import {exaSearchMs} from '@/lib/search-timing.mjs';
import {readSSE,partialPlan} from '@/lib/plan-stream.mjs';
import {budgetEvidence} from '@/lib/context-budget.mjs';
import { NextRequest, NextResponse } from 'next/server';
import { resolveLocation, selectedLocation } from '@/lib/location.mjs';
import { buildSearch, safeUrl } from '@/lib/logic.mjs';
import { allowedOrigin, localDevelopment } from '@/lib/request-origin.mjs';
export const maxDuration = 60;
const buckets = new Map<string,{count:number;until:number}>();
function requiresAccess(req:NextRequest) {
 return !!process.env.HAL_ACCESS_CODE && !localDevelopment(req.headers.get('host'),process.env.NODE_ENV,process.env.VERCEL);
}
export async function GET(req:NextRequest) {
 const location=resolveLocation(req.headers.get('x-vercel-ip-country'),req.headers.get('x-vercel-ip-city'));
 return NextResponse.json({liveAvailable:!!process.env.EXA_API_KEY,accessRequired:requiresAccess(req),location},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req:NextRequest) {
 const start=Date.now();
 if(!process.env.EXA_API_KEY) return NextResponse.json({error:'Live search is not configured yet. Add EXA_API_KEY to .env.local (locally) or Vercel environment settings.'},{status:503});
 if(requiresAccess(req) && req.headers.get('x-hal-access')!==process.env.HAL_ACCESS_CODE) return NextResponse.json({error:'Enter the demo access code in settings.'},{status:401});
 const origin=req.headers.get('origin');
 if(!allowedOrigin(origin,req.nextUrl.origin,process.env.NODE_ENV==='development' && !process.env.VERCEL)) return NextResponse.json({error:'Request origin is not allowed.'},{status:403});
 if(Number(req.headers.get('content-length'))>16000) return NextResponse.json({error:'Your message is too long.'},{status:413});
 let body; try {body=await req.json();} catch {return NextResponse.json({error:'Invalid request.'},{status:400});}
 if(!body || typeof body.query!=='string' || !body.query.trim() || body.query.length>2000 || !['chat','plan'].includes(body.mode)) return NextResponse.json({error:'Please enter a message under 2,000 characters.'},{status:400});
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]||'local';
 const now=Date.now(); for(const [k,b] of buckets) if(b.until<now) buckets.delete(k);
 const bucket=buckets.get(key)||{count:0,until:now+60000};
 if(bucket.count>=10) return NextResponse.json({error:'A little breather — please try again in a minute.'},{status:429});
 bucket.count++; buckets.set(key,bucket);
 if(body.mode==='chat')return NextResponse.json({error:'Chat uses the ElevenLabs session endpoint.'},{status:400});
 const searchStart=Date.now();
 const upstreamAbort=new AbortController();
 const streaming=body.stream===true;
 try {
  const response=await fetch('https://api.exa.ai/search',{method:'POST',headers:{'Content-Type':'application/json',...(streaming?{Accept:'text/event-stream'}:{}),'x-api-key':process.env.EXA_API_KEY},body:JSON.stringify({...buildSearch(body.query.trim(),body.mode,selectedLocation(body.location,resolveLocation(req.headers.get('x-vercel-ip-country'),req.headers.get('x-vercel-ip-city')))),...(streaming?{stream:true}:{})}),signal:AbortSignal.any([upstreamAbort.signal,req.signal,AbortSignal.timeout(55000)])});
  if(!response.ok) return NextResponse.json({error:response.status===429?'Search is busy. Please try again shortly.':'Search could not complete. Please try again.',upstreamStatus:response.status},{status:502});
  function resultFor(data:any){
  const searchMs=exaSearchMs(data);
  const searchRoundtripMs=Date.now()-searchStart;
  const planEvidence=budgetEvidence((data.results||[]).map((r:{highlights?:string[]})=>({excerpt:(r.highlights||[]).join(' ')})),'plan');
  const content=data.output?.content;
  if(!content || typeof content.answer!=='string'||!content.answer.trim())throw new Error('Search returned no usable answer. Please try a more specific question.');
  const grounding=Array.isArray(data.output?.grounding)?data.output.grounding:[];
  const cited=grounding.flatMap((g:{citations?:{url:string;title:string}[]})=>g.citations||[]);
  const sources=Array.from(new Map(cited.filter((s:{url:string})=>safeUrl(s.url)).map((s:{url:string;title:string})=>[s.url,{title:s.title||new URL(s.url).hostname,url:s.url}])).values());
  return {title:content.title,answer:content.answer,sources,grounding,retrievedContext:planEvidence.sources.map((r:{excerpt:string})=>r.excerpt),sample:false,elapsedMs:Date.now()-start,metrics:{searchMs,searchRoundtripMs,searchTimingSource:'exa',searchType:'deep',highlights:'automatic',estimatedHighlightTokens:planEvidence.estimatedTokens,rawHighlightCharacters:planEvidence.rawCharacters,highlightCharacters:planEvidence.retainedCharacters,highlightCharacterLimit:planEvidence.characterLimit,highlightsTruncated:planEvidence.truncated,contextBudgetScope:'retained response highlights only; Exa internal synthesis context is not controlled',costDollars:data.costDollars?.total??null,requestId:data.requestId}};
  }
  if(!streaming||!response.headers.get('content-type')?.includes('text/event-stream'))return NextResponse.json(resultFor(await response.json()));
  const encoder=new TextEncoder();let cancelled=false;
  return new Response(new ReadableStream({
   async start(controller){
    const emit=(event:unknown)=>{if(!cancelled)controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));};
    let text='',data:any={},complete=false;
    try{
     for await(const frame of readSSE(response.body)){
      if(frame==='[DONE]')break;
      const event=JSON.parse(frame);
      if(event.error||event.type==='error')throw new Error('Search interrupted');
      const delta=event.choices?.[0]?.delta?.content??(event.type==='text-delta'?event.delta:undefined);
      if(typeof delta==='string'&&delta){text+=delta;emit({type:'partial',content:partialPlan(text)});}
      if(Array.isArray(event.results))data.results=event.results;
      if(exaSearchMs(event)!==undefined)data.searchTime=event.searchTime;
      if(event.type==='done'){data={...data,...event};complete=true;}
     }
     if(!complete)throw new Error('Incomplete search');
     emit({type:'complete',result:resultFor(data)});
    }catch{emit({type:'error',error:'Plan interrupted before it finished. Please try again.'});}
    finally{if(!cancelled)controller.close();}
   },
   cancel(){cancelled=true;upstreamAbort.abort();}
  }),{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'}});

 } catch(error) {return NextResponse.json({error:error instanceof Error && /abort|timeout/i.test(error.message)?'The request took too long. Please try again.':'Could not reach search. Please try again.'},{status:502});}
}
