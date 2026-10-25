import env from '@next/env';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {rubricFor, prepare, fingerprint, validateJudgment} from './evaluation/judge-core.mjs';

const {values: args} = parseArgs({options: {
 input: {type:'string'}, output: {type:'string'}, ids: {type:'string'},
 target: {type:'string', default:'retrieval'}, model: {type:'string'},
 'dry-run': {type:'boolean', default:false}, help: {type:'boolean', default:false},
}});
if (args.help) {
 console.log('npm run judge -- --input FILE --output FILE [--target retrieval|answer] [--ids q01,q02] [--model MODEL] [--dry-run]\nDry-run validates input without API calls. Rerun the same command to resume.');
 process.exit(0);
}
env.loadEnvConfig(fileURLToPath(new URL('../', import.meta.url)), true, {info(){}, error(){}});

async function main() {
 if (!args.input || !args.output) throw Error('Provide --input and --output; see npm run judge -- --help');
 const inputPath = path.resolve(args.input), outputPath = path.resolve(args.output);
 if (inputPath === outputPath) throw Error('Output must differ from input; original results are read-only');
 const rubric = rubricFor(args.target);
 const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
 const rows = Array.isArray(input) ? input : input.records;
 if (!Array.isArray(rows)) throw Error('Input must be a JSON array or {records: [...]}');
 if (new Set(rows.map(row => row.id)).size !== rows.length) throw Error('Duplicate record IDs');
 const ids = args.ids?.split(',').map(id => id.trim()).filter(Boolean);
 if (ids?.some(id => !rows.some(row => row.id === id))) throw Error('One or more --ids are missing from input');
 const selected = rows.filter(row => !ids || ids.includes(row.id));
 if (!selected.length) throw Error('No records selected');
 const payloads = selected.map(row => prepare(row, args.target));
 if (args['dry-run']) {
  console.log(JSON.stringify({dryRun:true, target:args.target, count:payloads.length,
   queries:payloads.map(p => ({id:p.id, sources:p.evidence.length, context_tokens_used:p.context_tokens_used}))}, null, 2));
  return; // No API calls, no output writes, no key required.
 }
 const model = args.model || process.env.GEMINI_JUDGE_MODEL;
 const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
 if (!model || !/^[a-zA-Z0-9._-]+$/.test(model)) throw Error('Set GEMINI_JUDGE_MODEL to an available Gemini model ID, or pass --model');
 if (!key) throw Error('Add GEMINI_API_KEY to .env.local');
 let report = {target:args.target, model, input:inputPath, rubric, records:[]};
 try {
  report = JSON.parse(await fs.readFile(outputPath, 'utf8'));
  if (report.target !== args.target || report.model !== model || report.rubric !== rubric || !Array.isArray(report.records))
   throw Error('Output belongs to another evaluation; choose a new --output path');
 } catch (error) { if (error.code !== 'ENOENT') throw error; }
 await fs.mkdir(path.dirname(outputPath), {recursive:true});
 const save = async () => {
  const temp = `${outputPath}.tmp`;
  await fs.writeFile(temp, JSON.stringify(report, null, 2), {mode:0o600});
  await fs.rename(temp, outputPath);
 };
 // Step 3: one query per judge call; never mix evidence across questions.
 for (const payload of payloads) {
  const hash = fingerprint(payload, model, rubric);
  if (report.records.some(row => row.id === payload.id && row.fingerprint === hash && row.judgment)) {
   console.log(`${payload.id}: already judged; skipped`); continue;
  }
  const started = performance.now();
  try {
   const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method:'POST', headers:{'Content-Type':'application/json', 'x-goog-api-key':key},
    body:JSON.stringify({systemInstruction:{parts:[{text:rubric}]},
     contents:[{role:'user', parts:[{text:JSON.stringify(payload)}]}],
     generationConfig:{temperature:0, responseMimeType:'application/json', maxOutputTokens:4096}}),
    signal:AbortSignal.timeout(180000),
   });
   if (!response.ok) throw Error(`Gemini HTTP ${response.status}`);
   const data = await response.json();
   const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('');
   const judgment = validateJudgment(JSON.parse(text));
   // Step 4: save after every success; subsequent runs resume by content hash.
   const record = {id:payload.id, fingerprint:hash, judgedAt:new Date().toISOString(),
    target:args.target, model:data.modelVersion || model, judge_latency_ms:Math.round(performance.now()-started),
    usage:data.usageMetadata, input:payload, judgment};
   report.records = report.records.filter(row => row.id !== payload.id).concat(record);
   await save();
   console.log(`${payload.id}: ${judgment.score}/5 — ${judgment.judge_note}`);
  } catch (error) {
   // Do not overwrite past scores or silently retry until a favourable score appears.
   throw Error(`${payload.id}: ${error.message}. Saved judgments are retained. Rerun the same command to resume.`);
  }
 }
 console.log(`Saved ${report.records.length} judgments to ${outputPath}`);
}
main().catch(error => {console.error(error.message); process.exitCode=1;});
