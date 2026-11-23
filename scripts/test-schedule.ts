// Checks for the «Расписание по татами» printout (times like Uventex). Run: npm test
import { addToClock, boutSlotSeconds, boutsFor, parsePrintRequest, printUrl } from '../src/components/PrintDocuments';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

// Uventex, tatami 1: KATA 7 athletes at 09:00, next category at 09:22; KUMITE 4 athletes 09:22 -> 09:34
const kata = { discipline: 'kata' as const, durationSeconds: 240 };
const kumite = { discipline: 'kumite' as const, durationSeconds: 90 };
check('kata of 7 takes ~22 min', addToClock('09:00', boutsFor(7) * boutSlotSeconds(kata)) === '09:22', addToClock('09:00', boutsFor(7) * boutSlotSeconds(kata)));
check('kumite of 4 (90 s bouts) takes 12 min', addToClock('09:22', boutsFor(4) * boutSlotSeconds(kumite)) === '09:34');
check('kata of 13 takes ~44 min', addToClock('11:25', boutsFor(13) * boutSlotSeconds(kata)) === '12:09');
check('one athlete: no bouts', boutsFor(1) === 0 && boutsFor(0) === 0);
check('team kata is longer than kata', boutSlotSeconds({ discipline: 'team_kata', durationSeconds: 240 }) > boutSlotSeconds(kata));
check('clock passes midnight safely', addToClock('23:50', 20 * 60) === '00:10');

const url = printUrl({ kind: 'schedule', eventId: 'ev1', lang: 'ky', start: '08:30' });
const back = parsePrintRequest(url.slice(1));
check('schedule link keeps the start time', back?.kind === 'schedule' && back.start === '08:30' && back.lang === 'ky', url);
check('bad start time is ignored', parsePrintRequest('?print=schedule&e=ev1&t=25:99')?.start === undefined);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll schedule checks passed');
process.exit(failures ? 1 : 0);
