// Browser-observed final transcript → first received audio chunk, not speech-end latency.
export function createVoiceLatency(now = () => performance.now()) {
 let started;
 return {
  begin() { started = now(); },
  reset() { started = undefined; },
  audio() {
   if (started === undefined) return undefined;
   const elapsed = Math.max(0, Math.round(now() - started));
   started = undefined;
   return elapsed;
  }
 };
}
