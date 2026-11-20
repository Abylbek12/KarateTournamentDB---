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
  'другие дисциплины': ['Башка дисциплиналар', 'Other disciplines']
};

export function disciplineLabel(name: string, lang: string): string {
  if (lang === 'ru') return name;
  const hit = DISCIPLINES[name.trim().toLowerCase()];
  return hit ? (lang === 'ky' ? hit[0] : hit[1]) : name;
}
