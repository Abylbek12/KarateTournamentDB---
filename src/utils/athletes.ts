// Club athlete database («Мои спортсмены»): a coach or parent enters an athlete once and reuses the card for every entry.
// One module for the server (which checks and stores) and the website (which shows the form).
// Run the checks: npm run test:athletes

import { athleteKey } from './pricing';

export const BELT_RANKS = [
  'white_10kyu', 'yellow_8kyu', 'orange_7kyu', 'green_6kyu', 'blue_4kyu', 'brown_3kyu', 'brown_1kyu',
  'black_1dan', 'black_2dan', 'black_3dan_plus', 'other'
] as const;

export interface ClubAthlete {
  id: string;
  /** Account that keeps the card (coach or parent). Only it and the admin see the card. */
  ownerId: string;
  lastName: string;
  firstName: string;
  lastNameLatin?: string;
  firstNameLatin?: string;
  /** YYYY-MM-DD */
  birthDate: string;
  gender: 'male' | 'female';
  beltRank: string;
  beltOther?: string;
  /** Last known weight. */
  weightKg?: number;
  licenseNumber?: string;
  clubName?: string;
  city?: string;
  countryCode?: string;
  /** Archived cards are hidden from the entry form but kept: old entries and results point to them. */
  archived?: boolean;
  /** The account owner's own card (a coach who also competes): «Добавить себя» uses it. */
  isSelf?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fields a person may send; id, owner and dates are set by the server. */
export type ClubAthleteInput = Partial<Omit<ClubAthlete, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

/** Who may keep a roster: coaches, athletes/parents and the admin. */
export const ROSTER_ROLES = new Set(['club_coach', 'athlete', 'admin']);
export const MAX_ATHLETES_PER_OWNER = 500;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const optional = (v: unknown, max: number) => text(v, max) || undefined;

export const isValidBirthDate = (v: string) => {
  if (!DATE.test(v) || Number.isNaN(Date.parse(v))) return false;
  const year = Number(v.slice(0, 4));
  return year >= 1920 && v <= new Date().toISOString().slice(0, 10);
};

/** Checks what a person sent. Returns clean fields or a Russian error message for the screen. */
export function sanitizeAthlete(input: unknown): { ok: true; value: Omit<ClubAthlete, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> } | { ok: false; error: string } {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const lastName = text(raw.lastName, 80);
  const firstName = text(raw.firstName, 80);
  const birthDate = text(raw.birthDate, 10);
  if (!lastName || !firstName) return { ok: false, error: 'Укажите фамилию и имя спортсмена.' };
  if (!isValidBirthDate(birthDate)) return { ok: false, error: 'Укажите правильную дату рождения.' };
  if (raw.gender !== 'male' && raw.gender !== 'female') return { ok: false, error: 'Укажите пол спортсмена.' };
  const beltRank = (BELT_RANKS as readonly string[]).includes(String(raw.beltRank)) ? String(raw.beltRank) : 'white_10kyu';
  const weight = Math.round(Number(raw.weightKg) * 10) / 10;
  const countryCode = text(raw.countryCode, 3).toUpperCase();
  return {
    ok: true,
    value: {
      lastName,
      firstName,
      lastNameLatin: optional(raw.lastNameLatin, 80),
      firstNameLatin: optional(raw.firstNameLatin, 80),
      birthDate,
      gender: raw.gender,
      beltRank,
      beltOther: beltRank === 'other' ? optional(raw.beltOther, 40) : undefined,
      weightKg: Number.isFinite(weight) && weight >= 10 && weight <= 250 ? weight : undefined,
      licenseNumber: optional(raw.licenseNumber, 40),
      clubName: optional(raw.clubName, 120),
      city: optional(raw.city, 80),
      countryCode: /^[A-Z]{3}$/.test(countryCode) ? countryCode : undefined,
      archived: raw.archived === true ? true : undefined,
      isSelf: raw.isSelf === true ? true : undefined
    }
  };
}

export const keyOf = (a: { lastName: string; firstName: string; birthDate: string }) => athleteKey(a.lastName, a.firstName, a.birthDate);

/** Same surname + name + birth date in one owner's roster = the same athlete. */
export function findSameAthlete<T extends ClubAthlete>(list: T[], ownerId: string, a: { lastName: string; firstName: string; birthDate: string }, exceptId?: string): T | undefined {
  const key = keyOf(a);
  return list.find((x) => x.ownerId === ownerId && x.id !== exceptId && keyOf(x) === key);
}

/** Cards an account may see: its own; the admin may look at one owner or at its own list. */
export function visibleAthletes<T extends ClubAthlete>(list: T[], user: { id: string; role: string }, ownerId?: string): T[] {
  if (user.role === 'admin' && ownerId) return list.filter((a) => a.ownerId === ownerId);
  return list.filter((a) => a.ownerId === user.id);
}

export const canManageAthlete = (a: ClubAthlete, user: { id: string; role: string }) => a.ownerId === user.id || user.role === 'admin';

/** A card built from an entry (when someone enters a new athlete by hand, or from past entries). */
export function athleteFromEntry(p: Record<string, any>) {
  return sanitizeAthlete({
    lastName: p.lastName,
    firstName: p.firstName,
    lastNameLatin: p.lastNameLatin,
    firstNameLatin: p.firstNameLatin,
    birthDate: p.birthDate,
    gender: p.gender,
    beltRank: p.beltRank,
    beltOther: p.beltOther,
    weightKg: p.declaredWeightKg,
    licenseNumber: p.licenseNumber,
    clubName: p.clubName,
    city: p.city,
    countryCode: p.countryCode
  });
}

/**
 * Athletes from this account's past entries that are not in its roster yet (one per athlete: the newest entry wins).
 * Team entries and withdrawn-only data are fine to skip: a team has no birth date.
 */
export function suggestFromEntries(participants: Record<string, any>[], roster: ClubAthlete[], ownerId: string) {
  const have = new Set(roster.filter((a) => a.ownerId === ownerId).map(keyOf));
  const byKey = new Map<string, Record<string, any>>();
  for (const p of participants) {
    if (p?.createdBy !== ownerId || p.teamName || !p.birthDate || !p.lastName) continue;
    const key = keyOf(p as any);
    if (have.has(key)) continue;
    const prev = byKey.get(key);
    if (!prev || String(p.createdAt || '') > String(prev.createdAt || '')) byKey.set(key, p);
  }
  const out: Omit<ClubAthlete, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>[] = [];
  for (const p of byKey.values()) {
    const r = athleteFromEntry(p);
    if (r.ok) out.push(r.value);
  }
  return out.sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.firstName.localeCompare(b.firstName, 'ru'));
}
