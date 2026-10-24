import env from '@next/env';
import {saveEnv} from './save-env.mjs';
import {languageConfig} from '../lib/agent-language.mjs';
env.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const {ELEVENLABS_API_KEY:key,ELEVENLABS_AGENT_ID:id}=process.env;
if(!key||!id)throw new Error('Existing ElevenLabs setup required.');
async function api(method,body){
 const r=await fetch('https://api.elevenlabs.io/v1/convai/agents/'+id,{method,headers:{'xi-api-key':key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error(`Agent language ${method}: HTTP ${r.status}`);
 return r.json();
}
const current=await api('GET');
const updated=await api('PATCH',{conversation_config:languageConfig(current.conversation_config)});
const version=updated.version_id??updated.version?.version_id;
if(version)await saveEnv('ELEVENLABS_AGENT_VERSION_ID',version);
const verified=await api('GET');
if(!verified.conversation_config.language_presets?.zh||!verified.conversation_config.agent.prompt.built_in_tools?.language_detection)throw new Error('Language settings not persisted.');
console.log(JSON.stringify({chineseEnabled:true,languageDetectionEnabled:true,versionUpdated:!!version}));
