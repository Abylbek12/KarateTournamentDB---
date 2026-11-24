import type { BeltRank, EventCategory, Gender, Participant } from '../types/schema';

/**
 * Tournament categories: names, eligibility (age on the first day of the tournament,
 * gender, weight, belt) and a standard WKF set to start from.
 * NOTE: weight classes and bout durations follow the common WKF structure; check them
 * against the regulations of your tournament before publishing.
 */

export const BELT_ORDER: BeltRank[] = [
  'white_10kyu', 'yellow_8kyu', 'orange_7kyu', 'green_6kyu', 'kyu_5', 'blue_4kyu',
  'brown_3kyu', 'brown_2kyu', 'brown_1kyu', 'black_1dan', 'black_2dan', 'black_3dan_plus'
];

export const BELT_LABELS: Record<BeltRank, string> = {
  white_10kyu: 'Белый (10 кю)', yellow_8kyu: 'Жёлтый (8 кю)', orange_7kyu: 'Оранжевый (7 кю)', green_6kyu: 'Зелёный (6 кю)', kyu_5: '5 кю',
  blue_4kyu: 'Синий (4 кю)', brown_3kyu: 'Коричневый (3 кю)', brown_2kyu: 'Коричневый (2 кю)', brown_1kyu: 'Коричневый (1 кю)', black_1dan: 'Чёрный (1 дан)',
  black_2dan: 'Чёрный (2 дан)', black_3dan_plus: 'Чёрный (3 дан и выше)', other: 'Другое'
};

/** Пояса для выпадающего списка: все по порядку, «Другое» — последним. */
export const BELT_CHOICES: BeltRank[] = [...BELT_ORDER, 'other'];

const BELT_LABELS_KY: Record<BeltRank, string> = {
  white_10kyu: 'Ак (10 кю)', yellow_8kyu: 'Сары (8 кю)', orange_7kyu: 'Кызгылт сары (7 кю)', green_6kyu: 'Жашыл (6 кю)', kyu_5: '5 кю',
  blue_4kyu: 'Көк (4 кю)', brown_3kyu: 'Күрөң (3 кю)', brown_2kyu: 'Күрөң (2 кю)', brown_1kyu: 'Күрөң (1 кю)', black_1dan: 'Кара (1 дан)',
  black_2dan: 'Кара (2 дан)', black_3dan_plus: 'Кара (3 дан жана жогору)', other: 'Башка'
};
const BELT_LABELS_EN: Record<BeltRank, string> = {
  white_10kyu: 'White (10 kyu)', yellow_8kyu: 'Yellow (8 kyu)', orange_7kyu: 'Orange (7 kyu)', green_6kyu: 'Green (6 kyu)', kyu_5: '5 kyu',
  blue_4kyu: 'Blue (4 kyu)', brown_3kyu: 'Brown (3 kyu)', brown_2kyu: 'Brown (2 kyu)', brown_1kyu: 'Brown (1 kyu)', black_1dan: 'Black (1 dan)',
  black_2dan: 'Black (2 dan)', black_3dan_plus: 'Black (3 dan and above)', other: 'Other'
};

/** Belt name in the interface language (ru / ky / en). */
export function beltLabel(b: BeltRank | string, lang: string = 'ru'): string {
  const map = lang === 'ky' ? BELT_LABELS_KY : lang === 'en' ? BELT_LABELS_EN : BELT_LABELS;
  return map[b as BeltRank] || String(b);
}

/** Пояс для показа людям: «Другое: <что вписал спортсмен>». */
export function beltName(p: { beltRank?: BeltRank | string; beltOther?: string }, lang: string = 'ru'): string {
  if (!p.beltRank) return '';
  if (p.beltRank === 'other') {
    const other = beltLabel('other', lang);
    return p.beltOther?.trim() ? `${other}: ${p.beltOther.trim()}` : other;
  }
  return beltLabel(p.beltRank, lang);
}

export const DISCIPLINE_LABELS: Record<EventCategory['discipline'], string> = {
  kumite: 'Кумитэ', kata: 'Ката', team_kumite: 'Командное кумитэ', team_kata: 'Командное ката', other: 'Другие дисциплины'
};

/** Kumite and the organizer's own disciplines can have weight classes. */
export const hasWeightClasses = (c: Pick<EventCategory, 'discipline'>) => c.discipline === 'kumite' || c.discipline === 'other';

/** Discipline name shown to people («Кумитэ», or the organizer's own, e.g. «Кихон»). */
export const disciplineName = (c: Pick<EventCategory, 'discipline' | 'customDiscipline'>) =>
  c.discipline === 'other' ? c.customDiscipline?.trim() || 'Другая дисциплина' : DISCIPLINE_LABELS[c.discipline];

export const isTeamCategory = (c: Pick<EventCategory, 'discipline'>) => c.discipline === 'team_kata' || c.discipline === 'team_kumite';

/** Full years on `onDate` (YYYY-MM-DD). */
export function ageOn(birthDate: string, onDate: string): number | null {
  const b = birthDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = onDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!b || !d) return null;
  let age = +d[1] - +b[1];
  if (+d[2] < +b[2] || (+d[2] === +b[2] && +d[3] < +b[3])) age--;
  return age;
}

const genderWord = (g: Gender, ageMin: number, ageMax: number | null) => {
  if (g === 'mixed') return 'Смешанные';
  const top = ageMax ?? 99;
  if (top <= 13) return g === 'male' ? 'Мальчики' : 'Девочки';
  if (top <= 17) return g === 'male' ? 'Юноши' : 'Девушки';
  return g === 'male' ? 'Мужчины' : 'Женщины';
};

const ageLabel = (min: number, max: number | null) => (max == null ? `${min}+` : min === max ? `${min} лет` : `${min}–${max} лет`);

export function weightLabel(c: Pick<EventCategory, 'weightMin' | 'weightMax'>): string {
  if (c.weightMax != null) return `−${c.weightMax} кг`;
  if (c.weightMin != null) return `+${c.weightMin} кг`;
  return '';
}

export function categoryName(c: EventCategory): string {
  if (c.name) return c.name;
  const parts = [disciplineName(c), `${genderWord(c.gender, c.ageMin, c.ageMax)} ${ageLabel(c.ageMin, c.ageMax)}`];
  const w = hasWeightClasses(c) ? weightLabel(c) : '';
  if (w) parts.push(w);
  if (c.minBelt) parts.push(`от ${BELT_LABELS[c.minBelt].toLowerCase()}`);
  return parts.join(' · ');
}

export interface FitResult {
  ok: boolean;
  reasons: string[];
}

/** Can this athlete (or team) enter this category? */
export function categoryFits(
  c: EventCategory,
  a: { birthDate?: string; gender?: Gender; weightKg?: number | null; beltRank?: BeltRank },
  eventStartDate: string
): FitResult {
  const reasons: string[] = [];
  if (isTeamCategory(c)) {
    if (c.gender !== 'mixed' && a.gender && a.gender !== 'mixed' && a.gender !== c.gender) reasons.push('другой пол команды');
    return { ok: reasons.length === 0, reasons };
  }
  if (c.gender !== 'mixed' && a.gender && a.gender !== c.gender) reasons.push(c.gender === 'male' ? 'категория для мужчин/юношей' : 'категория для женщин/девушек');
  const age = a.birthDate ? ageOn(a.birthDate, eventStartDate) : null;
  if (age == null) reasons.push('нужна дата рождения');
  else if (age < c.ageMin || (c.ageMax != null && age > c.ageMax)) reasons.push(`возраст ${age} (нужно ${ageLabel(c.ageMin, c.ageMax)})`);
  if (hasWeightClasses(c) && (c.weightMin != null || c.weightMax != null)) {
    const w = a.weightKg;
    if (!w) reasons.push('нужен вес');
    else if ((c.weightMin != null && w <= c.weightMin) || (c.weightMax != null && w > c.weightMax)) reasons.push(`вес ${w} кг (нужно ${weightLabel(c)})`);
  }
  // «Другое» нельзя сравнить по порядку поясов: такую заявку проверяет организатор вручную
  if (c.minBelt && a.beltRank && a.beltRank !== 'other' && BELT_ORDER.indexOf(a.beltRank) <BELT_ORDER.indexOf(c.minBelt)) reasons.push(`пояс ниже ${BELT_LABELS[c.minBelt].toLowerCase()}`);
  return { ok: reasons.length === 0, reasons };
}

/** Weigh-in check: the actual weight must still fit the category. */
export function weighInFits(c: EventCategory | undefined, actualKg: number | null): boolean {
  // No weight yet (not given in the entry) = nothing to check
  if (!c || !hasWeightClasses(c) || actualKg == null || !(actualKg > 0)) return true;
  if (c.weightMin != null && actualKg <= c.weightMin) return false;
  if (c.weightMax != null && actualKg > c.weightMax) return false;
  return true;
}

/** Category of the same discipline/gender/age that fits a weight (to move an athlete after weigh-in). */
export function findCategoryForWeight(all: EventCategory[], current: EventCategory, kg: number): EventCategory | undefined {
  return all.find(
    (c) =>
      c.id !== current.id &&
      c.tournamentId === current.tournamentId &&
      c.discipline === current.discipline &&
      (c.customDiscipline || "").trim().toLowerCase() === (current.customDiscipline || "").trim().toLowerCase() &&
      c.gender === current.gender &&
      c.ageMin === current.ageMin &&
      c.ageMax === current.ageMax &&
      weighInFits(c, kg)
  );
}

// ---------------- Standard WKF set ----------------

export interface AgeGroupPreset {
  key: string;
  label: string;
  ageMin: number;
  ageMax: number | null;
  durationSeconds: number;
  male: number[]; // upper limits; the last open class is added automatically
  female: number[];
}

export const WKF_AGE_GROUPS: AgeGroupPreset[] = [
  { key: 'u10', label: 'Дети 8–9 лет', ageMin: 8, ageMax: 9, durationSeconds: 90, male: [25, 30], female: [25, 30] },
  { key: 'u12', label: 'Дети 10–11 лет', ageMin: 10, ageMax: 11, durationSeconds: 90, male: [30, 35, 40], female: [30, 35] },
  { key: 'u14', label: 'Дети 12–13 лет', ageMin: 12, ageMax: 13, durationSeconds: 90, male: [40, 45, 50, 55], female: [40, 47] },
  { key: 'cadet', label: 'Кадеты 14–15 лет', ageMin: 14, ageMax: 15, durationSeconds: 120, male: [52, 57, 63, 70], female: [47, 54] },
  { key: 'junior', label: 'Юниоры 16–17 лет', ageMin: 16, ageMax: 17, durationSeconds: 120, male: [55, 61, 68, 76], female: [48, 53, 59, 66] },
  { key: 'u21', label: 'U21: 18–20 лет', ageMin: 18, ageMax: 20, durationSeconds: 180, male: [60, 67, 75, 84], female: [50, 55, 61, 68] },
  { key: 'senior', label: 'Взрослые 18+', ageMin: 18, ageMax: null, durationSeconds: 180, male: [60, 67, 75, 84], female: [50, 55, 61, 68] }
];

let seq = 0;
const newId = () => `cat-${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Builds kata + kumite categories (both genders) for the chosen age groups. */
export function buildWkfSet(tournamentId: string, groupKeys: string[], fee: number, opts: { kata: boolean; kumite: boolean; teamKata?: boolean }): EventCategory[] {
  const out: EventCategory[] = [];
  for (const g of WKF_AGE_GROUPS.filter((x) => groupKeys.includes(x.key))) {
    for (const gender of ['male', 'female'] as const) {
      const base = { tournamentId, gender, ageMin: g.ageMin, ageMax: g.ageMax, fee, durationSeconds: g.durationSeconds };
      if (opts.kata) out.push({ ...base, id: newId(), discipline: 'kata', weightMin: null, weightMax: null, durationSeconds: 240 });
      if (opts.teamKata) out.push({ ...base, id: newId(), discipline: 'team_kata', weightMin: null, weightMax: null, durationSeconds: 300, fee: fee * 3 });
      if (opts.kumite) {
        const limits = gender === 'male' ? g.male : g.female;
        let prev: number | null = null;
        for (const max of limits) {
          out.push({ ...base, id: newId(), discipline: 'kumite', weightMin: prev, weightMax: max });
          prev = max;
        }
        out.push({ ...base, id: newId(), discipline: 'kumite', weightMin: prev, weightMax: null });
      }
    }
  }
  return out;
}

export const newCategoryId = newId;

/** Entries of a category that take part in the draw. */
export const activeEntries = (participants: Participant[], categoryId: string) =>
  participants.filter((p) => p.categoryId === categoryId && p.status !== 'withdrawn' && p.status !== 'disqualified');
