import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  Layers, 
  Users, 
  Award, 
  Trophy, 
  Shuffle, 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  RefreshCw, 
  Check, 
  Sparkles,
  ChevronRight,
  Filter,
  Clock,
  Download,
  Calendar,
  Tv,
  Database,
  FileCode,
  Shield
} from 'lucide-react';
import { 
  Participant, 
  Club, 
  AgeCategory, 
  WeightCategory, 
  TournamentCategory, 
  Tatami, 
  Bout,
  RoundStage
} from '../types/schema';
import { getAutoAssignedTatami, seedWkfBracketWithProtection } from '../utils/wkfBracketSeeding';

interface TournamentEngineModuleProps {
  clubs: Club[];
  ageCategories: AgeCategory[];
  weightCategories: WeightCategory[];
  tournamentCategories: TournamentCategory[];
  tatamis: Tatami[];
  participants: Participant[];
  bouts: Bout[];
  onUpdateParticipant: (updated: Participant) => void;
  onBatchUpdateParticipants: (updatedList: Participant[]) => void;
  onGenerateBracketsForCategories: (newBouts: Bout[]) => void;
  onNavigateToScoreboard: (boutId: string) => void;
  onNavigateToBracketView: () => void;
}

export const TournamentEngineModule: React.FC<TournamentEngineModuleProps> = ({
  clubs,
  ageCategories,
  weightCategories,
  tournamentCategories,
  tatamis,
  participants,
  bouts,
  onUpdateParticipant,
  onBatchUpdateParticipants,
  onGenerateBracketsForCategories,
  onNavigateToScoreboard,
  onNavigateToBracketView
}) => {
  const [activeEngineTab, setActiveEngineTab] = useState<'eligibility' | 'generator' | 'schedule_preview' | 'sql_sync'>('generator');
  const [filterDivisionId, setFilterDivisionId] = useState<string>('all');
  const [distributionSuccessMessage, setDistributionSuccessMessage] = useState<string | null>(null);
  const [bracketGenerationSuccess, setBracketGenerationSuccess] = useState<string | null>(null);

  // Seeding strategy state
  const [seedingMethod, setSeedingMethod] = useState<'club_separation' | 'ranked' | 'random'>('club_separation');
  const [selectedDivisionsForDraw, setSelectedDivisionsForDraw] = useState<string[]>(
    tournamentCategories.map((tc) => tc.id)
  );

  // Scheduling Configuration
  const [sessionStartTime, setSessionStartTime] = useState<string>('10:00');
  const [boutIntervalMinutes, setBoutIntervalMinutes] = useState<number>(3); // break between bouts
  const [generatedBoutsPreview, setGeneratedBoutsPreview] = useState<Bout[]>([]);
  const [generatedSqlScript, setGeneratedSqlScript] = useState<string>('');

  // 1. Calculate athlete age helper
  const calculateAge = (birthDateStr: string) => {
    const birth = new Date(birthDateStr);
    const tournamentDate = new Date('2026-11-04');
    let age = tournamentDate.getFullYear() - birth.getFullYear();
    const m = tournamentDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && tournamentDate.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Eligibility Check: participant is admitted if weighed-in, medical cleared, and in valid weight range
  const athleteEligibilityMap = useMemo(() => {
    const map: Record<
      string,
      {
        isAdmitted: boolean;
        hasWeighIn: boolean;
        hasMedical: boolean;
        isOverweight: boolean;
        isUnderweight: boolean;
        statusText: string;
      }
    > = {};

    participants.forEach((p) => {
      const hasWeighIn = p.isWeighedIn;
      const hasMedical = p.isMedicalCleared;
      let isOverweight = false;
      let isUnderweight = false;

      if (p.categoryId) {
        const cat = tournamentCategories.find((c) => c.id === p.categoryId);
        if (cat && cat.weightCategoryId) {
          const wDef = weightCategories.find((w) => w.id === cat.weightCategoryId);
          if (wDef) {
            const actual = p.actualWeightKg !== null ? p.actualWeightKg : p.declaredWeightKg;
            if (wDef.maxWeightKg !== null && actual > wDef.maxWeightKg) isOverweight = true;
            if (actual < wDef.minWeightKg) isUnderweight = true;
          }
        }
      }

      const isAdmitted = hasWeighIn && hasMedical && !isOverweight && !isUnderweight && p.status !== 'disqualified' && p.status !== 'withdrawn';
      let statusText = 'Допущен к жеребьёвке';
      if (!hasMedical) statusText = 'Нет мед. допуска';
      else if (!hasWeighIn) statusText = 'Не взвешен';
      else if (isOverweight) statusText = 'Превышение веса (Overweight)';
      else if (isUnderweight) statusText = 'Недовес';

      map[p.id] = {
        isAdmitted,
        hasWeighIn,
        hasMedical,
        isOverweight,
        isUnderweight,
        statusText
      };
    });

    return map;
  }, [participants, tournamentCategories, weightCategories]);

  // Admitted vs Ineligible athletes count
  const admittedAthletesCount = useMemo(() => {
    return Object.values(athleteEligibilityMap).filter((e) => e.isAdmitted).length;
  }, [athleteEligibilityMap]);

  const ineligibleAthletesCount = participants.length - admittedAthletesCount;

  // Find optimal category for an athlete
  const findOptimalCategory = (p: Participant) => {
    const age = calculateAge(p.birthDate);
    const weight = p.actualWeightKg !== null ? p.actualWeightKg : p.declaredWeightKg;

    const matchedAge = ageCategories.find(
      (ac) => age >= ac.minAge && (ac.maxAge === null || age <= ac.maxAge)
    );
    if (!matchedAge) return null;

    const availableWeights = weightCategories.filter(
      (wc) => wc.ageCategoryId === matchedAge.id && wc.gender === p.gender
    );

    const matchedWeight = availableWeights.find((wc) => {
      const minOk = weight >= wc.minWeightKg;
      const maxOk = wc.maxWeightKg === null || weight <= wc.maxWeightKg;
      return minOk && maxOk;
    });

    if (!matchedWeight) return null;

    return tournamentCategories.find(
      (tc) =>
        tc.ageCategoryId === matchedAge.id &&
        tc.weightCategoryId === matchedWeight.id &&
        tc.gender === p.gender
    );
  };

  // 1-Click Batch Admit & Weigh-in All Athletes
  const handleBatchAdmitAll = () => {
    const updated = participants.map((p) => {
      const actual = p.actualWeightKg !== null ? p.actualWeightKg : p.declaredWeightKg;
      return {
        ...p,
        actualWeightKg: actual,
        isWeighedIn: true,
        isMedicalCleared: true,
        status: 'draw_seeded' as const
      };
    });
    onBatchUpdateParticipants(updated);
    setDistributionSuccessMessage('Все спортсмены успешно допущены мандатной комиссией и взвешены!');
    setTimeout(() => setDistributionSuccessMessage(null), 4000);
  };

  // 1-Click Transfer Overweight Athletes to Optimal Division
  const handleAutoReassignWeightMismatches = () => {
    let remapped = 0;
    const updated = participants.map((p) => {
      const eligibility = athleteEligibilityMap[p.id];
      if (eligibility && (eligibility.isOverweight || eligibility.isUnderweight)) {
        const optimal = findOptimalCategory(p);
        if (optimal) {
          remapped++;
          return {
            ...p,
            categoryId: optimal.id,
            status: 'draw_seeded' as const
          };
        }
      }
      return p;
    });

    onBatchUpdateParticipants(updated);
    setDistributionSuccessMessage(`Успешно переведено ${remapped} спортсменов в соответствующие весовые дивизионы.`);
    setTimeout(() => setDistributionSuccessMessage(null), 4000);
  };

  // =========================================================================
  // AUTOMATED BRACKET & TATAMI SCHEDULE GENERATOR ENGINE
  // =========================================================================
  const generateBracketsAndSchedule = (previewOnly = false) => {
    const allGeneratedBouts: Bout[] = [];
    const generatedSqlStatements: string[] = [
      '-- =====================================================================',
      '-- СИНХРОНИЗАЦИЯ ТУРНИРНЫХ СЕТОК И РАСПИСАНИЯ ПОЕДИНКОВ С БАЗОЙ ДАННЫХ',
      `-- Время генерации: ${new Date().toISOString()} | СУБД: PostgreSQL 14+`,
      '-- =====================================================================',
      'BEGIN;\n'
    ];

    // Tatami time trackers (in minutes from midnight)
    const [startHour, startMin] = sessionStartTime.split(':').map(Number);
    const initialMinutes = (startHour || 10) * 60 + (startMin || 0);

    const tatamiTimeTrackers: Record<string, number> = {};
    tatamis.forEach((t) => {
      tatamiTimeTrackers[t.id] = initialMinutes;
    });

    let boutSequenceCounter = 1;

    selectedDivisionsForDraw.forEach((catId) => {
      const catObj = tournamentCategories.find((c) => c.id === catId);
      if (!catObj) return;

      // Filter only admitted athletes
      const divisionAthletes = participants.filter((p) => {
        const inCat = p.categoryId === catId || (!p.categoryId && catId === 'tc1');
        const eligibility = athleteEligibilityMap[p.id];
        return inCat && (eligibility?.isAdmitted ?? true);
      });

      if (divisionAthletes.length < 2) return;

      // Automatically assign tatami based on division parameters (kata, cadets, lightweight, heavyweight)
      const autoTatamiInfo = getAutoAssignedTatami(catObj, tatamis);
      const assignedTatami = autoTatamiInfo.tatami;

      const categoryTitle = `${catObj.ageCategoryName || 'Взрослые 18+'} · ${catObj.weightCategoryName || 'Кумитэ'}`;
      const matchDurationMinutes = catObj.discipline === 'kata' ? 4 : 3;

      // Determine bracket sizing (4 or 8 slots)
      const count = divisionAthletes.length;
      let bracketSlots = 4;
      if (count > 4) bracketSlots = 8;

      let paddedSlots: (Participant | null)[] = [];
      let seeded: Participant[] = [];

      if (seedingMethod === 'club_separation') {
        // WKF Algorithm: Strict club, city, and country separation in rounds 1 & 2
        const { slots } = seedWkfBracketWithProtection(divisionAthletes, bracketSlots);
        paddedSlots = slots;
        seeded = slots.filter((p): p is Participant => p !== null);
      } else {
        seeded = [...divisionAthletes];
        if (seedingMethod === 'ranked') {
          const beltScores: Record<string, number> = {
            black_3dan_plus: 10,
            black_2dan: 9,
            black_1dan: 8,
            brown_1kyu: 7,
            brown_3kyu: 6,
            blue_4kyu: 5,
            green_6kyu: 4,
            orange_7kyu: 3,
            yellow_8kyu: 2,
            white_10kyu: 1
          };
          seeded.sort((a, b) => (beltScores[b.beltRank] || 0) - (beltScores[a.beltRank] || 0));
        } else {
          seeded.sort(() => Math.random() - 0.5);
        }
        for (let i = 0; i < bracketSlots; i++) {
          paddedSlots.push(seeded[i] || null);
        }
      }

      // Generate category_entries SQL
      seeded.forEach((p, sIdx) => {
        generatedSqlStatements.push(
          `INSERT INTO category_entries (id, category_id, participant_id, seed_number, created_at) ` +
          `VALUES (gen_random_uuid(), '${catId}', '${p.id}', ${sIdx + 1}, NOW()) ` +
          `ON CONFLICT (category_id, participant_id) DO UPDATE SET seed_number = ${sIdx + 1};`
        );
      });

      // Helper to compute and advance tatami schedule time
      const getNextBoutTime = (tId: string): string => {
        const currentMins = tatamiTimeTrackers[tId] || initialMinutes;
        const h = Math.floor(currentMins / 60);
        const m = currentMins % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        // Advance clock: match duration + interval buffer
        tatamiTimeTrackers[tId] = currentMins + matchDurationMinutes + boutIntervalMinutes;
        return timeStr;
      };

      if (bracketSlots === 8) {
        // Quarter-Finals (4 bouts)
        for (let i = 0; i < 4; i++) {
          const aka = paddedSlots[i * 2];
          const ao = paddedSlots[i * 2 + 1];
          const boutTime = getNextBoutTime(assignedTatami.id);
          const boutNum = assignedTatami.number * 100 + boutSequenceCounter++;

          const bObj: Bout = {
            id: `b_qf_${catId}_${i + 1}`,
            tournamentId: 'tourn1',
            categoryId: catId,
            categoryName: categoryTitle,
            tatamiId: assignedTatami.id,
            tatamiNumber: assignedTatami.number,
            boutNumber: boutNum,
            roundStage: 'quarter_final',
            bracketPosition: i + 1,
            akaParticipantId: aka?.id,
            akaParticipant: aka || undefined,
            aoParticipantId: ao?.id,
            aoParticipant: ao || undefined,
            scheduledTime: boutTime,
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
          };
          allGeneratedBouts.push(bObj);

          generatedSqlStatements.push(
            `INSERT INTO bouts (id, tournament_id, category_id, tatami_id, bout_number, round_stage, bracket_position, ` +
            `aka_participant_id, ao_participant_id, scheduled_time, status) ` +
            `VALUES ('${bObj.id}', '${bObj.tournamentId}', '${bObj.categoryId}', '${bObj.tatamiId}', ${bObj.boutNumber}, ` +
            `'${bObj.roundStage}', ${bObj.bracketPosition}, ${aka ? `'${aka.id}'` : 'NULL'}, ${ao ? `'${ao.id}'` : 'NULL'}, ` +
            `'2026-11-04 ${boutTime}:00+03', 'scheduled');`
          );
        }

        // Semi-Finals (2 bouts)
        for (let i = 0; i < 2; i++) {
          const boutTime = getNextBoutTime(assignedTatami.id);
          const boutNum = assignedTatami.number * 100 + boutSequenceCounter++;

          const bObj: Bout = {
            id: `b_sf_${catId}_${i + 1}`,
            tournamentId: 'tourn1',
            categoryId: catId,
            categoryName: categoryTitle,
            tatamiId: assignedTatami.id,
            tatamiNumber: assignedTatami.number,
            boutNumber: boutNum,
            roundStage: 'semi_final',
            bracketPosition: i + 1,
            scheduledTime: boutTime,
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
          };
          allGeneratedBouts.push(bObj);

          generatedSqlStatements.push(
            `INSERT INTO bouts (id, tournament_id, category_id, tatami_id, bout_number, round_stage, bracket_position, scheduled_time, status) ` +
            `VALUES ('${bObj.id}', '${bObj.tournamentId}', '${bObj.categoryId}', '${bObj.tatamiId}', ${bObj.boutNumber}, ` +
            `'semi_final', ${bObj.bracketPosition}, '2026-11-04 ${boutTime}:00+03', 'scheduled');`
          );
        }

        // Bronze Match
        const bronzeTime = getNextBoutTime(assignedTatami.id);
        const bronzeNum = assignedTatami.number * 100 + boutSequenceCounter++;
        const bronzeObj: Bout = {
          id: `b_bronze_${catId}`,
          tournamentId: 'tourn1',
          categoryId: catId,
          categoryName: categoryTitle,
          tatamiId: assignedTatami.id,
          tatamiNumber: assignedTatami.number,
          boutNumber: bronzeNum,
          roundStage: 'bronze_match',
          bracketPosition: 1,
          scheduledTime: bronzeTime,
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
        };
        allGeneratedBouts.push(bronzeObj);

        // Final Match
        const finalTime = getNextBoutTime(assignedTatami.id);
        const finalNum = assignedTatami.number * 100 + boutSequenceCounter++;
        const finalObj: Bout = {
          id: `b_final_${catId}`,
          tournamentId: 'tourn1',
          categoryId: catId,
          categoryName: categoryTitle,
          tatamiId: assignedTatami.id,
          tatamiNumber: assignedTatami.number,
          boutNumber: finalNum,
          roundStage: 'final',
          bracketPosition: 1,
          scheduledTime: finalTime,
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
        };
        allGeneratedBouts.push(finalObj);

        generatedSqlStatements.push(
          `INSERT INTO bouts (id, tournament_id, category_id, tatami_id, bout_number, round_stage, bracket_position, scheduled_time, status) ` +
          `VALUES ('${finalObj.id}', '${finalObj.tournamentId}', '${finalObj.categoryId}', '${finalObj.tatamiId}', ${finalObj.boutNumber}, ` +
          `'final', 1, '2026-11-04 ${finalTime}:00+03', 'scheduled');`
        );
      } else {
        // 4-competitor direct semi-finals + final
        for (let i = 0; i < 2; i++) {
          const aka = paddedSlots[i * 2];
          const ao = paddedSlots[i * 2 + 1];
          const boutTime = getNextBoutTime(assignedTatami.id);
          const boutNum = assignedTatami.number * 100 + boutSequenceCounter++;

          const bObj: Bout = {
            id: `b_sf_${catId}_${i + 1}`,
            tournamentId: 'tourn1',
            categoryId: catId,
            categoryName: categoryTitle,
            tatamiId: assignedTatami.id,
            tatamiNumber: assignedTatami.number,
            boutNumber: boutNum,
            roundStage: 'semi_final',
            bracketPosition: i + 1,
            akaParticipantId: aka?.id,
            akaParticipant: aka || undefined,
            aoParticipantId: ao?.id,
            aoParticipant: ao || undefined,
            scheduledTime: boutTime,
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
          };
          allGeneratedBouts.push(bObj);
        }

        const finalTime = getNextBoutTime(assignedTatami.id);
        const finalNum = assignedTatami.number * 100 + boutSequenceCounter++;
        allGeneratedBouts.push({
          id: `b_final_${catId}`,
          tournamentId: 'tourn1',
          categoryId: catId,
          categoryName: categoryTitle,
          tatamiId: assignedTatami.id,
          tatamiNumber: assignedTatami.number,
          boutNumber: finalNum,
          roundStage: 'final',
          bracketPosition: 1,
          scheduledTime: finalTime,
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
    });

    generatedSqlStatements.push('\nCOMMIT;\n');
    const fullSql = generatedSqlStatements.join('\n');
    setGeneratedSqlScript(fullSql);
    setGeneratedBoutsPreview(allGeneratedBouts);

    if (!previewOnly) {
      onGenerateBracketsForCategories(allGeneratedBouts);
      setBracketGenerationSuccess(
        `Сетка и расписание успешно сгенерированы и синхронизированы с базой данных! Добавлено ${allGeneratedBouts.length} поединков.`
      );
      setTimeout(() => setBracketGenerationSuccess(null), 5000);
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([generatedSqlScript], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sync_schedule_and_brackets.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Engine Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Automated Elimination Brackets & Schedule Synchronization</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Генератор сеток и расписания поединков
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Автоматическое формирование олимпийских сеток WKF, посев с разведением спортсменов одного клуба, 
              расчет расписания боев по татами с интервалами отдыха и синхронизация с таблицами <code>category_entries</code> и <code>bouts</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                generateBracketsAndSchedule(false);
                setActiveEngineTab('schedule_preview');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Сгенерировать и синхронизировать</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Допущено к жеребьёвке:</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
              {admittedAthletesCount} / {participants.length} атлетов
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Требуют проверки/взвешивания:</span>
            <span className={`text-lg font-bold mt-0.5 block ${ineligibleAthletesCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {ineligibleAthletesCount} человек
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Дивизионов для жеребьёвки:</span>
            <span className="text-lg font-bold text-sky-400 mt-0.5 block">
              {selectedDivisionsForDraw.length} категорий
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Поединков в базе данных:</span>
            <span className="text-lg font-bold text-rose-400 mt-0.5 block">
              {bouts.length} боев
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveEngineTab('generator')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeEngineTab === 'generator'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Параметры жеребьевки и татами</span>
          </button>

          <button
            onClick={() => setActiveEngineTab('eligibility')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeEngineTab === 'eligibility'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Контроль допуска и взвешивания ({admittedAthletesCount}/{participants.length})</span>
          </button>

          <button
            onClick={() => {
              if (generatedBoutsPreview.length === 0) generateBracketsAndSchedule(true);
              setActiveEngineTab('schedule_preview');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeEngineTab === 'schedule_preview'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Таймлайн расписания по татами</span>
          </button>

          <button
            onClick={() => {
              if (!generatedSqlScript) generateBracketsAndSchedule(true);
              setActiveEngineTab('sql_sync');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeEngineTab === 'sql_sync'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL синхронизация (category_entries & bouts)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {bracketGenerationSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{bracketGenerationSuccess}</span>
          </div>
          <button
            onClick={onNavigateToBracketView}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
          >
            <span>Посмотреть сетки</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {distributionSuccessMessage && (
        <div className="p-4 rounded-xl bg-sky-950/90 border border-sky-500 text-sky-300 text-xs font-mono flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <span>{distributionSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. GENERATOR CONFIGURATION TAB                                            */}
      {/* ========================================================================= */}
      {activeEngineTab === 'generator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seeding Algorithm Selector */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shuffle className="w-4 h-4 text-rose-400" />
                <span>Алгоритм посева в олимпийскую сетку</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'club_separation',
                    title: 'Разведение одноклубников (WKF Standard)',
                    desc: 'Спортсмены из одного клуба разводятся в противоположные ветки сетки (АКА верх / АО низ), исключая ранние встречи одноклубников.'
                  },
                  {
                    id: 'ranked',
                    title: 'Посев по квалификации (Даны / Кю)',
                    desc: 'Обладатели старших поясов (1–3 даны) размещаются на позициях сеяных лидеров сетки (#1, #8, #4, #5).'
                  },
                  {
                    id: 'random',
                    title: 'Слепая жеребьевка (Blind Draw)',
                    desc: 'Случайное распределение бойцов по турнирной сетке без учета клубов и рейтингов.'
                  }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSeedingMethod(item.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      seedingMethod === item.id
                        ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        seedingMethod === item.id ? 'border-rose-500 bg-rose-500' : 'border-slate-700'
                      }`}>
                        {seedingMethod === item.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tatami Schedule Parameters */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Параметры тайминга и расписания татами</span>
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Время начала программы (МСК):</label>
                  <input
                    type="time"
                    value={sessionStartTime}
                    onChange={(e) => setSessionStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Интервал между поединками (мин):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBoutIntervalMinutes(val)}
                        className={`py-2 rounded-xl font-bold border transition-colors ${
                          boutIntervalMinutes === val
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        +{val} мин
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Татами в расписании:</span>
                    <strong className="text-white">{tatamis.length} ковра</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Чистое время боя:</span>
                    <strong className="text-white">По нормативу категории</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Защита отдыха спортсмена:</span>
                    <strong className="text-emerald-400">≥ 15 мин между кругами</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Division Selection for Draw */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-400" />
                    <span>Выбор дивизионов ({selectedDivisionsForDraw.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedDivisionsForDraw.length === tournamentCategories.length) {
                        setSelectedDivisionsForDraw([]);
                      } else {
                        setSelectedDivisionsForDraw(tournamentCategories.map((c) => c.id));
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-[11px] font-mono underline"
                  >
                    {selectedDivisionsForDraw.length === tournamentCategories.length ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>

                <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto no-scrollbar font-mono text-xs">
                  {tournamentCategories.map((tc) => {
                    const isSelected = selectedDivisionsForDraw.includes(tc.id);
                    const count = participants.filter((p) => p.categoryId === tc.id).length;
                    return (
                      <div
                        key={tc.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDivisionsForDraw(selectedDivisionsForDraw.filter((id) => id !== tc.id));
                          } else {
                            setSelectedDivisionsForDraw([...selectedDivisionsForDraw, tc.id]);
                          }
                        }}
                        className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-slate-950 border-rose-900/60 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-900 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-3 h-3 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span className="truncate">{tc.ageCategoryName} · {tc.weightCategoryName || 'Ката'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                          {count} атлетов
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  generateBracketsAndSchedule(false);
                  setActiveEngineTab('schedule_preview');
                }}
                className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Запустить генерацию и обновить расписание</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ATHLETE ELIGIBILITY & WEIGH-IN CONTROL TAB                              */}
      {/* ========================================================================= */}
      {activeEngineTab === 'eligibility' && (
        <div className="space-y-4">
          {/* Quick Actions Strip */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-white font-bold block">
                Мандатная комиссия и контрольное взвешивание участников
              </span>
              <span className="text-slate-400 text-[11px]">
                В турнирную сетку допускаются только спортсмены с отметкой о взвешивании и допуском врача.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBatchAdmitAll}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Допустить всех (Пройти взвешивание)</span>
              </button>

              <button
                onClick={handleAutoReassignWeightMismatches}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg font-bold border border-slate-700 flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5 text-rose-400" />
                <span>Перевести спортсменов с превышением веса</span>
              </button>
            </div>
          </div>

          {/* Athletes Eligibility Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Спортсмен</th>
                    <th className="px-5 py-3.5">Клуб</th>
                    <th className="px-5 py-3.5">Категория</th>
                    <th className="px-5 py-3.5 text-center">Вес заявка / факт</th>
                    <th className="px-5 py-3.5 text-center">Взвешивание</th>
                    <th className="px-5 py-3.5 text-center">Мед. допуск</th>
                    <th className="px-5 py-3.5 text-right">Статус допуска к сетке</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {participants.map((p) => {
                    const elig = athleteEligibilityMap[p.id];
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">
                          <div>{p.lastName} {p.firstName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {p.beltRank.replace('_', ' ')} · {p.licenseNumber}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-300">{p.clubName}</td>

                        <td className="px-5 py-3.5 text-slate-400 font-sans">
                          {p.categoryId
                            ? tournamentCategories.find((c) => c.id === p.categoryId)?.weightCategoryName || 'Категория'
                            : 'Не назначена'}
                        </td>

                        <td className="px-5 py-3.5 text-center text-slate-300">
                          {p.declaredWeightKg} кг / {p.actualWeightKg ? `${p.actualWeightKg} кг` : '—'}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => {
                              onUpdateParticipant({
                                ...p,
                                isWeighedIn: !p.isWeighedIn,
                                actualWeightKg: p.actualWeightKg ?? p.declaredWeightKg
                              });
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                              p.isWeighedIn
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {p.isWeighedIn ? '✓ Взвешен' : 'Не взвешен'}
                          </button>
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => {
                              onUpdateParticipant({
                                ...p,
                                isMedicalCleared: !p.isMedicalCleared
                              });
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                              p.isMedicalCleared
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {p.isMedicalCleared ? '✓ Допущен' : 'Отказ'}
                          </button>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            elig?.isAdmitted
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {elig?.isAdmitted ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            <span>{elig?.statusText}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SCHEDULE TIMELINE & BOUTS PREVIEW TAB                                  */}
      {/* ========================================================================= */}
      {activeEngineTab === 'schedule_preview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              <span className="text-white font-bold">
                Сгенерированное расписание поединков ({generatedBoutsPreview.length > 0 ? generatedBoutsPreview.length : bouts.length} матчей)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToBracketView}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold border border-slate-700"
              >
                Открыть сетку плей-офф →
              </button>
            </div>
          </div>

          {/* Matches List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(generatedBoutsPreview.length > 0 ? generatedBoutsPreview : bouts).map((match) => (
              <div
                key={match.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">#{match.boutNumber}</span>
                    <span>·</span>
                    <span className="text-rose-400 font-bold">Т{match.tatamiNumber || 1}</span>
                    <span>·</span>
                    <span className="text-white">{match.scheduledTime}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-300 border border-slate-800">
                    {match.roundStage}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-300 truncate">
                  {match.categoryName}
                </div>

                {/* Fighters */}
                <div className="space-y-1">
                  <div className="p-2 rounded bg-slate-900 flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="truncate">{match.akaParticipant?.lastName || 'АКА'} {match.akaParticipant?.firstName}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{match.akaParticipant?.clubName}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-900 flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      <span className="truncate">{match.aoParticipant?.lastName || 'АО'} {match.aoParticipant?.firstName}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{match.aoParticipant?.clubName}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Статус: <strong className="text-white">{match.status}</strong></span>
                  <button
                    onClick={() => onNavigateToScoreboard(match.id)}
                    className="text-rose-400 hover:text-rose-300 underline"
                  >
                    Открыть на табло →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SQL DATABASE SYNCHRONIZATION TAB                                       */}
      {/* ========================================================================= */}
      {activeEngineTab === 'sql_sync' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="font-bold text-white block">
                SQL-транзакция синхронизации с базой данных (PostgreSQL DDL/DML)
              </span>
              <span className="text-slate-400 text-[11px]">
                Вставляет записи посева в <code>category_entries</code> и генерирует расписание боев в таблице <code>bouts</code>.
              </span>
            </div>

            <button
              onClick={handleDownloadSql}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать sync_schedule.sql</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto no-scrollbar">
            <pre className="whitespace-pre-wrap">{generatedSqlScript || '-- Нажмите "Запустить генерацию", чтобы сформировать SQL транзакцию.'}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
