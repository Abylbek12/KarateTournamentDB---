// Entry fees: price periods (early / regular / late) and a discount for every next category of the same athlete.
// One module for the server (which decides the amount) and the website (which shows the estimate).
// Run the checks: npm run test:pricing

/** A price period. It lasts until `endsOn` inclusive (date in Bishkek); it starts the day after the previous one ends. */
export interface PricePeriod {
  id: string;
  /** «Ранняя регистрация», «Основная», «Поздняя». */
  name: string;
  /** YYYY-MM-DD, last day of the period (Bishkek time). */
  endsOn: string;
  /** Added to every category fee in this period. Negative = early-bird discount. */
  extra: number;
}

export interface TournamentPricing {
  periods: PricePeriod[];
  /** Discount for each next individual category of the same athlete (the most expensive one is paid in full). */
  additionalDiscount: number;
}

/** Category fields pricing needs. */
export interface PricedCategory {
  id: string;
  fee: number;
  discipline: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MONEY = 10_000_000;

const money = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(-MAX_MONEY, Math.min(MAX_MONEY, n)) : 0;
};

export const isTeamDiscipline = (discipline: string) => discipline === 'team_kata' || discipline === 'team_kumite';

/** Keeps only valid data from what the organizer sent; undefined = no special pricing. */
export function sanitizePricing(input: unknown): TournamentPricing | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const raw = input as { periods?: unknown; additionalDiscount?: unknown };
  const seen = new Set<string>();
  const periods: PricePeriod[] = (Array.isArray(raw.periods) ? raw.periods : [])
    .slice(0, 12)
    .map((p: any, i: number) => ({
      id: String(p?.id || `period-${i + 1}`).slice(0, 60),
      name: String(p?.name || '').trim().slice(0, 60),
      endsOn: String(p?.endsOn || ''),
      extra: money(p?.extra)
    }))
    .filter((p) => DATE.test(p.endsOn) && !Number.isNaN(Date.parse(p.endsOn)))
    .filter((p) => (seen.has(p.endsOn) ? false : (seen.add(p.endsOn), true)))
    .sort((a, b) => a.endsOn.localeCompare(b.endsOn));
  const additionalDiscount = Math.max(0, money(raw.additionalDiscount));
  if (periods.length === 0 && additionalDiscount === 0) return undefined;
  return { periods, additionalDiscount };
}

/** Today's date in Bishkek (UTC+6, no daylight saving), YYYY-MM-DD. */
export function bishkekDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 6 * 3600_000).toISOString().slice(0, 10);
}

/** The period in force on `today`. After the last period ends, the last one stays in force (late entries). */
export function currentPeriod(pricing: TournamentPricing | undefined, today: string): PricePeriod | null {
  const periods = pricing?.periods || [];
  if (periods.length === 0) return null;
  return periods.find((p) => p.endsOn >= today) || periods[periods.length - 1];
}

/** First day of each period, for display: null for the first period («до …»). */
export function periodStartsOn(pricing: TournamentPricing | undefined, periodId: string): string | null {
  const periods = pricing?.periods || [];
  const i = periods.findIndex((p) => p.id === periodId);
  if (i <= 0) return null;
  const d = new Date(`${periods[i - 1].endsOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Price of one category in a period. A free category stays free. */
export function categoryPrice(category: PricedCategory, period: PricePeriod | null): number {
  const fee = Math.max(0, money(category.fee));
  if (fee === 0) return 0;
  return Math.max(0, fee + (period?.extra || 0));
}

/** Price of a next (2nd, 3rd...) individual category. */
export function additionalPrice(category: PricedCategory, period: PricePeriod | null, pricing: TournamentPricing | undefined): number {
  const full = categoryPrice(category, period);
  if (isTeamDiscipline(category.discipline)) return full;
  return Math.max(0, full - (pricing?.additionalDiscount || 0));
}

export interface QuoteEntry {
  category: PricedCategory;
  /** Same athlete = same key (surname|name|birth date). null for team entries. */
  athleteKey: string | null;
}

export interface QuoteLine {
  amount: number;
  kind: 'first' | 'additional' | 'team' | 'free';
}

export interface Quote {
  lines: QuoteLine[];
  total: number;
  period: PricePeriod | null;
}

export const athleteKey = (lastName: string, firstName: string, birthDate: string) =>
  `${String(lastName).trim().toLowerCase()}|${String(firstName).trim().toLowerCase()}|${birthDate}`;

/**
 * Prices for new entries, in the same order.
 * `paidBefore` = athleteKey → how many paid-priced individual entries the athlete already has in this tournament.
 * Within one athlete the most expensive category is the «first» (full price), the others get the discount.
 * If the athlete already has an entry, all new ones are «next».
 */
export function quoteEntries(
  entries: QuoteEntry[],
  pricing: TournamentPricing | undefined,
  today: string,
  paidBefore: Map<string, number> = new Map()
): Quote {
  const period = currentPeriod(pricing, today);
  const lines: QuoteLine[] = entries.map(() => ({ amount: 0, kind: 'free' }));
  const byAthlete = new Map<string, number[]>();

  entries.forEach((e, i) => {
    const full = categoryPrice(e.category, period);
    if (full === 0) return;
    if (isTeamDiscipline(e.category.discipline) || !e.athleteKey) {
      lines[i] = { amount: full, kind: 'team' };
      return;
    }
    const list = byAthlete.get(e.athleteKey) || [];
    list.push(i);
    byAthlete.set(e.athleteKey, list);
  });

  for (const [key, idx] of byAthlete) {
    // Most expensive first; ties keep the order the athlete chose.
    const sorted = [...idx].sort((a, b) => categoryPrice(entries[b].category, period) - categoryPrice(entries[a].category, period) || a - b);
    let hasFirst = (paidBefore.get(key) || 0) > 0;
    for (const i of sorted) {
      if (!hasFirst) {
        lines[i] = { amount: categoryPrice(entries[i].category, period), kind: 'first' };
        hasFirst = true;
      } else {
        lines[i] = { amount: additionalPrice(entries[i].category, period, pricing), kind: 'additional' };
      }
    }
  }

  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), period };
}

/** How many paid-priced individual entries each athlete already has in a tournament (withdrawn ones do not count). */
export function countPaidBefore(
  participants: { tournamentId: string; categoryId?: string; status?: string; lastName: string; firstName: string; birthDate: string; teamName?: string }[],
  categories: PricedCategory[],
  tournamentId: string
): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of participants) {
    if (p.tournamentId !== tournamentId || p.status === 'withdrawn' || p.teamName || !p.birthDate) continue;
    const cat = categories.find((c) => c.id === p.categoryId);
    if (!cat || isTeamDiscipline(cat.discipline) || !(Number(cat.fee) > 0)) continue;
    const key = athleteKey(p.lastName, p.firstName, p.birthDate);
    out.set(key, (out.get(key) || 0) + 1);
  }
  return out;
}

/** Amount owed for an entry: the price fixed at entry time, or the category fee for older entries. */
export const entryFee = (p: { feeAmount?: number }, category?: { fee: number }) =>
  typeof p.feeAmount === 'number' ? p.feeAmount : category?.fee ?? 0;
