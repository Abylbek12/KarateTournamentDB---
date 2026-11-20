// Automated checks for the default «current tournament». Run: npm test
import { pickCurrentTournament, localToday } from '../src/utils/currentTournament';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const today = '2026-11-20';
const events = [
  { id: 'skif', startDate: '2027-01-22', endDate: '2027-01-24', status: 'registration_open' },
  { id: 'asia', startDate: '2027-01-01', endDate: '2027-01-10', status: 'registration_open' },
  { id: 'europe', startDate: '2026-11-19', endDate: '2026-11-21', status: 'in_progress' },
  { id: 'naryn', startDate: '2026-10-10', endDate: '2026-10-10', status: 'completed', isArchived: true }
];

check('running today wins over first in list', pickCurrentTournament(events, today)?.id === 'europe');
check('remembered choice wins', pickCurrentTournament(events, today, 'skif')?.id === 'skif');
check('remembered but finished is ignored', pickCurrentTournament(events, today, 'naryn')?.id === 'europe');
check('unknown remembered id is ignored', pickCurrentTournament(events, today, 'nope')?.id === 'europe');
check('nothing today → nearest upcoming', pickCurrentTournament(events.filter((e) => e.id !== 'europe'), today)?.id === 'asia');
check('only past → most recent', pickCurrentTournament([events[3], { id: 'old', startDate: '2025-01-01', endDate: '2025-01-02' }], today)?.id === 'naryn');
check('one-day tournament today', pickCurrentTournament([{ id: 'one', startDate: today }], today)?.id === 'one');
check('empty list', pickCurrentTournament([], today) === undefined);
check('local date format', /^\d{4}-\d{2}-\d{2}$/.test(localToday()) && localToday(new Date(2026, 0, 5)) === '2026-01-05');

if (failures > 0) {
  console.error(`\n${failures} current-tournament check(s) failed`);
  process.exit(1);
}
console.log('\nAll current-tournament checks passed');
