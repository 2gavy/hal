// One transcript owns one chat turn, even when the agent acknowledges, searches,
// then sends a final answer with a different response ID.
export function createVoiceTurns(sessionId) {
 let current=null;
 return {
  user(message) {
   const id=`voice-${sessionId}-${message.event_id}`;
   const isNew=current?.id!==id;
   current={id,query:message.message};
   return {...current,isNew};
  },
  answer(text,evidence) {
   return current?{...current,answer:text,evidence}:null;
  }
 };
}
