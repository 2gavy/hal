import test from 'node:test';
import assert from 'node:assert/strict';
import {createChatStream} from '../lib/chat-stream.mjs';
test('streams Unicode chunks and does not duplicate stop payload',()=>{const s=createChatStream();assert.equal(s.push({type:'start',event_id:1,text:''}),'');assert.equal(s.push({type:'delta',event_id:1,text:'你好'}),'你好');assert.equal(s.push({type:'delta',event_id:1,text:'，Daisy'}),'你好，Daisy');assert.equal(s.push({type:'stop',event_id:1,text:'你好，Daisy'}),'你好，Daisy');});
test('new response and tool reset discard prior draft',()=>{const s=createChatStream();s.push({type:'delta',response_id:'a',event_id:1,text:'old'});assert.equal(s.push({type:'delta',response_id:'b',event_id:2,text:'new'}),'new');s.reset();assert.equal(s.push({type:'delta',response_id:'b',event_id:2,text:'after search'}),'after search');});
