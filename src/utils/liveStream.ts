/**
 * One shared connection to the server's live update stream (/api/stream).
 * The server announces every change ({ key, version }); screens then fetch the fresh data.
 */
type Listener = (event: { type: string; key?: string; version?: number }) => void;

const listeners = new Set<Listener>();
let source: EventSource | null = null;
let connected = false;

function ensure() {
  if (source || typeof window === 'undefined' || typeof EventSource === 'undefined') return;
  source = new EventSource('/api/stream');
  source.onopen = () => (connected = true);
  source.onerror = () => (connected = false); // EventSource reconnects by itself
  source.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data);
      listeners.forEach((l) => l(event));
    } catch {
      /* ignore malformed */
    }
  };
}

export function subscribeLive(listener: Listener): () => void {
  ensure();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isLiveConnected = () => connected;

/** Device key of a tatami console opened from a QR code (kept for this browser tab). */
export function getDeviceKey(): string | null {
  try {
    return sessionStorage.getItem('tatami_device_key');
  } catch {
    return null;
  }
}

export function setDeviceKey(key: string | null) {
  try {
    if (key) sessionStorage.setItem('tatami_device_key', key);
    else sessionStorage.removeItem('tatami_device_key');
  } catch {
    /* storage unavailable */
  }
}
