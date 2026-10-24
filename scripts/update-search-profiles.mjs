import env from '@next/env';import {saveEnv} from './save-env.mjs';
import {configureSearchTool,searchVariables,LOCATION_PROMPT} from '../lib/search-profiles.mjs';
env.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const {ELEVENLABS_API_KEY:key,ELEVENLABS_EXA_TOOL_ID:toolId,ELEVENLABS_AGENT_ID:agentId}=process.env;
if(!key||!toolId||!agentId)throw new Error('Existing ElevenLabs setup required');
async function api(path,method='GET',body){const response=await fetch('https://api.elevenlabs.io/v1/convai/'+path,{method,headers:{'xi-api-key':key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`${method} ${path.split('/')[0]} HTTP ${response.status}: ${(await response.text()).slice(0,2000)}`);return response.json();}
const tool=await api('tools/'+toolId);
await api('tools/'+toolId,'PATCH',{tool_config:configureSearchTool(tool.tool_config)});
const agent=await api('agents/'+agentId);
const placeholders={...agent.conversation_config.agent.dynamic_variables?.dynamic_variable_placeholders,...searchVariables('voice'),search_location:'{}'};
delete placeholders.search_highlight_characters;
const oldPrompt=agent.conversation_config.agent.prompt.prompt;
const prompt=oldPrompt.replace('Include the city and country in local searches and respect destinations explicitly named by the user.','').replace(/Search location JSON:[\s\S]*$/, '').trim()+' '+LOCATION_PROMPT;
const updated=await api('agents/'+agentId,'PATCH',{conversation_config:{agent:{prompt:{prompt},dynamic_variables:{dynamic_variable_placeholders:placeholders}}}});
const version=updated.version_id??updated.version?.version_id;
if(version)await saveEnv('ELEVENLABS_AGENT_VERSION_ID',version);
const verified=await api('tools/'+toolId);const props=verified.tool_config.api_schema.request_body_schema.properties;
console.log(JSON.stringify({objective:props.objective,required:verified.tool_config.api_schema.request_body_schema.required,numResults:props.numResults,highlights:props.contents.properties.highlights,userLocation:props.userLocation,agentVersionUpdated:!!version}));
