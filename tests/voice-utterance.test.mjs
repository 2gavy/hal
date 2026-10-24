import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createUtterance} from '../lib/voice-utterance.mjs';
const segment=(text,isFinal)=>Object.assign([{transcript:text}],{isFinal});
test('longer final utterances use a shorter pause while one-word fragments retain grace',()=>{
 const delays=[];
 const u=createUtterance(()=>{},()=>{},(_fn,ms)=>{delays.push(ms);return delays.length;},()=>{});
 u.update([segment('how',true)]);
 u.update([segment('how do I renew my passport',true)]);
 assert.deepEqual(delays,[1200,450]);
});
function setup(){const queue=new Map(),sent=[],shown=[];let id=0;const utterance=createUtterance(t=>sent.push(t),t=>shown.push(t),fn=>{queue.set(++id,fn);return id;},id=>queue.delete(id));return {utterance,queue,sent,shown,fire(){const callbacks=[...queue.values()];queue.clear();callbacks.forEach(f=>f());}};}
test('interim first word is not sent; complete phrase and later segments accumulate',()=>{const s=setup();s.utterance.update([segment('find',false)]);s.fire();assert.deepEqual(s.sent,[]);s.utterance.update([segment('find brunch',true)]);s.utterance.update([segment('find brunch',true),segment('near me',false)]);assert.equal(s.queue.size,0);s.utterance.update([segment('find brunch',true),segment('near me',true)]);s.fire();assert.deepEqual(s.sent,['find brunch near me']);});
test('continued speech cancels pending submission and revised text replaces interim',()=>{const s=setup();s.utterance.update([segment('one',true)]);s.utterance.speechStart();assert.equal(s.queue.size,0);s.utterance.update([segment('one more thing',false)]);s.utterance.ended();s.fire();assert.deepEqual(s.sent,['one more thing']);});
test('mute or hangup cancels text and end events cannot submit it later',()=>{const s=setup();s.utterance.update([segment('stop',true)]);const stale=[...s.queue.values()][0];s.utterance.cancel();s.utterance.ended();stale();s.fire();assert.deepEqual(s.sent,[]);});
test('duplicate end events never submit twice',()=>{const s=setup();s.utterance.update([segment('full sentence',true)]);s.fire();s.utterance.ended();s.fire();assert.equal(s.sent.length,1);});
