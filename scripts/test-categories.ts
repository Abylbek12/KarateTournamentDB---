// Automated checks for categories and eligibility. Run: npm test
import { ageOn, categoryFits, categoryName, buildWkfSet, weighInFits, findCategoryForWeight, beltName } from '../src/utils/eventCategories';
import type { EventCategory } from '../src/types/schema';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

check('age: birthday not yet reached', ageOn('2012-12-10', '2026-11-28') === 13);
check('age: birthday reached', ageOn('2012-11-28', '2026-11-28') === 14);

const set = buildWkfSet('t', ['cadet'], 1500, { kata: true, kumite: true });
const kumiteBoys = set.filter((c) => c.discipline === 'kumite' && c.gender === 'male');
check('WKF cadets: 5 boys kumite classes (-52…-70, +70)', kumiteBoys.length === 5, kumiteBoys.map((c) => categoryName(c)).join(' | '));
check('names: "Кумитэ · Юноши 14–15 лет · −52 кг"', categoryName(kumiteBoys[0]) === 'Кумитэ · Юноши 14–15 лет · −52 кг', categoryName(kumiteBoys[0]));
check('names: open class "+70 кг"', categoryName(kumiteBoys[4]).endsWith('+70 кг'));

const c57 = kumiteBoys[1] as EventCategory; // -57: (52, 57]
check('fit: 15 y.o. boy 55 kg fits −57', categoryFits(c57, { birthDate: '2011-03-01', gender: 'male', weightKg: 55 }, '2026-11-28').ok);
const tooOld = categoryFits(c57, { birthDate: '2009-01-01', gender: 'male', weightKg: 55 }, '2026-11-28');
check('fit: 17 y.o. rejected with reason', !tooOld.ok && tooOld.reasons[0].startsWith('возраст 17'), tooOld.reasons.join(', '));
check('fit: girl rejected from boys category', !categoryFits(c57, { birthDate: '2011-03-01', gender: 'female', weightKg: 55 }, '2026-11-28').ok);
check('fit: 52.0 kg belongs to −52, not −57', !categoryFits(c57, { birthDate: '2011-03-01', gender: 'male', weightKg: 52 }, '2026-11-28').ok);
check('weigh-in: 57.4 kg does not fit −57', !weighInFits(c57, 57.4));
check('weigh-in: suggests −63 for 57.4 kg', categoryName(findCategoryForWeight(set, c57, 57.4)!).endsWith('−63 кг'));

// Пояс «Другое»: не блокирует заявку в категории с минимальным поясом, показывается с текстом спортсмена
const brownOnly = { ...c57, minBelt: 'brown_3kyu' } as EventCategory;
const kid = { birthDate: '2011-03-01', gender: 'male' as const, weightKg: 55 };
check('belt: white belt is below brown minimum', !categoryFits(brownOnly, { ...kid, beltRank: 'white_10kyu' }, '2026-11-28').ok);
check('belt: «Другое» is not rejected for belt reasons', categoryFits(brownOnly, { ...kid, beltRank: 'other' }, '2026-11-28').ok);
check('belt: «Другое» shows custom text', beltName({ beltRank: 'other', beltOther: ' Красный ' }) === 'Другое: Красный');
check('belt: «Другое» without text', beltName({ beltRank: 'other' }) === 'Другое');
check('belt: ordinary belt label', beltName({ beltRank: 'brown_1kyu' }) === 'Коричневый (1 кю)');

console.log(failures ? `\n${failures} check(s) failed` : '\nAll category checks passed');
process.exit(failures ? 1 : 0);
