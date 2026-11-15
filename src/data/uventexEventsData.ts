import { Tournament } from '../types/schema';

export type EventActionType = 
  | 'info' 
  | 'categories_prices' 
  | 'brackets' 
  | 'results' 
  | 'medals' 
  | 'live_scoring';

export interface DivisionItem {
  id: string;
  code: string;
  name: string;
  categoryType: 'forms' | 'sparring' | 'weapons' | 'extreme' | 'para';
  ageGroup: string;
  beltRank: string;
  gender: 'Male' | 'Female' | 'Mixed';
  price: number;
  participantsCount: number;
  scheduledTime: string;
  ring: string;
}

export interface RingScheduleGroup {
  ringId: string;
  ringName: string;
  day: string;
  divisions: DivisionItem[];
}

export interface MedalReportRow {
  rank: number;
  name: string;
  type: 'club' | 'federation' | 'country';
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
}

export interface UventexEventItem extends Tournament {
  emblemType: string;
  locationLabel: string;
  dateLabel: string;
  logoSvg?: string;
  accentColor?: string;
  availableActions: EventActionType[];
  days?: string[];
  priceTiers?: { label: string; dateRange: string; fee: number; isCurrent?: boolean }[];
  ringsCount?: number;
  divisions?: DivisionItem[];
  ringsSchedule?: RingScheduleGroup[];
  medalsReport?: MedalReportRow[];
}

// ---------------------------------------------------------------------------
// DEMO DATA — example tournaments in Kyrgyzstan.
// All events, clubs and numbers below are fictional examples for testing the site.
// Replace them with real tournaments from the admin panel.
// ---------------------------------------------------------------------------

const div = (
  id: string,
  code: string,
  name: string,
  categoryType: DivisionItem['categoryType'],
  ageGroup: string,
  beltRank: string,
  gender: DivisionItem['gender'],
  price: number,
  participantsCount: number,
  scheduledTime: string,
  ring: string
): DivisionItem => ({ id, code, name, categoryType, ageGroup, beltRank, gender, price, participantsCount, scheduledTime, ring });

const DEMO_DIVISIONS: DivisionItem[] = [
  div('d1', 'KA-U10-M', 'Ката · Мальчики 8–9 лет · Цветные пояса', 'forms', '8–9 лет', 'Цветные пояса', 'Male', 1500, 14, '09:30', 'Татами 1'),
  div('d2', 'KA-U10-F', 'Ката · Девочки 8–9 лет · Цветные пояса', 'forms', '8–9 лет', 'Цветные пояса', 'Female', 1500, 11, '10:10', 'Татами 1'),
  div('d3', 'KU-U12-M30', 'Кумитэ · Мальчики 10–11 лет · −30 кг', 'sparring', '10–11 лет', 'Все пояса', 'Male', 1500, 9, '10:40', 'Татами 2'),
  div('d4', 'KU-U12-M35', 'Кумитэ · Мальчики 10–11 лет · −35 кг', 'sparring', '10–11 лет', 'Все пояса', 'Male', 1500, 12, '11:15', 'Татами 2'),
  div('d5', 'KU-U12-F', 'Кумитэ · Девочки 10–11 лет · −32 кг', 'sparring', '10–11 лет', 'Все пояса', 'Female', 1500, 7, '11:50', 'Татами 2'),
  div('d6', 'KA-CAD-M', 'Ката · Кадеты 14–15 лет · Юноши', 'forms', '14–15 лет', 'Все пояса', 'Male', 2000, 10, '12:30', 'Татами 3'),
  div('d7', 'KU-CAD-M57', 'Кумитэ · Кадеты 14–15 лет · Юноши −57 кг', 'sparring', '14–15 лет', 'Все пояса', 'Male', 2000, 13, '13:10', 'Татами 3'),
  div('d8', 'KU-CAD-F54', 'Кумитэ · Кадеты 14–15 лет · Девушки −54 кг', 'sparring', '14–15 лет', 'Все пояса', 'Female', 2000, 8, '13:50', 'Татами 3'),
  div('d9', 'KU-JUN-M68', 'Кумитэ · Юниоры 16–17 лет · −68 кг', 'sparring', '16–17 лет', 'Все пояса', 'Male', 2000, 11, '14:30', 'Татами 4'),
  div('d10', 'KU-SEN-M75', 'Кумитэ · Взрослые 18+ · Мужчины −75 кг', 'sparring', '18+', 'Чёрный пояс', 'Male', 2500, 9, '15:10', 'Татами 4'),
  div('d11', 'KA-SEN-F', 'Ката · Взрослые 18+ · Женщины', 'forms', '18+', 'Чёрный пояс', 'Female', 2500, 6, '15:50', 'Татами 1'),
  div('d12', 'TEAM-KA', 'Командное ката · Смешанные команды', 'forms', 'Все возрасты', 'Все пояса', 'Mixed', 3000, 5, '16:30', 'Татами 1')
];

const DEMO_RINGS: RingScheduleGroup[] = [1, 2, 3, 4].map((n) => ({
  ringId: `ring${n}`,
  ringName: `Татами ${n}`,
  day: 'Суббота',
  divisions: DEMO_DIVISIONS.filter((d) => d.ring === `Татами ${n}`)
}));

const DEMO_MEDALS: MedalReportRow[] = [
  { rank: 1, name: 'СК «Тигр» (Бишкек)', type: 'club', gold: 9, silver: 6, bronze: 7, total: 22, points: 46 },
  { rank: 2, name: 'Клуб «Ала-Тоо» (Ош)', type: 'club', gold: 7, silver: 8, bronze: 5, total: 20, points: 42 },
  { rank: 3, name: 'Додзё «Самурай» (Каракол)', type: 'club', gold: 6, silver: 5, bronze: 8, total: 19, points: 36 },
  { rank: 4, name: 'СК «Манас» (Бишкек)', type: 'club', gold: 4, silver: 6, bronze: 6, total: 16, points: 30 },
  { rank: 5, name: 'Клуб «Барс» (Джалал-Абад)', type: 'club', gold: 3, silver: 4, bronze: 7, total: 14, points: 24 },
  { rank: 1, name: 'г. Бишкек', type: 'federation', gold: 15, silver: 13, bronze: 14, total: 42, points: 85 },
  { rank: 2, name: 'Ошская область', type: 'federation', gold: 9, silver: 10, bronze: 8, total: 27, points: 55 },
  { rank: 3, name: 'Иссык-Кульская область', type: 'federation', gold: 7, silver: 6, bronze: 9, total: 22, points: 42 },
  { rank: 4, name: 'Чуйская область', type: 'federation', gold: 5, silver: 6, bronze: 6, total: 17, points: 33 },
  { rank: 1, name: 'Кыргызстан', type: 'country', gold: 30, silver: 28, bronze: 31, total: 89, points: 177 },
  { rank: 2, name: 'Казахстан', type: 'country', gold: 8, silver: 9, bronze: 7, total: 24, points: 49 },
  { rank: 3, name: 'Узбекистан', type: 'country', gold: 5, silver: 6, bronze: 8, total: 19, points: 35 },
  { rank: 4, name: 'Таджикистан', type: 'country', gold: 2, silver: 3, bronze: 4, total: 9, points: 17 }
];

const MONTHS = ['янв.', 'февр.', 'март', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
const ruDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d} ${y}`;
};

const IMAGES = [
  '/src/assets/images/karate_tatami_arena_1793821750724.jpg',
  '/src/assets/images/karate_kumite_match_1793821751076.jpg',
  '/src/assets/images/championship_podium_1794135363745.jpg',
  '/src/assets/images/martial_arts_action_1794135363457.jpg',
  '/src/assets/images/martial_arts_arena_1794135363803.jpg'
];

interface DemoEventInput {
  id: string;
  title: string;
  city: string;
  region: string;
  venueName: string;
  organization: string;
  league: string;
  startDate: string;
  endDate: string;
  rulesType: 'wkf' | 'skif';
  athleteCount: number;
  clubCount: number;
  tatamiCount: number;
  description: string;
  accentColor: string;
  completed?: boolean;
  image: number;
}

const ALL_ACTIONS: EventActionType[] = ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring'];

const makeDemoEvent = (e: DemoEventInput): UventexEventItem => ({
  id: e.id,
  title: e.title,
  slug: e.id,
  locationLabel: e.region === `г. ${e.city}` ? `Кыргызстан, ${e.city}` : `Кыргызстан, ${e.region}, ${e.city}`,
  dateLabel: `${ruDate(e.startDate)} - ${ruDate(e.endDate)}`,
  startDate: e.startDate,
  endDate: e.endDate,
  city: e.city,
  country: 'Кыргызстан',
  venueName: e.venueName,
  organization: e.organization,
  league: e.league,
  sportType: 'Спортивное каратэ',
  rulesType: e.rulesType,
  status: e.completed ? 'completed' : 'registration_open',
  isRegistrationOpen: !e.completed,
  athleteCount: e.athleteCount,
  clubCount: e.clubCount,
  tatamiCount: e.tatamiCount,
  registrationDeadline: e.startDate,
  imageUrl: IMAGES[e.image % IMAGES.length],
  bannerUrl: IMAGES[e.image % IMAGES.length],
  description: e.description,
  disciplines: ['Индивидуальное ката', 'Индивидуальное кумитэ', 'Командное ката'],
  scheduleSummary: [],
  emblemType: 'kg',
  accentColor: e.accentColor,
  availableActions: ALL_ACTIONS,
  days: e.startDate === e.endDate ? ['Суббота'] : ['Суббота', 'Воскресенье'],
  priceTiers: [
    { label: 'Ранняя регистрация', dateRange: 'до 30 дней до старта', fee: 1500 },
    { label: 'Стандартная регистрация', dateRange: 'до дня мандатной комиссии', fee: 2000, isCurrent: true }
  ],
  divisions: DEMO_DIVISIONS,
  ringsSchedule: DEMO_RINGS,
  medalsReport: DEMO_MEDALS
});

export const UVENTEX_SCREENSHOT_EVENTS: UventexEventItem[] = [
  makeDemoEvent({
    id: 'kg-bishkek-cup-2026', title: 'Кубок города Бишкек по каратэ WKF 2026', city: 'Бишкек', region: 'г. Бишкек',
    venueName: 'Спорткомплекс (пример)', organization: 'Федерация каратэ г. Бишкек (пример)', league: 'Городской турнир',
    startDate: '2026-11-28', endDate: '2026-11-29', rulesType: 'wkf', athleteCount: 320, clubCount: 24, tatamiCount: 4,
    description: 'Открытый кубок столицы для детей, кадетов, юниоров и взрослых. Ката и кумитэ по правилам WKF.',
    accentColor: '#1f5fa8', image: 0
  }),
  makeDemoEvent({
    id: 'kg-osh-open-2026', title: 'Открытый турнир г. Ош среди детей и юношей', city: 'Ош', region: 'Ошская обл.',
    venueName: 'Спортивный зал (пример)', organization: 'Клуб «Ала-Тоо» (пример)', league: 'Детско-юношеский турнир',
    startDate: '2026-12-05', endDate: '2026-12-05', rulesType: 'wkf', athleteCount: 180, clubCount: 15, tatamiCount: 3,
    description: 'Турнир для спортсменов 6–15 лет. Отличный старт сезона для начинающих.',
    accentColor: '#c0392b', image: 1
  }),
  makeDemoEvent({
    id: 'kg-national-championship-2026', title: 'Чемпионат Кыргызской Республики по каратэ 2026', city: 'Бишкек', region: 'г. Бишкек',
    venueName: 'Дворец спорта (пример)', organization: 'Национальная федерация каратэ (пример)', league: 'Национальный чемпионат',
    startDate: '2026-12-12', endDate: '2026-12-13', rulesType: 'wkf', athleteCount: 450, clubCount: 38, tatamiCount: 4,
    description: 'Главный старт сезона: кадеты, юниоры и взрослые. Отбор в сборную страны.',
    accentColor: '#b8860b', image: 2
  }),
  makeDemoEvent({
    id: 'kg-karakol-kata-2027', title: 'Турнир по ката «Каракол 2027»', city: 'Каракол', region: 'Иссык-Кульская обл.',
    venueName: 'Спортшкола (пример)', organization: 'Додзё «Самурай» (пример)', league: 'Областной турнир',
    startDate: '2027-01-23', endDate: '2027-01-23', rulesType: 'wkf', athleteCount: 120, clubCount: 11, tatamiCount: 2,
    description: 'Турнир только по ката: индивидуальные и командные выступления, электронное судейство.',
    accentColor: '#16806a', image: 3
  }),
  makeDemoEvent({
    id: 'kg-jalal-abad-youth-2027', title: 'Первенство Джалал-Абадской области среди юношей', city: 'Джалал-Абад', region: 'Джалал-Абадская обл.',
    venueName: 'Спорткомплекс (пример)', organization: 'Клуб «Барс» (пример)', league: 'Областное первенство',
    startDate: '2027-02-20', endDate: '2027-02-21', rulesType: 'wkf', athleteCount: 210, clubCount: 17, tatamiCount: 3,
    description: 'Областное первенство для юношей и девушек 10–17 лет.',
    accentColor: '#6d4bb3', image: 4
  }),
  makeDemoEvent({
    id: 'kg-talas-cup-2027', title: 'Кубок Таласа по каратэ', city: 'Талас', region: 'Таласская обл.',
    venueName: 'Спортивный зал (пример)', organization: 'Федерация каратэ Таласа (пример)', league: 'Областной турнир',
    startDate: '2027-03-21', endDate: '2027-03-21', rulesType: 'wkf', athleteCount: 140, clubCount: 12, tatamiCount: 2,
    description: 'Весенний кубок к празднику Нооруз для всех возрастов.',
    accentColor: '#1f7a3a', image: 0
  }),
  makeDemoEvent({
    id: 'kg-issyk-kul-cup-2027', title: 'Кубок Иссык-Куля по традиционному каратэ', city: 'Чолпон-Ата', region: 'Иссык-Кульская обл.',
    venueName: 'Спортбаза (пример)', organization: 'Ассоциация традиционного каратэ (пример)', league: 'Летний кубок',
    startDate: '2027-06-19', endDate: '2027-06-20', rulesType: 'skif', athleteCount: 260, clubCount: 21, tatamiCount: 4,
    description: 'Летний международный кубок на берегу Иссык-Куля по правилам SKIF (Shobu Ippon).',
    accentColor: '#0e7490', image: 1
  }),
  makeDemoEvent({
    id: 'kg-naryn-cup-2026', title: 'Кубок Нарына 2026', city: 'Нарын', region: 'Нарынская обл.',
    venueName: 'Спортивный зал (пример)', organization: 'Клуб «Тянь-Шань» (пример)', league: 'Областной турнир',
    startDate: '2026-10-10', endDate: '2026-10-10', rulesType: 'wkf', athleteCount: 95, clubCount: 9, tatamiCount: 2,
    description: 'Завершённый турнир — пример архива с результатами и медальным зачётом.',
    accentColor: '#475569', completed: true, image: 2
  }),
  makeDemoEvent({
    id: 'kg-bishkek-juniors-2026', title: 'Первенство Бишкека среди юниоров 2026', city: 'Бишкек', region: 'г. Бишкек',
    venueName: 'Спорткомплекс (пример)', organization: 'Федерация каратэ г. Бишкек (пример)', league: 'Городское первенство',
    startDate: '2026-09-19', endDate: '2026-09-20', rulesType: 'wkf', athleteCount: 230, clubCount: 19, tatamiCount: 3,
    description: 'Завершённый турнир — пример архива с результатами и медальным зачётом.',
    accentColor: '#475569', completed: true, image: 3
  })
];
