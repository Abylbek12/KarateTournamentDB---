// Checks of the bracket drawing (slots, byes, «Победитель #…») and of the three third-place modes. Run: npm test
import * as E from '../src/utils/boutEngine';
import { applyBoutResult, computeStandings } from '../src/utils/bracketProgression';
import { bracketLayout } from '../src/utils/bracketLayout';
import { generateProtectedWkfCategoryBouts } from '../src/utils/wkfBracketSeeding';
import { categoryCode } from '../src/utils/eventCategories';
import type { ThirdPlaceMode } from '../src/types/schema';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, clubId: 'c' + (i % 3), city: 'Нарын', country: 'KG', firstName: 'A', lastName: 'B' + i, beltRank: 'x' }) as any);
const draw = (n: number) => {
  const athletes = people(n);
  const { bouts } = generateProtectedWkfCategoryBouts({ id: 'c1', tournamentId: 't', discipline: 'kumite', gender: 'male' } as any, athletes, [{ id: 't1', number: 1, name: 'T', status: 'ready' } as any], { durationSeconds: 90 });
  return { bouts, find: (id?: string) => athletes.find((a) => a.id === id) };
};

// 7 athletes: three quarter-finals, the bye stands in the upper slot of the first semi-final
{
  const { bouts } = draw(7);
  const L = bracketLayout(bouts);
  check('7: rounds 1/4 → semi → final', L.stages.join(',') === 'quarter_final,semi_final,final', L.stages.join(','));
  check('7: four quarter-final slots, three bouts', L.columns[0].length === 4 && L.columns[0].filter((s) => s.bout).length === 3);
  const qf = L.columns[0].filter((s) => s.bout).map((s) => s.bout!.boutNumber);
  const [sf1, sf2] = L.columns[1];
  check('7: bye athlete in the upper slot of semi 1', sf1.aka.kind === 'athlete');
  check('7: semi 1 lower slot = winner of the first quarter bout', sf1.ao.kind === 'winner' && sf1.ao.boutNumber === qf[0], JSON.stringify(sf1.ao));
  check('7: semi 2 = winners of the other two quarter bouts', sf2.aka.kind === 'winner' && sf2.ao.kind === 'winner' && sf2.aka.boutNumber === qf[1] && sf2.ao.boutNumber === qf[2]);
  const fin = L.columns[2][0];
  check('7: final waits for both semis', fin.aka.kind === 'winner' && fin.ao.kind === 'winner' && fin.aka.boutNumber === sf1.bout!.boutNumber && fin.ao.boutNumber === sf2.bout!.boutNumber);
}

// 3 athletes: one semi-final, the bye goes straight to the final
{
  const { bouts } = draw(3);
  const L = bracketLayout(bouts);
  const fin = L.columns[1][0];
  check('3: final has the bye athlete and «winner of» the semi', fin.aka.kind === 'athlete' && fin.ao.kind === 'winner');
}

// 2 athletes: just the final
check('2: one column, one bout', bracketLayout(draw(2).bouts).columns.length === 1);

// 16 athletes: 1/8 → final, 8 + 4 + 2 + 1 slots
{
  const L = bracketLayout(draw(16).bouts);
  check('16: slots 8/4/2/1', L.columns.map((c) => c.length).join('/') === '8/4/2/1');
}

// 32 athletes: 1/16 round, 16 + 16 slots → subgroups A and B
{
  const L = bracketLayout(draw(32).bouts);
  check('32: slots 16/8/4/2/1', L.columns.map((c) => c.length).join('/') === '16/8/4/2/1');
  const fin = L.columns[L.columns.length - 1][0];
  check('32: final = winners of semi 1 (A) and semi 2 (B)', fin.aka.kind === 'winner' && fin.ao.kind === 'winner');
}
// 20 athletes: still 32 slots, byes in the first round
check('20: 1/16 round with byes', bracketLayout(draw(20).bouts).firstCount === 16);

// Category codes
check('code: kumite boys 7–10 −27', categoryCode({ discipline: 'kumite', gender: 'male', ageMin: 7, ageMax: 10, weightMin: null, weightMax: 27 } as any) === 'KU-M7-10-27');
check('code: kata girls 13–14', categoryCode({ discipline: 'kata', gender: 'female', ageMin: 13, ageMax: 14, weightMin: 50, weightMax: null } as any) === 'KA-F13-14');
check('code: open weight kumite', categoryCode({ discipline: 'kumite', gender: 'male', ageMin: 18, ageMax: null, weightMin: null, weightMax: null } as any) === 'KU-M18+-ABS');

// Third places
const run = (n: number, mode: ThirdPlaceMode) => {
  let { bouts, find } = draw(n);
  const order = ['round_1_8', 'quarter_final', 'semi_final', 'repechage', 'bronze_match', 'final'];
  for (let guard = 0; guard < 60; guard++) {
    const next = bouts.filter((b) => b.status !== 'completed' && b.akaParticipantId && b.aoParticipantId).sort((a, b) => order.indexOf(a.roundStage) - order.indexOf(b.roundStage))[0];
    if (!next) break;
    bouts = applyBoutResult(bouts, E.declareWinner(next, 'aka', 'points_lead'), find, mode);
  }
  return { bouts, st: computeStandings(bouts, 'c1') };
};
{
  const { bouts, st } = run(8, 'two_bronze');
  const semis = bouts.filter((b) => b.roundStage === 'semi_final');
  const losers = semis.map((b) => (b.winnerId === b.akaParticipantId ? b.aoParticipantId : b.akaParticipantId));
  check('two bronzes: no repechage, no bronze bout', !bouts.some((b) => b.roundStage === 'repechage' || b.roundStage === 'bronze_match'));
  check('two bronzes: both semi-final losers are 3rd', st.complete && st.bronze.length === 2 && losers.every((l) => st.bronze.includes(l!)), JSON.stringify(st));
}
{
  const { bouts, st } = run(8, 'bronze_match');
  const bm = bouts.filter((b) => b.roundStage === 'bronze_match');
  check('bronze bout: one bout between the semi-final losers', bm.length === 1 && bm[0].status === 'completed');
  check('bronze bout: its loser is 4th', !!st.fourth && st.fourth !== st.bronze[0] && bm[0].akaParticipantId !== undefined && [bm[0].akaParticipantId, bm[0].aoParticipantId].includes(st.fourth));
  check('bronze bout: one 3rd place, its winner', st.complete && st.bronze.length === 1 && st.bronze[0] === bm[0].winnerId, JSON.stringify(st));
  const numbers = bouts.map((b) => b.boutNumber);
  check('bronze bout: bout numbers stay unique', new Set(numbers).size === numbers.length);
}
{
  const { bouts, st } = run(8, 'repechage');
  check('repechage (WKF): two bronzes after repechage', st.complete && st.bronze.length === 2 && bouts.some((b) => b.roundStage === 'repechage'), JSON.stringify(st));
}
{
  const { st } = run(3, 'two_bronze');
  check('3 athletes: one 3rd place (semi loser)', st.complete && st.bronze.length === 1, JSON.stringify(st));
}

console.log(failures ? `\n${failures} bracket check(s) FAILED` : '\nAll bracket checks passed');
process.exit(failures ? 1 : 0);
