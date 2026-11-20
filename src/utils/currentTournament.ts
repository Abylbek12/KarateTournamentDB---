/**
 * «Current tournament» for organizers and officials: one choice shared by every working screen
 * (tatami, weigh-in, draw, screens & video, fees, documents).
 */

interface EventLike {
  id: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  isArchived?: boolean;
}

const STORAGE_KEY = 'tatami_current_event';

const isFinished = (e: EventLike, today: string) =>
  e.status === 'completed' || !!e.isArchived || (!!(e.endDate || e.startDate) && (e.endDate || e.startDate)! < today);

/**
 * Which tournament to open by default:
 * 1) the one this organizer chose before (if it is not finished),
 * 2) the one running today,
 * 3) the nearest upcoming one,
 * 4) otherwise the most recent one.
 */
export function pickCurrentTournament<T extends EventLike>(events: T[], today: string, remembered?: string | null): T | undefined {
  if (events.length === 0) return undefined;
  const chosen = remembered ? events.find((e) => e.id === remembered) : undefined;
  if (chosen && !isFinished(chosen, today)) return chosen;
  const running = events.filter((e) => e.startDate && e.startDate <= today && (e.endDate || e.startDate)! >= today && e.status !== 'completed');
  if (running.length > 0) return running.sort((a, b) => (a.startDate! < b.startDate! ? -1 : 1))[0];
  const upcoming = events.filter((e) => e.startDate && e.startDate > today && !isFinished(e, today));
  if (upcoming.length > 0) return upcoming.sort((a, b) => (a.startDate! < b.startDate! ? -1 : 1))[0];
  return [...events].sort((a, b) => ((a.endDate || a.startDate || '') > (b.endDate || b.startDate || '') ? -1 : 1))[0];
}

/** Local date as YYYY-MM-DD (the tournament dates are local, not UTC). */
export function localToday(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function readRememberedTournament(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberTournament(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode: not remembered */
  }
}
