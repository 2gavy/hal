import {parseElevenEvidence} from '../lib/eleven-evidence.mjs';
import WebSocket from 'next/dist/compiled/ws/index.js';
import {readFile,writeFile} from 'node:fs/promises';
import {searchVariables} from '../lib/search-profiles.mjs';
const searching=process.argv.includes('--search');
const dir=searching?'../outputs/voice-search-check':'../outputs/voice-language-check';
const input=await readFile(dir+'/chinese-input.pcm');
const r=await fetch('http://127.0.0.1:3000/api/voice/session',{method:'POST',headers:{Origin:'http://127.0.0.1:3000'}});const d=await r.json();if(!r.ok)throw new Error('Session '+r.status);
const result={transcripts:[],answers:[],audioBytes:0};const chunks=[];
await new Promise((resolve,reject)=>{
 const ws=new WebSocket(d.signedUrl);let pump,idle,offset=0,finished=false;
 const timeout=setTimeout(()=>done(new Error('Voice timeout')),55000);
 function done(error){if(finished)return;finished=true;clearTimeout(timeout);clearTimeout(idle);clearInterval(pump);ws.close();error?reject(error):resolve();}
 ws.on('error',()=>done(new Error('Voice websocket error')));
 ws.on('open',()=>ws.send(JSON.stringify({type:'conversation_initiation_client_data',dynamic_variables:{city:'Singapore',country:'SG',language:'English',search_location:'{"country":"SG"}',...searchVariables('voice')}})));
 ws.on('message',raw=>{const e=JSON.parse(raw.toString());
 if(e.type==='ping')ws.send(JSON.stringify({type:'pong',event_id:e.ping_event.event_id}));
 if(e.type==='conversation_initiation_metadata'){
 const m=e.conversation_initiation_metadata_event;
 if(m.user_input_audio_format!=='pcm_16000'||m.agent_output_audio_format!=='pcm_16000')return done(new Error('Unexpected audio format'));
 pump=setInterval(()=>{const part=offset<input.length?input.subarray(offset,offset+3200):Buffer.alloc(3200);offset+=3200;ws.send(JSON.stringify({user_audio_chunk:part.toString('base64')}));},100);
 }
 if(e.type==='user_transcript'){result.transcripts.push(e.user_transcription_event.user_transcript);console.log('Heard:',result.transcripts.at(-1));}
 if(e.type==='agent_response'){result.answers.push(e.agent_response_event.agent_response);console.log('Reply:',result.answers.at(-1));}
 if(e.type==='agent_tool_response_full_payload'){const evidence=parseElevenEvidence(e.agent_tool_response_full_payload);if(evidence){result.evidence=evidence;console.log('Exa search ms:',evidence.searchMs);}}
 if(e.type==='audio'){const b=Buffer.from(e.audio_event.audio_base_64,'base64');chunks.push(b);result.audioBytes+=b.length;clearTimeout(idle);idle=setTimeout(()=>{if(!searching||result.evidence)done();},6000);}
 });
});
await writeFile(dir+'/chinese-reply.pcm',Buffer.concat(chunks));await writeFile(dir+'/result.json',JSON.stringify(result,null,2));
if(!result.transcripts.some(t=>/\p{Script=Han}/u.test(t))||!result.answers.some(t=>/\p{Script=Han}/u.test(t))||!result.audioBytes)throw new Error('Missing Chinese transcript, response or spoken audio');
console.log('PASS: Chinese audio input, Chinese reply transcript and audio output');
