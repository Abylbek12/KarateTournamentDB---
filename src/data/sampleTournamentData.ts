import { 
  User, 
  Club, 
  AgeCategory, 
  WeightCategory, 
  TournamentCategory, 
  Participant, 
  Tatami, 
  Bout,
  Tournament
} from '../types/schema';

export const SAMPLE_CLUBS: Club[] = [
  { id: 'c1', name: 'СК "Тигр"', shortCode: 'SMR', city: 'Бишкек', region: 'г. Бишкек', headCoachName: 'Асанов Бакыт Таалайбекович', contactPhone: '+996 (495) 123-45-67', athleteCount: 18 },
  { id: 'c2', name: 'Клуб "Ала-Тоо"', shortCode: 'BSD', city: 'Ош', region: 'Ошская обл.', headCoachName: 'Мамытов Улан Кубанычбекович', contactPhone: '+996 (812) 987-65-43', athleteCount: 14 },
  { id: 'c3', name: 'СК "Манас"', shortCode: 'OLM', city: 'Каракол', region: 'Иссык-Кульская обл.', headCoachName: 'Токтогулов Эрлан Маратович', contactPhone: '+996 (843) 555-12-34', athleteCount: 12 },
  { id: 'c4', name: 'Клуб "Барс"', shortCode: 'TRN', city: 'Кант', region: 'Чуйская обл.', headCoachName: 'Исаков Нурбек Жыргалбекович', contactPhone: '+996 (343) 222-33-44', athleteCount: 10 },
  { id: 'c5', name: 'СК "Тянь-Шань"', shortCode: 'VST', city: 'Джалал-Абад', region: 'Джалал-Абадская обл.', headCoachName: 'Сулайманов Азамат Бакытович', contactPhone: '+996 (383) 777-88-99', athleteCount: 8 }
];

export const SAMPLE_USERS: User[] = [
  { id: 'u1', email: 'chief.referee@karate-fed.ru', fullName: 'Эсенбаев Адилет Геннадьевич', phone: '+996 (916) 111-22-33', role: 'chief_referee', licenseCode: 'INT-REF-0104', refereeCategory: 'international_a', isActive: true, createdAt: '2026-01-10' },
  { id: 'u2', email: 'tatami1.ref@karate-fed.ru', fullName: 'Суханов Бакыт Олегович', phone: '+996 (926) 222-33-44', role: 'tatami_referee', licenseCode: 'INT-REF-0288', refereeCategory: 'international_b', isActive: true, createdAt: '2026-01-15' },
  { id: 'u3', email: 'tatami2.ref@karate-fed.ru', fullName: 'Касымов Игорь Васильевич', phone: '+996 (903) 333-44-55', role: 'tatami_referee', licenseCode: 'RUS-REF-1490', refereeCategory: 'national_1', isActive: true, createdAt: '2026-02-01' },
  { id: 'u4', email: 'scorekeeper1@karate-fed.ru', fullName: 'Романова Айгерим Павловна', phone: '+996 (915) 444-55-66', role: 'scorekeeper', isActive: true, createdAt: '2026-02-10' },
  { id: 'u5', email: 'scorekeeper2@karate-fed.ru', fullName: 'Ильин Эмир Сергеевич', phone: '+996 (918) 555-66-77', role: 'scorekeeper', isActive: true, createdAt: '2026-02-10' },
  { id: 'u6', email: 'coach.smr@samurai.club', fullName: 'Асанов Бакыт Таалайбекович', phone: '+996 (495) 123-45-67', role: 'club_coach', clubId: 'c1', isActive: true, createdAt: '2026-01-20' },
  { id: 'u7', email: 'doctor@sportsmed.ru', fullName: 'Д-р Федорова Анна Викторовна', phone: '+996 (905) 888-99-00', role: 'medical_officer', licenseCode: 'MED-SP-992', isActive: true, createdAt: '2026-01-05' }
];

export const SAMPLE_AGE_CATEGORIES: AgeCategory[] = [
  { id: 'ac1', name: 'Дети 8-9 лет', code: 'U10', minAge: 8, maxAge: 9, matchDurationSeconds: 90 },
  { id: 'ac2', name: 'Дети 10-11 лет', code: 'U12', minAge: 10, maxAge: 11, matchDurationSeconds: 90 },
  { id: 'ac3', name: 'Кадеты 14-15 лет', code: 'CADET_14_15', minAge: 14, maxAge: 15, matchDurationSeconds: 120 },
  { id: 'ac4', name: 'Юниоры 16-17 лет', code: 'JUNIOR_16_17', minAge: 16, maxAge: 17, matchDurationSeconds: 120 },
  { id: 'ac5', name: 'Взрослые 18-34 года', code: 'SENIOR_18_PLUS', minAge: 18, maxAge: 34, matchDurationSeconds: 180 },
  { id: 'ac6', name: 'Мастера / Ветераны 35+', code: 'MASTERS_35_PLUS', minAge: 35, maxAge: null, matchDurationSeconds: 120 }
];

export const SAMPLE_WEIGHT_CATEGORIES: WeightCategory[] = [
  // Взрослые Мужчины (ac5)
  { id: 'wc_m_60', ageCategoryId: 'ac5', gender: 'male', name: '-60 кг', minWeightKg: 0, maxWeightKg: 60.00, isOpenWeight: false },
  { id: 'wc_m_67', ageCategoryId: 'ac5', gender: 'male', name: '-67 кг', minWeightKg: 60.01, maxWeightKg: 67.00, isOpenWeight: false },
  { id: 'wc_m_75', ageCategoryId: 'ac5', gender: 'male', name: '-75 кг', minWeightKg: 67.01, maxWeightKg: 75.00, isOpenWeight: false },
  { id: 'wc_m_84', ageCategoryId: 'ac5', gender: 'male', name: '-84 кг', minWeightKg: 75.01, maxWeightKg: 84.00, isOpenWeight: false },
  { id: 'wc_m_plus84', ageCategoryId: 'ac5', gender: 'male', name: '+84 кг', minWeightKg: 84.01, maxWeightKg: null, isOpenWeight: false },
  // Взрослые Женщины (ac5)
  { id: 'wc_f_50', ageCategoryId: 'ac5', gender: 'female', name: '-50 кг', minWeightKg: 0, maxWeightKg: 50.00, isOpenWeight: false },
  { id: 'wc_f_55', ageCategoryId: 'ac5', gender: 'female', name: '-55 кг', minWeightKg: 50.01, maxWeightKg: 55.00, isOpenWeight: false },
  { id: 'wc_f_61', ageCategoryId: 'ac5', gender: 'female', name: '-61 кг', minWeightKg: 55.01, maxWeightKg: 61.00, isOpenWeight: false },
  { id: 'wc_f_68', ageCategoryId: 'ac5', gender: 'female', name: '-68 кг', minWeightKg: 61.01, maxWeightKg: 68.00, isOpenWeight: false },
  { id: 'wc_f_plus68', ageCategoryId: 'ac5', gender: 'female', name: '+68 кг', minWeightKg: 68.01, maxWeightKg: null, isOpenWeight: false },
  // Кадеты Юноши (ac3)
  { id: 'wc_cad_52', ageCategoryId: 'ac3', gender: 'male', name: '-52 кг', minWeightKg: 0, maxWeightKg: 52.00, isOpenWeight: false },
  { id: 'wc_cad_57', ageCategoryId: 'ac3', gender: 'male', name: '-57 кг', minWeightKg: 52.01, maxWeightKg: 57.00, isOpenWeight: false },
  { id: 'wc_cad_63', ageCategoryId: 'ac3', gender: 'male', name: '-63 кг', minWeightKg: 57.01, maxWeightKg: 63.00, isOpenWeight: false },
  { id: 'wc_cad_70', ageCategoryId: 'ac3', gender: 'male', name: '-70 кг', minWeightKg: 63.01, maxWeightKg: 70.00, isOpenWeight: false },
  { id: 'wc_cad_plus70', ageCategoryId: 'ac3', gender: 'male', name: '+70 кг', minWeightKg: 70.01, maxWeightKg: null, isOpenWeight: false }
];

export const SAMPLE_TATAMIS: Tatami[] = [
  { id: 't1', tournamentId: 'tourn1', number: 1, name: 'Татами №1 (Центральное)', locationZone: 'Главная арена, Сектор A', status: 'active', currentBoutId: 'b1' },
  { id: 't2', tournamentId: 'tourn1', number: 2, name: 'Татами №2', locationZone: 'Главная арена, Сектор B', status: 'active', currentBoutId: 'b3' },
  { id: 't3', tournamentId: 'tourn1', number: 3, name: 'Татами №3', locationZone: 'Тренировочный манеж, Сектор C', status: 'ready' },
  { id: 't4', tournamentId: 'tourn1', number: 4, name: 'Татами №4 (Ката)', locationZone: 'Малый зал, Сектор D', status: 'ready' }
];

export const SAMPLE_TOURNAMENT_CATEGORIES: TournamentCategory[] = [
  { id: 'tc1', tournamentId: 'tourn1', ageCategoryId: 'ac5', weightCategoryId: 'wc_m_75', discipline: 'kumite', gender: 'male', bracketType: 'olympic_with_repechage', assignedTatamiId: 't1', ageCategoryName: 'Взрослые 18-34 года', weightCategoryName: '-75 кг', participantsCount: 16 },
  { id: 'tc2', tournamentId: 'tourn1', ageCategoryId: 'ac5', weightCategoryId: 'wc_m_67', discipline: 'kumite', gender: 'male', bracketType: 'olympic_with_repechage', assignedTatamiId: 't1', ageCategoryName: 'Взрослые 18-34 года', weightCategoryName: '-67 кг', participantsCount: 12 },
  { id: 'tc3', tournamentId: 'tourn1', ageCategoryId: 'ac5', weightCategoryId: 'wc_f_55', discipline: 'kumite', gender: 'female', bracketType: 'olympic_with_repechage', assignedTatamiId: 't2', ageCategoryName: 'Взрослые 18-34 года', weightCategoryName: '-55 кг', participantsCount: 8 },
  { id: 'tc4', tournamentId: 'tourn1', ageCategoryId: 'ac3', weightCategoryId: 'wc_cad_63', discipline: 'kumite', gender: 'male', bracketType: 'olympic_with_repechage', assignedTatamiId: 't3', ageCategoryName: 'Кадеты 14-15 лет', weightCategoryName: '-63 кг', participantsCount: 14 },
  { id: 'tc5', tournamentId: 'tourn1', ageCategoryId: 'ac5', discipline: 'kata', gender: 'male', bracketType: 'olympic_direct_elimination', assignedTatamiId: 't4', ageCategoryName: 'Взрослые 18-34 года', weightCategoryName: 'Индивидуальное Ката', participantsCount: 10 }
];

export const SAMPLE_PARTICIPANTS: Participant[] = [
  { id: 'p1', tournamentId: 'tourn1', clubId: 'c1', clubName: 'СК "Тигр"', city: 'Бишкек', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Данияр', lastName: 'Абдыкадыров', gender: 'male', birthDate: '2001-05-14', beltRank: 'black_2dan', declaredWeightKg: 74.2, actualWeightKg: 74.1, isWeighedIn: true, isMedicalCleared: true, status: 'competing', licenseNumber: 'KGZ-KRT-8842' },
  { id: 'p2', tournamentId: 'tourn1', clubId: 'c2', clubName: 'Клуб "Ала-Тоо"', city: 'Ош', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Адилет', lastName: 'Жумабеков', gender: 'male', birthDate: '2000-11-20', beltRank: 'black_1dan', declaredWeightKg: 74.8, actualWeightKg: 74.6, isWeighedIn: true, isMedicalCleared: true, status: 'competing', licenseNumber: 'KGZ-KRT-7731' },
  { id: 'p3', tournamentId: 'tourn1', clubId: 'c3', clubName: 'СК "Манас"', city: 'Каракол', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Тимур', lastName: 'Каримов', gender: 'male', birthDate: '2002-03-08', beltRank: 'black_1dan', declaredWeightKg: 73.5, actualWeightKg: 73.4, isWeighedIn: true, isMedicalCleared: true, status: 'competing', licenseNumber: 'KGZ-KRT-6620' },
  { id: 'p4', tournamentId: 'tourn1', clubId: 'c4', clubName: 'Клуб "Барс"', city: 'Кант', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Эмир', lastName: 'Бакиров', gender: 'male', birthDate: '1999-09-17', beltRank: 'black_2dan', declaredWeightKg: 74.9, actualWeightKg: 74.9, isWeighedIn: true, isMedicalCleared: true, status: 'competing', licenseNumber: 'KGZ-KRT-9951' },
  { id: 'p5', tournamentId: 'tourn1', clubId: 'c5', clubName: 'СК "Тянь-Шань"', city: 'Джалал-Абад', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Нурсултан', lastName: 'Сыдыков', gender: 'male', birthDate: '2001-08-12', beltRank: 'brown_1kyu', declaredWeightKg: 73.8, actualWeightKg: 73.8, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'KGZ-KRT-1144' },
  { id: 'p6', tournamentId: 'tourn1', clubId: 'c1', clubName: 'СК "Тигр"', city: 'Бишкек', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Руслан', lastName: 'Алиев', gender: 'male', birthDate: '2003-01-28', beltRank: 'brown_1kyu', declaredWeightKg: 74.5, actualWeightKg: 74.3, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'KGZ-KRT-1255' },
  { id: 'p7', tournamentId: 'tourn1', clubId: 'c2', clubName: 'Клуб "Ала-Тоо"', city: 'Ош', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Бектур', lastName: 'Кадыров', gender: 'male', birthDate: '2000-04-03', beltRank: 'black_1dan', declaredWeightKg: 74.0, actualWeightKg: 74.0, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'KGZ-KRT-1366' },
  { id: 'p8', tournamentId: 'tourn1', clubId: 'c3', clubName: 'СК "Манас"', city: 'Каракол', country: 'Кыргызстан', categoryId: 'tc1', firstName: 'Дастан', lastName: 'Иманалиев', gender: 'male', birthDate: '2002-10-15', beltRank: 'brown_1kyu', declaredWeightKg: 73.2, actualWeightKg: 73.1, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'KGZ-KRT-1477' },
  { id: 'p9', tournamentId: 'tourn1', clubId: 'c1', clubName: 'СК "Тигр"', city: 'Бишкек', country: 'Кыргызстан', categoryId: 'tc3', firstName: 'Айпери', lastName: 'Касымова', gender: 'female', birthDate: '2003-02-11', beltRank: 'brown_1kyu', declaredWeightKg: 54.3, actualWeightKg: 54.0, isWeighedIn: true, isMedicalCleared: true, status: 'competing', licenseNumber: 'KGZ-KRT-4412' },
  { id: 'p10', tournamentId: 'tourn1', clubId: 'c2', clubName: 'Клуб "Ала-Тоо"', city: 'Ош', country: 'Кыргызстан', categoryId: 'tc3', firstName: 'Айзада', lastName: 'Турдубаева', gender: 'female', birthDate: '2004-07-25', beltRank: 'black_1dan', declaredWeightKg: 54.8, actualWeightKg: 54.5, isWeighedIn: true, isMedicalCleared: true, status: 'competing', licenseNumber: 'KGZ-KRT-5521' },
  { id: 'p11', tournamentId: 'tourn1', clubId: 'c5', clubName: 'СК "Тянь-Шань"', city: 'Джалал-Абад', country: 'Кыргызстан', categoryId: 'tc4', firstName: 'Эржан', lastName: 'Мамбетов', gender: 'male', birthDate: '2011-04-19', beltRank: 'green_6kyu', declaredWeightKg: 61.2, actualWeightKg: 61.0, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'KGZ-KRT-3309' },
  { id: 'p12', tournamentId: 'tourn1', clubId: 'c3', clubName: 'СК "Манас"', city: 'Каракол', country: 'Кыргызстан', categoryId: 'tc4', firstName: 'Ислам', lastName: 'Усенов', gender: 'male', birthDate: '2011-08-30', beltRank: 'blue_4kyu', declaredWeightKg: 62.5, actualWeightKg: null, isWeighedIn: false, isMedicalCleared: true, status: 'registered', licenseNumber: 'KGZ-KRT-2218' },
  { id: 'p13', tournamentId: 'tourn1', clubId: 'c4', clubName: 'Клуб "Барс"', city: 'Алматы', country: 'Казахстан', categoryId: 'tc1', firstName: 'Нурлан', lastName: 'Амангельды', gender: 'male', birthDate: '2001-09-03', beltRank: 'black_1dan', declaredWeightKg: 74.3, actualWeightKg: 74.0, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'KAZ-KRT-9011' },
  { id: 'p14', tournamentId: 'tourn1', clubId: 'c2', clubName: 'Клуб "Ала-Тоо"', city: 'Ташкент', country: 'Узбекистан', categoryId: 'tc1', firstName: 'Шахзод', lastName: 'Рахимов', gender: 'male', birthDate: '2002-12-05', beltRank: 'brown_1kyu', declaredWeightKg: 74.7, actualWeightKg: 74.4, isWeighedIn: true, isMedicalCleared: true, status: 'draw_seeded', licenseNumber: 'UZB-KRT-4420' }
];

export const SAMPLE_BOUTS: Bout[] = [
  {
    id: 'b1',
    tournamentId: 'tourn1',
    categoryId: 'tc1',
    categoryName: 'Взрослые 18+ · Мужчины · Кумитэ -75 кг',
    tatamiId: 't1',
    tatamiNumber: 1,
    boutNumber: 104,
    roundStage: 'semi_final',
    bracketPosition: 1,
    akaParticipantId: 'p1',
    akaParticipant: SAMPLE_PARTICIPANTS[0], // Данияр Абдыкадыров (Самурай)
    aoParticipantId: 'p2',
    aoParticipant: SAMPLE_PARTICIPANTS[1],  // Адилет Жумабеков (Бусидо)
    scheduledTime: '12:30',
    actualStartTime: '12:32',
    akaScore: 3,
    aoScore: 2,
    akaSenshu: true,
    aoSenshu: false,
    akaPenaltiesC1: 1,
    aoPenaltiesC1: 2,
    akaPenaltiesC2: 0,
    aoPenaltiesC2: 1,
    status: 'in_progress',
    timerSecondsRemaining: 48,
    events: [
      { id: 'e1', boutId: 'b1', matchSecond: 155, competitorColor: 'aka', participantId: 'p1', eventType: 'yuko_1', points: 1, timestamp: '12:33:05' },
      { id: 'e2', boutId: 'b1', matchSecond: 155, competitorColor: 'aka', participantId: 'p1', eventType: 'senshu', points: 0, timestamp: '12:33:06' },
      { id: 'e3', boutId: 'b1', matchSecond: 110, competitorColor: 'ao', participantId: 'p2', eventType: 'waza_ari_2', points: 2, timestamp: '12:34:10' },
      { id: 'e4', boutId: 'b1', matchSecond: 72, competitorColor: 'aka', participantId: 'p1', eventType: 'waza_ari_2', points: 2, timestamp: '12:34:58' }
    ]
  },
  {
    id: 'b2',
    tournamentId: 'tourn1',
    categoryId: 'tc1',
    categoryName: 'Взрослые 18+ · Мужчины · Кумитэ -75 кг',
    tatamiId: 't1',
    tatamiNumber: 1,
    boutNumber: 105,
    roundStage: 'semi_final',
    bracketPosition: 2,
    akaParticipantId: 'p3',
    akaParticipant: SAMPLE_PARTICIPANTS[2], // Тимур Каримов (Олимп)
    aoParticipantId: 'p4',
    aoParticipant: SAMPLE_PARTICIPANTS[3],  // Эмир Бакиров (Торнадо)
    scheduledTime: '12:45',
    akaScore: 0,
    aoScore: 0,
    akaSenshu: false,
    aoSenshu: false,
    akaPenaltiesC1: 0,
    aoPenaltiesC1: 0,
    akaPenaltiesC2: 0,
    aoPenaltiesC2: 0,
    status: 'scheduled',
    timerSecondsRemaining: 180
  },
  {
    id: 'b3',
    tournamentId: 'tourn1',
    categoryId: 'tc3',
    categoryName: 'Взрослые 18+ · Женщины · Кумитэ -55 кг',
    tatamiId: 't2',
    tatamiNumber: 2,
    boutNumber: 202,
    roundStage: 'final',
    bracketPosition: 1,
    akaParticipantId: 'p5',
    akaParticipant: SAMPLE_PARTICIPANTS[4], // Айпери Касымова (Самурай)
    aoParticipantId: 'p6',
    aoParticipant: SAMPLE_PARTICIPANTS[5],  // Айзада Турдубаева (Бусидо)
    scheduledTime: '12:35',
    actualStartTime: '12:36',
    akaScore: 1,
    aoScore: 4,
    akaSenshu: false,
    aoSenshu: true,
    akaPenaltiesC1: 0,
    aoPenaltiesC1: 1,
    akaPenaltiesC2: 1,
    aoPenaltiesC2: 0,
    status: 'in_progress',
    timerSecondsRemaining: 94
  },
  {
    id: 'b4',
    tournamentId: 'tourn1',
    categoryId: 'tc1',
    categoryName: 'Взрослые 18+ · Мужчины · Кумитэ -75 кг',
    tatamiId: 't1',
    tatamiNumber: 1,
    boutNumber: 101,
    roundStage: 'quarter_final',
    bracketPosition: 1,
    akaParticipantId: 'p1',
    akaParticipant: SAMPLE_PARTICIPANTS[0],
    scheduledTime: '11:40',
    actualStartTime: '11:42',
    actualEndTime: '11:46',
    akaScore: 5,
    aoScore: 1,
    akaSenshu: true,
    aoSenshu: false,
    akaPenaltiesC1: 0,
    aoPenaltiesC1: 1,
    akaPenaltiesC2: 1,
    aoPenaltiesC2: 0,
    winnerId: 'p1',
    winReason: 'points_lead',
    status: 'completed',
    timerSecondsRemaining: 0
  },
  {
    id: 'b5',
    tournamentId: 'tourn1',
    categoryId: 'tc4',
    categoryName: 'Кадеты 14-15 лет · Юноши · Кумитэ -63 кг',
    tatamiId: 't3',
    tatamiNumber: 3,
    boutNumber: 301,
    roundStage: 'round_1_8',
    bracketPosition: 1,
    akaParticipantId: 'p7',
    akaParticipant: SAMPLE_PARTICIPANTS[6],
    scheduledTime: '13:00',
    akaScore: 0,
    aoScore: 0,
    akaSenshu: false,
    aoSenshu: false,
    akaPenaltiesC1: 0,
    aoPenaltiesC1: 0,
    akaPenaltiesC2: 0,
    aoPenaltiesC2: 0,
    status: 'scheduled',
    timerSecondsRemaining: 120
  },
  // Kata match sample (tc5)
  {
    id: 'b6',
    tournamentId: 'tourn1',
    categoryId: 'tc5',
    categoryName: 'Взрослые 18+ · Мужчины · Индивидуальное Ката',
    discipline: 'kata',
    tatamiId: 't4',
    tatamiNumber: 4,
    boutNumber: 401,
    roundStage: 'final',
    bracketPosition: 1,
    akaParticipantId: 'p1',
    akaParticipant: SAMPLE_PARTICIPANTS[0],
    aoParticipantId: 'p2',
    aoParticipant: SAMPLE_PARTICIPANTS[1],
    scheduledTime: '15:30',
    actualStartTime: '15:32',
    actualEndTime: '15:42',
    akaScore: 25,
    aoScore: 24,
    akaKataScore: 25.4,
    aoKataScore: 24.8,
    kataNameAka: 'Anan (Анан)',
    kataNameAo: 'Chatanyara Kushanku (Тятаяра Кусянку)',
    akaSenshu: false,
    aoSenshu: false,
    akaPenaltiesC1: 0,
    aoPenaltiesC1: 0,
    akaPenaltiesC2: 0,
    aoPenaltiesC2: 0,
    winnerId: 'p1',
    winReason: 'points_lead',
    status: 'completed',
    timerSecondsRemaining: 0,
    refereeProtocolId: 'prot_kata_01'
  }
];


export const SAMPLE_TOURNAMENT_CLUBS = [
  {
    id: 'tc_c1_t1',
    tournamentId: 'tourn1',
    clubId: 'c1',
    clubName: 'СК "Тигр"',
    teamLeaderName: 'Асанов В. С. (ЗТР)',
    athletesDeclaredCount: 18,
    athletesAdmittedCount: 18,
    status: 'accredited' as const,
    feePaid: true,
    registeredAt: '2026-03-25'
  },
  {
    id: 'tc_c2_t1',
    tournamentId: 'tourn1',
    clubId: 'c2',
    clubName: 'Клуб "Ала-Тоо"',
    teamLeaderName: 'Мамытов М. Д.',
    athletesDeclaredCount: 14,
    athletesAdmittedCount: 14,
    status: 'accredited' as const,
    feePaid: true,
    registeredAt: '2026-03-26'
  },
  {
    id: 'tc_c3_t1',
    tournamentId: 'tourn1',
    clubId: 'c3',
    clubName: 'СК "Манас"',
    teamLeaderName: 'Токтогулов Р. И.',
    athletesDeclaredCount: 12,
    athletesAdmittedCount: 11,
    status: 'accredited' as const,
    feePaid: true,
    registeredAt: '2026-03-28'
  },
  {
    id: 'tc_c4_t1',
    tournamentId: 'tourn1',
    clubId: 'c4',
    clubName: 'Клуб "Барс"',
    teamLeaderName: 'Исаков А. П.',
    athletesDeclaredCount: 10,
    athletesAdmittedCount: 10,
    status: 'accredited' as const,
    feePaid: true,
    registeredAt: '2026-03-29'
  },
  {
    id: 'tc_c5_t1',
    tournamentId: 'tourn1',
    clubId: 'c5',
    clubName: 'СК "Тянь-Шань"',
    teamLeaderName: 'Сулайманов С. Н.',
    athletesDeclaredCount: 8,
    athletesAdmittedCount: 8,
    status: 'verified' as const,
    feePaid: true,
    registeredAt: '2026-04-01'
  }
];

export const SAMPLE_REFEREE_PROTOCOLS = [
  {
    id: 'prot_01',
    protocolNumber: 'PR-2026-T1-104',
    boutId: 'b1',
    tournamentId: 'tourn1',
    tournamentName: 'Чемпионат Бишкека по единоборствам 2026',
    categoryId: 'tc1',
    categoryName: 'Взрослые 18+ · Мужчины · Кумитэ -75 кг',
    discipline: 'kumite' as const,
    tatamiNumber: 1,
    roundStage: 'semi_final' as const,
    akaParticipantId: 'p1',
    aoParticipantId: 'p2',
    akaParticipantName: 'Абдыкадыров Данияр',
    aoParticipantName: 'Жумабеков Адилет',
    akaClub: 'СК "Тигр"',
    aoClub: 'Клуб "Ала-Тоо"',
    shushinRefereeName: 'Суханов Д. О. (МК-В)',
    kansaArbitratorName: 'Эсенбаев А. Г. (МК-А)',
    fukushinReferees: ['Касымов И. В.', 'Жумабеков В. М.', 'Орлов П. С.', 'Михайлов А. Д.'],
    scoreSummary: '4:2 (АКА + Senshu)',
    winnerName: 'Абдыкадыров Данияр (АКА)',
    winReason: 'Преимущество по очкам (points_lead)',
    videoReviewUsed: true,
    protestFiled: false,
    protestStatus: 'none' as const,
    certifiedAt: '12:28:15',
    notes: 'Видеоповтор VR по запросу тренера АО: оценка Юко для АКА подтверждена единогласно.'
  },
  {
    id: 'prot_02',
    protocolNumber: 'PR-2026-T1-101',
    boutId: 'b4',
    tournamentId: 'tourn1',
    tournamentName: 'Чемпионат Бишкека по единоборствам 2026',
    categoryId: 'tc1',
    categoryName: 'Взрослые 18+ · Мужчины · Кумитэ -75 кг',
    discipline: 'kumite' as const,
    tatamiNumber: 1,
    roundStage: 'quarter_final' as const,
    akaParticipantId: 'p1',
    aoParticipantId: 'p3',
    akaParticipantName: 'Абдыкадыров Данияр',
    aoParticipantName: 'Каримов Тимур',
    akaClub: 'СК "Тигр"',
    aoClub: 'СК "Манас"',
    shushinRefereeName: 'Суханов Д. О. (МК-В)',
    kansaArbitratorName: 'Эсенбаев А. Г. (МК-А)',
    fukushinReferees: ['Касымов И. В.', 'Жумабеков В. М.', 'Орлов П. С.', 'Михайлов А. Д.'],
    scoreSummary: '5:1 (АКА + Senshu)',
    winnerName: 'Абдыкадыров Данияр (АКА)',
    winReason: 'Преимущество по очкам (points_lead)',
    videoReviewUsed: false,
    protestFiled: false,
    protestStatus: 'none' as const,
    certifiedAt: '11:46:30',
    notes: 'Поединок прошел без нарушений регламента.'
  },
  {
    id: 'prot_kata_01',
    protocolNumber: 'PR-2026-T4-K01',
    boutId: 'b6',
    tournamentId: 'tourn1',
    tournamentName: 'Чемпионат Бишкека по единоборствам 2026',
    categoryId: 'tc5',
    categoryName: 'Взрослые 18+ · Мужчины · Индивидуальное Ката',
    discipline: 'kata' as const,
    tatamiNumber: 4,
    roundStage: 'final' as const,
    akaParticipantId: 'p1',
    aoParticipantId: 'p2',
    akaParticipantName: 'Абдыкадыров Данияр',
    aoParticipantName: 'Жумабеков Адилет',
    akaClub: 'СК "Тигр"',
    aoClub: 'Клуб "Ала-Тоо"',
    shushinRefereeName: 'Касымов И. В. (ВК)',
    kansaArbitratorName: 'Эсенбаев А. Г. (МК-А)',
    fukushinReferees: ['Судья 1 (7.6)', 'Судья 2 (7.7)', 'Судья 3 (7.8)', 'Судья 4 (7.5)', 'Судья 5 (7.9)'],
    scoreSummary: '25.4 против 24.8',
    winnerName: 'Абдыкадыров Данияр (Ката "Анан")',
    winReason: 'Высший балл судейской коллегии Ката',
    videoReviewUsed: false,
    protestFiled: false,
    protestStatus: 'none' as const,
    certifiedAt: '15:43:00',
    notes: 'Оценки 7 судей с отбрасыванием крайних баллов: Техника 70% (17.78) + Атлетизм 30% (7.62) = 25.40'
  }
];

export const SAMPLE_KATA_EVALUATIONS = [
  {
    id: 'ke1',
    boutId: 'b6',
    participantId: 'p1',
    participantName: 'Абдыкадыров Данияр',
    clubName: 'СК "Тигр"',
    kataName: 'Anan (Анан)',
    judgeScores: [7.8, 7.6, 8.0, 7.7, 7.9, 7.5, 7.8],
    trimmedMinScore: 7.5,
    trimmedMaxScore: 8.0,
    technicalScore: 17.78,
    athleticScore: 7.62,
    totalScore: 25.40,
    rank: 1
  },
  {
    id: 'ke2',
    boutId: 'b6',
    participantId: 'p2',
    participantName: 'Жумабеков Адилет',
    clubName: 'Клуб "Ала-Тоо"',
    kataName: 'Chatanyara Kushanku (Тятаяра Кусянку)',
    judgeScores: [7.5, 7.6, 7.8, 7.4, 7.7, 7.3, 7.6],
    trimmedMinScore: 7.3,
    trimmedMaxScore: 7.8,
    technicalScore: 17.36,
    athleticScore: 7.44,
    totalScore: 24.80,
    rank: 2
  }
];

export const SAMPLE_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    title: 'Открытый Международный Кубок Единоборств 2026',
    slug: 'open-martial-arts-cup-2026',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Премьер-Лига Единоборств',
    organization: 'Национальная Федерация Спортивных Единоборств',
    venueName: 'Дворец Единоборств им. И. Ярыгина',
    city: 'Бишкек',
    country: 'Кыргызстан',
    startDate: '2026-11-14',
    endDate: '2026-11-16',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 248,
    clubCount: 22,
    tatamiCount: 4,
    registrationDeadline: '2026-11-10 18:00',
    imageUrl: '/src/assets/images/martial_arts_arena_1794135363803.jpg',
    bannerUrl: '/src/assets/images/martial_arts_arena_1794135363803.jpg',
    description: 'Главный открытый осенний турнир национального календаря. Поединки по международным спортивным правилам Кумитэ и Ката во всех возрастных дивизионах (от 10 лет до ветеранов). Электронное судейство, разведение одноклубников в сетках и прямая трансляция.',
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
  {
    id: 't2',
    title: 'Традиционный турнир по боевым искусствам «Кубок Северо-Запада»',
    slug: 'traditional-northwest-cup-2026',
    rulesType: 'skif',
    sportType: 'Традиционные единоборства',
    league: 'Мировая Серия Мастеров',
    organization: 'Федерация Традиционных Единоборств',
    venueName: 'СК «Юбилейный» (Малая Арена)',
    city: 'Ош',
    country: 'Кыргызстан',
    startDate: '2026-11-28',
    endDate: '2026-11-29',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 164,
    clubCount: 14,
    tatamiCount: 3,
    registrationDeadline: '2026-11-24 20:00',
    imageUrl: '/src/assets/images/martial_arts_action_1794135363457.jpg',
    bannerUrl: '/src/assets/images/martial_arts_action_1794135363457.jpg',
    description: 'Традиционное первенство по классическому стилю. Регламент поединков Shobu Ippon и Shobu Sanbon с акцентом на чистоту техники, Тодоме-ваза, Дзёгай и традиционные формы ката.',
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
  {
    id: 't3',
    title: 'Всероссийский юношеский турнир «Кубок Поволжья»',
    slug: 'volga-cup-youth-2026',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Всероссийская Лига',
    organization: 'Ассоциация боевых искусств Поволжья',
    venueName: 'Центр единоборств Поволжской Академии',
    city: 'Каракол',
    country: 'Кыргызстан',
    startDate: '2026-12-12',
    endDate: '2026-12-14',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 310,
    clubCount: 28,
    tatamiCount: 4,
    registrationDeadline: '2026-12-05 23:59',
    imageUrl: '/src/assets/images/karate_tatami_arena_1793821750724.jpg',
    bannerUrl: '/src/assets/images/karate_tatami_arena_1793821750724.jpg',
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
  {
    id: 't4',
    title: 'Международный турнир «Eurasia Sports Cup 2026»',
    slug: 'eurasia-sports-cup-2026',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Мировая Серия А',
    organization: 'Азиатский Союз Единоборств',
    venueName: 'Дворец Спорта им. Балуана Шолака',
    city: 'Алматы',
    country: 'Казахстан',
    startDate: '2026-12-20',
    endDate: '2026-12-22',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 420,
    clubCount: 36,
    tatamiCount: 5,
    registrationDeadline: '2026-12-15 18:00',
    imageUrl: '/src/assets/images/championship_podium_1794135363745.jpg',
    bannerUrl: '/src/assets/images/championship_podium_1794135363745.jpg',
    description: 'Крупнейший международный турнир Центральной Азии. Рейтинговый зачёт Мировой Серии А, участие сборных команд из 12 стран, видеоповторы VR и призовой фонд.',
    disciplines: [
      'Взрослые Мужчины (-60, -67, -75, -84, +84 кг)',
      'Взрослые Женщины (-50, -55, -61, -68, +68 кг)',
      'Индивидуальное и командное Ката',
      'Инклюзивный спорт (Пара-единоборства)'
    ],
    scheduleSummary: [
      { time: '09:00 - 10:30', title: 'Официальное контрольное взвешивание', stage: 'Медицинский блок' },
      { time: '11:00 - 15:00', title: 'Предварительные раунды турнира', stage: 'Татами 1-5' },
      { time: '16:00 - 19:00', title: 'Медальные финалы и вручение поясов чемпионов', stage: 'Главный ковер' }
    ]
  },
  {
    id: 't5',
    title: 'Открытый Кубок Содружества «Minsk Open 2027»',
    slug: 'minsk-open-cup-2027',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Кубок Содружества',
    organization: 'Ассоциация Спортивных Единоборств Беларуси',
    venueName: 'Falcon Club Arena',
    city: 'Ташкент',
    country: 'Узбекистан',
    startDate: '2027-01-22',
    endDate: '2027-01-24',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 280,
    clubCount: 24,
    tatamiCount: 4,
    registrationDeadline: '2027-01-16 23:59',
    imageUrl: '/src/assets/images/karate_kumite_match_1793821751076.jpg',
    bannerUrl: '/src/assets/images/karate_kumite_match_1793821751076.jpg',
    description: 'Зимний кубок дружбы и мастерства. Высокий соревновательный уровень среди клубов СНГ, цифровые судейские пульты и онлайн-трансляция в Virtual Studios.',
    disciplines: [
      'Кумитэ 18+ Мужчины и Женщины',
      'Кадеты и Юниоры 14-17 лет',
      'Мастерс 35+ (ветераны)',
      'Командные стенка на стенку'
    ],
    scheduleSummary: [
      { time: '08:30 - 09:30', title: 'Жеребьевка и утверждение сеток', stage: 'Секретариат ГСК' },
      { time: '10:00 - 14:30', title: 'Предварительный пул поединков', stage: 'Татами 1-4' },
      { time: '15:30 - 18:00', title: 'Финалы и награждение команд', stage: 'Главный помост' }
    ]
  },
  {
    id: 't6',
    title: 'Международная Премьер-Лига Единоборств Dubai 2027',
    slug: 'premier-league-dubai-2027',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Премьер-Лига Единоборств',
    organization: 'Международная Федерация Единоборств & UAE Sports Council',
    venueName: 'Hamdan Sports Complex',
    city: 'Дубай',
    country: 'ОАЭ',
    startDate: '2027-02-18',
    endDate: '2027-02-21',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 650,
    clubCount: 58,
    tatamiCount: 6,
    registrationDeadline: '2027-02-05 20:00',
    imageUrl: '/src/assets/images/martial_arts_arena_1794135363803.jpg',
    bannerUrl: '/src/assets/images/martial_arts_arena_1794135363803.jpg',
    description: 'Этап мирового первенства Premier League. Участвуют лучшие спортсмены мирового рейтинга Top 32, олимпийский формат сеток с раунд-робин и видеоповторами VR.',
    disciplines: [
      'Premier Kumite -60, -67, -75, -84, +84 кг',
      'Premier Female Kumite -50, -55, -61, -68, +68 кг',
      'Individual Kata Male / Female (7-Judge Panel)',
      'Инклюзивные дивизионы K21, K22'
    ],
    scheduleSummary: [
      { time: '09:00 - 13:00', title: 'Round Robin Pool Bouts', stage: 'Tatami 1-6' },
      { time: '14:00 - 17:00', title: 'Quarter-finals & Semi-finals', stage: 'Tatami 1-4' },
      { time: '18:00 - 20:30', title: 'Gold & Bronze Medal Matches', stage: 'Central Mat (Tatami 1)' }
    ]
  },
  {
    id: 't7',
    title: 'Кубок Черноморского Побережья «Sochi Open 2027»',
    slug: 'sochi-open-cup-2027',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Всероссийская Лига',
    organization: 'Южная Ассоциация Спортивных Единоборств',
    venueName: 'Ледовый Дворец «Айсберг» (Арена Единоборств)',
    city: 'Сочи',
    country: 'Кыргызстан',
    startDate: '2027-03-05',
    endDate: '2027-03-07',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 380,
    clubCount: 32,
    tatamiCount: 4,
    registrationDeadline: '2027-02-25 18:00',
    imageUrl: '/src/assets/images/martial_arts_action_1794135363457.jpg',
    bannerUrl: '/src/assets/images/martial_arts_action_1794135363457.jpg',
    description: 'Весенний открытый кубок на олимпийских объектах Сочи. Участие сильнейших клубов южных и центральных регионов, электронное судейство и онлайн-сетки.',
    disciplines: [
      'Кумитэ Мужчины и Женщины (18+)',
      'Юноши и Девушки (12-15 лет)',
      'Мастера и Ветераны спорта',
      'Командное Ката'
    ],
    scheduleSummary: [
      { time: '09:00 - 10:30', title: 'Мандатная комиссия и допуск', stage: 'Пресс-центр' },
      { time: '11:00 - 16:00', title: 'Предварительные поединки', stage: 'Татами 1-4' },
      { time: '16:30 - 18:30', title: 'Финалы за золотые медали', stage: 'Центральное татами' }
    ]
  },
  {
    id: 't8',
    title: 'Международный турнир столиц «Astana Grand Arena 2027»',
    slug: 'astana-grand-arena-2027',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Мировая Серия А',
    organization: 'Столичная Федерация Боевых Искусств',
    venueName: 'Дворец Единоборств «Жекпе-жек» им. Ж. Ушкемпирова',
    city: 'Астана',
    country: 'Казахстан',
    startDate: '2027-03-19',
    endDate: '2027-03-21',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 450,
    clubCount: 40,
    tatamiCount: 5,
    registrationDeadline: '2027-03-12 21:00',
    imageUrl: '/src/assets/images/championship_podium_1794135363745.jpg',
    bannerUrl: '/src/assets/images/championship_podium_1794135363745.jpg',
    description: 'Масштабный турнир на ультрасовременной арене единоборств столицы. Международный рейтинг, видеоповторы VR на каждом татами, прямая трансляция.',
    disciplines: [
      'Индивидуальное Кумитэ 18+ (-60, -67, -75, -84, +84 кг)',
      'Индивидуальное Ката Мужчины / Женщины',
      'Юниоры 16-17 лет',
      'Командное первенство'
    ],
    scheduleSummary: [
      { time: '08:30 - 10:00', title: 'Взвешивание и мандат', stage: 'Сектор B' },
      { time: '10:30 - 15:30', title: 'Отборочные круги', stage: 'Татами 1-5' },
      { time: '16:30 - 19:30', title: 'Гала-финалы и награждение', stage: 'Главный ковер' }
    ]
  },
  {
    id: 't9',
    title: 'Уральский открытый кубок «Мастера Боевых Искусств»',
    slug: 'ural-masters-cup-2027',
    rulesType: 'skif',
    sportType: 'Традиционные единоборства',
    league: 'Национальная Лига',
    organization: 'Уральская Лига Традиционных Единоборств',
    venueName: 'Дворец Спорта УГМК',
    city: 'Кант',
    country: 'Кыргызстан',
    startDate: '2027-04-09',
    endDate: '2027-04-11',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 220,
    clubCount: 18,
    tatamiCount: 3,
    registrationDeadline: '2027-04-02 23:59',
    imageUrl: '/src/assets/images/karate_tatami_arena_1793821750724.jpg',
    bannerUrl: '/src/assets/images/karate_tatami_arena_1793821750724.jpg',
    description: 'Региональное первенство по традиционным правилам с чистым иппоном. Высокие требования к точности техники и духу поединка.',
    disciplines: [
      'Shobu Ippon Мужчины и Женщины',
      'Традиционное Ката',
      'Поединки среди ветеранов 35+'
    ],
    scheduleSummary: [
      { time: '09:00 - 10:00', title: 'Регистрация участников', stage: 'Мандатная зона' },
      { time: '10:30 - 14:00', title: 'Состязания по Ката', stage: 'Татами 1-3' },
      { time: '14:30 - 18:00', title: 'Поединки Shobu Ippon и награждение', stage: 'Татами 1-3' }
    ]
  },
  {
    id: 't10',
    title: 'Чемпионат Центральной Азии «Silk Road Martial Arts Cup»',
    slug: 'silk-road-cup-2027',
    rulesType: 'wkf',
    sportType: 'Спортивное каратэ',
    league: 'Кубок Содружества',
    organization: 'Центральноазиатская Лига Единоборств',
    venueName: 'Humo Arena Sport Palace',
    city: 'Ташкент',
    country: 'Узбекистан',
    startDate: '2027-04-23',
    endDate: '2027-04-25',
    status: 'registration_open',
    isRegistrationOpen: true,
    athleteCount: 510,
    clubCount: 44,
    tatamiCount: 6,
    registrationDeadline: '2027-04-15 18:00',
    imageUrl: '/src/assets/images/martial_arts_arena_1794135363803.jpg',
    bannerUrl: '/src/assets/images/martial_arts_arena_1794135363803.jpg',
    description: 'Масштабный международный турнир Шелкового Пути. Объединяет спортсменов из 15 стран региона, электронная жеребьевка и мультиязычные протоколы.',
    disciplines: [
      'Взрослые Кумитэ (-60, -67, -75, -84, +84 кг)',
      'Индивидуальное Ката',
      'Юношеские дивизионы 10-15 лет'
    ],
    scheduleSummary: [
      { time: '09:00 - 11:00', title: 'Мандатная комиссия', stage: 'Арена' },
      { time: '11:30 - 16:30', title: 'Отборочные бои', stage: 'Татами 1-6' },
      { time: '17:30 - 20:00', title: 'Финалы и гала-награждение', stage: 'Центральный ковер' }
    ]
  }
];


/** Demo data above belongs to this example tournament ('tourn1' is its legacy id). */
export const DEMO_TOURNAMENT_ID = 'kg-bishkek-cup-2026';

/** True when a record with `tournamentId` belongs to the event `eventId`. */
export const belongsToEvent = (tournamentId: string | undefined, eventId: string) =>
  tournamentId === eventId || ((tournamentId === 'tourn1' || !tournamentId) && eventId === DEMO_TOURNAMENT_ID);

/** Bout length for a category: from its age category (kata gets 4 min as a safe upper bound). */
export const durationForCategory = (cat: { ageCategoryId?: string; discipline?: string }) =>
  cat.discipline === 'kata' ? 240 : SAMPLE_AGE_CATEGORIES.find((a) => a.id === cat.ageCategoryId)?.matchDurationSeconds ?? 180;
