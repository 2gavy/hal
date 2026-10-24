import {formatDuration} from '@/lib/format-duration.mjs';
import MapShortcuts,{type MapPlace} from './map-shortcuts';
export function AnswerTimings({searchMs,voiceMs,planMs}:{searchMs?:number;voiceMs?:number;planMs?:number}){
 return (searchMs!=null||voiceMs!=null||planMs!=null)?<div className="answer-timings"><span className="action-timings">{planMs!=null&&<span className="action-latency" title="Plan request processing time, including retrieval and answer synthesis">Plan <b>{formatDuration(planMs)}</b></span>}{searchMs!=null&&<span className="action-latency" title="Exa server search time; excludes HTTP round-trip time">Search <b>{formatDuration(searchMs)}</b></span>}{voiceMs!=null&&<span className="action-latency" title="Final transcript to first received audio; excludes recognition and playback delay">Voice <b>{formatDuration(voiceMs)}</b></span>}</span></div>:null;
}
export default function AnswerActions({answer,places,query,searchMs,voiceMs}:{answer:string;places?:MapPlace[];query:string;searchMs?:number;voiceMs?:number}){
 return <div className="answer-actions">
  <MapShortcuts answer={answer} places={places} query={query}/>
  {(searchMs!=null||voiceMs!=null)&&<div className="action-timings">
  {searchMs!=null&&<span className="action-latency" title="Exa server search time; excludes HTTP round-trip time">Search <b>{formatDuration(searchMs)}</b></span>}
  {voiceMs!=null&&<span className="action-latency" title="Final transcript to first received audio; excludes recognition and playback delay">Voice <b>{formatDuration(voiceMs)}</b></span>}
  </div>}
 </div>;
}
