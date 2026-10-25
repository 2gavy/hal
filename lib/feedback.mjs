// Allowlist telemetry and explicitly submitted feedback; omit prompts, answers and keys.
export function feedbackEvent(body, now = new Date()) {
 if (!body || typeof body.responseId !== 'string' || !/^[\w:-]{1,160}$/.test(body.responseId) || !['up','down',null].includes(body.rating) || !['chat','voice','plan'].includes(body.mode)) throw new Error('Invalid feedback');
 if(body.reason!==undefined && (typeof body.reason!=='string' || body.reason.length>1000)) throw new Error('Invalid feedback reason');
 const reason=body.rating==='down' ? (body.reason?.trim() || null) : null;
 const metrics={};
 for(const key of ['searchMs','voiceMs','estimatedHighlightTokens']) if(Number.isFinite(body.metrics?.[key])&&body.metrics[key]>=0&&body.metrics[key]<=1e9)metrics[key]=body.metrics[key];
 const domains=Array.isArray(body.sourceDomains)?[...new Set(body.sourceDomains.filter(v=>typeof v==='string'&&/^[a-z0-9.-]{1,253}$/i.test(v)))].slice(0,20):[];
 return {event:'hal.answer_feedback',schemaVersion:2,reason,responseId:body.responseId,rating:body.rating,mode:body.mode,receivedAt:now.toISOString(),measurementOrigin:'client',searchType:['lite','deep'].includes(body.searchType)?body.searchType:null,requestId:typeof body.requestId==='string'&&/^[\w:-]{1,160}$/.test(body.requestId)?body.requestId:null,metrics,sourceDomains:domains};
}
