import { Participant, TournamentCategory, Tatami, Bout, RoundStage } from '../types/schema';

export interface ProtectionCheckResult {
  hasR1Conflict: boolean;
  hasR2Conflict: boolean;
  conflictType?: 'club' | 'city' | 'country';
  message: string;
}

export interface WkfSeedingReport {
  bracketSize: number;
  totalAthletes: number;
  r1ConflictsCount: number;
  r2ConflictsCount: number;
  clubSeparationSuccess: boolean;
  citySeparationSuccess: boolean;
  countrySeparationSuccess: boolean;
  separatedClubs: string[];
  separatedCities: string[];
  separatedCountries: string[];
  /** Detected tournament level: one city, national (cities/oblasts), international. */
  scope?: 'local' | 'national' | 'international';
  /** Which levels were used to separate athletes, most important first. */
  separationLevels?: ('club' | 'city' | 'region' | 'country')[];
  assignedTatami: Tatami;
  autoTatamiReason: string;
}

/**
 * Автоматическое назначение татами на основе выбранного дивизиона (дисциплина, возраст, вес, пол)
 */
export function getAutoAssignedTatami(category: TournamentCategory, tatamis: Tatami[]): { tatami: Tatami; reason: string } {
  if (tatamis.length === 0) {
    throw new Error('Список татами пуст');
  }

  // Если у категории уже жестко зафиксировано татами и оно существует в списке
  if (category.assignedTatamiId) {
    const existing = tatamis.find((t) => t.id === category.assignedTatamiId);
    if (existing) {
      return { 
        tatami: existing, 
        reason: `Фиксированное татами категории (Татами №${existing.number})` 
      };
    }
  }

  const isKata = category.discipline === 'kata' || category.discipline === 'team_kata';
  const ageName = (category.ageCategoryName || '').toLowerCase();
  const weightName = (category.weightCategoryName || '').toLowerCase();

  // 1. Дисциплина Ката -> Татами №4 (или татами с зоной Ката)
  if (isKata) {
    const kataTatami = tatamis.find((t) => t.number === 4 || t.name.toLowerCase().includes('ката')) || tatamis[tatamis.length - 1];
    return {
      tatami: kataTatami,
      reason: 'Специализированная площадка для индивидуального и командного Ката (WKF Kata Area)'
    };
  }

  // 2. Дети и Кадеты (U10, U12, Кадеты 14-15 лет) -> Татами №3
  const isCadetOrChild = ageName.includes('дети') || ageName.includes('кадет') || ageName.includes('14-15') || ageName.includes('u10') || ageName.includes('u12');
  if (isCadetOrChild) {
    const youthTatami = tatamis.find((t) => t.number === 3) || tatamis[0];
    return {
      tatami: youthTatami,
      reason: 'Молодежный дивизион: Кадеты 14-15 лет и младшие возрастные группы'
    };
  }

  // 3. Взрослые легкие веса (-50, -55, -60, -61, -67 кг) -> Татами №2
  const isLightweight = weightName.includes('-50') || weightName.includes('-55') || weightName.includes('-60') || weightName.includes('-61') || weightName.includes('-67');
  if (isLightweight) {
    const lightTatami = tatamis.find((t) => t.number === 2) || tatamis[0];
    return {
      tatami: lightTatami,
      reason: 'Легкие и средние весовые категории (Мужчины -60/-67 кг, Женщины -50/-55/-61 кг)'
    };
  }

  // 4. Взрослые средние и тяжелые веса (-75, -84, +84, -68, +68, абсолютная) -> Центральное Татами №1
  const centralTatami = tatamis.find((t) => t.number === 1) || tatamis[0];
  return {
    tatami: centralTatami,
    reason: 'Центральная арена: Тяжелые и престижные весовые категории (-75/-84/+84 кг)'
  };
}

// ============================================================================
// DRAW WITH SEPARATION (жеребьёвка с разведением)
//
// Rule: athletes who are "close" to each other must meet as LATE as possible.
//   club / school  >  city  >  region (oblast)  >  country
// The scope is detected automatically from the entries of the category:
//   * city tournament      -> everyone from one city: separate by club/school only;
//   * national tournament  -> also separate by city and by oblast;
//   * international        -> also separate by country.
// A level where all athletes are equal (e.g. everyone is from Kyrgyzstan) is ignored.
// ============================================================================

export type SeparationLevel = 'club' | 'city' | 'region' | 'country';
export type DrawScope = 'local' | 'national' | 'international';

/** How much a conflict on each level costs (club is by far the most important). */
const LEVEL_WEIGHT: Record<SeparationLevel, number> = { club: 1000, city: 120, region: 40, country: 15 };

/** City -> oblast of Kyrgyzstan (used when the entry has no explicit region). */
const KG_REGION_BY_CITY: Record<string, string> = {
  'бишкек': 'г. Бишкек',
  'ош': 'г. Ош',
  'кант': 'Чуйская обл.', 'токмок': 'Чуйская обл.', 'кара-балта': 'Чуйская обл.', 'беловодское': 'Чуйская обл.', 'сокулук': 'Чуйская обл.',
  'каракол': 'Иссык-Кульская обл.', 'чолпон-ата': 'Иссык-Кульская обл.', 'балыкчы': 'Иссык-Кульская обл.',
  'нарын': 'Нарынская обл.', 'кочкор': 'Нарынская обл.',
  'талас': 'Таласская обл.',
  'джалал-абад': 'Джалал-Абадская обл.', 'кара-куль': 'Джалал-Абадская обл.', 'майлуу-суу': 'Джалал-Абадская обл.', 'таш-кумыр': 'Джалал-Абадская обл.',
  'баткен': 'Баткенская обл.', 'кызыл-кия': 'Баткенская обл.', 'сулюкта': 'Баткенская обл.',
  'узген': 'Ошская обл.', 'кара-суу': 'Ошская обл.'
};

const norm = (v?: string | null) => (v || '').trim().toLowerCase();
const clubKey = (v?: string | null) => norm(v).replace(/[«»"'“”„`]/g, '').replace(/\s+/g, ' ').trim();

export function separationKey(p: Participant, level: SeparationLevel): string {
  switch (level) {
    case 'club':
      // Club names typed by different people: ignore quotes and extra spaces ("Тигр" = «Тигр»)
      return clubKey(p.clubName) || norm(p.clubId);
    case 'city':
      return norm(p.city);
    case 'region':
      return norm((p as Participant & { region?: string }).region) || norm(KG_REGION_BY_CITY[norm(p.city)]) || norm(p.city);
    case 'country':
      return norm(p.country);
  }
}

/** Levels that actually distinguish athletes in this category, plus the detected scope. */
export function detectSeparation(athletes: Participant[]): { levels: SeparationLevel[]; scope: DrawScope } {
  const varies = (level: SeparationLevel) => {
    const values = new Set(athletes.map((a) => separationKey(a, level)).filter(Boolean));
    return values.size >= 2;
  };
  const levels = (['club', 'city', 'region', 'country'] as SeparationLevel[]).filter(varies);
  const scope: DrawScope = levels.includes('country') ? 'international' : levels.includes('city') || levels.includes('region') ? 'national' : 'local';
  return { levels, scope };
}

/** Round in which slots i and j can first meet (1 = first round). */
const meetRound = (i: number, j: number) => Math.floor(Math.log2(i ^ j)) + 1;

function pairCost(a: Participant, b: Participant, i: number, j: number, levels: SeparationLevel[], totalRounds: number): number {
  let cost = 0;
  const earlyness = totalRounds - meetRound(i, j); // 0 = could only meet in the final
  if (earlyness <= 0) return 0;
  const factor = Math.pow(4, earlyness);
  for (const level of levels) {
    const ka = separationKey(a, level);
    if (ka && ka === separationKey(b, level)) cost += LEVEL_WEIGHT[level] * factor;
  }
  return cost;
}

function totalCost(slots: (Participant | null)[], levels: SeparationLevel[], totalRounds: number): number {
  let cost = 0;
  for (let i = 0; i < slots.length; i++) {
    const a = slots[i];
    if (!a) continue;
    for (let j = i + 1; j < slots.length; j++) {
      const b = slots[j];
      if (b) cost += pairCost(a, b, i, j, levels, totalRounds);
    }
  }
  return cost;
}

/** Cost contributed by the athlete in slot k against everyone else. */
function slotCost(slots: (Participant | null)[], k: number, levels: SeparationLevel[], totalRounds: number, skip = -1): number {
  const a = slots[k];
  if (!a) return 0;
  let cost = 0;
  for (let j = 0; j < slots.length; j++) {
    if (j === k || j === skip) continue;
    const b = slots[j];
    if (b) cost += pairCost(a, b, k, j, levels, totalRounds);
  }
  return cost;
}

/** Standard seeding order (1-based seeds -> slot), e.g. size 8: [0,7,4,3,2,5,6,1]. Seeds 1 and 2 meet only in the final. */
function seedSlotOrder(size: number): number[] {
  let order = [0];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n - 1 - s]);
  }
  // order[k] = seed index occupying slot k; invert to seed -> slot
  const slotOfSeed = new Array(size);
  order.forEach((seed, slot) => (slotOfSeed[seed] = slot));
  return slotOfSeed;
}

const BELT_WEIGHT: Record<string, number> = {
  black_3dan_plus: 10, black_2dan: 9, black_1dan: 8, brown_1kyu: 7, brown_3kyu: 6,
  blue_4kyu: 5, green_6kyu: 4, orange_7kyu: 3, yellow_8kyu: 2, white_10kyu: 1
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Orders athletes so that members of the same club are dealt far apart:
 * biggest clubs first, one member per club per round (like dealing cards).
 */
function dealByClub(athletes: Participant[]): Participant[] {
  const groups = new Map<string, Participant[]>();
  for (const a of shuffle(athletes)) {
    const key = separationKey(a, 'club') || `solo:${a.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  const lists = [...groups.values()]
    .map((g) => g.sort((x, y) => (BELT_WEIGHT[y.beltRank] || 0) - (BELT_WEIGHT[x.beltRank] || 0)))
    .sort((x, y) => y.length - x.length);
  const dealt: Participant[] = [];
  for (let round = 0; dealt.length < athletes.length; round++) {
    for (const g of lists) if (round < g.length) dealt.push(g[round]);
  }
  return dealt;
}

export const bracketSizeFor = (count: number) => {
  let size = 2;
  while (size < count) size *= 2;
  return Math.max(size, 2);
};

/**
 * Builds a bracket where athletes of the same club (then city, oblast, country)
 * meet as late as possible. Byes go to the top seed positions.
 */
export function seedWkfBracketWithProtection(
  athletes: Participant[],
  preferredBracketSize?: number
): { slots: (Participant | null)[]; report: Omit<WkfSeedingReport, 'assignedTatami' | 'autoTatamiReason'> } {
  const count = athletes.length;
  const bracketSize = Math.max(preferredBracketSize || 0, bracketSizeFor(count));
  const totalRounds = Math.log2(bracketSize);
  const { levels, scope } = detectSeparation(athletes);
  const seedToSlot = seedSlotOrder(bracketSize);

  let bestSlots: (Participant | null)[] = new Array(bracketSize).fill(null);
  let bestCost = Infinity;

  const attempts = count <= 2 ? 1 : 25;
  for (let attempt = 0; attempt < attempts; attempt++) {
    // 1. Greedy start: deal clubs apart along the seeding order
    const slots: (Participant | null)[] = new Array(bracketSize).fill(null);
    dealByClub(athletes).forEach((a, seed) => (slots[seedToSlot[seed]] = a));
    const occupied = slots.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);

    // 2. Improve with pairwise swaps until no swap helps (byes stay in place)
    let cost = totalCost(slots, levels, totalRounds);
    let improved = cost > 0;
    while (improved) {
      improved = false;
      for (let x = 0; x < occupied.length && cost > 0; x++) {
        for (let y = x + 1; y < occupied.length; y++) {
          const i = occupied[x];
          const j = occupied[y];
          const before = slotCost(slots, i, levels, totalRounds, j) + slotCost(slots, j, levels, totalRounds, i);
          [slots[i], slots[j]] = [slots[j], slots[i]];
          const after = slotCost(slots, i, levels, totalRounds, j) + slotCost(slots, j, levels, totalRounds, i);
          if (after < before) {
            cost -= before - after;
            improved = true;
          } else {
            [slots[i], slots[j]] = [slots[j], slots[i]];
          }
        }
      }
    }

    if (cost < bestCost) {
      bestCost = cost;
      bestSlots = slots;
      if (cost === 0) break;
    }
  }

  // 3. Report: conflicts that could not be avoided
  let r1Conflicts = 0;
  let r2Conflicts = 0;
  const conflictsByLevel: Record<SeparationLevel, number> = { club: 0, city: 0, region: 0, country: 0 };
  for (let i = 0; i < bracketSize; i++) {
    const a = bestSlots[i];
    if (!a) continue;
    for (let j = i + 1; j < bracketSize; j++) {
      const b = bestSlots[j];
      if (!b) continue;
      const round = meetRound(i, j);
      if (round > 2 || round === totalRounds) continue;
      const sameLevels = levels.filter((l) => separationKey(a, l) && separationKey(a, l) === separationKey(b, l));
      if (sameLevels.length === 0) continue;
      if (round === 1) r1Conflicts++;
      else r2Conflicts++;
      sameLevels.forEach((l) => conflictsByLevel[l]++);
    }
  }

  const unique = (level: SeparationLevel, pick: (p: Participant) => string | undefined) =>
    Array.from(new Set(athletes.map(pick).filter(Boolean) as string[]));

  return {
    slots: bestSlots,
    report: {
      bracketSize,
      totalAthletes: count,
      r1ConflictsCount: r1Conflicts,
      r2ConflictsCount: r2Conflicts,
      clubSeparationSuccess: conflictsByLevel.club === 0,
      citySeparationSuccess: conflictsByLevel.city === 0 && conflictsByLevel.region === 0,
      countrySeparationSuccess: conflictsByLevel.country === 0,
      separatedClubs: unique('club', (p) => p.clubName || p.clubId),
      separatedCities: unique('city', (p) => p.city),
      separatedCountries: unique('country', (p) => p.country),
      scope,
      separationLevels: levels
    }
  };
}

/**
 * Checks whether two slots could meet in round 1 or 2 while sharing a club / city / country.
 */
export function checkPairProtection(p1: Participant, p2: Participant, slotIndex1: number, slotIndex2: number): ProtectionCheckResult {
  const round = meetRound(slotIndex1, slotIndex2);
  const same = (l: SeparationLevel) => separationKey(p1, l) && separationKey(p1, l) === separationKey(p2, l);
  const type: ProtectionCheckResult['conflictType'] = same('club') ? 'club' : same('city') ? 'city' : same('country') ? 'country' : undefined;
  if (!type || round > 2) return { hasR1Conflict: false, hasR2Conflict: false, message: 'Разведение соблюдено' };
  const what = type === 'club' ? `общий клуб "${p1.clubName || p1.clubId}"` : type === 'city' ? `общий город "${p1.city}"` : `общая страна "${p1.country}"`;
  return {
    hasR1Conflict: round === 1,
    hasR2Conflict: true,
    conflictType: type,
    message: `Конфликт ${round}-го круга: ${what}`
  };
}

const stageForBoutsInRound = (bouts: number): RoundStage =>
  bouts === 1 ? 'final' : bouts === 2 ? 'semi_final' : bouts === 4 ? 'quarter_final' : bouts === 8 ? 'round_1_8' : bouts === 16 ? 'round_1_16' : 'round_1_32';

/**
 * Generates all bouts of an elimination bracket (any size), plus two repechage
 * bouts for bronze (WKF awards two bronze medals). A bye advances the athlete automatically.
 */
export function generateProtectedWkfCategoryBouts(
  category: TournamentCategory,
  athletes: Participant[],
  tatamis: Tatami[],
  options?: { startTime?: string; boutIntervalMinutes?: number; durationSeconds?: number; categoryTitle?: string }
): { bouts: Bout[]; report: WkfSeedingReport } {
  const { tatami: autoTatami, reason: autoTatamiReason } = getAutoAssignedTatami(category, tatamis);
  const startTime = options?.startTime || '12:00';
  const interval = options?.boutIntervalMinutes || 12;
  const [startH, startM] = startTime.split(':').map(Number);
  const computeTime = (offsetMins: number) => {
    const total = startH * 60 + startM + offsetMins;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  const { slots, report: rawReport } = seedWkfBracketWithProtection(athletes);
  const bracketSize = rawReport.bracketSize;
  const categoryTitle = options?.categoryTitle || `${category.ageCategoryName || 'Взрослые 18+'} · ${category.gender === 'male' ? 'Мужчины' : 'Женщины'} · ${
    category.discipline === 'kata' ? 'Ката' : category.weightCategoryName || 'Кумитэ'
  }`;

  const bouts: Bout[] = [];
  let offset = 0;
  let boutNumber = autoTatami.number * 100 + 10;
  const stamp = Date.now();

  const makeBout = (stage: RoundStage, position: number, aka?: Participant | null, ao?: Participant | null): Bout => ({
    id: `${category.id}_${stage}_${position}_${stamp}`,
    tournamentId: category.tournamentId || 'tourn1',
    categoryId: category.id,
    categoryName: categoryTitle,
    tatamiId: autoTatami.id,
    tatamiNumber: autoTatami.number,
    boutNumber: ++boutNumber,
    roundStage: stage,
    bracketPosition: position,
    akaParticipantId: aka?.id,
    akaParticipant: aka || undefined,
    aoParticipantId: ao?.id,
    aoParticipant: ao || undefined,
    scheduledTime: computeTime((offset += interval) - interval),
    akaScore: 0,
    aoScore: 0,
    akaSenshu: false,
    aoSenshu: false,
    akaPenaltiesC1: 0,
    aoPenaltiesC1: 0,
    akaPenaltiesC2: 0,
    aoPenaltiesC2: 0,
    status: 'scheduled',
    durationSeconds: options?.durationSeconds ?? (category.discipline === 'kata' ? 240 : 180),
    timerSecondsRemaining: options?.durationSeconds ?? (category.discipline === 'kata' ? 240 : 180),
    timerStartedAt: null
  });

  // Known athletes entering each round (null = decided by a previous bout)
  let entrants: (Participant | null | 'bye')[] = slots.map((s) => s ?? 'bye');
  while (entrants.length >= 2) {
    const boutsInRound = entrants.length / 2;
    const stage = stageForBoutsInRound(boutsInRound);
    const next: (Participant | null | 'bye')[] = [];
    for (let k = 0; k < boutsInRound; k++) {
      const a = entrants[2 * k];
      const b = entrants[2 * k + 1];
      if (a === 'bye' && b === 'bye') {
        next.push('bye');
      } else if (a === 'bye' || b === 'bye') {
        next.push(a === 'bye' ? b : a); // walk-over: advances without a bout
      } else {
        bouts.push(makeBout(stage, k + 1, a, b));
        next.push(null);
      }
    }
    entrants = next;
  }

  // Repechage bouts for the two bronze medals are created automatically once the
  // finalists are known (see utils/bracketProgression.ts).

  // Run order: earlier rounds first, final last
  const order: RoundStage[] = ['round_1_32', 'round_1_16', 'round_1_8', 'quarter_final', 'semi_final', 'repechage', 'bronze_match', 'final'];
  bouts.sort((x, y) => order.indexOf(x.roundStage) - order.indexOf(y.roundStage) || x.bracketPosition - y.bracketPosition);
  bouts.forEach((b, i) => (b.scheduledTime = computeTime(i * interval)));

  return {
    bouts,
    report: { ...rawReport, assignedTatami: autoTatami, autoTatamiReason }
  };
}
