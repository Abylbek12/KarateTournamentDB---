import type { UserRole } from '../types/schema';

/** Role of the current visitor; 'guest' = not signed in. */
export type AccessRole = UserRole | 'guest';

const STAFF: AccessRole[] = ['admin', 'chief_referee', 'tatami_referee', 'scorekeeper'];
const SIGNED_IN: AccessRole[] = ['admin', 'chief_referee', 'tatami_referee', 'scorekeeper', 'club_coach', 'athlete', 'medical_officer'];

/**
 * Who may open which screen. 'public' = everyone, including visitors who are not signed in.
 * The server enforces the same rules for data changes; this table controls what is shown.
 */
export const TAB_ACCESS: Record<string, 'public' | AccessRole[]> = {
  // Public portal
  tournaments: 'public',
  tournament_details: 'public',
  event_info: 'public',
  event_categories_prices: 'public',
  event_brackets: 'public',
  event_results: 'public',
  event_medals: 'public',
  event_live_scoring: 'public',
  studios: 'public',
  virtual_studios: 'public',
  rankings: 'public',
  about: 'public',
  help: 'public',

  // Personal / club area (sign-in required)
  registration: ['admin', 'club_coach', 'athlete'],
  coach: ['admin', 'club_coach'],
  acquiring: ['admin', 'club_coach', 'athlete'],
  video_analytics: ['admin', 'chief_referee', 'club_coach'],

  // Competition operations (officials)
  scoreboard: STAFF,
  schedule: [...STAFF, 'medical_officer'],
  bracket: ['admin', 'chief_referee'],
  participants: ['admin', 'chief_referee', 'scorekeeper', 'medical_officer'],
  referee_vr: ['admin', 'chief_referee', 'tatami_referee'],
  protocols: STAFF,
  doctor: ['admin', 'chief_referee', 'medical_officer'],
  engine: ['admin', 'chief_referee'],
  analytics: ['admin', 'chief_referee'],

  // Organizer / site owner
  admin: SIGNED_IN, // admins manage events here; other roles see their personal cabinet
  accounting: ['admin'],
  exports: ['admin', 'chief_referee'],
  lan: ['admin'],
  categories: ['admin'],
  schema: ['admin'],
  sql: ['admin']
};

export function canAccess(tab: string, role: AccessRole): boolean {
  const rule = TAB_ACCESS[tab];
  if (!rule) return role === 'admin'; // unknown screens: admin only
  if (rule === 'public') return true;
  return rule.includes(role);
}

export const ROLE_LABELS: Record<AccessRole, string> = {
  guest: 'Гость',
  athlete: 'Спортсмен',
  club_coach: 'Тренер / клуб',
  tatami_referee: 'Судья татами',
  scorekeeper: 'Секретарь',
  chief_referee: 'Главный судья',
  medical_officer: 'Врач',
  admin: 'Администратор'
};
