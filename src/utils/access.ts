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
  coach: ['admin', 'club_coach', 'athlete'],
  acquiring: ['admin', 'club_coach', 'athlete'],

  // Competition operations (officials)
  scoreboard: [...STAFF, 'medical_officer'],
  participants: ['admin', 'chief_referee', 'scorekeeper', 'medical_officer'],

  // Organizer / site owner
  admin: SIGNED_IN, // admins manage events here; other roles see their personal cabinet
  exports: ['admin', 'chief_referee'],
  lan: ['admin'],
  screens: ['admin'],
  event_setup: ['admin', 'chief_referee'],
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

/** Role name in the interface language (ru / ky / en). */
const ROLE_LABELS_KY: Record<AccessRole, string> = {
  guest: 'Конок',
  athlete: 'Спортчу',
  club_coach: 'Машыктыруучу / клуб',
  tatami_referee: 'Татами калысы',
  scorekeeper: 'Катчы',
  chief_referee: 'Башкы калыс',
  medical_officer: 'Дарыгер',
  admin: 'Администратор'
};

const ROLE_LABELS_EN: Record<AccessRole, string> = {
  guest: 'Guest',
  athlete: 'Athlete',
  club_coach: 'Coach / club',
  tatami_referee: 'Tatami referee',
  scorekeeper: 'Scorekeeper',
  chief_referee: 'Chief referee',
  medical_officer: 'Medical officer',
  admin: 'Administrator'
};

export function roleLabel(role: AccessRole, language: string): string {
  if (language === 'ky') return ROLE_LABELS_KY[role];
  if (language === 'en') return ROLE_LABELS_EN[role];
  return ROLE_LABELS[role];
}
