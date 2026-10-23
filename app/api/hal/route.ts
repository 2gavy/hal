import { NextRequest, NextResponse } from 'next/server';
import { resolveLocation } from '@/lib/location.mjs';
import { buildSearch, safeUrl } from '@/lib/logic.mjs';
export const maxDuration = 60;
const buckets = new Map<string,{count:number;until:number}>();
export async function GET(req:NextRequest) {
 const location=resolveLocation(req.headers.get('x-vercel-ip-country'),req.headers.get('x-vercel-ip-city'));
 return NextResponse.json({liveAvailable:!!process.env.EXA_API_KEY,accessRequired:!!process.env.HAL_ACCESS_CODE,location},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req:NextRequest) {
 const start=Date.now();
 if(!process.env.EXA_API_KEY) return NextResponse.json({error:'Live search is not configured yet. Use sample mode, or add EXA_API_KEY in Vercel.'},{status:503});
 if(process.env.HAL_ACCESS_CODE && req.headers.get('x-hal-access')!==process.env.HAL_ACCESS_CODE) return NextResponse.json({error:'Enter the demo access code in settings.'},{status:401});
 const origin=req.headers.get('origin');
 if(origin && origin!==req.nextUrl.origin) return NextResponse.json({error:'Request origin is not allowed.'},{status:403});
 if(Number(req.headers.get('content-length'))>16000) return NextResponse.json({error:'Your message is too long.'},{status:413});
 let body; try {body=await req.json();} catch {return NextResponse.json({error:'Invalid request.'},{status:400});}
 if(!body || typeof body.query!=='string' || !body.query.trim() || body.query.length>2000 || !['chat','plan'].includes(body.mode)) return NextResponse.json({error:'Please enter a message under 2,000 characters.'},{status:400});
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]||'local';
 const now=Date.now(); for(const [k,b] of buckets) if(b.until<now) buckets.delete(k);
 const bucket=buckets.get(key)||{count:0,until:now+60000};
 if(bucket.count>=10) return NextResponse.json({error:'A little breather — please try again in a minute.'},{status:429});
 bucket.count++; buckets.set(key,bucket);
 try {
  const response=await fetch('https://api.exa.ai/search',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.EXA_API_KEY,'Exa-Beta':'dynamic-highlights-2026-08-28'},body:JSON.stringify(buildSearch(body.query.trim(),body.mode,resolveLocation(req.headers.get('x-vercel-ip-country'),req.headers.get('x-vercel-ip-city')))),signal:AbortSignal.any([req.signal,AbortSignal.timeout(55000)])});
  if(!response.ok) return NextResponse.json({error:response.status===429?'Search is busy. Please try again shortly.':'Search could not complete. Please try again.',upstreamStatus:response.status},{status:502});
  const data=await response.json();
  const content=data.output?.content;
  if(!content || typeof content.answer!=='string') return NextResponse.json({error:'Search returned no usable answer. Please try a more specific question.'},{status:502});
  const grounding=Array.isArray(data.output?.grounding)?data.output.grounding:[];
  const cited=grounding.flatMap((g:{citations?:{url:string;title:string}[]})=>g.citations||[]);
  const sources=Array.from(new Map(cited.filter((s:{url:string})=>safeUrl(s.url)).map((s:{url:string;title:string})=>[s.url,{title:s.title||new URL(s.url).hostname,url:s.url}])).values());
  return NextResponse.json({title:content.title,answer:content.answer,sources,grounding,sample:false,elapsedMs:Date.now()-start,metrics:{searchType:body.mode==='plan'?'deep':'auto',highlights:'dynamic',estimatedHighlightTokens:Math.ceil((data.results||[]).reduce((n:number,r:{highlights?:string[]})=>n+(r.highlights||[]).join('').length,0)/4),costDollars:data.costDollars?.total??null,requestId:data.requestId}});
 } catch(error) {return NextResponse.json({error:error instanceof Error && /abort|timeout/i.test(error.message)?'Search took too long. Your plan run was not used. Please try again.':'Could not reach search. Please try again.'},{status:502});}
}
