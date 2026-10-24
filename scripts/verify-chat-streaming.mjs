import WebSocket from 'next/dist/compiled/ws/index.js';
import {locationVariables,resolveLocation} from '../lib/location.mjs';
import {searchVariables} from '../lib/search-profiles.mjs';
const base=process.env.HAL_BASE_URL||'http://localhost:3000';
const r=await fetch(base+'/api/voice/session',{method:'POST',headers:{Origin:base,...(process.env.HAL_ACCESS_CODE?{'x-hal-access':process.env.HAL_ACCESS_CODE}:{})}});
if(!r.ok)throw new Error('Session failed '+r.status);const {signedUrl}=await r.json();
await new Promise((resolve,reject)=>{
 const socket=new WebSocket(signedUrl);let chunks=0,search=false;const start=Date.now();let firstChunkMs;
 const timer=setTimeout(()=>{socket.close();reject(new Error('No completed response in 45s'));},45000);
 socket.on('open',()=>socket.send(JSON.stringify({type:'conversation_initiation_client_data',conversation_config_override:{conversation:{text_only:true}},dynamic_variables:{...locationVariables(resolveLocation('SG','Tanjong Pagar')),...searchVariables('chat'),city:'Tanjong Pagar',country:'SG',language:'English'}})));
 socket.on('error',()=>{clearTimeout(timer);reject(new Error('Socket failed'));});
 socket.on('message',raw=>{const e=JSON.parse(raw.toString());if(e.type==='ping')socket.send(JSON.stringify({type:'pong',event_id:e.ping_event.event_id}));if(e.type==='conversation_initiation_metadata')socket.send(JSON.stringify({type:'user_message',text:'Find two good laksa places near Tanjong Pagar.'}));if(e.type==='agent_tool_response_full_payload')search=true;if(e.type==='agent_chat_response_part'&&search&&e.text_response_part.type==='delta'){chunks++;firstChunkMs??=Date.now()-start;}if(e.type==='agent_response'&&search){clearTimeout(timer);socket.close();console.log(JSON.stringify({streamedChunks:chunks,firstChunkMs,completeMs:Date.now()-start}));chunks?resolve():reject(new Error('No text chunks received'));}});
});
