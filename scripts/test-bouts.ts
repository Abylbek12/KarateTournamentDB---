// Automated checks for the bout rules engine and bracket progression. Run: npm test
import * as E from '../src/utils/boutEngine';
import { applyBoutResult, computeStandings } from '../src/utils/bracketProgression';
import { generateProtectedWkfCategoryBouts } from '../src/utils/wkfBracketSeeding';
import type { Bout } from '../src/types/schema';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const bout = (extra: Partial<Bout> = {}): Bout =>
  ({
    id: 'b', tournamentId: 't', categoryId: 'c', tatamiId: 't1', boutNumber: 1, roundStage: 'final', bracketPosition: 1,
    akaParticipantId: 'A', aoParticipantId: 'B', scheduledTime: '10:00', akaScore: 0, aoScore: 0, akaSenshu: false, aoSenshu: false,
    akaPenaltiesC1: 0, aoPenaltiesC1: 0, akaPenaltiesC2: 0, aoPenaltiesC2: 0, status: 'scheduled',
    durationSeconds: 180, timerSecondsRemaining: 180, timerStartedAt: null, ...extra
  }) as Bout;

// Clock
{
  const t0 = 1_000_000;
  let b = E.startClock(bout(), t0);
  check('clock: running after start', E.isRunning(b) && b.status === 'in_progress');
  check('clock: 2.5 s later shows 177.5 s', Math.abs(E.remainingSeconds(b, t0 + 2500) - 177.5) < 1e-9);
  b = E.stopClock(b, t0 + 2500);
  check('clock: stop keeps the remaining time', !E.isRunning(b) && Math.abs(b.timerSecondsRemaining - 177.5) < 1e-9);
  {
    // A screen whose clock reads earlier than the start must not show more than the bout time
    const started = E.startClock(E.resetClock({ ...b, status: 'scheduled', timerStartedAt: null } as any), t0);
    check('clock: never above the bout time (clock difference)', E.remainingSeconds(started, t0 - 13000) === started.timerSecondsRemaining, String(E.remainingSeconds(started, t0 - 13000)));
  }
  check('format: 2:58 above ten seconds', E.formatClock(177.5) === '2:58', E.formatClock(177.5));
  check('format: tenths in the last ten seconds', E.formatClock(9.46) === '9.4' && E.formatClock(0.04) === '0.0', `${E.formatClock(9.46)} ${E.formatClock(0.04)}`);
  check('format: exactly 10 s shows 0:10', E.formatClock(10) === '0:10');
  check('clock: cannot start without both athletes', !E.isRunning(E.startClock(bout({ aoParticipantId: undefined }), t0)));
}

// WKF scoring
{
  let b = E.addScore(bout(), 'ao', 2);
  check('senshu: first unopposed point', b.aoSenshu && !b.akaSenshu);
  b = E.addScore(b, 'aka', 3);
  check('senshu: stays after opponent scores', b.aoSenshu);
  const corrected = E.addScore(E.addScore(bout(), 'aka', 1), 'aka', -1);
  check('correction back to 0:0 removes senshu', !corrected.akaSenshu && corrected.akaScore === 0);
  let m = bout({ akaScore: 6, aoScore: 1 });
  m = E.addScore(m, 'aka', 3);
  check('8-point lead ends the bout', m.status === 'completed' && m.winnerId === 'A' && m.winReason === 'mercy_rule_8pt');
  check('no scoring after the end', E.addScore(m, 'ao', 3).aoScore === 1);
}

// Time up
{
  check('time up: more points wins', E.onTimeUp(bout({ akaScore: 3, aoScore: 2 })).winnerId === 'A');
  const s = E.onTimeUp(bout({ akaScore: 2, aoScore: 2, aoSenshu: true }));
  check('time up: tie goes to senshu', s.winnerId === 'B' && s.winReason === 'senshu_advantage');
  const h = E.onTimeUp(bout({ akaScore: 2, aoScore: 2 }));
  check('time up: tie without senshu waits for Hantei', h.awaitingDecision === true && h.status !== 'completed');
  const d = E.hantei(h, 'aka');
  check('hantei decides the bout', d.status === 'completed' && d.winReason === 'hantei_decision' && !d.awaitingDecision);
}

// Penalties
{
  const p = E.setPenalty(bout(), 'aka', 'c2', 4);
  check('Hansoku: opponent wins', p.winnerId === 'B' && p.winReason === 'hansoku_dq');
  check('kiken: opponent wins', E.kiken(bout(), 'ao').winnerId === 'A');
}

// SKIF
{
  let s = E.addSkif(bout({ ruleSystem: 'skif', skifFormat: 'shobu_ippon' }), 'aka', 'waza_ari');
  check('SKIF shobu ippon: one waza-ari continues', s.status !== 'completed');
  s = E.addSkif(s, 'aka', 'waza_ari');
  check('SKIF shobu ippon: two waza-ari = awasete ippon', s.winnerId === 'A' && s.winReason === 'awasete_ippon');
  const i = E.addSkif(bout({ ruleSystem: 'skif', skifFormat: 'shobu_ippon' }), 'ao', 'ippon');
  check('SKIF shobu ippon: ippon wins', i.winnerId === 'B');
  let sb = bout({ ruleSystem: 'skif', skifFormat: 'shobu_sanbon' });
  sb = E.addSkif(E.addSkif(sb, 'aka', 'ippon'), 'aka', 'ippon');
  check('SKIF sanbon: two ippon continue', sb.status !== 'completed');
  sb = E.addSkif(sb, 'aka', 'ippon');
  check('SKIF sanbon: third ippon wins', sb.winnerId === 'A');
}

// Full bracket with repechage
{
  const athletes = Array.from({ length: 8 }, (_, i) => ({ id: 'p' + i, clubId: 'c' + (i % 4), city: 'Бишкек', country: 'KG', firstName: 'A', lastName: 'B' + i, beltRank: 'x' }) as any);
  const find = (id?: string) => athletes.find((a) => a.id === id);
  let { bouts } = generateProtectedWkfCategoryBouts({ id: 'c1', tournamentId: 't', discipline: 'kumite', gender: 'male' } as any, athletes, [{ id: 't1', number: 1, name: 'T', status: 'ready' } as any], { durationSeconds: 120 });
  check('generator: duration from category', bouts.every((b) => b.durationSeconds === 120 && b.timerSecondsRemaining === 120));
  const order = ['quarter_final', 'semi_final', 'repechage', 'final'];
  for (let guard = 0; guard < 40; guard++) {
    const next = bouts.filter((b) => b.status !== 'completed' && b.akaParticipantId && b.aoParticipantId).sort((a, b) => order.indexOf(a.roundStage) - order.indexOf(b.roundStage))[0];
    if (!next) break;
    bouts = applyBoutResult(bouts, E.declareWinner(next, 'aka', 'points_lead'), find);
  }
  const st = computeStandings(bouts, 'c1');
  check('8 athletes: gold, silver and two bronzes', !!st.gold && !!st.silver && st.bronze.length === 2 && st.complete, JSON.stringify(st));
  check('8 athletes: 7 elimination + 2 repechage bouts', bouts.length === 9, `bouts=${bouts.length}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll bout checks passed');
process.exit(failures ? 1 : 0);
