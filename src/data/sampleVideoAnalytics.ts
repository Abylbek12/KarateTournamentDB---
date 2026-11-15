import { KeyMoment, FederationAnalyticsReport } from '../types/schema';

export const SAMPLE_KEY_MOMENTS: Record<string, KeyMoment[]> = {
  b1: [
    {
      id: 'km-1',
      boutId: 'b1',
      timestampSeconds: 24,
      displayTime: '00:24',
      title: 'YUKO (1 балл) + SENSHU — Встречный Gyaku-tsuki',
      type: 'score_yuko',
      competitor: 'aka',
      athleteName: 'Алиев Руслан',
      athleteClub: 'СК «Тигр» (Бишкек)',
      techniqueName: 'Gyaku-tsuki',
      targetZone: 'Chudan (Корпус)',
      speedMps: 12.8,
      reactionMs: 172,
      refereeFlags: { k1: true, k2: true, k3: false, k4: true, consensus: '3 из 4 судей (Консенсус)' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 98.4,
      notes: 'Чистый прямой удар обратной рукой в корпус на опережении атаки соперника. Открыт счет поединка (Senshu присужден Ака).'
    },
    {
      id: 'km-2',
      boutId: 'b1',
      timestampSeconds: 58,
      displayTime: '00:58',
      title: 'WAZA-ARI (2 балла) — Круговой удар ногой Chudan Geri',
      type: 'score_wazaari',
      competitor: 'ao',
      athleteName: 'Жумабеков Бакыт',
      athleteClub: 'КБИ «Барс» (Ош)',
      techniqueName: 'Mawashi-geri',
      targetZone: 'Chudan (Корпус)',
      speedMps: 16.4,
      reactionMs: 210,
      refereeFlags: { k1: true, k2: true, k3: true, k4: true, consensus: '4 из 4 судей (Единогласно)' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 99.1,
      notes: 'Удар дальней ногой под локоть соперника в печень. Рефери зафиксировал Waza-ari, Ао вышел вперёд 2:1.'
    },
    {
      id: 'km-3',
      boutId: 'b1',
      timestampSeconds: 85,
      displayTime: '01:25',
      title: 'ПРЕДУПРЕЖДЕНИЕ C2 — Выход за площадку (Jogai)',
      type: 'warning_c2',
      competitor: 'aka',
      athleteName: 'Алиев Руслан',
      athleteClub: 'СК «Тигр» (Бишкек)',
      targetZone: 'Tatami Out (Jogai)',
      speedMps: 3.2,
      reactionMs: 0,
      refereeFlags: { k1: true, k2: true, k3: true, k4: true, consensus: 'Зафиксировано рефери и 3 судьями' },
      criteriaAudit: {
        goodForm: false,
        sportingAttitude: true,
        zanshin: false,
        properTiming: false,
        correctDistance: false,
        vigorousApplication: false
      },
      aiConfidence: 97.5,
      notes: 'Спортсмен Ака вышел двумя ногами за пределы 8-метровой боевой зоны татами без атакующего действия.'
    },
    {
      id: 'km-4',
      boutId: 'b1',
      timestampSeconds: 108,
      displayTime: '01:48',
      title: 'ВИДЕОПОВТОР VR (Челлендж тренера Ака) — Uraken-uchi Jodan',
      type: 'vr_challenge_aka',
      competitor: 'aka',
      athleteName: 'Алиев Руслан',
      athleteClub: 'СК «Тигр» (Бишкек)',
      techniqueName: 'Uraken-uchi',
      targetZone: 'Jodan (Голова)',
      speedMps: 14.1,
      reactionMs: 165,
      refereeFlags: { k1: false, k2: true, k3: true, k4: false, consensus: 'Изначально 2 флага, пересмотр ГСК' },
      vrOutcome: {
        requestedBy: 'aka',
        technique: 'Uraken-uchi в висок',
        confirmed: true,
        rulingText: 'ЧЕЛЛЕНДЖ УДОВЛЕТВОРЁН: На камере 2 зафиксирован четкий контакт без избыточной силы (Skin-touch). Балл YUKO присужден Ака, карточка тренера сохранена.'
      },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 95.8,
      notes: 'Судейская видеокомиссия ГСК подтвердила результативное касание перчаткой. Счет сравнялся 2:2.'
    },
    {
      id: 'km-5',
      boutId: 'b1',
      timestampSeconds: 135,
      displayTime: '02:15',
      title: 'YUKO (1 балл) — Быстрый джеб Kizami-tsuki',
      type: 'score_yuko',
      competitor: 'ao',
      athleteName: 'Жумабеков Бакыт',
      athleteClub: 'КБИ «Барс» (Ош)',
      techniqueName: 'Kizami-tsuki',
      targetZone: 'Jodan (Голова)',
      speedMps: 13.6,
      reactionMs: 154,
      refereeFlags: { k1: true, k2: false, k3: true, k4: true, consensus: '3 из 4 судей' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 98.0,
      notes: 'Молниеносный удар передней рукой при смещении под правую руку соперника. Счет 3:2 в пользу Ао.'
    },
    {
      id: 'km-6',
      boutId: 'b1',
      timestampSeconds: 162,
      displayTime: '02:42',
      title: 'IPPON (3 балла) — Подсечка Ashi-Barai + добивание Gyaku-tsuki',
      type: 'score_ippon',
      competitor: 'aka',
      athleteName: 'Алиев Руслан',
      athleteClub: 'СК «Тигр» (Бишкек)',
      techniqueName: 'Ashi-barai + Tsuki',
      targetZone: 'Ashi (Подсечка)',
      speedMps: 15.2,
      reactionMs: 188,
      refereeFlags: { k1: true, k2: true, k3: true, k4: true, consensus: '4 из 4 судей (IPPON)' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 99.6,
      notes: 'Безупречная подсечка под опорную ногу Ао, соперник потерял баланс и упал на спину; Ака мгновенно нанес контрольный удар с демонстрацией Zanshin. Ака выходит вперед 5:3!'
    },
    {
      id: 'km-7',
      boutId: 'b1',
      timestampSeconds: 172,
      displayTime: '02:52',
      title: 'DOCTOR TIME (80 секунд) — Осмотр носового кровотечения Ао',
      type: 'doctor_timeout',
      competitor: 'doctor',
      athleteName: 'Жумабеков Бакыт',
      athleteClub: 'КБИ «Барс» (Ош)',
      targetZone: 'Med Zone',
      speedMps: 0,
      reactionMs: 0,
      refereeFlags: { k1: false, k2: false, k3: false, k4: false, consensus: 'Остановка рефери по травме' },
      criteriaAudit: {
        goodForm: false,
        sportingAttitude: true,
        zanshin: false,
        properTiming: false,
        correctDistance: false,
        vigorousApplication: false
      },
      aiConfidence: 100,
      notes: 'Врач соревнований провел обработку носовой полости за 38 секунд. Спортсмен допущен к продолжению боя.'
    }
  ],
  b2: [
    {
      id: 'km-21',
      boutId: 'b2',
      timestampSeconds: 32,
      displayTime: '00:32',
      title: 'YUKO (1 балл) — Gyaku-tsuki Chudan',
      type: 'score_yuko',
      competitor: 'aka',
      athleteName: 'Мамытов Эмир',
      athleteClub: 'СШОР «Вымпел» (Каракол)',
      techniqueName: 'Gyaku-tsuki',
      targetZone: 'Chudan (Корпус)',
      speedMps: 11.9,
      reactionMs: 195,
      refereeFlags: { k1: true, k2: true, k3: false, k4: true, consensus: '3 из 4 судей' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 96.2,
      notes: 'Точная контратака в живот при сближении соперника.'
    },
    {
      id: 'km-22',
      boutId: 'b2',
      timestampSeconds: 78,
      displayTime: '01:18',
      title: 'IPPON (3 балла) — Ura-Mawashi-Geri Jodan (Вертушка)',
      type: 'score_ippon',
      competitor: 'ao',
      athleteName: 'Сыдыков Адилет',
      athleteClub: 'СК «Тянь-Шань» (Кант)',
      techniqueName: 'Ura-mawashi-geri',
      targetZone: 'Jodan (Голова)',
      speedMps: 17.8,
      reactionMs: 168,
      refereeFlags: { k1: true, k2: true, k3: true, k4: true, consensus: '4 из 4 судей' },
      criteriaAudit: {
        goodForm: true,
        sportingAttitude: true,
        zanshin: true,
        properTiming: true,
        correctDistance: true,
        vigorousApplication: true
      },
      aiConfidence: 99.4,
      notes: 'Скрытый круговой удар пяткой в голову с разворота. Чистый Ippon (3 балла)!'
    }
  ]
};

export const SAMPLE_FEDERATION_REPORT: FederationAnalyticsReport = {
  reportId: 'FED-REP-2026-SPORTS-001',
  tournamentId: 't1',
  tournamentTitle: 'Открытый Международный Кубок Единоборств 2026',
  organization: 'Национальная Федерация Спортивных Единоборств',
  city: 'Бишкек',
  generatedAt: '2026-11-06T18:30:00Z',
  chiefReferee: 'Турдубаев В.И. (Судья международной категории)',
  technicalDelegate: 'Миронов А.П. (Технический делегат Федерации)',
  totalBoutsAnalyzed: 148,
  totalAthletes: 248,
  totalClubs: 14,
  scoringDistribution: {
    totalPoints: 612,
    yukoCount: 398,
    wazaAriCount: 84,
    ipponCount: 46,
    yukoPct: 65.0,
    wazaAriPct: 27.5,
    ipponPct: 7.5,
    topTechniques: [
      { name: 'Gyaku-tsuki (Корпус/Голова)', count: 284, pct: 46.4 },
      { name: 'Kizami-tsuki (Передний джеб)', count: 114, pct: 18.6 },
      { name: 'Mawashi-geri Chudan (Нога в корпус)', count: 72, pct: 11.8 },
      { name: 'Ura-mawashi-geri Jodan (Вертушка)', count: 32, pct: 5.2 },
      { name: 'Ashi-barai + Tsuki (Подсечка с добиванием)', count: 28, pct: 4.6 },
      { name: 'Uraken-uchi (Удар тыльной стороной кулака)', count: 48, pct: 7.8 },
      { name: 'Ushiro-geri Chudan (Удар ногой назад)', count: 14, pct: 2.3 }
    ]
  },
  disciplinaryAnalytics: {
    c1WarningsCount: 94,
    c2WarningsCount: 182,
    hansokuCount: 3,
    shikkakuCount: 0,
    mostCommonInfraction: 'Категория 2: Выход за площадку (Jogai) — 48% от всех штрафов'
  },
  refereeingAccuracy: {
    vrChallengesTotal: 28,
    vrChallengesOverturned: 18,
    vrChallengesUpheld: 10,
    overturnRatePct: 64.3,
    flagConsensusRatioPct: 94.8,
    averageReviewDurationSec: 32.4
  },
  safetyAndMedical: {
    doctorTimeoutsCount: 16,
    averageDoctorDurationSec: 46.2,
    kikenCount: 2,
    primaryInjuryZone: 'Носовые капиллярные кровотечения и ушибы плюсневых суставов'
  },
  clubRankings: [
    {
      rank: 1,
      clubName: 'СК «Тигр»',
      city: 'Бишкек',
      athletesCount: 32,
      gold: 6,
      silver: 4,
      bronze: 5,
      totalMedals: 15,
      pointsScore: 98,
      efficiencyRating: 3.06
    },
    {
      rank: 2,
      clubName: 'КБИ «Барс»',
      city: 'Ош',
      athletesCount: 28,
      gold: 4,
      silver: 5,
      bronze: 4,
      totalMedals: 13,
      pointsScore: 82,
      efficiencyRating: 2.93
    },
    {
      rank: 3,
      clubName: 'СШОР «Вымпел»',
      city: 'Каракол',
      athletesCount: 24,
      gold: 3,
      silver: 2,
      bronze: 6,
      totalMedals: 11,
      pointsScore: 64,
      efficiencyRating: 2.67
    },
    {
      rank: 4,
      clubName: 'СК «Тянь-Шань»',
      city: 'Кант',
      athletesCount: 20,
      gold: 2,
      silver: 3,
      bronze: 3,
      totalMedals: 8,
      pointsScore: 48,
      efficiencyRating: 2.40
    },
    {
      rank: 5,
      clubName: 'Академия «Тигр»',
      city: 'Джалал-Абад',
      athletesCount: 18,
      gold: 2,
      silver: 1,
      bronze: 4,
      totalMedals: 7,
      pointsScore: 42,
      efficiencyRating: 2.33
    }
  ],
  executiveAiSummary: `Соревнования «Открытый Международный Кубок Единоборств 2026» прошли в строгом соответствии с международным регламентом спортивных соревнований. 
Зафиксирована высокая результативность: в среднем 4.14 балла за поединок. В тактической структуре преобладает техника опережения Gyaku-tsuki (46.4%), при этом возросла эффективность сложных ударов ногами в голову (Ura-mawashi-geri) в финальных стадиях.
Внедренная система судейских видеоповторов (VR) доказала высокую объективность: среднее время рассмотрения апелляции тренера составило 32.4 секунды, что позволило сохранить плотный соревновательный тайминг на всех 4 татами без задержек. Медицинский регламент «Doctor 80s Time» обеспечил безопасность атлетов: ни одного случая превышения лимита времени оказания помощи не зафиксировано.`,
  recommendations: [
    'Тренерскому составу: усилить отработку контроля дистанции в концовках раундов для снижения нарушений Категории 2 (Jogai выходы).',
    'Судейской коллегии: продолжить практику калибровки порога касания Skin-touch в возрастной группе 14-15 лет (Кадеты).',
    'Оргкомитету: тиражировать автоматизированную систему онлайн-видеоаналитики и протоколов на все региональные этапы сезона 2026/2027.'
  ]
};
