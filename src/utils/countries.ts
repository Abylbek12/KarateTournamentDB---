/**
 * Countries with NOC (IOC) codes used in WKF results, ISO-2 codes for flags,
 * and names in Russian and English. Kyrgyz uses the Russian name where it is the same.
 */
export interface Country {
  noc: string;
  iso2: string;
  ru: string;
  en: string;
  ky?: string;
}

export const COUNTRIES: Country[] = [
  { noc: 'KGZ', iso2: 'KG', ru: 'Кыргызстан', en: 'Kyrgyzstan', ky: 'Кыргызстан' },
  { noc: 'KAZ', iso2: 'KZ', ru: 'Казахстан', en: 'Kazakhstan', ky: 'Казакстан' },
  { noc: 'UZB', iso2: 'UZ', ru: 'Узбекистан', en: 'Uzbekistan', ky: 'Өзбекстан' },
  { noc: 'TJK', iso2: 'TJ', ru: 'Таджикистан', en: 'Tajikistan', ky: 'Тажикстан' },
  { noc: 'TKM', iso2: 'TM', ru: 'Туркменистан', en: 'Turkmenistan', ky: 'Түркмөнстан' },
  { noc: 'RUS', iso2: 'RU', ru: 'Россия', en: 'Russia', ky: 'Орусия' },
  { noc: 'BLR', iso2: 'BY', ru: 'Беларусь', en: 'Belarus' },
  { noc: 'UKR', iso2: 'UA', ru: 'Украина', en: 'Ukraine' },
  { noc: 'MDA', iso2: 'MD', ru: 'Молдова', en: 'Moldova' },
  { noc: 'AZE', iso2: 'AZ', ru: 'Азербайджан', en: 'Azerbaijan' },
  { noc: 'ARM', iso2: 'AM', ru: 'Армения', en: 'Armenia' },
  { noc: 'GEO', iso2: 'GE', ru: 'Грузия', en: 'Georgia' },
  { noc: 'MGL', iso2: 'MN', ru: 'Монголия', en: 'Mongolia' },
  { noc: 'CHN', iso2: 'CN', ru: 'Китай', en: 'China', ky: 'Кытай' },
  { noc: 'JPN', iso2: 'JP', ru: 'Япония', en: 'Japan' },
  { noc: 'KOR', iso2: 'KR', ru: 'Южная Корея', en: 'Republic of Korea', ky: 'Түштүк Корея' },
  { noc: 'IND', iso2: 'IN', ru: 'Индия', en: 'India' },
  { noc: 'PAK', iso2: 'PK', ru: 'Пакистан', en: 'Pakistan' },
  { noc: 'AFG', iso2: 'AF', ru: 'Афганистан', en: 'Afghanistan' },
  { noc: 'IRI', iso2: 'IR', ru: 'Иран', en: 'Iran' },
  { noc: 'IRQ', iso2: 'IQ', ru: 'Ирак', en: 'Iraq' },
  { noc: 'TUR', iso2: 'TR', ru: 'Турция', en: 'Türkiye', ky: 'Түркия' },
  { noc: 'KSA', iso2: 'SA', ru: 'Саудовская Аравия', en: 'Saudi Arabia', ky: 'Сауд Арабиясы' },
  { noc: 'UAE', iso2: 'AE', ru: 'ОАЭ', en: 'United Arab Emirates' },
  { noc: 'QAT', iso2: 'QA', ru: 'Катар', en: 'Qatar' },
  { noc: 'KUW', iso2: 'KW', ru: 'Кувейт', en: 'Kuwait' },
  { noc: 'BRN', iso2: 'BH', ru: 'Бахрейн', en: 'Bahrain' },
  { noc: 'OMA', iso2: 'OM', ru: 'Оман', en: 'Oman' },
  { noc: 'JOR', iso2: 'JO', ru: 'Иордания', en: 'Jordan' },
  { noc: 'LBN', iso2: 'LB', ru: 'Ливан', en: 'Lebanon' },
  { noc: 'ISR', iso2: 'IL', ru: 'Израиль', en: 'Israel' },
  { noc: 'EGY', iso2: 'EG', ru: 'Египет', en: 'Egypt' },
  { noc: 'MAR', iso2: 'MA', ru: 'Марокко', en: 'Morocco' },
  { noc: 'ALG', iso2: 'DZ', ru: 'Алжир', en: 'Algeria' },
  { noc: 'TUN', iso2: 'TN', ru: 'Тунис', en: 'Tunisia' },
  { noc: 'RSA', iso2: 'ZA', ru: 'ЮАР', en: 'South Africa' },
  { noc: 'INA', iso2: 'ID', ru: 'Индонезия', en: 'Indonesia' },
  { noc: 'MAS', iso2: 'MY', ru: 'Малайзия', en: 'Malaysia' },
  { noc: 'PHI', iso2: 'PH', ru: 'Филиппины', en: 'Philippines' },
  { noc: 'VIE', iso2: 'VN', ru: 'Вьетнам', en: 'Vietnam' },
  { noc: 'THA', iso2: 'TH', ru: 'Таиланд', en: 'Thailand' },
  { noc: 'SGP', iso2: 'SG', ru: 'Сингапур', en: 'Singapore' },
  { noc: 'AUS', iso2: 'AU', ru: 'Австралия', en: 'Australia' },
  { noc: 'GER', iso2: 'DE', ru: 'Германия', en: 'Germany' },
  { noc: 'FRA', iso2: 'FR', ru: 'Франция', en: 'France' },
  { noc: 'ITA', iso2: 'IT', ru: 'Италия', en: 'Italy' },
  { noc: 'ESP', iso2: 'ES', ru: 'Испания', en: 'Spain' },
  { noc: 'POR', iso2: 'PT', ru: 'Португалия', en: 'Portugal' },
  { noc: 'GBR', iso2: 'GB', ru: 'Великобритания', en: 'Great Britain' },
  { noc: 'NED', iso2: 'NL', ru: 'Нидерланды', en: 'Netherlands' },
  { noc: 'BEL', iso2: 'BE', ru: 'Бельгия', en: 'Belgium' },
  { noc: 'SUI', iso2: 'CH', ru: 'Швейцария', en: 'Switzerland' },
  { noc: 'AUT', iso2: 'AT', ru: 'Австрия', en: 'Austria' },
  { noc: 'POL', iso2: 'PL', ru: 'Польша', en: 'Poland' },
  { noc: 'CZE', iso2: 'CZ', ru: 'Чехия', en: 'Czechia' },
  { noc: 'SVK', iso2: 'SK', ru: 'Словакия', en: 'Slovakia' },
  { noc: 'HUN', iso2: 'HU', ru: 'Венгрия', en: 'Hungary' },
  { noc: 'ROU', iso2: 'RO', ru: 'Румыния', en: 'Romania' },
  { noc: 'BUL', iso2: 'BG', ru: 'Болгария', en: 'Bulgaria' },
  { noc: 'SRB', iso2: 'RS', ru: 'Сербия', en: 'Serbia' },
  { noc: 'CRO', iso2: 'HR', ru: 'Хорватия', en: 'Croatia' },
  { noc: 'SLO', iso2: 'SI', ru: 'Словения', en: 'Slovenia' },
  { noc: 'BIH', iso2: 'BA', ru: 'Босния и Герцеговина', en: 'Bosnia and Herzegovina', ky: 'Босния жана Герцеговина' },
  { noc: 'MNE', iso2: 'ME', ru: 'Черногория', en: 'Montenegro' },
  { noc: 'MKD', iso2: 'MK', ru: 'Северная Македония', en: 'North Macedonia', ky: 'Түндүк Македония' },
  { noc: 'GRE', iso2: 'GR', ru: 'Греция', en: 'Greece' },
  { noc: 'CYP', iso2: 'CY', ru: 'Кипр', en: 'Cyprus' },
  { noc: 'DEN', iso2: 'DK', ru: 'Дания', en: 'Denmark' },
  { noc: 'SWE', iso2: 'SE', ru: 'Швеция', en: 'Sweden' },
  { noc: 'NOR', iso2: 'NO', ru: 'Норвегия', en: 'Norway' },
  { noc: 'FIN', iso2: 'FI', ru: 'Финляндия', en: 'Finland' },
  { noc: 'EST', iso2: 'EE', ru: 'Эстония', en: 'Estonia' },
  { noc: 'LAT', iso2: 'LV', ru: 'Латвия', en: 'Latvia' },
  { noc: 'LTU', iso2: 'LT', ru: 'Литва', en: 'Lithuania' },
  { noc: 'USA', iso2: 'US', ru: 'США', en: 'United States', ky: 'АКШ' },
  { noc: 'CAN', iso2: 'CA', ru: 'Канада', en: 'Canada' },
  { noc: 'MEX', iso2: 'MX', ru: 'Мексика', en: 'Mexico' },
  { noc: 'BRA', iso2: 'BR', ru: 'Бразилия', en: 'Brazil' },
  { noc: 'ARG', iso2: 'AR', ru: 'Аргентина', en: 'Argentina' },
  { noc: 'CHI', iso2: 'CL', ru: 'Чили', en: 'Chile' },
  { noc: 'PER', iso2: 'PE', ru: 'Перу', en: 'Peru' },
  { noc: 'COL', iso2: 'CO', ru: 'Колумбия', en: 'Colombia' },
  { noc: 'VEN', iso2: 'VE', ru: 'Венесуэла', en: 'Venezuela' }
];

const byNoc = new Map(COUNTRIES.map((c) => [c.noc, c]));
const byName = new Map<string, Country>();
for (const c of COUNTRIES) {
  for (const n of [c.ru, c.en, c.ky, c.noc, c.iso2]) if (n) byName.set(n.trim().toLowerCase(), c);
}
// Common alternative spellings
for (const [alias, noc] of [
  ['киргизия', 'KGZ'], ['kyrgyz republic', 'KGZ'], ['кыргызская республика', 'KGZ'], ['рф', 'RUS'],
  ['russian federation', 'RUS'], ['korea', 'KOR'], ['turkey', 'TUR'], ['турция', 'TUR'], ['england', 'GBR'],
  ['uk', 'GBR'], ['holland', 'NED'], ['czech republic', 'CZE'], ['чешская республика', 'CZE']
] as const) {
  byName.set(alias, byNoc.get(noc)!);
}

export const countryByNoc = (noc?: string) => (noc ? byNoc.get(noc.toUpperCase()) : undefined);

/** Finds a country by NOC/ISO code or by its Russian / English / Kyrgyz name. */
export const findCountry = (value?: string): Country | undefined => (value ? byName.get(value.trim().toLowerCase()) : undefined);

/** Emoji flag from an ISO-2 code (🇰🇬). */
export const flagEmoji = (iso2?: string) =>
  iso2 && /^[A-Z]{2}$/.test(iso2) ? String.fromCodePoint(...[...iso2].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '🏳️';

export const countryName = (c: Country | undefined, lang: 'ru' | 'ky' | 'en') => (c ? (lang === 'en' ? c.en : lang === 'ky' ? c.ky || c.ru : c.ru) : '');
