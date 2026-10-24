import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceTurns} from '../lib/voice-turns.mjs';
test('acknowledgement and final answer update one user turn',()=>{
 const turns=createVoiceTurns('session-a'),saved=new Map();
 assert.equal(turns.answer('Hello',{}),null);
 turns.user({event_id:1,message:'HDB grant and loan.'});
 for(const text of ["I’ll look up the details.",'Start with the HFE letter.']){
  const turn=turns.answer(text,{});saved.set(turn.id,turn);
 }
 assert.equal(saved.size,1);assert.equal([...saved.values()][0].answer,'Start with the HFE letter.');
});
test('transcript revisions retain a turn; deliberate repeated questions and new calls do not collide',()=>{
 const turns=createVoiceTurns('a');assert.equal(turns.user({event_id:1,message:'HDB'}).isNew,true);
 assert.equal(turns.user({event_id:1,message:'HDB grant and loan.'}).isNew,false);
 const first=turns.answer('Answer',{});
 turns.user({event_id:2,message:'HDB grant and loan.'});assert.notEqual(turns.answer('Answer',{}).id,first.id);
 const next=createVoiceTurns('b');next.user({event_id:1,message:'HDB grant and loan.'});assert.notEqual(next.answer('Answer',{}).id,first.id);
});
