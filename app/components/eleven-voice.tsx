'use client';
import {locationVariables} from '@/lib/location.mjs';
import {searchVariables} from '@/lib/search-profiles.mjs';
import {useEffect,useRef,useState} from 'react';
import {microphoneIssue} from '@/lib/voice-errors.mjs';
import {displayAnswer} from '@/lib/display-answer.mjs';
import {Mic,MicOff,PhoneOff,ExternalLink} from 'lucide-react';
import type {Conversation as Session} from '@elevenlabs/client';
import {parseElevenEvidence} from '@/lib/eleven-evidence.mjs';
import {createVoiceTurns} from '@/lib/voice-turns.mjs';
import {createVoiceLatency} from '@/lib/voice-latency.mjs';
import AnswerActions from './answer-actions';
type Evidence={estimatedHighlightTokens?:number;places?:{name:string;address?:string}[];sources:{title:string;url:string}[];searchMs?:number;voiceMs?:number};
export type VoiceTurn={id:string;query:string;answer:string;evidence:Evidence};
export default function ElevenVoice({premium,access,location,onClose,onTurn}:{premium:boolean;access:string;location:{city:string;country:string|null;language:string;latitude?:number;longitude?:number};onClose:()=>void;onTurn:(turn:VoiceTurn)=>void}){
 const [answer,setAnswer]=useState('');
 const [micIssue,setMicIssue]=useState<{title:string;message:string}|null>(null);
 const [status,setStatus]=useState('connecting'),[speaking,setSpeaking]=useState(false),[muted,setMuted]=useState(false),[searching,setSearching]=useState(false),[error,setError]=useState(''),[transcript,setTranscript]=useState(''),[evidence,setEvidence]=useState<Evidence>({sources:[]}),[attempt,setAttempt]=useState(0),[needsCode,setNeedsCode]=useState(false),[code,setCode]=useState(access);
 const session=useRef<Session|null>(null),dialog=useRef<HTMLDivElement>(null),onTurnRef=useRef(onTurn);onTurnRef.current=onTurn;
 useEffect(()=>{
  let disposed=false,active:Session|null=null;const controller=new AbortController();let question='';let currentEvidence:Evidence={sources:[]};const latency=createVoiceLatency();const voiceTurns=createVoiceTurns(crypto.randomUUID());let lastTurn:VoiceTurn|undefined;
  setEvidence({sources:[]});setTranscript('');setAnswer('');setStatus('connecting');setError('');setMicIssue(null);setNeedsCode(false);setMuted(false);setSpeaking(false);setSearching(false);
  async function connect(){try{
   if(!navigator.mediaDevices?.getUserMedia)throw new DOMException('Microphone unsupported','NotSupportedError');
   let permission:PermissionStatus|undefined;
   try{permission=await navigator.permissions?.query({name:'microphone' as PermissionName});}catch{}
   if(disposed)return;
   if(permission?.state==='denied')throw new DOMException('Permission denied','NotAllowedError');

   const response=await fetch('/api/voice/session',{method:'POST',headers:{'x-hal-access':code},signal:controller.signal});
   const data=await response.json();if(disposed)return;
   if(response.status===401){setNeedsCode(true);throw new Error(data.error);}
   if(!response.ok)throw new Error(data.error||'Voice is unavailable.');
   const {Conversation}=await import('@elevenlabs/client');if(disposed)return;
   active=await Conversation.startSession({signedUrl:data.signedUrl,connectionType:'websocket',dynamicVariables:{...locationVariables(location),...searchVariables('voice'),city:location.city||location.country||'Singapore',country:location.country||'SG',language:location.language},
    onStatusChange:({status})=>{if(!disposed)setStatus(status);},
    onAudio:audio=>{if(disposed||!audio)return;const voiceMs=latency.audio();if(voiceMs==null)return;currentEvidence={...currentEvidence,voiceMs};setEvidence(currentEvidence);if(lastTurn){lastTurn={...lastTurn,evidence:currentEvidence};onTurnRef.current(lastTurn);}},
    onModeChange:({mode})=>{if(!disposed)setSpeaking(mode==='speaking');},
    onError:()=>{if(!disposed){setError('Voice connection interrupted. Please reconnect.');setSearching(false);}},
    onDisconnect:()=>{latency.reset();if(!disposed){setStatus('disconnected');setSpeaking(false);setSearching(false);}},
    onMessage:(message)=>{if(disposed)return;if(message.source==='user'){
     const turn=voiceTurns.user(message);question=turn.query;
     if(turn.isNew){latency.begin();lastTurn=undefined;setAnswer('');currentEvidence={sources:[]};setEvidence(currentEvidence);}
     else if(lastTurn){lastTurn={...lastTurn,query:question};onTurnRef.current(lastTurn);}
     setTranscript(question);
    }else if(question){
     const text=displayAnswer(message.message);setAnswer(text);
     const turn=voiceTurns.answer(text,currentEvidence);if(turn){lastTurn=turn;onTurnRef.current(turn);}
    }},
    onAgentToolRequest:(event)=>{if(!disposed&&event.tool_name==='web_search')setSearching(true);},
    onAgentToolResponse:(event)=>{
     if(disposed||event.tool_name!=='web_search')return;setSearching(false);
     if(event.is_error){setError('Search could not complete. You can try asking again.');return;}
     if(!('full_tool_result' in event))return;
     const parsed=parseElevenEvidence(event);if(parsed){currentEvidence={...currentEvidence,...parsed};setEvidence(currentEvidence);if(lastTurn){lastTurn={...lastTurn,evidence:currentEvidence};onTurnRef.current(lastTurn);}}
    }
   });
   if(disposed){await active.endSession();return;}session.current=active;if(code){try{sessionStorage.setItem('hal-access',code);}catch{}}
  }catch(e){if(!disposed){setStatus('disconnected');const issue=microphoneIssue(e);setMicIssue(issue);setError(issue?'':e instanceof Error?e.message:'Could not start voice. Please try again.');}}}
  void connect();return()=>{disposed=true;controller.abort();session.current=null;void active?.endSession();};
 // A retry creates a fresh authenticated session; normal renders must not restart a call.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[attempt]);
 useEffect(()=>{dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();},[]);
 const connected=status==='connected';
 return <div ref={dialog} className={`voice-screen ${evidence.sources.length?'has-voice-results ':''}${speaking?'is-speaking':searching?'is-thinking':connected&&!muted?'is-listening':''}`} role="dialog" aria-modal="true" aria-label="Voice conversation with Hal" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}if(event.key==='Tab'){const items=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}}>
  <div className="voice-top"><span>hal<span className="voice-plus">{premium?'+':''}</span></span><span className="voice-tag">VOICE</span></div>
  <div className="voice-center"><div className="voice-orb" aria-hidden="true"><i/><i/><i/><div className="orb-grain"/></div><div className="voice-copy" aria-live="polite"><h2>{status==='connecting'?'Connecting…':speaking?'A little help, out loud.':searching?'Let me find that.':connected?'I’m listening.':micIssue?micIssue.title:'Let’s reconnect.'}</h2><p>{muted?'Microphone paused.':speaking?'You can interrupt me anytime.':connected?'Go ahead, Daisy.':micIssue?'Your chat is still here.':'Your conversation with Hal.'}</p></div></div>
  <div className="voice-evidence">{transcript&&<p className="voice-transcript">“{transcript}”</p>}{searching&&<p role="status">Searching…</p>}<AnswerActions answer={answer} places={evidence.places} query={transcript} searchMs={evidence.searchMs} voiceMs={evidence.voiceMs}/><div className="voice-source-list">{evidence.sources.map((source,i)=><a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span className="voice-source-number">{i+1}</span><span><strong>{source.title}</strong><small>{new URL(source.url).hostname}</small></span><ExternalLink size={13}/></a>)}</div></div>
  <div className="voice-bottom">{micIssue&&<p className="voice-notice" role="status">{micIssue.message}</p>}{error&&<p className="voice-notice" role="status">{error}</p>}{needsCode&&<input type="password" aria-label="Voice access code" placeholder="Access code" value={code} onChange={e=>setCode(e.target.value)}/>}<div className="voice-controls">{connected?<button className="voice-mic" aria-label={muted?'Resume microphone':'Pause microphone'} aria-pressed={!muted} onClick={()=>{session.current?.setMicMuted(!muted);setMuted(!muted);}}>{muted?<MicOff size={23}/>:<Mic size={23}/>}</button>:status!=='connecting'&&<button className="voice-mic voice-retry" onClick={()=>setAttempt(n=>n+1)}><Mic size={18}/><span>{needsCode?'Connect':'Try again'}</span></button>}<button className="voice-hangup" aria-label="End voice conversation" onClick={onClose}><PhoneOff size={25}/></button></div><span className="voice-footer">{connected?'Hands-free · pause the mic anytime':<button className="voice-back-chat" onClick={onClose}>Back to Chat</button>}</span></div>
 </div>;
}
