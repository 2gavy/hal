import {NextRequest,NextResponse} from 'next/server';
import {allowedOrigin,localDevelopment} from '@/lib/request-origin.mjs';
export const maxDuration=20;
const requests=new Map<string,{count:number;until:number}>();
export async function POST(req:NextRequest){
 const local=localDevelopment(req.headers.get('host'),process.env.NODE_ENV,process.env.VERCEL);
 const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
 if(!allowedOrigin(req.headers.get('origin'),req.nextUrl.origin,local))return reply({error:'Request origin is not allowed.'},403);
 if(!local&&(!process.env.HAL_ACCESS_CODE||req.headers.get('x-hal-access')!==process.env.HAL_ACCESS_CODE))return reply({error:'Enter your access code to start voice.'},401);
 if(!process.env.ELEVENLABS_API_KEY||!process.env.ELEVENLABS_AGENT_ID)return reply({error:'ElevenLabs voice setup is not complete yet.'},503);
 const now=Date.now();for(const [key,value] of requests)if(value.until<now)requests.delete(key);
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]||'local';
 const bucket=requests.get(key)||{count:0,until:now+60000};
 if(bucket.count>=5)return reply({error:'Please wait a moment before starting another call.'},429);
 bucket.count++;requests.set(key,bucket);
 try{
  const url=new URL('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url');url.searchParams.set('agent_id',process.env.ELEVENLABS_AGENT_ID);url.searchParams.set('include_conversation_id','true');if(process.env.ELEVENLABS_AGENT_VERSION_ID)url.searchParams.set('version_id',process.env.ELEVENLABS_AGENT_VERSION_ID);
  const response=await fetch(url,{headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},cache:'no-store',signal:AbortSignal.any([req.signal,AbortSignal.timeout(15000)])});
  if(!response.ok)return reply({error:'Could not connect to ElevenLabs. Check the server key, agent and permissions.'},502);
  const data=await response.json();if(typeof data.signed_url!=='string')throw new Error('Missing session');
  return reply({signedUrl:data.signed_url});
 }catch{return reply({error:'Voice connection failed. Please try again.'},502);}
}
