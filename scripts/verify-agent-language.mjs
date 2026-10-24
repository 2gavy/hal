import env from '@next/env';env.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
import WebSocket from 'next/dist/compiled/ws/index.js';
import {searchVariables} from '../lib/search-profiles.mjs';
const url=new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');url.searchParams.set('agent_id',process.env.ELEVENLABS_AGENT_ID);url.searchParams.set('version_id',process.env.ELEVENLABS_AGENT_VERSION_ID);
const response=process.argv.includes('--app')?await fetch('http://127.0.0.1:3000/api/voice/session',{method:'POST',headers:{Origin:'http://127.0.0.1:3000'}}):await fetch(url,{headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY}});
const data=await response.json();if(!response.ok)throw new Error('Session HTTP '+response.status);
const prompts=['附近有什么好吃的点心？','Please switch to English. Ask me which neighbourhood I am in.'];
await new Promise((resolve,reject)=>{
 const ws=new WebSocket(data.signed_url??data.signedUrl);let turn=0;
 const timeout=setTimeout(()=>{ws.close();reject(new Error('Language verification timed out'));},60000);
 const done=(e)=>{clearTimeout(timeout);ws.close();e?reject(e):resolve();};
 ws.on('error',()=>done(new Error('Websocket failed')));
 ws.on('open',()=>ws.send(JSON.stringify({type:'conversation_initiation_client_data',conversation_config_override:{conversation:{text_only:true}},dynamic_variables:{city:'Singapore',country:'SG',language:'English',search_location:'{"country":"SG"}',...searchVariables('voice')}})));
 ws.on('message',raw=>{const e=JSON.parse(raw.toString());
  if(e.type==='ping')ws.send(JSON.stringify({type:'pong',event_id:e.ping_event.event_id}));
  if(e.type==='conversation_initiation_metadata')ws.send(JSON.stringify({type:'user_message',text:prompts[turn]}));
  if(e.type==='agent_tool_request'&&e.agent_tool_request.tool_name==='language_detection')console.log('Language switching tool invoked');
  if(e.type==='agent_response'){
   const answer=e.agent_response_event.agent_response;console.log(JSON.stringify({query:prompts[turn],answer}));
   if(turn===0&&!/\p{Script=Han}/u.test(answer))return done(new Error('Expected Chinese reply'));
   if(turn===1&&/\p{Script=Han}/u.test(answer))return done(new Error('Expected English reply'));
   if(turn===0&&/切换|帮你搜索/.test(answer)&&answer.length<70)return;
   turn++;if(turn===prompts.length)return done();
   ws.send(JSON.stringify({type:'user_message',text:prompts[turn]}));
  }
 });
});
