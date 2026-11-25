// Remembered sign-in: the profile of the signed-in user is kept in the browser (localStorage), so after a page
// reload the site shows the account at once instead of a short «please sign in» screen while /api/auth/me answers.
// Only a hint for the screen: the real check is the session cookie on the server, which confirms or clears it.
// No password, cookie or token is stored here.
import type { AuthenticatedUserProfile, UserRole } from '../types/schema';

export const AUTH_CACHE_KEY = 'tatami_auth_user';

const ROLES: UserRole[] = ['admin', 'organizer', 'chief_referee', 'tatami_referee', 'scorekeeper', 'club_coach', 'athlete', 'medical_officer'];

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
const store = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Only the fields the screen needs, so nothing extra from the server lands in the browser. */
export function toCachedProfile(u: AuthenticatedUserProfile): AuthenticatedUserProfile {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    provider: u.provider,
    avatarUrl: u.avatarUrl,
    licenseCode: u.licenseCode,
    clubName: u.clubName,
    alsoCompetes: u.alsoCompetes,
    isVerified: u.isVerified,
    confirmedAt: u.confirmedAt,
    lastLoginAt: u.lastLoginAt
  };
}

/** Parses a stored value; anything broken or unexpected counts as «not signed in». */
export function parseCachedUser(raw: string | null | undefined): AuthenticatedUserProfile | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (!u || typeof u !== 'object' || typeof u.id !== 'string' || !u.id || typeof u.email !== 'string') return null;
    if (!ROLES.includes(u.role)) return null;
    return { ...u, fullName: typeof u.fullName === 'string' ? u.fullName : '' } as AuthenticatedUserProfile;
  } catch {
    return null;
  }
}

export function readCachedUser(s: Storage | null = store()): AuthenticatedUserProfile | null {
  try {
    return parseCachedUser(s?.getItem(AUTH_CACHE_KEY));
  } catch {
    return null;
  }
}

/** Saves the profile after sign-in / profile change; null (sign-out, expired session) removes it. */
export function writeCachedUser(u: AuthenticatedUserProfile | null, s: Storage | null = store()) {
  try {
    if (u) s?.setItem(AUTH_CACHE_KEY, JSON.stringify(toCachedProfile(u)));
    else s?.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Private mode / blocked storage: the site still works, only without the instant restore
  }
}
