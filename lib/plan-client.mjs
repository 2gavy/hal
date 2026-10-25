import { readPlanResponse } from './plan-stream.mjs';
// Browser -> Hal server. The server owns the Exa API key and Deep request.
/**
 * @param {string} query
 * @param {import('./hal-types').HalLocation} location
 * @param {AbortSignal} signal
 * @param {(answer: import('./hal-types').PartialAnswer) => void} onPartial
 * @returns {Promise<import('./hal-types').Result>}
 */
export async function requestPlan(query, location, signal, onPartial) {
  const response = await fetch('/api/hal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      mode: 'plan',
      stream: true,
      location: {
        country: location.country,
        city: location.city,
        ...('latitude' in location
          ? { latitude: location.latitude, longitude: location.longitude }
          : {}),
      },
    }),
    signal,
  });
  const result = await readPlanResponse(
    response,
    (partial) => {
      if (!signal.aborted) onPartial(partial);
    },
    signal,
  );
  signal.throwIfAborted();
  if (!response.ok)
    throw Object.assign(new Error(result.error || 'Something went wrong. Please try again.'), {
      status: response.status,
    });
  return result;
}
