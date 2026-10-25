import test from 'node:test';
import assert from 'node:assert/strict';
import {requestPlan} from '../lib/plan-client.mjs';
const location={country:'PH',city:'Manila',latitude:14.6,longitude:120.98};
const answer={title:'Plan',answer:'A grounded answer',sources:[],sample:false,elapsedMs:100};

test('Plan client sends the expected location and streaming request without an Exa key',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'/api/hal');
  assert.deepEqual(JSON.parse(options.body),{query:'Japan trip',mode:'plan',stream:true,location});
  assert.equal(options.headers['x-hal-access'],'demo');
  assert.equal(options.headers['x-api-key'],undefined);
  return Response.json(answer);
 });
 assert.deepEqual(await requestPlan('Japan trip','demo',location,new AbortController().signal,()=>{}),answer);
});

test('Plan partials stream before the final answer',async t=>{
 const partial={title:'Plan',answer:'A grounded'};
 t.mock.method(globalThis,'fetch',async()=>new Response(
  `data: ${JSON.stringify({type:'partial',content:partial})}\n\ndata: ${JSON.stringify({type:'complete',result:answer})}\n\n`,
  {headers:{'Content-Type':'text/event-stream'}}));
 const updates=[];
 assert.deepEqual(await requestPlan('Japan trip','',location,new AbortController().signal,p=>updates.push(p)),answer);
 assert.deepEqual(updates,[partial]);
});

test('Plan access failures preserve status for the access-code dialog',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({error:'Enter the demo access code.'},{status:401}));
 await assert.rejects(requestPlan('Japan trip','',location,new AbortController().signal,()=>{}),{status:401});
});

test('a cancelled Plan cannot produce partial or completed UI content',async t=>{
 const controller=new AbortController(),updates=[];
 t.mock.method(globalThis,'fetch',async()=>{
  controller.abort();
  return Response.json(answer);
 });
 await assert.rejects(requestPlan('Japan trip','',location,controller.signal,p=>updates.push(p)),{name:'AbortError'});
 assert.deepEqual(updates,[]);
});
