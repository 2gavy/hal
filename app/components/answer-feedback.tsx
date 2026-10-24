'use client';
import {useEffect,useRef,useState} from 'react';
import {ThumbsUp,ThumbsDown} from 'lucide-react';
type Rating='up'|'down'|null;
type Props={responseId:string;mode:'chat'|'voice'|'plan';access:string;sources:{url:string}[];metrics?:{searchType:string;requestId?:string;searchMs?:number;voiceMs?:number;estimatedHighlightTokens?:number}};
export default function AnswerFeedback({responseId,mode,access,sources,metrics}:Props){
 const [rating,setRating]=useState<Rating>(null),[pending,setPending]=useState(false),[message,setMessage]=useState('');const lock=useRef(false);
 const storageKey=`hal-feedback:${responseId}`;
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);setRating(saved==='up'||saved==='down'?saved:null);}catch{}},[storageKey]);
 async function vote(value:Rating){
  if(lock.current)return;lock.current=true;setPending(true);setMessage('');const next=rating===value?null:value;
  try{
   const sourceDomains=sources.flatMap(s=>{try{return [new URL(s.url).hostname];}catch{return [];}});
   const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json','x-hal-access':access},body:JSON.stringify({responseId,mode,rating:next,sourceDomains,searchType:metrics?.searchType,requestId:metrics?.requestId,metrics}),signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw new Error('Feedback could not be saved. Try again.');
   setRating(next);try{if(next)localStorage.setItem(storageKey,next);else localStorage.removeItem(storageKey);}catch{}
   setMessage(next?'Thanks for your feedback':'Feedback removed');
  }catch{setMessage('Couldn’t save feedback. Please try again.');}finally{lock.current=false;setPending(false);}
 }
 return <div className="answer-feedback" role="group" aria-label="Rate this answer">
  <button type="button" title="Helpful" aria-label="Helpful answer" aria-pressed={rating==='up'} disabled={pending} onClick={()=>void vote('up')}><ThumbsUp size={15}/></button>
  <button type="button" title="Not helpful" aria-label="Unhelpful answer" aria-pressed={rating==='down'} disabled={pending} onClick={()=>void vote('down')}><ThumbsDown size={15}/></button>
  <span className="feedback-message" role="status">{message}</span>
 </div>;
}
