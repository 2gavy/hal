import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVoiceLatency} from '../lib/voice-latency.mjs';
test('voice latency ignores greetings and measures only first audio per user turn',()=>{
 let now=0;const timer=createVoiceLatency(()=>now);
 assert.equal(timer.audio(),undefined);timer.begin();now=643.6;
 assert.equal(timer.audio(),644);now=900;assert.equal(timer.audio(),undefined);
 timer.begin();now=1200;assert.equal(timer.audio(),300);
});
test('new transcript replaces previous pending turn; disconnected calls discard pending time',()=>{
 let now=0;const timer=createVoiceLatency(()=>now);timer.begin();now=100;timer.begin();now=350;
 assert.equal(timer.audio(),250);timer.begin();timer.reset();now=1000;assert.equal(timer.audio(),undefined);
});
