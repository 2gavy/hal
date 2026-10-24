import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createListeningLoop} from '../lib/listening-loop.mjs';
function setup(){let calls=0;const pending=new Map();let id=0;const loop=createListeningLoop(()=>calls++,(fn)=>{pending.set(++id,fn);return id;},id=>pending.delete(id));return {loop,pending,calls:()=>calls};}
test('speech completion hands back to listening, once',()=>{const s=setup();s.loop.enable();s.loop.resume();s.loop.resume();assert.equal(s.pending.size,1);[...s.pending.values()][0]();assert.equal(s.calls(),1);});
test('hang-up or mute cancels pending recognition restart',()=>{const s=setup();s.loop.enable();s.loop.resume();const stale=[...s.pending.values()][0];s.loop.stop();assert.equal(s.pending.size,0);stale();assert.equal(s.calls(),0);s.loop.resume();assert.equal(s.pending.size,0);});
test('explicit unmute permits subsequent speech hand-offs',()=>{const s=setup();s.loop.enable();s.loop.stop();s.loop.enable();s.loop.resume();[...s.pending.values()][0]();assert.equal(s.calls(),1);});
