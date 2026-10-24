// Response IDs distinguish new messages from chunks of the current message.
export function createChatStream(){
 let id,text='';
 return {
  reset(){id=undefined;text='';},
  push(part){
   const next=part.response_id??part.event_id;
   if(part.type==='start'||next!==id){id=next;text='';}
   if(part.type!=='stop'&&typeof part.text==='string')text+=part.text;
   return text;
  }
 };
}
