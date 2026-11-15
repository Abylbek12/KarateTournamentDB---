import { Tournament } from '../types/schema';
import { Language } from './translations';

export interface LocalizedTournamentContent {
  title: string;
  organization: string;
  venueName: string;
  city: string;
  country: string;
  description: string;
  disciplines: string[];
  scheduleSummary: {
    time: string;
    title: string;
    stage: string;
    tatamiNumber?: number;
  }[];
}

export const TOURNAMENT_TRANSLATIONS: Record<string, Partial<Record<Language, LocalizedTournamentContent>>> = {
  t1: {
    ru: {
      title: 'Открытый Международный Кубок Единоборств 2026',
      organization: 'Национальная Федерация Спортивных Единоборств',
      venueName: 'Дворец Единоборств им. И. Ярыгина',
      city: 'Бишкек',
      country: 'Кыргызстан',
      description: 'Главный открытый осенний турнир национального календаря. Поединки по международным правилам Кумитэ и Ката во всех возрастных дивизионах (от 10 лет до ветеранов). Электронное судейство, разведение одноклубников в сетках и прямая трансляция.',
      disciplines: [
        'Индивидуальное Кумитэ (-60, -67, -75, -84, +84 кг)',
        'Индивидуальное Ката (Мужчины / Женщины)',
        'Командное Кумитэ (5+2)',
        'Кадеты и Юниоры 14-17 лет'
      ],
      scheduleSummary: [
        { time: '08:00 - 09:30', title: 'Мандатная комиссия и контрольное взвешивание', stage: 'Проверка документов и допуск' },
        { time: '09:30 - 10:15', title: 'Судейский брифинг ГСК и жеребьевка дивизионов', stage: 'Подготовка протоколов' },
        { time: '10:30 - 11:00', title: 'Торжественная церемония открытия соревнований', stage: 'Парад клубов и гимн' },
        { time: '11:00 - 14:00', title: 'Предварительные поединки (1/16, 1/8, 1/4 финала)', stage: 'Татами 1, 2, 3 (Кумитэ) · Татами 4 (Ката)' },
        { time: '14:00 - 15:30', title: 'Утешительные поединки за бронзу (Repechage)', stage: 'Татами 1-4' },
        { time: '16:00 - 18:00', title: 'Финальный блок за золотые медали и награждение', stage: 'Главный ковер (Татами 1)' }
      ]
    },
    en: {
      title: 'Open International Martial Arts Championship Cup 2026',
      organization: 'National Combat Sports Federation',
      venueName: 'Yarygin Palace of Martial Arts Arena',
      city: 'Bishkek',
      country: 'Kyrgyzstan',
      description: 'Premier national open autumn tournament. Kumite and Kata bouts under international competition regulations across all age divisions (U10 to Masters). Electronic flag voting, club seeding protection, and live multi-tatami broadcast.',
      disciplines: [
        'Individual Kumite (-60, -67, -75, -84, +84 kg)',
        'Individual Kata (Men / Women)',
        'Team Kumite (5+2 Fighters)',
        'Cadets & Juniors 14-17 Years'
      ],
      scheduleSummary: [
        { time: '08:00 - 09:30', title: 'Credentials commission & Official weigh-in', stage: 'Document audit & medical check' },
        { time: '09:30 - 10:15', title: 'Referee council briefing & Smart Seeding Draw', stage: 'Bracket protocols' },
        { time: '10:30 - 11:00', title: 'Grand Opening Ceremony', stage: 'Parade of clubs & anthem' },
        { time: '11:00 - 14:00', title: 'Elimination rounds (1/16, 1/8, 1/4 Finals)', stage: 'Tatamis 1, 2, 3 (Kumite) · Tatami 4 (Kata)' },
        { time: '14:00 - 15:30', title: 'Repechage bronze matches', stage: 'Tatamis 1-4' },
        { time: '16:00 - 18:00', title: 'Gold medal championship finals & Award podium', stage: 'Main Arena (Tatami 1)' }
      ]
    },
    ky: {
      title: 'Жекпе-жек боюнча Ачык Эл аралык Кубок 2026',
      organization: 'Улуттук Спорттук Жекпе-жек Федерациясы',
      venueName: 'И. Ярыгин атындагы Жекпе-жек Сарайы',
      city: 'Бишкек',
      country: 'Кыргызстан',
      description: 'Улуттук календардын башкы күзгү ачык турнири. Бардык курактык дивизиондордо Кумитэ жана Ката боюнча эл аралык эрежелер менен беттештер. Электрондук калыстык жана түз эфир.',
      disciplines: [
        'Жеке Кумитэ (-60, -67, -75, -84, +84 кг)',
        'Жеке Ката (Эркектер / Аялдар)',
        'Командалык Кумитэ (5+2)',
        'Кадеттер жана Юниорлор 14-17 жаш'
      ],
      scheduleSummary: [
        { time: '08:00 - 09:30', title: 'Мандаттык комиссия жана салмак текшерүү', stage: 'Документтерди текшерүү жана уруксат' },
        { time: '09:30 - 10:15', title: 'Калыстар брифинги жана чүчүкулак', stage: 'Протоколдорду даярдоо' },
        { time: '10:30 - 11:00', title: 'Мелдештин салтанаттуу ачылыш аземи', stage: 'Клубдар парады жана гимн' },
        { time: '11:00 - 14:00', title: 'Алдын ала беттештер (1/16, 1/8, 1/4 финал)', stage: 'Татами 1, 2, 3 (Кумитэ) · Татами 4 (Ката)' },
        { time: '14:00 - 15:30', title: 'Коло медаль үчүн беттештер (Repechage)', stage: 'Татами 1-4' },
        { time: '16:00 - 18:00', title: 'Алтын медаль үчүн финалдык беттештер жана сыйлоо', stage: 'Башкы килем (Татами 1)' }
      ]
    }
  },
  t2: {
    ru: {
      title: 'Традиционный турнир по боевым искусствам «Кубок Северо-Запада»',
      organization: 'Федерация Традиционных Единоборств',
      venueName: 'СК «Юбилейный» (Малая Арена)',
      city: 'Ош',
      country: 'Кыргызстан',
      description: 'Традиционное первенство по классическому стилю. Регламент поединков Shobu Ippon и Shobu Sanbon с акцентом на чистоту техники, Тодоме-ваза, Дзёгай и традиционные ката.',
      disciplines: [
        'Традиционное Shobu Ippon (Мужчины / Женщины)',
        'Традиционное Shobu Sanbon (Юноши 14-17 лет)',
        'Классическое Ката мастеров (Хэйан, Бассай-дай, Канку-дай)',
        'Абсолютная весовая категория (Open Weight)'
      ],
      scheduleSummary: [
        { time: '09:00 - 10:00', title: 'Регистрация представителей и проверка будо-паспортов', stage: 'Мандатная комиссия' },
        { time: '10:00 - 12:30', title: 'Соревнования по Ката во всех возрастных дивизионах', stage: 'Татами 1, 2, 3' },
        { time: '12:30 - 13:00', title: 'Технический перерыв и показательные выступления мастеров', stage: 'Главная площадка' },
        { time: '13:00 - 16:30', title: 'Поединки Shobu Ippon и Sanbon', stage: 'Татами 1-3' },
        { time: '17:00 - 18:00', title: 'Награждение призеров и вручение кубков лучших клубов', stage: 'Подиум' }
      ]
    },
    en: {
      title: 'Traditional Martial Arts Championship "North-West Cup"',
      organization: 'Traditional Martial Arts Federation',
      venueName: 'Yubileyny Sports Complex (Small Arena)',
      city: 'Osh',
      country: 'Kyrgyzstan',
      description: 'Traditional championship in classical martial arts. Shobu Ippon and Shobu Sanbon match rules emphasizing technique decisiveness, Todome-waza, Jogai, and traditional kata.',
      disciplines: [
        'Traditional Shobu Ippon (Men / Women)',
        'Traditional Shobu Sanbon (Youth 14-17 years)',
        'Classic Master Kata (Heian, Bassai-Dai, Kanku-Dai)',
        'Open Weight Division'
      ],
      scheduleSummary: [
        { time: '09:00 - 10:00', title: 'Representatives check-in & Budo passport verification', stage: 'Credentials committee' },
        { time: '10:00 - 12:30', title: 'Kata competitions across all divisions', stage: 'Tatamis 1, 2, 3' },
        { time: '12:30 - 13:00', title: 'Technical recess and master demonstrations', stage: 'Main arena' },
        { time: '13:00 - 16:30', title: 'Shobu Ippon & Sanbon bouts', stage: 'Tatamis 1-3' },
        { time: '17:00 - 18:00', title: 'Award ceremony & best club trophies', stage: 'Podium' }
      ]
    }
  },
  t3: {
    ru: {
      title: 'Всероссийский юношеский турнир «Кубок Поволжья»',
      organization: 'Ассоциация боевых искусств Поволжья',
      venueName: 'Центр единоборств Поволжской Академии',
      city: 'Каракол',
      country: 'Кыргызстан',
      description: 'Масштабный турнир среди детей, кадетов и юниоров (10-17 лет). Полное разведение соклубников и земляков в сетках, электронное онлайн-табло, отбор в региональные сборные.',
      disciplines: [
        'Дети 10-11 лет (Кумитэ и Ката)',
        'Кадеты 14-15 лет (-52, -57, -63, -70, +70 кг)',
        'Юниоры 16-17 лет (-55, -61, -68, -76, +76 кг)',
        'Командное Ката среди детских школ'
      ],
      scheduleSummary: [
        { time: '08:30 - 10:00', title: 'Электронный чек-ин и медицинский допуск', stage: 'Входная зона' },
        { time: '10:00 - 13:00', title: 'Дивизионы U10 и U12 (Кумитэ и Ката)', stage: 'Татами 1-4' },
        { time: '13:30 - 17:00', title: 'Поединки Кадетов и Юниоров', stage: 'Татами 1-4' },
        { time: '17:30 - 18:30', title: 'Торжественное награждение победителей и тренеров', stage: 'Подиум арены' }
      ]
    },
    en: {
      title: 'All-Russian Youth Tournament "Volga Cup"',
      organization: 'Volga Martial Arts Association',
      venueName: 'Volga Academy Combat Sports Center',
      city: 'Karakol',
      country: 'Kyrgyzstan',
      description: 'Large-scale tournament for youth, cadets and juniors (10-17 years). Automated club and city separation in brackets, live tatami scoring, and squad qualification.',
      disciplines: [
        'Children 10-11 years (Kumite & Kata)',
        'Cadets 14-15 years (-52, -57, -63, -70, +70 кг)',
        'Juniors 16-17 years (-55, -61, -68, -76, +76 кг)',
        'Team Kata among youth academies'
      ],
      scheduleSummary: [
        { time: '08:30 - 10:00', title: 'Electronic check-in & medical clearance', stage: 'Concourse' },
        { time: '10:00 - 13:00', title: 'U10 & U12 divisions (Kumite & Kata)', stage: 'Tatamis 1-4' },
        { time: '13:30 - 17:00', title: 'Cadet & Junior bouts', stage: 'Tatamis 1-4' },
        { time: '17:30 - 18:30', title: 'Award ceremony for champions and coaches', stage: 'Arena podium' }
      ]
    }
  }
};

/**
 * Returns a localized tournament object dynamically based on active language.
 * Guarantees zero latency and instant reactive UI updates.
 */
export function getLocalizedTournament(tournament: Tournament, language: Language = 'ru'): Tournament {
  const customLocalization = TOURNAMENT_TRANSLATIONS[tournament.id]?.[language];
  if (!customLocalization) {
    return tournament;
  }

  return {
    ...tournament,
    title: customLocalization.title || tournament.title,
    organization: customLocalization.organization || tournament.organization,
    venueName: customLocalization.venueName || tournament.venueName,
    city: customLocalization.city || tournament.city,
    country: customLocalization.country || tournament.country,
    description: customLocalization.description || tournament.description,
    disciplines: customLocalization.disciplines || tournament.disciplines,
    scheduleSummary: customLocalization.scheduleSummary || tournament.scheduleSummary
  };
}
