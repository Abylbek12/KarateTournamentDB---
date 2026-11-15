import { AppNotification, PaymentTransaction, AcquiringStats } from '../types/schema';

export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Вызов на Татами №1',
    message: 'Финал Мужчины св. 84 кг: Ака — Абдыкадыров Данияр (Сётокан), Ао — Жумабеков Арсений (Тигр). Готовность 2 минуты.',
    category: 'tatami',
    severity: 'urgent',
    timestamp: '14:42:10',
    isRead: false,
    tatamiNumber: 1,
    boutId: 'b1',
    actionTab: 'scoreboard',
    actionLabel: 'Открыть табло Татами 1',
    soundAlert: true
  },
  {
    id: 'notif-2',
    title: 'Медицинский таймаут: Doctor 80s',
    message: 'Татами №3: Остановлен поединок. Врач вызван к спортсмену Ковалеву М. (подозрение на носовое кровотечение). Таймер запущен.',
    category: 'medical',
    severity: 'critical',
    timestamp: '14:38:45',
    isRead: false,
    tatamiNumber: 3,
    boutId: 'b3',
    actionTab: 'doctor',
    actionLabel: 'Модуль Doctor 80s',
    soundAlert: true
  },
  {
    id: 'notif-3',
    title: 'Оплата взносов подтверждена (СБП)',
    message: 'Клуб «Сётокан Профи» оплатил стартовые взносы за 14 спортсменов на сумму 49 000 сом. Чек ФД №49102 сформирован.',
    category: 'payment',
    severity: 'info',
    timestamp: '14:30:12',
    isRead: false,
    actionTab: 'acquiring',
    actionLabel: 'Смотреть платеж'
  },
  {
    id: 'notif-4',
    title: 'Видеоповтор VR / Челлендж тренера',
    message: 'Татами №2: Тренер клуба «Барс» запросил VR-челлендж (Критерий: Иппон удар ногой в голову Джёдан). ГСК проводит ревью.',
    category: 'referee',
    severity: 'warning',
    timestamp: '14:24:00',
    isRead: true,
    tatamiNumber: 2,
    boutId: 'b2',
    actionTab: 'referee_vr',
    actionLabel: 'Панель VR судейства'
  },
  {
    id: 'notif-5',
    title: 'Завершено взвешивание категории',
    message: 'Мандатная комиссия: Категория Юниоры 16-17 лет до 68 кг полностью взвешена. Допущено 18 спортсменов, 0 дисквалификаций.',
    category: 'schedule',
    severity: 'info',
    timestamp: '14:10:30',
    isRead: true,
    actionTab: 'doctor',
    actionLabel: 'Протокол допуска'
  },
  {
    id: 'notif-6',
    title: 'Оперативное оповещение ГСК',
    message: 'Внимание судьям татами: Совещание судейской коллегии по обновлению регламента соревнований состоится в перерыве в 15:30 в зале брифинга.',
    category: 'system',
    severity: 'warning',
    timestamp: '13:50:00',
    isRead: true,
    actionTab: 'protocols',
    actionLabel: 'Судейские протоколы'
  }
];

export const SAMPLE_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'tx-1001',
    orderNumber: 'ORD-2026-0914',
    tournamentId: 't1',
    participantId: 'p1',
    participantName: 'Абдыкадыров Данияр',
    clubId: 'c1',
    clubName: 'СК «Сётокан Профи»',
    amountRub: 3500,
    feeCategory: 'athlete_entry',
    paymentMethod: 'sbp_qr',
    status: 'paid',
    createdAt: '2026-11-06T10:14:00Z',
    paidAt: '2026-11-06T10:14:42Z',
    fiscalReceiptNumber: 'ФД-00049102',
    fiscalSign: '9841029412',
    payerName: 'Абдыкадыров Данияр Сергеевич',
    payerEmail: 'd.ivanov@shotokan-pro.ru',
    payerPhone: '+996 (916) 555-01-22',
    categoryName: 'Мужчины 18+ лет, св. 84 кг',
    description: 'Стартовый взнос за участие в соревнованиях по кумитэ'
  },
  {
    id: 'tx-1002',
    orderNumber: 'ORD-2026-0915',
    tournamentId: 't1',
    participantId: 'p2',
    participantName: 'Жумабеков Арсений',
    clubId: 'c2',
    clubName: 'Каратэ-клуб «Тигр»',
    amountRub: 3500,
    feeCategory: 'athlete_entry',
    paymentMethod: 'card',
    status: 'paid',
    createdAt: '2026-11-06T10:30:00Z',
    paidAt: '2026-11-06T10:31:15Z',
    fiscalReceiptNumber: 'ФД-00049103',
    fiscalSign: '1249812401',
    payerName: 'Жумабекова Елена Викторовна',
    payerEmail: 'e.smirnova@mail.ru',
    payerPhone: '+996 (921) 444-11-99',
    categoryName: 'Мужчины 18+ лет, св. 84 кг',
    description: 'Стартовый взнос за участие в соревнованиях по кумитэ (МИР •••• 4812)'
  },
  {
    id: 'tx-1003',
    orderNumber: 'ORD-2026-0916',
    tournamentId: 't1',
    clubId: 'c3',
    clubName: 'Академия боевых искусств «Барс»',
    amountRub: 42000,
    feeCategory: 'team_entry',
    paymentMethod: 'club_invoice',
    status: 'paid',
    createdAt: '2026-11-05T14:00:00Z',
    paidAt: '2026-11-05T16:20:00Z',
    fiscalReceiptNumber: 'СЧ-2026/11-084',
    fiscalSign: '4481029519',
    payerName: 'ООО «Академия Барс» (ИНН 7701928410)',
    payerEmail: 'finance@bars-academy.ru',
    payerPhone: '+996 (495) 780-99-00',
    description: 'Оплата заявки команды: 12 атлетов + страховка и аккредитация 2 тренеров'
  },
  {
    id: 'tx-1004',
    orderNumber: 'ORD-2026-0917',
    tournamentId: 't1',
    participantId: 'p3',
    participantName: 'Мамытов Михаил',
    clubId: 'c1',
    clubName: 'СК «Сётокан Профи»',
    amountRub: 3500,
    feeCategory: 'athlete_entry',
    paymentMethod: 'tpay',
    status: 'paid',
    createdAt: '2026-11-06T11:05:00Z',
    paidAt: '2026-11-06T11:05:30Z',
    fiscalReceiptNumber: 'ФД-00049104',
    fiscalSign: '3391058201',
    payerName: 'Мамытов Михаил',
    payerEmail: 'kovalev.m@gmail.com',
    payerPhone: '+996 (903) 123-45-67',
    categoryName: 'Мужчины 18+ лет, до 75 кг',
    description: 'Оплата взноса через T-Pay (быстрая авторизация)'
  },
  {
    id: 'tx-1005',
    orderNumber: 'ORD-2026-0918',
    tournamentId: 't1',
    participantId: 'p4',
    participantName: 'Асанов Руслан',
    clubId: 'c4',
    clubName: 'ДЮСШ «Тигр»',
    amountRub: 4250,
    feeCategory: 'athlete_entry',
    paymentMethod: 'sbp_qr',
    status: 'pending',
    createdAt: '2026-11-06T14:15:00Z',
    payerName: 'Асанов Руслан Дмитриевич',
    payerEmail: 'r.alekseev@samurai-do.org',
    payerPhone: '+996 (977) 654-32-10',
    categoryName: 'Юниоры 16-17 лет, до 68 кг',
    description: 'Стартовый взнос + спортивная страховка на 3 дня соревнований'
  },
  {
    id: 'tx-1006',
    orderNumber: 'ORD-2026-0919',
    tournamentId: 't1',
    participantId: 'p5',
    participantName: 'Сыдыков Бектур',
    clubId: 'c2',
    clubName: 'Каратэ-клуб «Тигр»',
    amountRub: 3500,
    feeCategory: 'athlete_entry',
    paymentMethod: 'cash_mandate',
    status: 'paid',
    createdAt: '2026-11-06T09:00:00Z',
    paidAt: '2026-11-06T09:05:00Z',
    fiscalReceiptNumber: 'ФД-00049100',
    fiscalSign: '7729103829',
    payerName: 'Сыдыков Бектур (в кассу комиссии)',
    payerEmail: 'vasiliev.k@tiger-karate.ru',
    payerPhone: '+996 (905) 888-22-11',
    categoryName: 'Мужчины 18+ лет, св. 84 кг',
    description: 'Оплата взноса наличными при очном взвешивании на мандатной комиссии'
  },
  {
    id: 'tx-1007',
    orderNumber: 'ORD-2026-0920',
    tournamentId: 't1',
    participantId: 'p6',
    participantName: 'Сулайманов Адилет',
    clubId: 'c3',
    clubName: 'Академия боевых искусств «Барс»',
    amountRub: 3500,
    feeCategory: 'athlete_entry',
    paymentMethod: 'card',
    status: 'refunded',
    createdAt: '2026-11-05T12:00:00Z',
    paidAt: '2026-11-05T12:02:00Z',
    fiscalReceiptNumber: 'ВОЗВ-000012',
    fiscalSign: '5510293810',
    payerName: 'Сулайманова Ольга Сергеевна',
    payerEmail: 'o.morozova@yandex.ru',
    payerPhone: '+996 (985) 333-22-11',
    categoryName: 'Юниоры 16-17 лет, до 76 кг',
    description: 'Возврат взноса по справке о болезни до жеребьевки турнира'
  }
];

export const INITIAL_ACQUIRING_STATS: AcquiringStats = {
  totalRevenueRub: 59700,
  paidCount: 5,
  pendingCount: 1,
  refundedCount: 1,
  collectionRatePct: 91.5,
  averageFeeRub: 3650,
  sbpSharePct: 45,
  cardSharePct: 35,
  invoiceSharePct: 20
};

// Web Audio API Synth for clean tournament acoustic alert pings
export function playNotificationSound(type: 'urgent' | 'chime' | 'success' | 'warning' = 'chime') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'urgent') {
      // Double urgent beep (Tatami summon / Medical)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'success') {
      // Pleasant payment success chime (major third)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(370, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Standard gentle bell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy until user gesture
  }
}
