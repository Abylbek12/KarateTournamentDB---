// Checks for the tournament workflow: stage addresses and which stages are done. Run: npm test
import { tabFromHash, manageHash } from '../src/utils/routes';
import { workflowStatus, WORKFLOW_STEPS } from '../src/utils/workflow';
import type { Bout, EventCategory, Participant } from '../src/types/schema';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

check('6 numbered stages', WORKFLOW_STEPS.length === 6 && WORKFLOW_STEPS.every((s, i) => s.n === i + 1));
const r = tabFromHash(manageHash('kg-naryn', 4));
check('stage link → manage, tournament, stage', r?.tab === 'manage' && r.eventId === 'kg-naryn' && r.step === 4, JSON.stringify(r));
check('wrong stage number → stage 1', tabFromHash('#manage;id=x;step=99')?.step === 1);
check('no stage → stage 1', tabFromHash('#manage;id=x')?.step === 1);

const EV = 'ev';
const cat = (id: string): EventCategory => ({ id, tournamentId: EV, discipline: 'kumite', gender: 'male', ageMin: 18, ageMax: null, weightMin: null, weightMax: null, fee: 0, durationSeconds: 180 });
const p = (id: string, categoryId: string, weighed = false): Participant => ({ id, tournamentId: EV, categoryId, isWeighedIn: weighed, status: 'registered' } as Participant);
const bout = (categoryId: string, status: Bout['status']): Bout => ({ id: categoryId + status, tournamentId: EV, categoryId, status } as Bout);

let s = workflowStatus(EV, [], [], []);
check('empty tournament: start at stage 1', s.current === 1 && !s.done[1]);
s = workflowStatus(EV, [cat('c1')], [], []);
check('categories made: stage 1 done, go to 2', s.done[1] && s.current === 2);
const two = [p('a', 'c1'), p('b', 'c1')];
s = workflowStatus(EV, [cat('c1')], two, []);
check('entries: stage 2 done, weigh-in next', s.done[2] && s.current === 3 && s.counts[2] === 2);
const weighed = [p('a', 'c1', true), p('b', 'c1', true)];
s = workflowStatus(EV, [cat('c1')], weighed, []);
check('all weighed: draw next', s.done[3] && s.current === 4);
s = workflowStatus(EV, [cat('c1')], weighed, [bout('c1', 'scheduled')]);
check('drawn: bouts next', s.done[4] && s.current === 5);
s = workflowStatus(EV, [cat('c1')], weighed, [bout('c1', 'completed')]);
check('all bouts finished: stages 5 and 6 done', s.done[5] && s.done[6]);
s = workflowStatus(EV, [cat('c1')], [...weighed, { ...p('w', 'c1', true), status: 'withdrawn' } as Participant], []);
check('withdrawn entries do not count', s.counts[2] === 2);
s = workflowStatus('other', [cat('c1')], weighed, []);
check('another tournament is not mixed in', !s.done[1] && s.counts[2] === 0);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll workflow checks passed');
process.exit(failures ? 1 : 0);
