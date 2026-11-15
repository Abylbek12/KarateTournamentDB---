import type { Bout, TournamentRules, WinReason } from '../types/schema';

/**
 * Bout rules engine — the single source of truth for every scoreboard and console.
 * All functions are pure: they take a bout and return the updated bout.
 *
 * Clock: the bout stores `timerSecondsRemaining` (seconds left when the clock was last
 * stopped) and `timerStartedAt` (epoch ms while running). Any screen computes the exact
 * time left from these two values, so the clock does not need to be saved every second
 * and all screens show the same time down to tenths of a second.
 *
 * WKF kumite: Yuko 1, Waza-ari 2, Ippon 3; 8-point lead ends the bout; first unopposed
 * point gives Senshu; time up: more points wins, tie -> Senshu, tie without Senshu ->
 * judges' decision (Hantei). Warnings: two categories (C1/C2) with 4 levels each;
 * level 4 (Hansoku) loses the bout. NOTE: verify the warning system against the
 * current WKF rulebook used by your federation.
 *
 * SKIF / Shobu: Waza-ari and Ippon. Shobu Ippon: Ippon or two Waza-ari wins.
 * Shobu Sanbon: three Ippon (two Waza-ari = one Ippon) win.
 */

export type Side = 'aka' | 'ao';
export const other = (s: Side): Side => (s === 'aka' ? 'ao' : 'aka');

export const MERCY_LEAD = 8;
export const WARNING_AT_SECONDS = 15;
export const PENALTY_LEVELS = ['—', 'Chukoku', 'Keikoku', 'Hansoku-chui', 'Hansoku'] as const;

const sideId = (b: Bout, s: Side) => (s === 'aka' ? b.akaParticipantId : b.aoParticipantId);
export const ruleSystemOf = (b: Bout, fallback: TournamentRules = 'wkf'): TournamentRules => b.ruleSystem || fallback;

// ---------------- Clock ----------------

export function remainingSeconds(b: Bout, now = Date.now()): number {
  const base = Math.max(0, b.timerSecondsRemaining ?? 0);
  if (!b.timerStartedAt) return base;
  return Math.max(0, base - (now - b.timerStartedAt) / 1000);
}

export const isRunning = (b: Bout) => !!b.timerStartedAt;

/** "2:59" above 10 s, "9.4" in the last ten seconds. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  if (s < 10) return (Math.floor(s * 10) / 10).toFixed(1);
  const whole = Math.ceil(s - 1e-6);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const canPlay = (b: Bout) => b.status !== 'completed' && !b.awaitingDecision && !!b.akaParticipantId && !!b.aoParticipantId;

export function startClock(b: Bout, now = Date.now()): Bout {
  if (!canPlay(b) || isRunning(b) || remainingSeconds(b, now) <= 0) return b;
  return {
    ...b,
    status: 'in_progress',
    actualStartTime: b.actualStartTime || new Date(now).toTimeString().slice(0, 5),
    timerStartedAt: now
  };
}

export function stopClock(b: Bout, now = Date.now()): Bout {
  if (!isRunning(b)) return b;
  return { ...b, timerSecondsRemaining: remainingSeconds(b, now), timerStartedAt: null };
}

export function adjustClock(b: Bout, deltaSeconds: number, now = Date.now()): Bout {
  const full = b.durationSeconds ?? 180;
  const stopped = stopClock(b, now);
  const next = Math.min(full, Math.max(0, stopped.timerSecondsRemaining + deltaSeconds));
  const adjusted = { ...stopped, timerSecondsRemaining: next };
  return isRunning(b) ? { ...adjusted, timerStartedAt: now } : adjusted;
}

export function resetClock(b: Bout): Bout {
  return { ...b, timerSecondsRemaining: b.durationSeconds ?? 180, timerStartedAt: null };
}

// ---------------- Finishing ----------------

export function declareWinner(b: Bout, side: Side, reason: WinReason, now = Date.now()): Bout {
  const stopped = stopClock(b, now);
  return {
    ...stopped,
    winnerId: sideId(b, side),
    winReason: reason,
    status: 'completed',
    awaitingDecision: false,
    actualEndTime: new Date(now).toTimeString().slice(0, 5)
  };
}

/** Re-opens a finished bout (correction by the chief referee). */
export function reopenBout(b: Bout): Bout {
  return { ...b, winnerId: undefined, winReason: undefined, status: 'in_progress', awaitingDecision: false, actualEndTime: undefined };
}

/** SKIF points: Ippon = 2, Waza-ari = 1 (two Waza-ari make one Ippon). */
const skifPoints = (b: Bout, s: Side) => 2 * ((s === 'aka' ? b.akaIppon : b.aoIppon) ?? 0) + ((s === 'aka' ? b.akaWazaAri : b.aoWazaAri) ?? 0);

/** What happens when the clock reaches zero. */
export function onTimeUp(b: Bout, rules: TournamentRules = 'wkf', now = Date.now()): Bout {
  if (b.status === 'completed') return b;
  const stopped = { ...stopClock(b, now), timerSecondsRemaining: 0, timerStartedAt: null };
  if (ruleSystemOf(b, rules) === 'skif') {
    const a = skifPoints(b, 'aka');
    const o = skifPoints(b, 'ao');
    if (a !== o) return declareWinner(stopped, a > o ? 'aka' : 'ao', 'points_lead', now);
    return { ...stopped, awaitingDecision: true };
  }
  if (b.akaScore !== b.aoScore) return declareWinner(stopped, b.akaScore > b.aoScore ? 'aka' : 'ao', 'points_lead', now);
  if (b.akaSenshu) return declareWinner(stopped, 'aka', 'senshu_advantage', now);
  if (b.aoSenshu) return declareWinner(stopped, 'ao', 'senshu_advantage', now);
  return { ...stopped, awaitingDecision: true };
}

/** Judges' decision (Hantei) after a tie without Senshu. */
export function hantei(b: Bout, side: Side, now = Date.now()): Bout {
  return declareWinner(b, side, 'hantei_decision', now);
}

// ---------------- WKF scoring ----------------

/** Adds (points > 0) or corrects (points < 0) the score of one side. */
export function addScore(b: Bout, side: Side, points: number, now = Date.now()): Bout {
  if (b.status === 'completed') return b;
  const key = side === 'aka' ? 'akaScore' : 'aoScore';
  const before = b[key];
  const after = Math.max(0, before + points);
  let next: Bout = { ...b, [key]: after, status: b.status === 'scheduled' ? 'in_progress' : b.status };

  const oppScore = side === 'aka' ? b.aoScore : b.akaScore;
  if (points > 0 && before === 0 && oppScore === 0 && !b.akaSenshu && !b.aoSenshu) {
    next = { ...next, akaSenshu: side === 'aka', aoSenshu: side === 'ao' };
  }
  // A correction back to 0:0 removes the Senshu it created
  if (points < 0 && after === 0 && oppScore === 0) next = { ...next, akaSenshu: false, aoSenshu: false };

  if (Math.abs(next.akaScore - next.aoScore) >= MERCY_LEAD) {
    return declareWinner(next, next.akaScore > next.aoScore ? 'aka' : 'ao', 'mercy_rule_8pt', now);
  }
  return next;
}

/** Senshu can be given or withdrawn manually by the referee (e.g. withdrawal rules). */
export function setSenshu(b: Bout, side: Side, value: boolean): Bout {
  return { ...b, akaSenshu: side === 'aka' ? value : false, aoSenshu: side === 'ao' ? value : false };
}

/** Sets a warning level (0–4) in category C1 or C2. Level 4 = Hansoku: the opponent wins. */
export function setPenalty(b: Bout, side: Side, category: 'c1' | 'c2', level: number, now = Date.now()): Bout {
  const lv = Math.max(0, Math.min(4, Math.round(level)));
  const key = `${side}Penalties${category === 'c1' ? 'C1' : 'C2'}` as 'akaPenaltiesC1';
  const next = { ...b, [key]: lv };
  if (lv === 4 && b.status !== 'completed') return declareWinner(next, other(side), 'hansoku_dq', now);
  return next;
}

export const kiken = (b: Bout, side: Side, now = Date.now()) => declareWinner(b, other(side), 'kiken_injury', now);
export const shikkaku = (b: Bout, side: Side, now = Date.now()) => declareWinner(b, other(side), 'hansoku_dq', now);

// ---------------- SKIF scoring ----------------

export function addSkif(b: Bout, side: Side, kind: 'waza_ari' | 'ippon', delta = 1, now = Date.now()): Bout {
  if (b.status === 'completed') return b;
  const key = (side === 'aka' ? (kind === 'ippon' ? 'akaIppon' : 'akaWazaAri') : kind === 'ippon' ? 'aoIppon' : 'aoWazaAri') as 'akaIppon';
  const next: Bout = {
    ...b,
    [key]: Math.max(0, (b[key] ?? 0) + delta),
    status: b.status === 'scheduled' ? 'in_progress' : b.status
  };
  const pts = skifPoints(next, side);
  const format = next.skifFormat || 'shobu_ippon';
  if (delta > 0) {
    if (format === 'shobu_ippon' && pts >= 2) {
      return declareWinner(next, side, kind === 'ippon' ? 'ippon_direct' : 'awasete_ippon', now);
    }
    if (format === 'shobu_sanbon' && pts >= 6) return declareWinner(next, side, 'shobu_sanbon_win', now);
  }
  return next;
}

// ---------------- Display helpers ----------------

export const WIN_REASON_LABELS: Record<WinReason, string> = {
  points_lead: 'По очкам',
  senshu_advantage: 'Senshu (первый балл)',
  hantei_decision: 'Решение судей (Хантей)',
  ippon_kyokushin: 'Иппон',
  hansoku_dq: 'Дисквалификация соперника (Хансоку)',
  kiken_injury: 'Отказ / травма соперника (Кикен)',
  ippon_direct: 'Иппон',
  awasete_ippon: 'Авасэтэ иппон (два вадза-ари)',
  shobu_sanbon_win: 'Сёбу санбон',
  mercy_rule_8pt: 'Разница 8 очков',
  encho_sen_sudden_death: 'Энчо-сэн (до первого балла)'
};
