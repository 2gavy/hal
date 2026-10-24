import {exaSearchMs} from './search-timing.mjs';
import {safeUrl} from './logic.mjs';
export function parseElevenEvidence(event){
 if(event.tool_name!=='web_search'||event.is_error||typeof event.full_tool_result!=='string')return null;
 try{const data=JSON.parse(event.full_tool_result);
  if(!data||!Array.isArray(data.results))return null;
  const places=data.results.flatMap(r=>Array.isArray(r?.entities)?r.entities:[]).filter(e=>e?.type==='place'&&typeof e.properties?.name==='string').map(e=>({name:e.properties.name,address:typeof e.properties.address==='string'?e.properties.address:undefined}));
  const highlights=data.results.flatMap(r=>Array.isArray(r?.highlights)?r.highlights:[]).filter(h=>typeof h==='string');
  const estimatedHighlightTokens=highlights.length?Math.ceil(highlights.reduce((n,h)=>n+h.length,0)/4):undefined;
  return {estimatedHighlightTokens,places,sources:data.results.filter(r=>r&&safeUrl(r.url)).map(r=>({title:typeof r.title==='string'?r.title:new URL(r.url).hostname,url:r.url})),searchMs:exaSearchMs(data)};
 }catch{return null;}
}
export function elevenLanguage(country){return {SG:'en',MY:'ms',PH:'tl',TH:'th',ID:'id'}[country]||'en';}
