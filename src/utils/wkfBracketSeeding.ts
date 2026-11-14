import { Participant, TournamentCategory, Tatami, Bout, RoundStage } from '../types/schema';

export interface ProtectionCheckResult {
  hasR1Conflict: boolean;
  hasR2Conflict: boolean;
  conflictType?: 'club' | 'city' | 'country';
  message: string;
}

export interface WkfSeedingReport {
  bracketSize: number;
  totalAthletes: number;
  r1ConflictsCount: number;
  r2ConflictsCount: number;
  clubSeparationSuccess: boolean;
  citySeparationSuccess: boolean;
  countrySeparationSuccess: boolean;
  separatedClubs: string[];
  separatedCities: string[];
  separatedCountries: string[];
  assignedTatami: Tatami;
  autoTatamiReason: string;
}

/**
 * Автоматическое назначение татами на основе выбранного дивизиона (дисциплина, возраст, вес, пол)
 */
export function getAutoAssignedTatami(category: TournamentCategory, tatamis: Tatami[]): { tatami: Tatami; reason: string } {
  if (tatamis.length === 0) {
    throw new Error('Список татами пуст');
  }

  // Если у категории уже жестко зафиксировано татами и оно существует в списке
  if (category.assignedTatamiId) {
    const existing = tatamis.find((t) => t.id === category.assignedTatamiId);
    if (existing) {
      return { 
        tatami: existing, 
        reason: `Фиксированное татами категории (Татами №${existing.number})` 
      };
    }
  }

  const isKata = category.discipline === 'kata' || category.discipline === 'team_kata';
  const ageName = (category.ageCategoryName || '').toLowerCase();
  const weightName = (category.weightCategoryName || '').toLowerCase();

  // 1. Дисциплина Ката -> Татами №4 (или татами с зоной Ката)
  if (isKata) {
    const kataTatami = tatamis.find((t) => t.number === 4 || t.name.toLowerCase().includes('ката')) || tatamis[tatamis.length - 1];
    return {
      tatami: kataTatami,
      reason: 'Специализированная площадка для индивидуального и командного Ката (WKF Kata Area)'
    };
  }

  // 2. Дети и Кадеты (U10, U12, Кадеты 14-15 лет) -> Татами №3
  const isCadetOrChild = ageName.includes('дети') || ageName.includes('кадет') || ageName.includes('14-15') || ageName.includes('u10') || ageName.includes('u12');
  if (isCadetOrChild) {
    const youthTatami = tatamis.find((t) => t.number === 3) || tatamis[0];
    return {
      tatami: youthTatami,
      reason: 'Молодежный дивизион: Кадеты 14-15 лет и младшие возрастные группы'
    };
  }

  // 3. Взрослые легкие веса (-50, -55, -60, -61, -67 кг) -> Татами №2
  const isLightweight = weightName.includes('-50') || weightName.includes('-55') || weightName.includes('-60') || weightName.includes('-61') || weightName.includes('-67');
  if (isLightweight) {
    const lightTatami = tatamis.find((t) => t.number === 2) || tatamis[0];
    return {
      tatami: lightTatami,
      reason: 'Легкие и средние весовые категории (Мужчины -60/-67 кг, Женщины -50/-55/-61 кг)'
    };
  }

  // 4. Взрослые средние и тяжелые веса (-75, -84, +84, -68, +68, абсолютная) -> Центральное Татами №1
  const centralTatami = tatamis.find((t) => t.number === 1) || tatamis[0];
  return {
    tatami: centralTatami,
    reason: 'Центральная арена: Тяжелые и престижные весовые категории (-75/-84/+84 кг)'
  };
}

/**
 * Оценка штрафа конфликтов между спортсменами в сетке
 * Штрафует нахождение представителей одного клуба/города/страны:
 * - в одной паре первого круга (R1) - максимальный штраф
 * - в одном 4-местном квадранте (R2) - высокий штраф
 * - в одной половине сетки - умеренный штраф
 */
function evaluateBracketPenalty(slots: (Participant | null)[], bracketSize: number): number {
  let penalty = 0;

  for (let i = 0; i < bracketSize; i++) {
    const a = slots[i];
    if (!a) continue;

    for (let j = i + 1; j < bracketSize; j++) {
      const b = slots[j];
      if (!b) continue;

      const sameClub = a.clubId && b.clubId && a.clubId === b.clubId;
      const sameCity = a.city && b.city && a.city.trim().toLowerCase() === b.city.trim().toLowerCase();
      const sameCountry = a.country && b.country && a.country.trim().toLowerCase() === b.country.trim().toLowerCase();

      if (!sameClub && !sameCity && !sameCountry) continue;

      // 1. Конфликт 1-го круга (одна пара поединка)
      const sameR1Pair = Math.floor(i / 2) === Math.floor(j / 2);
      if (sameR1Pair) {
        if (sameClub) penalty += 50000;
        if (sameCity) penalty += 25000;
        if (sameCountry) penalty += 10000;
      }

      // 2. Конфликт 2-го круга (один 4-местный квадрант)
      const sameR2Quadrant = Math.floor(i / 4) === Math.floor(j / 4);
      if (sameR2Quadrant) {
        if (sameClub) penalty += 8000;
        if (sameCity) penalty += 4000;
        if (sameCountry) penalty += 1500;
      }

      // 3. Нахождение в одной половине сетки
      const sameHalf = (i < bracketSize / 2 && j < bracketSize / 2) || (i >= bracketSize / 2 && j >= bracketSize / 2);
      if (sameHalf) {
        if (sameClub) penalty += 100;
        if (sameCity) penalty += 50;
        if (sameCountry) penalty += 20;
      }
    }
  }

  return penalty;
}

/**
 * Проверяет, возможен ли поединок между спортсменами в 1-м или 2-м круге
 */
export function checkPairProtection(p1: Participant, p2: Participant, slotIndex1: number, slotIndex2: number): ProtectionCheckResult {
  const sameClub = p1.clubId && p2.clubId && p1.clubId === p2.clubId;
  const sameCity = p1.city && p2.city && p1.city.trim().toLowerCase() === p2.city.trim().toLowerCase();
  const sameCountry = p1.country && p2.country && p1.country.trim().toLowerCase() === p2.country.trim().toLowerCase();

  const isR1Pair = Math.floor(slotIndex1 / 2) === Math.floor(slotIndex2 / 2);
  const isR2Quadrant = Math.floor(slotIndex1 / 4) === Math.floor(slotIndex2 / 4);

  if (isR1Pair) {
    if (sameClub) return { hasR1Conflict: true, hasR2Conflict: true, conflictType: 'club', message: `Конфликт 1-го круга: общий клуб "${p1.clubName || p1.clubId}"` };
    if (sameCity) return { hasR1Conflict: true, hasR2Conflict: true, conflictType: 'city', message: `Конфликт 1-го круга: общий город "${p1.city}"` };
    if (sameCountry) return { hasR1Conflict: true, hasR2Conflict: true, conflictType: 'country', message: `Конфликт 1-го круга: общая страна "${p1.country}"` };
  }

  if (isR2Quadrant) {
    if (sameClub) return { hasR1Conflict: false, hasR2Conflict: true, conflictType: 'club', message: `Конфликт 2-го круга: общий клуб "${p1.clubName || p1.clubId}"` };
    if (sameCity) return { hasR1Conflict: false, hasR2Conflict: true, conflictType: 'city', message: `Конфликт 2-го круга: общий город "${p1.city}"` };
    if (sameCountry) return { hasR1Conflict: false, hasR2Conflict: true, conflictType: 'country', message: `Конфликт 2-го круга: общая страна "${p1.country}"` };
  }

  return { hasR1Conflict: false, hasR2Conflict: false, message: 'Разведение WKF соблюдено' };
}

/**
 * Интеллектуальный генератор сетки WKF с защитой от поединков соклубников,
 * земляков (один город) и соотечественников (одна страна) в 1-м и 2-м кругах.
 */
export function seedWkfBracketWithProtection(
  athletes: Participant[],
  preferredBracketSize?: number
): { slots: (Participant | null)[]; report: Omit<WkfSeedingReport, 'assignedTatami' | 'autoTatamiReason'> } {
  const count = athletes.length;
  let bracketSize = preferredBracketSize || 4;
  if (!preferredBracketSize) {
    if (count > 8) bracketSize = 16;
    else if (count > 4) bracketSize = 8;
    else bracketSize = 4;
  }

  // WKF стандартные слоты для семян (посева)
  // Для 8-местной: Верх: 0, 1, 2, 3 | Низ: 4, 5, 6, 7
  // Квадранты для 16: Q1 (0..3), Q2 (4..7), Q3 (8..11), Q4 (12..15)

  // 1. Создаем начальный массив слотов
  let bestSlots: (Participant | null)[] = new Array(bracketSize).fill(null);

  // Сортируем участников: сперва с высокими поясами (дан), затем остальные
  const beltRanksWeight: Record<string, number> = {
    'black_3dan_plus': 10,
    'black_2dan': 9,
    'black_1dan': 8,
    'brown_1kyu': 7,
    'brown_3kyu': 6,
    'blue_4kyu': 5,
    'green_6kyu': 4,
    'orange_7kyu': 3,
    'yellow_8kyu': 2,
    'white_10kyu': 1
  };

  const sortedAthletes = [...athletes].sort((a, b) => {
    const wB = beltRanksWeight[b.beltRank] || 0;
    const wA = beltRanksWeight[a.beltRank] || 0;
    return wB - wA;
  });

  // Первоначальное чередование по квадрантам/половинам (Upper Half vs Lower Half)
  // Для 8 участников: слоты [0, 4, 2, 6, 1, 5, 3, 7]
  const pattern8 = [0, 4, 2, 6, 1, 5, 3, 7];
  const pattern16 = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
  const pattern4 = [0, 2, 1, 3];

  const preferredPattern = bracketSize === 16 ? pattern16 : bracketSize === 8 ? pattern8 : pattern4;

  for (let i = 0; i < sortedAthletes.length && i < bracketSize; i++) {
    bestSlots[preferredPattern[i]] = sortedAthletes[i];
  }

  let bestPenalty = evaluateBracketPenalty(bestSlots, bracketSize);

  // 2. Итерационная оптимизация (локальный стохастический поиск / Hill Climbing)
  // Переставляем участников местами для минимизации штрафа конфликтов
  const MAX_ITERATIONS = 400;
  for (let iter = 0; iter < MAX_ITERATIONS && bestPenalty > 0; iter++) {
    const candidateSlots = [...bestSlots];
    const idxA = Math.floor(Math.random() * bracketSize);
    const idxB = Math.floor(Math.random() * bracketSize);
    if (idxA === idxB) continue;

    // Меняем местами
    const temp = candidateSlots[idxA];
    candidateSlots[idxA] = candidateSlots[idxB];
    candidateSlots[idxB] = temp;

    const penalty = evaluateBracketPenalty(candidateSlots, bracketSize);
    if (penalty < bestPenalty) {
      bestSlots = candidateSlots;
      bestPenalty = penalty;
    }
  }

  // 3. Формирование аналитического отчета о разведении
  let r1Conflicts = 0;
  let r2Conflicts = 0;
  const clubSet = new Set<string>();
  const citySet = new Set<string>();
  const countrySet = new Set<string>();

  for (let i = 0; i < bracketSize; i++) {
    const a = bestSlots[i];
    if (!a) continue;
    if (a.clubName) clubSet.add(a.clubName);
    if (a.city) citySet.add(a.city);
    if (a.country) countrySet.add(a.country);

    for (let j = i + 1; j < bracketSize; j++) {
      const b = bestSlots[j];
      if (!b) continue;

      const sameClub = a.clubId && b.clubId && a.clubId === b.clubId;
      const sameCity = a.city && b.city && a.city.trim().toLowerCase() === b.city.trim().toLowerCase();
      const sameCountry = a.country && b.country && a.country.trim().toLowerCase() === b.country.trim().toLowerCase();

      if (!sameClub && !sameCity && !sameCountry) continue;

      const sameR1 = Math.floor(i / 2) === Math.floor(j / 2);
      const sameR2 = Math.floor(i / 4) === Math.floor(j / 4);

      if (sameR1) r1Conflicts++;
      else if (sameR2) r2Conflicts++;
    }
  }

  return {
    slots: bestSlots,
    report: {
      bracketSize,
      totalAthletes: athletes.length,
      r1ConflictsCount: r1Conflicts,
      r2ConflictsCount: r2Conflicts,
      clubSeparationSuccess: r1Conflicts === 0 && r2Conflicts === 0,
      citySeparationSuccess: r1Conflicts === 0 && r2Conflicts === 0,
      countrySeparationSuccess: r1Conflicts === 0 && r2Conflicts === 0,
      separatedClubs: Array.from(clubSet),
      separatedCities: Array.from(citySet),
      separatedCountries: Array.from(countrySet)
    }
  };
}

/**
 * Полная генерация дерева поединков WKF для выбранного дивизиона
 * с автоматическим назначением татами и защитой сетки.
 */
export function generateProtectedWkfCategoryBouts(
  category: TournamentCategory,
  athletes: Participant[],
  tatamis: Tatami[],
  options?: { startTime?: string; boutIntervalMinutes?: number }
): { bouts: Bout[]; report: WkfSeedingReport } {
  const { tatami: autoTatami, reason: autoTatamiReason } = getAutoAssignedTatami(category, tatamis);
  const startTime = options?.startTime || '12:00';
  const interval = options?.boutIntervalMinutes || 12;

  const [startH, startM] = startTime.split(':').map(Number);
  const computeTime = (offsetMins: number) => {
    const totalMinutes = startH * 60 + startM + offsetMins;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const { slots, report: rawReport } = seedWkfBracketWithProtection(athletes);
  const bracketSize = rawReport.bracketSize;
  const categoryTitle = `${category.ageCategoryName || 'Взрослые 18+'} · ${category.gender === 'male' ? 'Мужчины' : 'Женщины'} · ${category.discipline === 'kata' ? 'Ката' : category.weightCategoryName || 'Кумитэ'}`;

  const generatedBouts: Bout[] = [];
  let currentMinuteOffset = 0;
  let boutCounter = autoTatami.number * 100 + 10;

  if (bracketSize === 8) {
    // 1/4 финала (4 боя)
    const qfBouts: Bout[] = [];
    for (let i = 0; i < 4; i++) {
      const aka = slots[i * 2];
      const ao = slots[i * 2 + 1];
      boutCounter++;
      const b: Bout = {
        id: `bout_${Date.now()}_cat_${category.id}_qf_${i + 1}`,
        tournamentId: category.tournamentId || 'tourn1',
        categoryId: category.id,
        categoryName: categoryTitle,
        tatamiId: autoTatami.id,
        tatamiNumber: autoTatami.number,
        boutNumber: boutCounter,
        roundStage: 'quarter_final',
        bracketPosition: i + 1,
        akaParticipantId: aka?.id,
        akaParticipant: aka || undefined,
        aoParticipantId: ao?.id,
        aoParticipant: ao || undefined,
        scheduledTime: computeTime(currentMinuteOffset),
        akaScore: 0,
        aoScore: 0,
        akaSenshu: false,
        aoSenshu: false,
        akaPenaltiesC1: 0,
        aoPenaltiesC1: 0,
        akaPenaltiesC2: 0,
        aoPenaltiesC2: 0,
        status: 'scheduled',
        timerSecondsRemaining: category.discipline === 'kata' ? 240 : 180
      };
      qfBouts.push(b);
      currentMinuteOffset += interval;
    }
    generatedBouts.push(...qfBouts);

    // Полуфиналы (2 боя)
    const sfBouts: Bout[] = [];
    for (let i = 0; i < 2; i++) {
      boutCounter++;
      const b: Bout = {
        id: `bout_${Date.now()}_cat_${category.id}_sf_${i + 1}`,
        tournamentId: category.tournamentId || 'tourn1',
        categoryId: category.id,
        categoryName: categoryTitle,
        tatamiId: autoTatami.id,
        tatamiNumber: autoTatami.number,
        boutNumber: boutCounter,
        roundStage: 'semi_final',
        bracketPosition: i + 1,
        scheduledTime: computeTime(currentMinuteOffset),
        akaScore: 0,
        aoScore: 0,
        akaSenshu: false,
        aoSenshu: false,
        akaPenaltiesC1: 0,
        aoPenaltiesC1: 0,
        akaPenaltiesC2: 0,
        aoPenaltiesC2: 0,
        status: 'scheduled',
        timerSecondsRemaining: category.discipline === 'kata' ? 240 : 180
      };
      sfBouts.push(b);
      currentMinuteOffset += interval;
    }
    generatedBouts.push(...sfBouts);

    // Бронзовый финал
    boutCounter++;
    generatedBouts.push({
      id: `bout_${Date.now()}_cat_${category.id}_bronze`,
      tournamentId: category.tournamentId || 'tourn1',
      categoryId: category.id,
      categoryName: categoryTitle,
      tatamiId: autoTatami.id,
      tatamiNumber: autoTatami.number,
      boutNumber: boutCounter,
      roundStage: 'bronze_match',
      bracketPosition: 1,
      scheduledTime: computeTime(currentMinuteOffset),
      akaScore: 0,
      aoScore: 0,
      akaSenshu: false,
      aoSenshu: false,
      akaPenaltiesC1: 0,
      aoPenaltiesC1: 0,
      akaPenaltiesC2: 0,
      aoPenaltiesC2: 0,
      status: 'scheduled',
      timerSecondsRemaining: category.discipline === 'kata' ? 240 : 180
    });
    currentMinuteOffset += interval;

    // Главный финал за 1-е место (Золото)
    boutCounter++;
    generatedBouts.push({
      id: `bout_${Date.now()}_cat_${category.id}_final`,
      tournamentId: category.tournamentId || 'tourn1',
      categoryId: category.id,
      categoryName: categoryTitle,
      tatamiId: autoTatami.id,
      tatamiNumber: autoTatami.number,
      boutNumber: boutCounter,
      roundStage: 'final',
      bracketPosition: 1,
      scheduledTime: computeTime(currentMinuteOffset),
      akaScore: 0,
      aoScore: 0,
      akaSenshu: false,
      aoSenshu: false,
      akaPenaltiesC1: 0,
      aoPenaltiesC1: 0,
      akaPenaltiesC2: 0,
      aoPenaltiesC2: 0,
      status: 'scheduled',
      timerSecondsRemaining: category.discipline === 'kata' ? 240 : 180
    });
  } else {
    // 4 участника: Полуфиналы (2 боя) + Бронза + Финал
    for (let i = 0; i < 2; i++) {
      const aka = slots[i * 2];
      const ao = slots[i * 2 + 1];
      boutCounter++;
      generatedBouts.push({
        id: `bout_${Date.now()}_cat_${category.id}_sf_${i + 1}`,
        tournamentId: category.tournamentId || 'tourn1',
        categoryId: category.id,
        categoryName: categoryTitle,
        tatamiId: autoTatami.id,
        tatamiNumber: autoTatami.number,
        boutNumber: boutCounter,
        roundStage: 'semi_final',
        bracketPosition: i + 1,
        akaParticipantId: aka?.id,
        akaParticipant: aka || undefined,
        aoParticipantId: ao?.id,
        aoParticipant: ao || undefined,
        scheduledTime: computeTime(currentMinuteOffset),
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
      });
      currentMinuteOffset += interval;
    }

    // Финал
    boutCounter++;
    generatedBouts.push({
      id: `bout_${Date.now()}_cat_${category.id}_final`,
      tournamentId: category.tournamentId || 'tourn1',
      categoryId: category.id,
      categoryName: categoryTitle,
      tatamiId: autoTatami.id,
      tatamiNumber: autoTatami.number,
      boutNumber: boutCounter,
      roundStage: 'final',
      bracketPosition: 1,
      scheduledTime: computeTime(currentMinuteOffset),
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
    });
  }

  return {
    bouts: generatedBouts,
    report: {
      ...rawReport,
      assignedTatami: autoTatami,
      autoTatamiReason
    }
  };
}
