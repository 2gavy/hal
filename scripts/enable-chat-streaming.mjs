import env from '@next/env';
import {saveEnv} from './save-env.mjs';
env.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const {ELEVENLABS_API_KEY:key,ELEVENLABS_AGENT_ID:id}=process.env;
if(!key||!id)throw new Error('Existing ElevenLabs setup required.');
const url='https://api.elevenlabs.io/v1/convai/agents/'+id;
async function api(method,body){const r=await fetch(url,{method,headers:{'xi-api-key':key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`Agent ${method}: HTTP ${r.status}`);return r.json();}
const current=await api('GET');
const conversation=current.conversation_config.conversation;
const events=[...new Set([...(conversation.client_events||[]),'agent_chat_response_part'])];
const updated=await api('PATCH',{conversation_config:{conversation:{...conversation,client_events:events}}});
const version=updated.version_id??updated.version?.version_id;
if(version)await saveEnv('ELEVENLABS_AGENT_VERSION_ID',version);
const verified=await api('GET');
if(!verified.conversation_config.conversation.client_events.includes('agent_chat_response_part'))throw new Error('Streaming event not enabled');
console.log(JSON.stringify({chatStreamingEnabled:true,versionChanged:!!version&&version!==process.env.ELEVENLABS_AGENT_VERSION_ID}));
