// Shared by new-agent setup and the existing-agent migration.
export const LANGUAGE_PROMPT = 'Reply in the language the user speaks or explicitly requests, including the very first reply and clarification questions. When the user speaks Chinese, reply in Chinese, not English; use natural Mandarin for speech. Match their Chinese script in text when clear. Country, city, UI language and search-result language must never override the user’s language. {{language}} is only a fallback before the user speaks. Use language_detection to switch the spoken output language when needed, before answering. Do not announce the switch. Follow a clear language change in later turns; a place name or short acknowledgement alone is not a request to switch.';
export const LANGUAGE_DETECTION = {type:'system',name:'language_detection',pre_tool_speech:'off',description:'Switch to the language the user is speaking or explicitly requests before replying. Chinese speech or Chinese text requires zh, even when the user is located in Singapore. A place name alone does not request a switch.',params:{system_tool_type:'language_detection'}};
export function withLanguagePolicy(prompt){
 const clean=prompt.replace('Default language is {{language}}; follow the language she speaks.','').replace(LANGUAGE_PROMPT,'').trim();
 return LANGUAGE_PROMPT+' '+clean;
}
export function languageConfig(config){
 return {
  language_presets:{...config.language_presets,zh:config.language_presets?.zh??{overrides:{agent:{first_message:''}}}},
  agent:{prompt:{llm:'claude-haiku-4-5',prompt:withLanguagePolicy(config.agent.prompt.prompt),built_in_tools:{...config.agent.prompt.built_in_tools,language_detection:LANGUAGE_DETECTION}}}
 };
}
