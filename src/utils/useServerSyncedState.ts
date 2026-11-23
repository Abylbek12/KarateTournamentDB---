import React from 'react';
import { subscribeLive, isLiveConnected } from './liveStream';

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

interface Options {
  /** Try to save local changes to the server (normally: a user is signed in). */
  canWrite: boolean;
  /** Called with a human-readable message when the server refuses a save. */
  onError?: (message: string) => void;
  /** How often to check the server for changes made on other devices (ms). */
  pollMs?: number;
  /** Save the whole value automatically after local changes (default true). */
  autoSave?: boolean;
}

export interface SyncControls {
  /** Skip pulls for a moment after an optimistic local change saved elsewhere. */
  holdPulls: (ms: number) => void;
  /** true once the first answer from the server has arrived (or failed): before that, «empty» does not mean «no data». */
  loaded: boolean;
}

/**
 * Like useState, but the value lives on the server (/api/state/:key):
 * - loads the saved value on start;
 * - saves local changes (debounced) when the user is allowed to;
 * - picks up changes from other devices every few seconds.
 * If the server has no saved value yet, the initial value is used.
 */
export function useServerSyncedState<T>(key: string, initial: T, options: Options): [T, Setter<T>, SyncControls] {
  const [value, setValue] = React.useState<T>(initial);
  const versionRef = React.useRef(0);
  const syncedJsonRef = React.useRef<string | null>(null);
  const loadedRef = React.useRef(false);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = React.useRef(false);
  const errorShownRef = React.useRef(false);
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const holdUntilRef = React.useRef(0);
  const [loaded, setLoaded] = React.useState(false);
  const controls = React.useMemo<SyncControls>(() => ({ holdPulls: (ms) => (holdUntilRef.current = Date.now() + ms), loaded }), [loaded]);

  const adopt = React.useCallback((serverValue: unknown, version: number) => {
    versionRef.current = version;
    if (serverValue !== null && serverValue !== undefined) {
      syncedJsonRef.current = JSON.stringify(serverValue);
      setValue(serverValue as T);
    }
  }, []);

  // Initial load + polling for changes from other devices.
  React.useEffect(() => {
    let cancelled = false;

    const pull = async (initialLoad: boolean) => {
      if (savingRef.current || saveTimerRef.current) return; // don't clobber unsaved local edits
      if (!initialLoad && Date.now() < holdUntilRef.current) {
        setTimeout(() => pull(false), holdUntilRef.current - Date.now() + 50);
        return;
      }
      try {
        const url = initialLoad ? `/api/state/${key}` : `/api/state/${key}?since=${versionRef.current}`;
        const res = await fetch(url);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled || savingRef.current || saveTimerRef.current) return;
        if (data.changed !== false) adopt(data.value, data.version ?? 0);
      } catch {
        // offline: keep working with local data
      } finally {
        if (initialLoad) {
          loadedRef.current = true;
          if (!cancelled) setLoaded(true);
        }
      }
    };

    pull(true);
    // Instant updates from the server; polling stays as a safety net (slower while live).
    const unsubscribe = subscribeLive((event) => {
      if (event.type === 'state' && event.key === key && event.version !== versionRef.current) pull(false);
      if (event.type === 'hello') pull(false);
    });
    // Ticks every second. With instant updates: a safety check every 15 s.
    // Without them (Vercel): poll every pollMs. The page changes pollMs as the visitor moves between screens
    // (fast only where bouts are live), so it is read on every tick instead of restarting the loop.
    // A tab nobody looks at (hidden or minimised) does not ask the server at all.
    let sinceLastPull = 0;
    const timer = setInterval(() => {
      sinceLastPull++;
      const every = isLiveConnected() ? 15 : Math.max(1, Math.round((optionsRef.current.pollMs ?? 3000) / 1000));
      if (sinceLastPull < every) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      sinceLastPull = 0;
      pull(false);
    }, 1000);
    // Coming back to the tab: fresh data right away
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        sinceLastPull = 0;
        pull(false);
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      unsubscribe();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key, adopt]);

  // Save local changes.
  React.useEffect(() => {
    if (!loadedRef.current) return;
    const json = JSON.stringify(value);
    if (json === syncedJsonRef.current) return;
    if (!optionsRef.current.canWrite || optionsRef.current.autoSave === false) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      savingRef.current = true;
      try {
        const res = await fetch(`/api/state/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseVersion: versionRef.current, value: JSON.parse(json) })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          versionRef.current = data.version;
          syncedJsonRef.current = json;
          errorShownRef.current = false;
        } else if (res.status === 409) {
          adopt(data.value, data.version ?? versionRef.current);
          optionsRef.current.onError?.(
            'Эти данные только что изменили на другом устройстве — показана свежая версия. Повторите своё изменение.'
          );
        } else {
          // Not allowed: remember this version so we don't retry in a loop.
          syncedJsonRef.current = json;
          if (!errorShownRef.current) {
            errorShownRef.current = true;
            optionsRef.current.onError?.(data.error || 'Сервер не сохранил изменения.');
          }
        }
      } catch {
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          optionsRef.current.onError?.('Нет связи с сервером: изменения пока сохранены только на этом устройстве.');
        }
      } finally {
        savingRef.current = false;
      }
    }, 700);
  }, [value, key, adopt]);

  return [value, setValue, controls];
}
