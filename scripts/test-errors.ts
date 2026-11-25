// Checks for src/utils/globalErrors.ts: which errors show a notice, repeats are not spammed,
// fetchJson never throws and explains failures in the visitor's language.
import assert from 'node:assert/strict';
import { classifyError, isIgnorableError, isStaleBundleError, reportNotice, subscribeNotice, dismissNotice, fetchJson, type GlobalNotice } from '../src/utils/globalErrors';

let passed = 0;
const check = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  passed++;
  console.log('✓', name);
};

await check('browser noise is ignored', () => {
  assert.equal(isIgnorableError('ResizeObserver loop completed with undelivered notifications.'), true);
  assert.equal(isIgnorableError('Script error.'), true);
  assert.equal(classifyError(new DOMException('The user aborted a request.', 'AbortError')), null);
});

await check('a vanished screen file after a site update asks to refresh', () => {
  assert.equal(isStaleBundleError('Failed to fetch dynamically imported module: https://x/assets/a.js'), true);
  assert.equal(classifyError(new TypeError('Failed to fetch dynamically imported module: /assets/b.js')), 'update');
});

await check('a real bug is reported', () => {
  assert.equal(classifyError(new TypeError("Cannot read properties of undefined (reading 'id')")), 'error');
});

await check('the same notice is not repeated while it is shown; offline is not replaced by a passing error', () => {
  const seen: (GlobalNotice | null)[] = [];
  const off = subscribeNotice((n) => seen.push(n));
  dismissNotice();
  seen.length = 0;
  reportNotice('offline');
  reportNotice('offline');
  reportNotice('error');
  assert.equal(seen.filter(Boolean).length, 1);
  assert.equal(seen[0]?.kind, 'offline');
  reportNotice('update'); // a new version matters more
  assert.equal(seen.at(-1)?.kind, 'update');
  dismissNotice();
  off();
});

await check('fetchJson: no connection -> friendly text, no exception', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new TypeError('fetch failed');
  }) as typeof fetch;
  try {
    const r = await fetchJson('/api/events', undefined, 'ky');
    assert.equal(r.ok, false);
    assert.equal(r.status, 0);
    assert.match(r.error || '', /Интернетти/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

await check('fetchJson: server text wins, otherwise a 5xx explanation', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) =>
    url.includes('bad') ? new Response(JSON.stringify({ error: 'Нет такого турнира' }), { status: 404 }) : new Response('oops', { status: 502 })) as typeof fetch;
  try {
    assert.equal((await fetchJson('/api/bad')).error, 'Нет такого турнира');
    const r = await fetchJson('/api/x', undefined, 'en');
    assert.equal(r.status, 502);
    assert.match(r.error || '', /server/i);
    globalThis.fetch = (async () => new Response(JSON.stringify({ events: [] }), { status: 200 })) as typeof fetch;
    const ok = await fetchJson<{ events: unknown[] }>('/api/events');
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.data, { events: [] });
  } finally {
    globalThis.fetch = realFetch;
  }
});

console.log(`\nerrors: all ${passed} checks passed`);
