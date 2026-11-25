// One place for unexpected problems on the page:
//  * window "error" and "unhandledrejection" -> a calm notice instead of a white screen;
//  * every fetch() to our own /api: no connection -> «нет связи» notice until a request succeeds again,
//    a server failure (5xx) -> a short notice. 4xx answers stay with the screen that asked (it shows its own text).
// The notice itself is drawn by <GlobalErrorNotice /> (src/components/GlobalErrorNotice.tsx).

export type NoticeKind = 'offline' | 'server' | 'update' | 'error';

export interface GlobalNotice {
  kind: NoticeKind;
  /** Technical detail for the console / curious users; never shown as the main text. */
  detail?: string;
  at: number;
}

type Listener = (notice: GlobalNotice | null) => void;

const listeners = new Set<Listener>();
let current: GlobalNotice | null = null;
const lastShown: Partial<Record<NoticeKind, number>> = {};
/** The same kind of notice is not repeated more often than this (polling every second must not spam). */
const REPEAT_MS: Record<NoticeKind, number> = { offline: 0, server: 20000, update: 0, error: 15000 };

function emit(next: GlobalNotice | null) {
  current = next;
  listeners.forEach((l) => l(next));
}

export function subscribeNotice(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export function dismissNotice() {
  emit(null);
}

export function reportNotice(kind: NoticeKind, detail?: string) {
  const now = Date.now();
  // A new site version or no connection matter more than a passing error: do not replace them
  if (current && (current.kind === 'update' || current.kind === 'offline') && kind !== 'update' && current.kind !== kind) return;
  if (current?.kind === kind) return;
  const last = lastShown[kind] ?? 0;
  if (REPEAT_MS[kind] && now - last < REPEAT_MS[kind]) return;
  lastShown[kind] = now;
  emit({ kind, detail, at: now });
}

/** Connection is back: hide the «no connection» notice. */
function connectionRestored() {
  if (current?.kind === 'offline') emit(null);
}

/** Errors that are not ours or do not break anything. */
export function isIgnorableError(message: string): boolean {
  const m = message || '';
  return (
    /ResizeObserver loop/i.test(m) ||
    // Cross-origin scripts (browser extensions, YouTube player) report only this text
    /^Script error\.?$/i.test(m) ||
    /AbortError|The user aborted a request|signal is aborted/i.test(m) ||
    /NotAllowedError/i.test(m) || // autoplay / speech blocked by the browser
    /Non-Error promise rejection captured/i.test(m)
  );
}

/** A lazily loaded screen file is gone: the site was updated while the page was open. */
export function isStaleBundleError(message: string): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk \d+ failed/i.test(
    message || ''
  );
}

export function classifyError(error: unknown): NoticeKind | null {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? '');
  if (isIgnorableError(message)) return null;
  if (isStaleBundleError(message)) return 'update';
  return 'error';
}

function isOwnApi(input: RequestInfo | URL): boolean {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

function isQuietPath(input: RequestInfo | URL): boolean {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return /\/api\/(chat|health)\b/.test(raw);
}

let installed = false;

/** Call once at start-up (main.tsx). Safe to call again. */
export function installGlobalErrorHandlers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    // Failed <img>/<script> loads also come here (without .error): images have their own fallbacks
    if (!(event instanceof ErrorEvent)) return;
    const kind = classifyError(event.error ?? event.message);
    if (!kind) return;
    console.error('[global error]', event.error ?? event.message);
    reportNotice(kind, event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const kind = classifyError(event.reason);
    if (!kind) return;
    console.error('[unhandled promise]', event.reason);
    // A failed fetch nobody caught: the fetch wrapper already showed «no connection»
    if (event.reason instanceof TypeError && /fetch|network|load failed/i.test(event.reason.message)) return;
    reportNotice(kind, event.reason instanceof Error ? event.reason.message : String(event.reason));
  });

  window.addEventListener('offline', () => reportNotice('offline'));
  window.addEventListener('online', connectionRestored);

  // Single fetch handler for our API. The original behaviour is kept exactly:
  // the same Response is returned and the same error is thrown, so every screen still handles its own cases.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const own = isOwnApi(input);
    try {
      const res = await originalFetch(input, init);
      if (own) {
        // The assistant explains its own failures in its window
        if (res.status >= 500 && !isQuietPath(input)) reportNotice('server', `${res.status} ${res.statusText}`);
        else connectionRestored();
      }
      return res;
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (own && !aborted) reportNotice('offline', err instanceof Error ? err.message : String(err));
      throw err;
    }
  };
}

export interface JsonResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Human-readable reason in the visitor's language when ok is false. */
  error?: string;
}

/**
 * fetch + JSON with friendly errors, for new code: never throws.
 * `lang` picks the language of the error text.
 */
export async function fetchJson<T = unknown>(url: string, init?: RequestInit, lang: 'ru' | 'ky' | 'en' = 'ru'): Promise<JsonResult<T>> {
  const say = (ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);
  try {
    const res = await fetch(url, init);
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }
    if (res.ok) return { ok: true, status: res.status, data };
    const serverText = data && typeof data === 'object' && 'error' in data ? String((data as { error?: unknown }).error || '') : '';
    const fallback =
      res.status >= 500
        ? say('Сервер временно не отвечает. Попробуйте ещё раз.', 'Сервер убактылуу жооп бербей жатат. Кайра аракет кылыңыз.', 'The server is not responding. Please try again.')
        : res.status === 401 || res.status === 403
          ? say('Нет доступа. Войдите в аккаунт.', 'Кирүү укугу жок. Аккаунтка кириңиз.', 'No access. Please sign in.')
          : say('Не получилось выполнить запрос.', 'Сурам аткарылган жок.', 'The request failed.');
    return { ok: false, status: res.status, data, error: serverText || fallback };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: say('Нет связи с сервером. Проверьте интернет.', 'Сервер менен байланыш жок. Интернетти текшериңиз.', 'No connection to the server. Check the internet.')
    };
  }
}
