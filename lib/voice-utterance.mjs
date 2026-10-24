// Accumulate all recognition segments; only submit after a pause following final text.
export function createUtterance(onSubmit, onText, schedule=setTimeout, cancel=clearTimeout) {
 let text='',timer,closed=false;
 // Short fragments retain a longer grace period so a single word is not sent early.
 const pause=()=>text.split(/\s+/).length < 3 ? 1200 : 450;
 const clear=()=>{if(timer!==undefined)cancel(timer);timer=undefined;};
 const commit=()=>{clear();if(closed||!text.trim())return;closed=true;onSubmit(text.trim());};
 return {
  update(results){if(closed)return;clear();text=Array.from(results,r=>r[0]?.transcript||'').join(' ').trim();onText(text);if(text&&Array.from(results).every(r=>r.isFinal))timer=schedule(commit,pause());},
  speechStart(){clear();},
  ended(){clear();if(!closed&&text)timer=schedule(commit,pause());},
  cancel(){closed=true;clear();},
 };
}
