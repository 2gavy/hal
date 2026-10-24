// SSE frames may be split across network chunks, including inside UTF-8 characters.
export async function* readSSE(body) {
 if(!body)throw new Error('Missing response stream');
 const reader=body.getReader(),decoder=new TextDecoder();let buffer='';
 try {
  while(true){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});
   let match;
   while((match=/\r?\n\r?\n/.exec(buffer))){const frame=buffer.slice(0,match.index);buffer=buffer.slice(match.index+match[0].length);const data=frame.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).replace(/^ /,'')).join('\n');if(data)yield data;}
   if(done){if(buffer.trim())throw new Error('Incomplete response stream');break;}
  }
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
// Decode only complete JSON string characters; never render JSON syntax or partial escapes.
export function partialPlan(json){
 const result={title:'',answer:''};
 for(const key of ['title','answer']){
  const match=new RegExp('"'+key+'"\\s*:\\s*"').exec(json);if(!match)continue;
  let value='';
  for(let i=match.index+match[0].length;i<json.length;i++){
   const char=json[i];if(char==='"')break;
   if(char!=='\\'){value+=char;continue;}
   const next=json[++i];if(!next)break;
   if(next==='u'){const hex=json.slice(i+1,i+5);if(!/^[0-9a-f]{4}$/i.test(hex))break;value+=String.fromCharCode(parseInt(hex,16));i+=4;}
   else {const escapes={'"':'"','\\':'\\','/':'/','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};if(!(next in escapes))break;value+=escapes[next];}
  }
  result[key]=value.replace(/[\uD800-\uDBFF]$/,'');
 }
 return result;
}
export async function readPlanResponse(response,onPartial,signal){
 if(!response.headers.get('content-type')?.includes('text/event-stream'))return response.json();
 let result;
 for await(const frame of readSSE(response.body)){
  signal?.throwIfAborted();if(frame==='[DONE]')continue;
  const event=JSON.parse(frame);
  if(event.type==='error')throw new Error(event.error||'Plan interrupted. Please try again.');
  if(event.type==='partial')onPartial(event.content);
  if(event.type==='complete')result=event.result;
 }
 if(!result)throw new Error('Plan interrupted before it finished. Please try again.');
 return result;
}
