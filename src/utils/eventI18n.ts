/**
 * Tournament name, city and country in the interface language (ru / ky / en).
 * The organizer writes the name once in Russian; the Kyrgyz and English names are optional fields
 * (titleKy, titleEn). Cities and countries are translated automatically.
 */
import { transliterate } from './names';
import { findCountry, countryName } from './countries';

type Lang = 'ru' | 'ky' | 'en';

interface Titled {
  title: string;
  titleKy?: string;
  titleEn?: string;
}

// Built-in example tournaments carry their translations in the page translator; it registers a lookup here.
let builtInTitle: ((id: string, lang: string) => string | undefined) | null = null;
export function setBuiltInTitleLookup(fn: (id: string, lang: string) => string | undefined) {
  builtInTitle = fn;
}

/** Name of the tournament for this language; falls back to the original name. */
export function eventTitle(ev: (Titled & { id?: string }) | null | undefined, lang: string): string {
  if (!ev) return '';
  if (lang === 'ky' && ev.titleKy?.trim()) return ev.titleKy.trim();
  if (lang === 'en' && ev.titleEn?.trim()) return ev.titleEn.trim();
  if (lang !== 'ru' && ev.id && builtInTitle) {
    const t = builtInTitle(ev.id, lang);
    if (t) return t;
  }
  return ev.title;
}

/** Cities written the usual way in English (the rest are transliterated). */
const CITIES_EN: Record<string, string> = {
  'бишкек': 'Bishkek',
  'ош': 'Osh',
  'каракол': 'Karakol',
  'нарын': 'Naryn',
  'талас': 'Talas',
  'баткен': 'Batken',
  'джалал-абад': 'Jalal-Abad',
  'жалал-абад': 'Jalal-Abad',
  'токмок': 'Tokmok',
  'кант': 'Kant',
  'кара-балта': 'Kara-Balta',
  'чолпон-ата': 'Cholpon-Ata',
  'балыкчы': 'Balykchy',
  'узген': 'Uzgen',
  'кызыл-кия': 'Kyzyl-Kiya',
  'алматы': 'Almaty',
  'астана': 'Astana',
  'шымкент': 'Shymkent',
  'ташкент': 'Tashkent',
  'самарканд': 'Samarkand',
  'душанбе': 'Dushanbe',
  'москва': 'Moscow',
  'санкт-петербург': 'Saint Petersburg',
  'стамбул': 'Istanbul',
  'дубай': 'Dubai'
};

/** Cities with their own Kyrgyz spelling (the rest are written the same as in Russian). */
const CITIES_KY: Record<string, string> = {
  'джалал-абад': 'Жалал-Абад',
  'чолпон-ата': 'Чолпон-Ата',
  'узген': 'Өзгөн',
  'кызыл-кия': 'Кызыл-Кыя'
};

/** City name for this language. */
export function placeName(city: string | undefined, lang: string): string {
  const raw = (city || '').trim();
  if (!raw || lang === 'ru') return raw;
  const key = raw.toLowerCase().replace(/^г\.\s*/, '');
  if (lang === 'ky') return CITIES_KY[key] || raw;
  if (CITIES_EN[key]) return CITIES_EN[key];
  // Already in Latin letters: keep as written
  if (!/[а-яё]/i.test(raw)) return raw;
  return transliterate(raw.replace(/^г\.\s*/, ''));
}

/** Country name for this language (known countries only; otherwise as written). */
export function countryLabel(country: string | undefined, lang: string): string {
  const raw = (country || '').trim();
  if (!raw || lang === 'ru') return raw;
  const c = findCountry(raw);
  return c ? countryName(c, lang as Lang) : raw;
}

/** «Kyrgyzstan, Bishkek» in this language. */
export function locationText(ev: { city?: string; country?: string }, lang: string): string {
  return [countryLabel(ev.country, lang), placeName(ev.city, lang)].filter(Boolean).join(', ');
}

/** Keeps only short plain text for the optional translated names (server side). */
export function cleanTitleTranslation(value: unknown): string | undefined {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  return text || undefined;
}

/** Usual discipline names in Kyrgyz and English (organizer's own wording is kept as written). */
const DISCIPLINES: Record<string, [ky: string, en: string]> = {
  'индивидуальное ката': ['Жеке ката', 'Individual kata'],
  'индивидуальное кумитэ': ['Жеке кумитэ', 'Individual kumite'],
  'командное ката': ['Командалык ката', 'Team kata'],
  'командное кумитэ': ['Командалык кумитэ', 'Team kumite'],
  'ката': ['Ката', 'Kata'],
  'кумитэ': ['Кумитэ', 'Kumite'],
  'кумитэ индивидуальное (wkf)': ['Жеке кумитэ (WKF)', 'Individual kumite (WKF)'],
  'ката индивидуальное (wkf)': ['Жеке ката (WKF)', 'Individual kata (WKF)'],
  'другие дисциплины': ['Башка дисциплиналар', 'Other disciplines'],
  'командное кумитэ (wkf)': ['Командалык кумитэ (WKF)', 'Team kumite (WKF)'],
  'сётокан shobu ippon': ['Сётокан Shobu Ippon', 'Shotokan Shobu Ippon'],
  'сётокан shobu sanbon': ['Сётокан Shobu Sanbon', 'Shotokan Shobu Sanbon'],
  'кёкусинкай весовой нокдаун': ['Кёкусинкай салмак боюнча нокдаун', 'Kyokushin knockdown by weight'],
  'абсолютная весовая категория': ['Абсолюттук салмак категориясы', 'Open weight category'],
  'skif · shobu ippon': ['SKIF · Shobu Ippon', 'SKIF · Shobu Ippon'],
  'skif · shobu sanbon': ['SKIF · Shobu Sanbon', 'SKIF · Shobu Sanbon'],
  'wkf': ['WKF', 'WKF'],
  'кёкусинкай': ['Кёкусинкай', 'Kyokushin']
};

/** Older tournaments were saved with «(WKF)» in the names and «Сётокан …» styles: show them in the current wording. */
const DISCIPLINE_ALIASES: Record<string, string> = {
  'кумитэ индивидуальное (wkf)': 'Индивидуальное кумитэ',
  'ката индивидуальное (wkf)': 'Индивидуальное ката',
  'командное кумитэ (wkf)': 'Командное кумитэ',
  'командное кумитэ': 'Командное кумитэ',
  'командное ката': 'Командное ката',
  'сётокан shobu ippon': 'SKIF · Shobu Ippon',
  'сётокан shobu sanbon': 'SKIF · Shobu Sanbon',
  'кёкусинкай весовой нокдаун': 'Кёкусинкай'
};

/** Current name of a discipline (old saved names → today's wording). */
export const normalizeDiscipline = (name: string) => DISCIPLINE_ALIASES[name.trim().toLowerCase()] || name.trim();

export function disciplineLabel(name: string, lang: string): string {
  const current = normalizeDiscipline(name);
  if (lang === 'ru') return current;
  const hit = DISCIPLINES[current.toLowerCase()];
  return hit ? (lang === 'ky' ? hit[0] : hit[1]) : current;
}
