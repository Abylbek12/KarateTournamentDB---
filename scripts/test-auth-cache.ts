// Checks of the remembered sign-in (src/utils/authCache.ts). Run: npm run test:auth
import { AUTH_CACHE_KEY, parseCachedUser, readCachedUser, writeCachedUser } from '../src/utils/authCache';

let failures = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (!ok) failures++;
};
const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};
const user = { id: 'u1', email: 'coach@example.test', fullName: 'Тренер', role: 'club_coach', provider: 'credentials', isVerified: true, lastLoginAt: '2026-11-25T10:00:00Z' } as const;

{
  const s = mem();
  check('nothing stored → not signed in', readCachedUser(s) === null);
  writeCachedUser({ ...user, passwordHash: 'secret', consents: { x: 1 } } as any, s);
  const raw = s.m.get(AUTH_CACHE_KEY) || '';
  check('sign-in is remembered', readCachedUser(s)?.id === 'u1' && readCachedUser(s)?.role === 'club_coach');
  check('no password hash or extra server fields in the browser', !raw.includes('secret') && !raw.includes('consents'));
  writeCachedUser(null, s);
  check('sign-out forgets it', readCachedUser(s) === null && !s.m.has(AUTH_CACHE_KEY));
}
check('broken JSON → not signed in', parseCachedUser('{oops') === null);
check('unknown role → not signed in', parseCachedUser(JSON.stringify({ ...user, role: 'superuser' })) === null);
check('no id → not signed in', parseCachedUser(JSON.stringify({ ...user, id: '' })) === null);
{
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
  let threw = false;
  try {
    writeCachedUser(user as any, broken);
    check('blocked storage → reads as not signed in', readCachedUser(broken) === null);
  } catch {
    threw = true;
  }
  check('blocked storage does not break the site', !threw);
}

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nauth cache: all checks passed');
