import {NextRequest,NextResponse} from 'next/server';
import {appendFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {allowedOrigin,localDevelopment} from '@/lib/request-origin.mjs';
import {feedbackEvent} from '@/lib/feedback.mjs';
export const runtime='nodejs';
const buckets=new Map<string,{count:number;until:number}>();
export async function POST(req:NextRequest){
 const local=localDevelopment(req.headers.get('host'),process.env.NODE_ENV,process.env.VERCEL);
 if(!allowedOrigin(req.headers.get('origin'),req.nextUrl.origin,local))return NextResponse.json({error:'Origin not allowed'},{status:403});
 if(process.env.HAL_ACCESS_CODE&&!local&&req.headers.get('x-hal-access')!==process.env.HAL_ACCESS_CODE)return NextResponse.json({error:'Access code required'},{status:401});
 const now=Date.now();for(const [key,bucket] of buckets)if(bucket.until<now)buckets.delete(key);
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]||'local';const bucket=buckets.get(key)||{count:0,until:now+60000};
 if(bucket.count>=60)return NextResponse.json({error:'Please try again shortly'},{status:429});
 bucket.count++;buckets.set(key,bucket);
 let event;try{const text=await req.text();if(text.length>8000)return NextResponse.json({error:'Feedback too large'},{status:413});event=feedbackEvent(JSON.parse(text));}catch{return NextResponse.json({error:'Invalid feedback'},{status:400});}
 const record={...event,eventId:crypto.randomUUID()};
 try{
  if(local){const directory=join(process.cwd(),'.data');await mkdir(directory,{recursive:true});await appendFile(join(directory,'feedback.jsonl'),JSON.stringify(record)+'\n');}
  console.info(JSON.stringify(record));
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Could not save feedback'},{status:503});}
}
