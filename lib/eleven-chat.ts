import {createChatStream} from './chat-stream.mjs';
import {locationVariables} from '@/lib/location.mjs';
import {searchVariables} from '@/lib/search-profiles.mjs';
import {displayAnswer} from './display-answer.mjs';
import {Conversation,type Conversation as Session} from '@elevenlabs/client';
import {parseElevenEvidence} from './eleven-evidence.mjs';
export async function elevenChat(query:string,access:string,location:{city:string;country:string|null;language:string;latitude?:number;longitude?:number},signal:AbortSignal,history:{query:string;answer:string}[]=[],onProgress?:(update:{stage:'connecting'|'searching'|'writing';answer?:string})=>void){
 const started=performance.now();onProgress?.({stage:'connecting'});const stream=createChatStream();
 const response=await fetch('/api/voice/session',{method:'POST',headers:{'x-hal-access':access},signal});
 const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'Chat connection failed.'),{status:response.status});
 return new Promise<any>((resolve,reject)=>{
  let session:Session|undefined,finished=false,searchPending=false,searchComplete=false;let answerTimer:ReturnType<typeof setTimeout>|undefined;
  let evidence:{sources:{title:string;url:string}[];places?:{name:string;address?:string}[];searchMs?:number;estimatedHighlightTokens?:number}={sources:[]};
  const finish=(error?:Error,answer?:string)=>{if(finished)return;finished=true;clearTimeout(timer);clearTimeout(answerTimer);signal.removeEventListener('abort',cancel);void session?.endSession();if(error)reject(error);else resolve({title:'',answer:displayAnswer(answer||''),places:evidence.places,sources:evidence.sources,sample:false,elapsedMs:Math.round(performance.now()-started),metrics:{searchType:'lite',searchMs:evidence.searchMs,estimatedHighlightTokens:evidence.estimatedHighlightTokens,costDollars:null}});};
  const cancel=()=>finish(new DOMException('Cancelled','AbortError'));
  const timer=setTimeout(()=>finish(new Error('Hal took too long. Please try again.')),45000);
  signal.addEventListener('abort',cancel,{once:true});if(signal.aborted){cancel();return;}
  void Conversation.startSession({signedUrl:data.signedUrl,connectionType:'websocket',textOnly:true,dynamicVariables:{...locationVariables(location),...searchVariables('chat'),city:location.city||location.country||'Singapore',country:location.country||'SG',language:location.language},
   onAgentToolRequest:event=>{if(finished)return;if(event.tool_name==='web_search'){searchPending=true;stream.reset();onProgress?.({stage:'searching',answer:''});clearTimeout(answerTimer);}},
   onAgentToolResponse:event=>{if(finished)return;if(event.tool_name==='web_search'){searchPending=false;searchComplete=true;onProgress?.({stage:'writing'});}const parsed=parseElevenEvidence(event);if(parsed)evidence=parsed;},
   onAgentChatResponsePart:part=>{if(finished||searchPending)return;const answer=stream.push(part);if(answer)onProgress?.({stage:'writing',answer:displayAnswer(answer)});},
   onMessage:message=>{if(!finished&&message.source==='ai'&&!searchPending&&message.message.trim()){clearTimeout(answerTimer);if(searchComplete)finish(undefined,message.message);else answerTimer=setTimeout(()=>finish(undefined,message.message),1000);}},
   onError:()=>finish(new Error('Chat connection failed. Please try again.')),
   onDisconnect:()=>{if(!finished)finish(new Error('Chat disconnected before the answer arrived.'));}
  }).then(active=>{session=active;if(finished){void active.endSession();return;}if(history.length)active.sendContextualUpdate(`Previous conversation for context only: ${JSON.stringify(history.slice(-6))}`);active.sendUserMessage(query);}).catch(error=>finish(error));
 });
}
