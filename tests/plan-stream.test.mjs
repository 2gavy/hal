import {test} from 'node:test';import assert from 'node:assert/strict';
import {readSSE,partialPlan,readPlanResponse} from '../lib/plan-stream.mjs';
function response(text){const bytes=new TextEncoder().encode(text);return new Response(new ReadableStream({start(c){for(const byte of bytes)c.enqueue(new Uint8Array([byte]));c.close();}}),{headers:{'content-type':'text/event-stream'}});}
test('SSE handles fragmented UTF8, CRLF, comments and multiline data',async()=>{
 const values=[];for await(const frame of readSSE(response(': ping\r\ndata: 日本\r\ndata: test\r\n\r\ndata: [DONE]\n\n').body))values.push(frame);
 assert.deepEqual(values,['日本\ntest','[DONE]']);
});
test('partial structured answers decode escapes and incomplete unicode safely',()=>{
 const json=JSON.stringify({answer:'Visa "steps"\n日本 👋',title:'Plan'});
 for(let i=0;i<=json.length;i++)assert.ok('Visa "steps"\n日本 👋'.startsWith(partialPlan(json.slice(0,i)).answer));
 assert.deepEqual(partialPlan(json),{answer:'Visa "steps"\n日本 👋',title:'Plan'});
 assert.equal(partialPlan('{"answer":"hello\\u12').answer,'hello');
});
test('partial delivery precedes completion and metadata survives',async()=>{
 const events=[];const result={answer:'Done',sources:[{url:'https://example.com'}],metrics:{searchMs:1400}};
 const r=await readPlanResponse(response('data: '+JSON.stringify({type:'partial',content:{answer:'Do'}})+'\n\ndata: '+JSON.stringify({type:'complete',result})+'\n\n'),x=>events.push(x));
 assert.deepEqual(events,[{answer:'Do'}]);assert.deepEqual(r,result);
});
test('truncated, errored and cancelled responses never succeed',async()=>{
 await assert.rejects(readPlanResponse(response('data: {"type":"partial","content":{"answer":"partial"}}\n\n'),()=>{}),/interrupted/);
 await assert.rejects(readPlanResponse(response('data: {"type":"error","error":"failed"}\n\n'),()=>{}),/failed/);
 await assert.rejects(readPlanResponse(response('data: {}'),()=>{}),/Incomplete/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(readPlanResponse(response('data: {}\n\n'),()=>{},controller.signal),{name:'AbortError'});
});
