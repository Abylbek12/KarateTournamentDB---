// Automated checks for entry fees: price periods and the discount for next categories. Run: npm test
import { sanitizePricing, currentPeriod, bishkekDate, periodStartsOn, quoteEntries, countPaidBefore, athleteKey, entryFee, categoryPrice } from '../src/utils/pricing';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const pricing = sanitizePricing({
  additionalDiscount: 500,
  periods: [
    { id: 'late', name: 'Поздняя', endsOn: '2026-12-10', extra: 500 },
    { id: 'early', name: 'Ранняя', endsOn: '2026-11-20', extra: -300 },
    { id: 'bad', name: 'Ошибка', endsOn: '20.11.2026', extra: 1 },
    { id: 'main', name: 'Основная', endsOn: '2026-12-01', extra: 0 }
  ]
})!;

check('sanitize: bad date dropped, sorted by end date', pricing.periods.map((p) => p.id).join(',') === 'early,main,late', pricing.periods.map((p) => p.id).join(','));
check('sanitize: empty → undefined', sanitizePricing({ periods: [], additionalDiscount: 0 }) === undefined);
check('sanitize: garbage → undefined', sanitizePricing('x') === undefined && sanitizePricing([1]) === undefined);
check('sanitize: negative discount → 0', sanitizePricing({ periods: [], additionalDiscount: -5 }) === undefined);
check('sanitize: duplicate end dates kept once', sanitizePricing({ periods: [{ endsOn: '2026-01-01' }, { endsOn: '2026-01-01' }] })!.periods.length === 1);

check('period: before first end → early', currentPeriod(pricing, '2026-11-01')?.id === 'early');
check('period: on the last day → still early', currentPeriod(pricing, '2026-11-20')?.id === 'early');
check('period: next day → main', currentPeriod(pricing, '2026-11-21')?.id === 'main');
check('period: after the last → last stays', currentPeriod(pricing, '2027-01-01')?.id === 'late');
check('period: no pricing → null', currentPeriod(undefined, '2026-11-01') === null);
check('period start: first has none', periodStartsOn(pricing, 'early') === null);
check('period start: main starts the day after early', periodStartsOn(pricing, 'main') === '2026-11-21');
check('period start: across month end', periodStartsOn(sanitizePricing({ periods: [{ id: 'a', endsOn: '2026-11-30' }, { id: 'b', endsOn: '2026-12-31' }] }), 'b') === '2026-12-01');

check('Bishkek date: 19:00 UTC is already next day', bishkekDate(new Date('2026-11-20T19:00:00Z')) === '2026-11-21');
check('Bishkek date: 17:59 UTC is same day', bishkekDate(new Date('2026-11-20T17:59:00Z')) === '2026-11-20');

const kata = { id: 'kata', fee: 1500, discipline: 'kata' };
const kumite = { id: 'kumite', fee: 2000, discipline: 'kumite' };
const team = { id: 'team', fee: 4500, discipline: 'team_kata' };
const free = { id: 'free', fee: 0, discipline: 'kata' };
const A = athleteKey('Асанов', 'Бакыт', '2014-05-01');
const B = athleteKey('Исаева', 'Айгерим', '2013-02-02');

check('price: free stays free even with extra', categoryPrice(free, pricing.periods[2]) === 0);
check('price: early-bird never below 0', categoryPrice({ id: 'x', fee: 100, discipline: 'kata' }, pricing.periods[0]) === 0);

let q = quoteEntries([{ category: kata, athleteKey: A }, { category: kumite, athleteKey: A }], pricing, '2026-11-25');
check('main period: most expensive is first', q.lines[1].kind === 'first' && q.lines[1].amount === 2000, JSON.stringify(q.lines));
check('main period: other gets discount', q.lines[0].kind === 'additional' && q.lines[0].amount === 1000);
check('main period: total', q.total === 3000, String(q.total));

q = quoteEntries([{ category: kata, athleteKey: A }, { category: kumite, athleteKey: A }], pricing, '2026-11-10');
check('early period: −300 on both, discount on second', q.total === 1700 + 700, String(q.total));

q = quoteEntries([{ category: kata, athleteKey: A }, { category: kata, athleteKey: B }], pricing, '2026-11-25');
check('two athletes: both pay full', q.lines.every((l) => l.kind === 'first' && l.amount === 1500));

q = quoteEntries([{ category: team, athleteKey: null }, { category: team, athleteKey: null }], pricing, '2026-11-25');
check('teams: no next-category discount', q.total === 9000);

q = quoteEntries([{ category: kata, athleteKey: A }], pricing, '2026-11-25', new Map([[A, 1]]));
check('athlete already entered: new entry is «next»', q.lines[0].kind === 'additional' && q.total === 1000);

q = quoteEntries([{ category: free, athleteKey: A }, { category: kata, athleteKey: A }], pricing, '2026-11-25');
check('free category does not take the «first» slot', q.lines[0].kind === 'free' && q.lines[1].kind === 'first' && q.total === 1500);

q = quoteEntries([{ category: kata, athleteKey: A }, { category: kumite, athleteKey: A }], undefined, '2026-11-25');
check('no pricing: plain fees as before', q.total === 3500);

const parts = [
  { tournamentId: 't1', categoryId: 'kata', status: 'registered', lastName: 'Асанов', firstName: 'Бакыт', birthDate: '2014-05-01' },
  { tournamentId: 't1', categoryId: 'kumite', status: 'withdrawn', lastName: 'Асанов', firstName: 'Бакыт', birthDate: '2014-05-01' },
  { tournamentId: 't2', categoryId: 'kata', status: 'registered', lastName: 'Асанов', firstName: 'Бакыт', birthDate: '2014-05-01' },
  { tournamentId: 't1', categoryId: 'team', status: 'registered', lastName: '', firstName: 'Команда', birthDate: '', teamName: 'Команда' }
];
const before = countPaidBefore(parts, [kata, kumite, team], 't1');
check('paid before: counts only active individual entries of this tournament', before.get(A) === 1 && before.size === 1, JSON.stringify([...before]));

check('entry fee: fixed amount wins', entryFee({ feeAmount: 700 }, { fee: 1500 }) === 700);
check('entry fee: zero amount kept', entryFee({ feeAmount: 0 }, { fee: 1500 }) === 0);
check('entry fee: old entries use category fee', entryFee({}, { fee: 1500 }) === 1500);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll pricing checks passed');
