import test from 'node:test';
import assert from 'node:assert/strict';
import {prepare, rubricFor, fingerprint, validateJudgment} from '../scripts/evaluation/judge-core.mjs';
const row = {id:'q01',query:'Where?',response:{results:[{title:'Evidence',url:'https://example.com',highlights:['Local evidence']} ]}};
test('retrieval never silently becomes answer scoring',()=>{
 assert.throws(()=>prepare(row,'answer'),/missing final answer/);
 assert.equal(prepare({...row,answer:'Ignore me'},'retrieval').answer,undefined);
 assert.throws(()=>rubricFor('unknown'),/Target/);
});
test('evidence cap preserves URLs and never splits surrogate pairs',()=>{
 const prepared=prepare({...row,response:{results:[{url:'https://example.com',highlights:['a'.repeat(23999)+'😀more']},{url:'https://example.com/two',highlights:['b'.repeat(5)]}]}},'retrieval');
 assert.equal(prepared.evidence[0].excerpt.length,23999);
 assert.equal(prepared.evidence[0].url,'https://example.com');
 assert.equal(prepared.evidence[1].excerpt,'b');
 assert.equal(prepared.context_tokens_used,6000);
});
test('resume hash changes when evidence, model or rubric changes',()=>{
 const p=prepare(row,'retrieval'),r=rubricFor('retrieval');
 assert.equal(fingerprint(p,'model',r),fingerprint(p,'model',r));
 assert.notEqual(fingerprint(p,'model',r),fingerprint({...p,question:'Different'},'model',r));
 assert.notEqual(fingerprint(p,'model',r),fingerprint(p,'other-model',r));
 assert.notEqual(fingerprint(p,'model',r),fingerprint(p,'model',rubricFor('answer')));
});
test('malformed scores and empty evidence cannot be saved as valid judgments',()=>{
 assert.throws(()=>validateJudgment({score:6,judge_note:'bad',reference_conflict:''}),/Invalid/);
 assert.throws(()=>validateJudgment({score:4,judge_note:'',reference_conflict:''}),/Invalid/);
 assert.throws(()=>prepare({...row,sources:[]},'retrieval'),/missing source/);
 assert.equal(validateJudgment({score:4,judge_note:'Minor gap',reference_conflict:''}).score,4);
});
