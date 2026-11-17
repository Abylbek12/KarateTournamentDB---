/**
 * YouTube live streams per tatami.
 * The organizer pastes the link of a YouTube live broadcast; viewers watch it on the tournament's Live page.
 * Used by both the browser and the server (the server keeps only valid YouTube links).
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Video id from any usual YouTube link (watch?v=, youtu.be/, /live/, /embed/, /shorts/), or null. */
export function youtubeVideoId(input: string | null | undefined): string | null {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (ID_RE.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = url.searchParams.get('v');
    else if (['live', 'embed', 'shorts', 'v'].includes(parts[0])) id = parts[1] || null;
  }
  return id && ID_RE.test(id) ? id : null;
}

/** Normalized link that is stored and shown ("Open on YouTube"). */
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Player address for the embedded video (privacy-friendly domain, no cookies until play). */
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0`;

export const MAX_TATAMI = 12;

/** Keeps only tatami 1..12 with a valid YouTube link: { "1": "https://www.youtube.com/watch?v=..." }. */
export function sanitizeLiveStreams(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const n = Number(key);
    if (!Number.isInteger(n) || n < 1 || n > MAX_TATAMI) continue;
    const id = youtubeVideoId(typeof value === 'string' ? value : '');
    if (id) out[String(n)] = youtubeWatchUrl(id);
  }
  return out;
}

/** Tatami numbers that have a stream, in order. */
export function streamTatamis(streams: Record<string, string> | undefined): number[] {
  return Object.keys(streams || {})
    .map(Number)
    .filter((n) => Number.isInteger(n) && youtubeVideoId(streams![String(n)]))
    .sort((a, b) => a - b);
}
