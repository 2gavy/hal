export function formatDuration(ms) {
 if (!Number.isFinite(ms) || ms < 0) return '—';
 if (ms < 1000) return `${Math.round(ms)} ms`;
 if (ms < 60000) return `${Number((ms / 1000).toFixed(2))} s`;
 return `${Number((ms / 60000).toFixed(2))} min`;
}
