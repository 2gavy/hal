// Exa's server metric is distinct from HTTP/tool round-trip duration.
export function exaSearchMs(data) {
 const ms=data?.searchTime;
 return typeof ms==='number'&&Number.isFinite(ms)&&ms>=0?ms:undefined;
}
