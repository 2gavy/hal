import {test} from 'node:test';import assert from 'node:assert/strict';import {feedbackEvent} from '../lib/feedback.mjs';
test('feedback only retains allowlisted telemetry',()=>{
 const event=feedbackEvent({responseId:'turn-1',mode:'voice',rating:'down',query:'private',answer:'private',access:'secret',metrics:{searchMs:320,voiceMs:-1,inputTokens:Infinity},sourceDomains:['example.com','https://example.com/?secret=1','example.com']},new Date('2026-10-24T00:00:00Z'));
 assert.deepEqual(event.metrics,{searchMs:320});assert.deepEqual(event.sourceDomains,['example.com']);assert.equal(event.query,undefined);assert.equal(event.access,undefined);assert.equal(event.measurementOrigin,'client');
});
test('feedback rejects invalid identity, mode and votes; supports removal',()=>{
 const valid={responseId:'turn-1',mode:'plan',rating:null};assert.equal(feedbackEvent(valid).rating,null);
 for(const patch of [{responseId:'bad\nidentity'},{mode:'unknown'},{rating:1},{rating:undefined}])assert.throws(()=>feedbackEvent({...valid,...patch}));
});
test('feedback retains a bounded explanation only for a down vote',()=>{
 const valid={responseId:'turn-1',mode:'chat',rating:'down'};
 assert.equal(feedbackEvent({...valid,reason:' Wrong citation '}).reason,'Wrong citation');
 assert.equal(feedbackEvent({...valid,reason:'   '}).reason,null);
 assert.equal(feedbackEvent({...valid,rating:'up',reason:'old reason'}).reason,null);
 assert.equal(feedbackEvent({...valid,rating:null,reason:'old reason'}).reason,null);
 for(const reason of [42,{},'x'.repeat(1001)])assert.throws(()=>feedbackEvent({...valid,reason}));
 assert.equal(feedbackEvent({...valid,reason:'x'.repeat(1000)}).reason.length,1000);
});
