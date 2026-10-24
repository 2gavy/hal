export function allowedOrigin(origin, requestOrigin, development = false) {
  if (!origin || origin === requestOrigin) return true;
  if (!development) return false;
  try {
    const source = new URL(origin), target = new URL(requestOrigin);
    const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
    return loopback.has(source.hostname) && loopback.has(target.hostname)
      && source.protocol === target.protocol && source.port === target.port;
  } catch { return false; }
}

export function localDevelopment(host, nodeEnv, vercel) {
  if (nodeEnv !== 'development' || vercel || !host) return false;
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(`http://${host}`).hostname);
  } catch { return false; }
}
