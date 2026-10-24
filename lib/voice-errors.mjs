export function microphoneIssue(error) {
 const name=error?.name||'',message=String(error?.message||error||'');
 if(name==='NotAllowedError'||name==='SecurityError'||/permission denied|permission dismissed|not allowed|microphone.*blocked/i.test(message))return {title:'Allow your microphone',message:'Allow microphone access in Settings, then try again.'};
 if(name==='NotFoundError'||/no.*microphone|requested device not found/i.test(message))return {title:'No microphone found',message:'Connect a microphone, then try again.'};
 if(name==='NotReadableError'||/could not start audio|device.*in use/i.test(message))return {title:'Microphone is busy',message:'Close other apps using your mic, then try again.'};
 if(name==='NotSupportedError')return {title:'Voice isn’t available here',message:'Try Chrome or Safari, or use typed Chat.'};
 return null;
}
