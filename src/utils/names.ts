import type { Participant } from '../types/schema';
import { countryByNoc, findCountry, flagEmoji, type Country } from './countries';

/**
 * Athlete names for local and international use.
 *  - Transliteration of Russian / Kyrgyz Cyrillic to Latin (passport-style, as used in
 *    Kyrgyzstan: Ж=Zh, Х=Kh, Ц=Ts, Ч=Ch, Ш=Sh, Щ=Shch, Ю=Yu, Я=Ya, Ө=O, Ү=U, Ң=N).
 *  - International display follows WKF results: "SURNAME Name".
 */

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi', є: 'ye', ғ: 'g', қ: 'k', ұ: 'u', һ: 'h', ә: 'a'
};

export function transliterate(text: string): string {
  let out = '';
  for (const ch of text || '') {
    const lower = ch.toLowerCase();
    const t = MAP[lower];
    if (t === undefined) out += ch;
    else out += ch === lower ? t : t.charAt(0).toUpperCase() + t.slice(1);
  }
  return out;
}

const capitalize = (s: string) => s.replace(/(^|[\s-])(\p{L})/gu, (_, p1, p2) => p1 + p2.toUpperCase());

export const latinLast = (p: Pick<Participant, 'lastName' | 'lastNameLatin'>) => (p.lastNameLatin || transliterate(p.lastName || '')).trim();
export const latinFirst = (p: Pick<Participant, 'firstName' | 'firstNameLatin'>) => capitalize((p.firstNameLatin || transliterate(p.firstName || '')).trim());

/** Country of a participant: by NOC code, else by the country name typed in the entry. */
export const participantCountry = (p?: Pick<Participant, 'countryCode' | 'country'>): Country | undefined =>
  p ? countryByNoc(p.countryCode) || findCountry(p.country) : undefined;

export const participantNoc = (p?: Pick<Participant, 'countryCode' | 'country'>) => participantCountry(p)?.noc || (p?.countryCode ?? '');
export const participantFlag = (p?: Pick<Participant, 'countryCode' | 'country'>) => flagEmoji(participantCountry(p)?.iso2);

export type NameMode = 'local' | 'international';

/** Name for display: local "Фамилия Имя", international "SURNAME Name" (teams: team name). */
export function displayName(p: Participant | undefined, mode: NameMode): string {
  if (!p) return '';
  if (p.teamName) return mode === 'international' ? transliterate(p.teamName) : p.teamName;
  if (mode === 'international') return `${latinLast(p).toUpperCase()} ${latinFirst(p)}`.trim();
  return `${p.lastName} ${p.firstName}`.trim();
}

/** International mode when athletes come from more than one country, or the interface is in English. */
export function nameModeFor(participants: (Participant | undefined)[], language: 'ru' | 'ky' | 'en'): NameMode {
  if (language === 'en') return 'international';
  const nocs = new Set(participants.filter(Boolean).map((p) => participantNoc(p)).filter(Boolean));
  return nocs.size > 1 ? 'international' : 'local';
}

/** Club name for display: Latin letters on international screens. */
export const displayClub = (p: Pick<Participant, 'clubName'> | undefined, mode: NameMode) =>
  !p?.clubName ? '' : mode === 'international' ? transliterate(p.clubName) : p.clubName;

const CATEGORY_WORDS: Record<'en' | 'ky', [RegExp, string][]> = {
  en: [
    [/Командное ката/g, 'Team Kata'], [/Командное кумитэ/g, 'Team Kumite'], [/Кумитэ/g, 'Kumite'], [/Ката/g, 'Kata'],
    [/Мужчины/g, 'Male'], [/Женщины/g, 'Female'], [/Юноши/g, 'Boys'], [/Девушки/g, 'Girls'], [/Мальчики/g, 'Boys'],
    [/Девочки/g, 'Girls'], [/Смешанные/g, 'Mixed'], [/Взрослые/g, 'Seniors'], [/Кадеты/g, 'Cadets'], [/Юниоры/g, 'Juniors'],
    [/Дети/g, 'Children'], [/Индивидуальное/g, 'Individual'], [/ лет/g, ' years'], [/ года/g, ' years'], [/ кг/g, ' kg'], [/ от /g, ' from ']
  ],
  ky: [
    [/Командное ката/g, 'Командалык ката'], [/Командное кумитэ/g, 'Командалык кумитэ'], [/Мужчины/g, 'Эркектер'],
    [/Женщины/g, 'Аялдар'], [/Юноши/g, 'Өспүрүм балдар'], [/Девушки/g, 'Өспүрүм кыздар'], [/Мальчики/g, 'Балдар'],
    [/Девочки/g, 'Кыздар'], [/Смешанные/g, 'Аралаш'], [/Взрослые/g, 'Чоңдор'], [/Кадеты/g, 'Кадеттер'], [/Юниоры/g, 'Юниорлор'],
    [/Дети/g, 'Балдар'], [/ лет/g, ' жаш'], [/ года/g, ' жаш']
  ]
};

/** Translates a generated Russian category name ("Кумитэ · Юноши 14–15 лет · −57 кг"). */
export function localizeCategoryName(name: string | undefined, lang: 'ru' | 'ky' | 'en'): string {
  if (!name || lang === 'ru') return name || '';
  return CATEGORY_WORDS[lang].reduce((s, [re, to]) => s.replace(re, to), name);
}
