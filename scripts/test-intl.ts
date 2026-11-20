// Automated checks for countries and names. Run: npm test
import { transliterate, displayName, nameModeFor, participantNoc, participantFlag } from '../src/utils/names';
import { findCountry } from '../src/utils/countries';
import { eventTitle, placeName, countryLabel, disciplineLabel, cleanTitleTranslation } from '../src/utils/eventI18n';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};
const p = (o: any) => ({ id: '1', firstName: 'Адилет', lastName: 'Абдыкадыров', country: 'Кыргызстан', ...o }) as any;

check('translit: Абдыкадыров → Abdykadyrov', transliterate('Абдыкадыров') === 'Abdykadyrov', transliterate('Абдыкадыров'));
check('translit: Жумабекова Айгерим', transliterate('Жумабекова Айгерим') === 'Zhumabekova Aygerim', transliterate('Жумабекова Айгерим'));
check('translit: Kyrgyz letters Ө Ү Ң', transliterate('Төрөбек Үмүт Өң') === 'Torobek Umut On', transliterate('Төрөбек Үмүт Өң'));
check('translit: Щукин Юрий', transliterate('Щукин Юрий') === 'Shchukin Yuriy');
check('display local', displayName(p({}), 'local') === 'Абдыкадыров Адилет');
check('display international (WKF style)', displayName(p({}), 'international') === 'ABDYKADYROV Adilet', displayName(p({}), 'international'));
check('display uses own latin spelling', displayName(p({ lastNameLatin: 'Abdykadyrov', firstNameLatin: 'Adilet' }), 'international') === 'ABDYKADYROV Adilet');
check('country by russian name → KGZ', participantNoc(p({})) === 'KGZ');
check('country by NOC code wins', participantNoc(p({ countryCode: 'KAZ' })) === 'KAZ');
check('flag emoji 🇰🇬', participantFlag(p({})) === '🇰🇬', participantFlag(p({})));
check('alias: Киргизия → KGZ', findCountry('Киргизия')?.noc === 'KGZ');
check('IOC code differs from ISO: Germany = GER', findCountry('Германия')?.noc === 'GER');
check('mode: one country → local', nameModeFor([p({}), p({})], 'ru') === 'local');
check('mode: two countries → international', nameModeFor([p({}), p({ country: 'Казахстан' })], 'ru') === 'international');
check('mode: English interface → international', nameModeFor([p({})], 'en') === 'international');

// Tournament names, cities and countries in the interface language
const ev = { title: 'Открытый Кубок SKIF 2026', titleKy: 'SKIF Ачык Кубогу 2026', titleEn: 'SKIF Open Cup 2026' };
check('event title: Kyrgyz', eventTitle(ev, 'ky') === 'SKIF Ачык Кубогу 2026');
check('event title: English', eventTitle(ev, 'en') === 'SKIF Open Cup 2026');
check('event title: Russian original', eventTitle(ev, 'ru') === 'Открытый Кубок SKIF 2026');
check('event title: empty translation falls back', eventTitle({ title: 'Кубок', titleEn: '  ' }, 'en') === 'Кубок');
check('city: Бишкек → Bishkek', placeName('Бишкек', 'en') === 'Bishkek');
check('city: г. Ош → Osh', placeName('г. Ош', 'en') === 'Osh');
check('city: unknown is transliterated', placeName('Сокулук', 'en') === 'Sokuluk', placeName('Сокулук', 'en'));
check('city: Kyrgyz spelling', placeName('Джалал-Абад', 'ky') === 'Жалал-Абад');
check('country: Казахстан → Kazakhstan', countryLabel('Казахстан', 'en') === 'Kazakhstan');
check('discipline: Командное ката → Team kata', disciplineLabel('Командное ката', 'en') === 'Team kata');
check('translated title: cleaned and limited', cleanTitleTranslation('  a   b ') === 'a b' && cleanTitleTranslation('') === undefined && (cleanTitleTranslation('x'.repeat(500)) || '').length === 200);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll international checks passed');
process.exit(failures ? 1 : 0);
