import type { Bout, RoundStage, ThirdPlaceMode } from '../types/schema';

/**
 * Bracket progression for elimination categories (WKF style):
 *  - the winner of a bout moves to the next round (any bracket size, 1/32 … final);
 *  - repechage: athletes who lost to a finalist fight for bronze in that half of the
 *    bracket (first-round loser vs second-round loser, winner vs next loser, …,
 *    last bout against the semi-final loser). Two bronze medals, one per half.
 *
 * All functions are pure: they take the list of bouts and return a new list.
 */

export const ELIMINATION_ORDER: RoundStage[] = ['round_1_32', 'round_1_16', 'round_1_8', 'quarter_final', 'semi_final', 'final'];

const stageIndex = (stage: RoundStage) => ELIMINATION_ORDER.indexOf(stage);
const isElimination = (b: Bout) => stageIndex(b.roundStage) >= 0;

export const loserOf = (b: Bout): string | undefined =>
  b.winnerId ? (b.winnerId === b.akaParticipantId ? b.aoParticipantId : b.akaParticipantId) : undefined;

const done = (b?: Bout) => !!b && b.status === 'completed' && !!b.winnerId;

/** Repechage bouts are numbered by half (1 = upper, 2 = lower) and step: position = half * 100 + step. */
export const repechagePosition = (half: 1 | 2, step: number) => half * 100 + step;
export const repechageHalf = (b: Bout) => Math.floor(b.bracketPosition / 100) as 1 | 2;
export const repechageStep = (b: Bout) => b.bracketPosition % 100;

/** Athletes (ids) beaten by `finalistId` in this category, earliest round first. */
export function losersTo(bouts: Bout[], categoryId: string, finalistId: string): string[] {
  return bouts
    .filter((b) => b.categoryId === categoryId && isElimination(b) && b.roundStage !== 'final' && done(b) && b.winnerId === finalistId)
    .sort((a, b) => stageIndex(a.roundStage) - stageIndex(b.roundStage))
    .map(loserOf)
    .filter((id): id is string => !!id);
}

type ParticipantLookup = (id?: string) => Bout['akaParticipant'] | undefined;

function setSide(b: Bout, side: 'aka' | 'ao', id: string | undefined, find: ParticipantLookup): Bout {
  if (side === 'aka') {
    if (b.akaParticipantId === id) return b;
    return { ...b, akaParticipantId: id, akaParticipant: find(id) };
  }
  if (b.aoParticipantId === id) return b;
  return { ...b, aoParticipantId: id, aoParticipant: find(id) };
}

/** Creates / updates the repechage bouts of one category so they match the current results. */
export function syncRepechage(bouts: Bout[], categoryId: string, find: ParticipantLookup): Bout[] {
  let list = bouts;
  const semis = list.filter((b) => b.categoryId === categoryId && b.roundStage === 'semi_final');
  if (semis.length < 2) return list;

  for (const half of [1, 2] as const) {
    const semi = semis.find((b) => b.bracketPosition === half);
    if (!done(semi)) continue;
    const losers = losersTo(list, categoryId, semi!.winnerId!);
    const steps = losers.length - 1;

    for (let step = 1; step <= steps; step++) {
      const pos = repechagePosition(half, step);
      const prev = list.find((b) => b.categoryId === categoryId && b.roundStage === 'repechage' && b.bracketPosition === repechagePosition(half, step - 1));
      const akaId = step === 1 ? losers[0] : done(prev) ? prev!.winnerId : undefined;
      const aoId = losers[step];
      const existing = list.find((b) => b.categoryId === categoryId && b.roundStage === 'repechage' && b.bracketPosition === pos);

      if (existing) {
        if (existing.status === 'completed') continue;
        const updated = setSide(setSide(existing, 'aka', akaId, find), 'ao', aoId, find);
        if (updated !== existing) list = list.map((b) => (b.id === existing.id ? updated : b));
      } else {
        const maxNumber = Math.max(0, ...list.filter((b) => b.categoryId === categoryId).map((b) => b.boutNumber));
        const created: Bout = {
          ...semi!,
          id: `${categoryId}_repechage_${pos}`,
          roundStage: 'repechage',
          bracketPosition: pos,
          boutNumber: maxNumber + 1,
          akaParticipantId: akaId,
          akaParticipant: find(akaId),
          aoParticipantId: aoId,
          aoParticipant: find(aoId),
          akaScore: 0,
          aoScore: 0,
          akaSenshu: false,
          aoSenshu: false,
          akaPenaltiesC1: 0,
          aoPenaltiesC1: 0,
          akaPenaltiesC2: 0,
          aoPenaltiesC2: 0,
          akaWazaAri: 0,
          aoWazaAri: 0,
          akaIppon: 0,
          aoIppon: 0,
          winnerId: undefined,
          winReason: undefined,
          status: 'scheduled',
          actualStartTime: undefined,
          actualEndTime: undefined,
          timerSecondsRemaining: semi!.durationSeconds ?? 180,
          timerStartedAt: undefined,
          overrideNotes: undefined,
          refereeProtocolId: undefined
        } as Bout;
        list = [...list, created];
      }
    }
  }
  return list;
}

/** Bout for 3rd place (mode 'bronze_match'): the two semi-final losers, created when both semis are over. */
export function syncBronzeMatch(bouts: Bout[], categoryId: string, find: ParticipantLookup): Bout[] {
  const semis = bouts.filter((b) => b.categoryId === categoryId && b.roundStage === 'semi_final');
  const s1 = semis.find((b) => b.bracketPosition === 1);
  const s2 = semis.find((b) => b.bracketPosition === 2);
  if (!s1 || !s2) return bouts;
  const akaId = done(s1) ? loserOf(s1) : undefined;
  const aoId = done(s2) ? loserOf(s2) : undefined;
  const existing = bouts.find((b) => b.categoryId === categoryId && b.roundStage === 'bronze_match');
  if (existing) {
    if (existing.status === 'completed') return bouts;
    const updated = setSide(setSide(existing, 'aka', akaId, find), 'ao', aoId, find);
    return updated === existing ? bouts : bouts.map((b) => (b.id === existing.id ? updated : b));
  }
  if (!akaId || !aoId) return bouts;
  const final = bouts.find((b) => b.categoryId === categoryId && b.roundStage === 'final');
  const maxNumber = Math.max(0, ...bouts.filter((b) => b.categoryId === categoryId).map((b) => b.boutNumber));
  const created = {
    ...(final || s2),
    id: `${categoryId}_bronze_match`,
    roundStage: 'bronze_match',
    bracketPosition: 1,
    // a new number: printed brackets keep the numbers of the draw
    boutNumber: maxNumber + 1,
    akaParticipantId: akaId, akaParticipant: find(akaId), aoParticipantId: aoId, aoParticipant: find(aoId),
    akaScore: 0, aoScore: 0, akaSenshu: false, aoSenshu: false, akaPenaltiesC1: 0, aoPenaltiesC1: 0, akaPenaltiesC2: 0, aoPenaltiesC2: 0,
    akaWazaAri: 0, aoWazaAri: 0, akaIppon: 0, aoIppon: 0, winnerId: undefined, winReason: undefined, status: 'scheduled',
    actualStartTime: undefined, actualEndTime: undefined, timerSecondsRemaining: (final || s2).durationSeconds ?? 180, timerStartedAt: undefined,
    overrideNotes: undefined, refereeProtocolId: undefined
  } as Bout;
  return [...bouts, created];
}

/**
 * Applies a saved bout to the list: replaces it, moves the winner to the next round
 * and keeps the third-place bouts in sync (repechage, one bronze bout, or none for two bronzes).
 */
export function applyBoutResult(bouts: Bout[], updated: Bout, find: ParticipantLookup, thirdPlace: ThirdPlaceMode = 'repechage'): Bout[] {
  let list = bouts.map((b) => (b.id === updated.id ? updated : b));
  const idx = stageIndex(updated.roundStage);

  if (idx >= 0 && updated.roundStage !== 'final') {
    const nextStage = ELIMINATION_ORDER[idx + 1];
    const targetPos = Math.ceil(updated.bracketPosition / 2);
    const side: 'aka' | 'ao' = updated.bracketPosition % 2 === 1 ? 'aka' : 'ao';
    const winner = done(updated) ? updated.winnerId : undefined;
    list = list.map((b) =>
      b.categoryId === updated.categoryId && b.roundStage === nextStage && b.bracketPosition === targetPos && b.status !== 'completed'
        ? setSide(b, side, winner, find)
        : b
    );
  }

  if (updated.roundStage === 'repechage') {
    const half = repechageHalf(updated);
    const nextPos = repechagePosition(half, repechageStep(updated) + 1);
    list = list.map((b) =>
      b.categoryId === updated.categoryId && b.roundStage === 'repechage' && b.bracketPosition === nextPos && b.status !== 'completed'
        ? setSide(b, 'aka', done(updated) ? updated.winnerId : undefined, find)
        : b
    );
  }

  if (thirdPlace === 'bronze_match') return syncBronzeMatch(list, updated.categoryId, find);
  if (thirdPlace === 'two_bronze') return list;
  return syncRepechage(list, updated.categoryId, find);
}

export interface CategoryStandings {
  gold?: string;
  silver?: string;
  bronze: string[];
  /** true when all medals are decided */
  complete: boolean;
}

/** Medal places of a category computed from its bouts. */
export function computeStandings(bouts: Bout[], categoryId: string): CategoryStandings {
  const cat = bouts.filter((b) => b.categoryId === categoryId);
  const final = cat.find((b) => b.roundStage === 'final');
  const result: CategoryStandings = { bronze: [], complete: false };
  if (done(final)) {
    result.gold = final!.winnerId;
    result.silver = loserOf(final!);
  }

  const semis = cat.filter((b) => b.roundStage === 'semi_final');
  // One bout for 3rd place: only its winner is third
  const bronzeBouts = cat.filter((x) => x.roundStage === 'bronze_match');
  if (bronzeBouts.length > 0) {
    for (const b of bronzeBouts) if (done(b)) result.bronze.push(b.winnerId!);
    result.complete = !!result.gold && result.bronze.length >= bronzeBouts.length;
    return result;
  }

  let halvesDecided = 0;
  for (const half of [1, 2] as const) {
    const semi = semis.find((b) => b.bracketPosition === half);
    if (!done(semi)) continue;
    const losers = losersTo(bouts, categoryId, semi!.winnerId!);
    const chain = cat.filter((b) => b.roundStage === 'repechage' && repechageHalf(b) === half).sort((a, b) => repechageStep(a) - repechageStep(b));
    if (chain.length === 0) {
      // No repechage in this half: the semi-final loser is third (two bronzes, or nobody to fight)
      const loser = loserOf(semi!);
      if (loser) result.bronze.push(loser);
      halvesDecided++;
    } else if (chain.length === losers.length - 1 && done(chain[chain.length - 1])) {
      result.bronze.push(chain[chain.length - 1].winnerId!);
      halvesDecided++;
    }
  }

  result.complete = !!result.gold && halvesDecided === semis.length;
  return result;
}

export const stageLabel = (stage: RoundStage, lang: 'ru' | 'ky' | 'en' = 'ru') => {
  const ru: Record<RoundStage, string> = {
    round_1_32: '1/32 финала',
    round_1_16: '1/16 финала',
    round_1_8: '1/8 финала',
    quarter_final: '1/4 финала',
    semi_final: 'Полуфинал',
    repechage: 'Утешительный бой',
    bronze_match: 'Бой за 3 место',
    final: 'Финал'
  };
  const en: Record<RoundStage, string> = {
    round_1_32: 'Round of 64',
    round_1_16: 'Round of 32',
    round_1_8: 'Round of 16',
    quarter_final: 'Quarter-final',
    semi_final: 'Semi-final',
    repechage: 'Repechage',
    bronze_match: 'Bronze medal bout',
    final: 'Final'
  };
  const ky: Record<RoundStage, string> = {
    round_1_32: '1/32 финал',
    round_1_16: '1/16 финал',
    round_1_8: '1/8 финал',
    quarter_final: '1/4 финал',
    semi_final: 'Жарым финал',
    repechage: 'Утешителдик беттеш',
    bronze_match: '3-орун үчүн беттеш',
    final: 'Финал'
  };
  return (lang === 'en' ? en : lang === 'ky' ? ky : ru)[stage];
};
