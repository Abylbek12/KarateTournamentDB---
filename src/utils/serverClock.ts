/**
 * Shared tournament clock. Bout timers are stored as timestamps, so every device must
 * read the same time: a TV whose clock is 5 s behind the console would show 5 s more.
 * Each screen measures the difference between its clock and the server's and uses
 * server time for all bout clocks.
 */
let offsetMs = 0;
let started = false;

/** Current time on the server's clock (falls back to this device's clock). */
export const clockNow = () => Date.now() + offsetMs;

async function measure(): Promise<{ offset: number; rtt: number } | null> {
  try {
    const t0 = Date.now();
    const r = await fetch('/api/health', { cache: 'no-store' });
    const t1 = Date.now();
    const d = await r.json();
    if (typeof d.serverTime !== 'number') return null;
    return { offset: d.serverTime - (t0 + t1) / 2, rtt: t1 - t0 };
  } catch {
    return null;
  }
}

/** Takes a few samples and keeps the one with the shortest round trip. */
export async function syncServerClock() {
  const samples: { offset: number; rtt: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const s = await measure();
    if (s) samples.push(s);
  }
  if (samples.length) offsetMs = samples.sort((a, b) => a.rtt - b.rtt)[0].offset;
}

/** Starts syncing once per page (again every 5 minutes). */
export function startServerClock() {
  if (started || typeof window === 'undefined') return;
  started = true;
  syncServerClock();
  setInterval(syncServerClock, 5 * 60_000);
}
