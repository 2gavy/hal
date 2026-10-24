import {locationVariables,resolveLocation} from '../lib/location.mjs';
import WebSocket from 'next/dist/compiled/ws/index.js';import {searchVariables} from '../lib/search-profiles.mjs';
const coordinates=process.argv.includes('--coordinates');
const location=resolveLocation('SG','Tanjong Pagar',coordinates?{latitude:1.2765,longitude:103.8432}:null);
for(const mode of ['chat','voice']){
 const response=await fetch('http://127.0.0.1:3000/api/voice/session',{method:'POST',headers:{Origin:'http://127.0.0.1:3000'}});const data=await response.json();if(!response.ok)throw new Error('Session failed: '+response.status);
 await new Promise((resolve,reject)=>{
  const socket=new WebSocket(data.signedUrl);const timeout=setTimeout(()=>{socket.close();reject(new Error('Tool timeout'));},45000);
  socket.on('open',()=>socket.send(JSON.stringify({type:'conversation_initiation_client_data',conversation_config_override:{conversation:{text_only:true}},dynamic_variables:{...locationVariables(location),city:location.city,country:'SG',language:'English',...searchVariables(mode)}})));
  socket.on('error',()=>{clearTimeout(timeout);reject(new Error('Websocket failed'));});
  socket.on('message',raw=>{const event=JSON.parse(raw.toString());
   if(event.type==='ping')socket.send(JSON.stringify({type:'pong',event_id:event.ping_event.event_id}));
   if(event.type==='conversation_initiation_metadata')socket.send(JSON.stringify({type:'user_message',text:coordinates?'good laksa near me that is open late':'Find good brunch places in Singapore.'}));
   if(event.type==='agent_tool_request')console.log(JSON.stringify({mode,request:event.agent_tool_request}));
   if(event.type==='agent_tool_response_full_payload'){const payload=event.agent_tool_response_full_payload;const result=JSON.parse(payload.full_tool_result||'{}');console.log(JSON.stringify({mode,isError:payload.is_error,resultCount:result.results?.length,highlightLengths:result.results?.map(r=>(r.highlights||[]).join('').length)}));clearTimeout(timeout);socket.close();payload.is_error?reject(new Error('Tool failed')):resolve();}
  });
 });
}
