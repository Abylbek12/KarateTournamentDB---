// Automated checks for countries and names. Run: npm test
import { transliterate, displayName, nameModeFor, participantNoc, participantFlag } from '../src/utils/names';
import { findCountry } from '../src/utils/countries';

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

console.log(failures ? `\n${failures} check(s) failed` : '\nAll international checks passed');
process.exit(failures ? 1 : 0);
