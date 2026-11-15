import React, { useState, useMemo } from 'react';
import { 
  Trophy,
  UserPlus, 
  GitBranch, 
  ShieldCheck, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Users, 
  Layers, 
  Tv, 
  Clock, 
  ArrowRight, 
  Shuffle, 
  Shield, 
  Award, 
  Check, 
  RotateCcw, 
  Trash2, 
  Lock, 
  Database, 
  ShieldAlert 
} from 'lucide-react';
import { 
  Participant, 
  Club, 
  AgeCategory, 
  WeightCategory, 
  TournamentCategory, 
  Tatami, 
  Bout, 
  BeltRank, 
  Gender, 
  Discipline,
  RoundStage,
  UserRole,
  Tournament
} from '../types/schema';
import { seedWkfBracketWithProtection, getAutoAssignedTatami } from '../utils/wkfBracketSeeding';
import { TournamentEventsManager } from './TournamentEventsManager';
import { SAMPLE_TOURNAMENTS } from '../data/sampleTournamentData';

interface AdminPanelProps {
  clubs: Club[];
  ageCategories: AgeCategory[];
  weightCategories: WeightCategory[];
  tournamentCategories: TournamentCategory[];
  tatamis: Tatami[];
  participants: Participant[];
  bouts: Bout[];
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  tournaments?: Tournament[];
  selectedTournament?: Tournament;
  onSelectTournament?: (tournament: Tournament) => void;
  onAddTournament?: (tournament: Tournament) => void;
  onUpdateTournament?: (tournament: Tournament) => void;
  onDeleteTournament?: (tournamentId: string) => void;
  onAddParticipant: (participant: Participant) => void;
  onGenerateBracket: (newBouts: Bout[], categoryId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenResetDialog?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  clubs,
  ageCategories,
  weightCategories,
  tournamentCategories,
  tatamis,
  participants,
  bouts,
  currentUserRole = 'admin',
  onRoleChange,
  tournaments = SAMPLE_TOURNAMENTS,
  selectedTournament,
  onSelectTournament,
  onAddTournament,
  onUpdateTournament,
  onDeleteTournament,
  onAddParticipant,
  onGenerateBracket,
  onNavigateTab,
  onOpenResetDialog
}) => {
  const [localTournaments, setLocalTournaments] = useState<Tournament[]>(tournaments);
  const isAdmin = currentUserRole === 'admin';

  // Sync if prop updates
  React.useEffect(() => {
    if (tournaments && tournaments.length > 0) {
      setLocalTournaments(tournaments);
    }
  }, [tournaments]);

  const [activeAdminSubtab, setActiveAdminSubtab] = useState<'events' | 'register' | 'draw' | 'status' | 'reset'>('events');

  // If user switches to Participant/Institution role while on an Admin-only subtab, redirect to 'register' or 'events'
  React.useEffect(() => {
    if (!isAdmin && (activeAdminSubtab === 'draw' || activeAdminSubtab === 'status' || activeAdminSubtab === 'reset')) {
      setActiveAdminSubtab('register');
    }
  }, [isAdmin, activeAdminSubtab]);

  // ==========================================
  // REGISTRATION FORM STATE
  // ==========================================
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clubId, setClubId] = useState(clubs[0]?.id || 'c1');
  const [athleteCity, setAthleteCity] = useState(clubs[0]?.city || 'Бишкек');
  const [athleteCountry, setAthleteCountry] = useState('Кыргызстан');
  const [customClubName, setCustomClubName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('2002-05-15');
  const [beltRank, setBeltRank] = useState<BeltRank>('black_1dan');
  const [declaredWeight, setDeclaredWeight] = useState<number>(74.0);
  const [selectedAgeCatId, setSelectedAgeCatId] = useState<string>('ac5');
  const [selectedWeightCatId, setSelectedWeightCatId] = useState<string>('wc_m_75');
  const [discipline, setDiscipline] = useState<Discipline>('kumite');
  const [isMedicalCleared, setIsMedicalCleared] = useState(true);
  const [isWeighedIn, setIsWeighedIn] = useState(false);
  const [actualWeight, setActualWeight] = useState<number | null>(null);
  const [licenseNumber, setLicenseNumber] = useState(`KGZ-KRT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Auto compute athlete age based on birthDate
  const calculatedAge = useMemo(() => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const tournamentDate = new Date('2026-11-04');
    let age = tournamentDate.getFullYear() - birth.getFullYear();
    const m = tournamentDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && tournamentDate.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [birthDate]);

  // Filter available weight categories based on selected age and gender
  const availableWeightCategories = useMemo(() => {
    return weightCategories.filter(
      (w) => w.ageCategoryId === selectedAgeCatId && w.gender === gender
    );
  }, [weightCategories, selectedAgeCatId, gender]);

  // When gender or age changes, keep selected weight category valid
  React.useEffect(() => {
    if (availableWeightCategories.length > 0) {
      const exists = availableWeightCategories.some((w) => w.id === selectedWeightCatId);
      if (!exists) {
        setSelectedWeightCatId(availableWeightCategories[0].id);
      }
    }
  }, [availableWeightCategories, selectedWeightCatId]);

  // Auto-suggest best age category when birth date changes
  const handleBirthDateChange = (dateStr: string) => {
    setBirthDate(dateStr);
    const birth = new Date(dateStr);
    const tournamentDate = new Date('2026-11-04');
    let age = tournamentDate.getFullYear() - birth.getFullYear();
    const m = tournamentDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && tournamentDate.getDate() < birth.getDate())) {
      age--;
    }
    const matchedAgeCat = ageCategories.find(
      (ac) => age >= ac.minAge && (ac.maxAge === null || age <= ac.maxAge)
    );
    if (matchedAgeCat) {
      setSelectedAgeCatId(matchedAgeCat.id);
    }
  };

  // Find currently selected weight category details for validation warning
  const currentWeightDef = weightCategories.find((w) => w.id === selectedWeightCatId);

  const weightValidation = useMemo(() => {
    if (!currentWeightDef || discipline === 'kata') return { valid: true };
    if (declaredWeight < currentWeightDef.minWeightKg) {
      return {
        valid: false,
        message: `Вес ${declaredWeight} кг ниже минимального порога категории (${currentWeightDef.minWeightKg} кг)`
      };
    }
    if (currentWeightDef.maxWeightKg && declaredWeight > currentWeightDef.maxWeightKg) {
      return {
        valid: false,
        message: `Вес ${declaredWeight} кг превышает лимит категории ${currentWeightDef.name} (${currentWeightDef.maxWeightKg} кг)`
      };
    }
    return { valid: true, message: `Вес соответствует категории ${currentWeightDef.name}` };
  }, [currentWeightDef, declaredWeight, discipline]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    // Find or target category
    const targetTournamentCat = tournamentCategories.find(
      (tc) =>
        tc.ageCategoryId === selectedAgeCatId &&
        (discipline === 'kata' || tc.weightCategoryId === selectedWeightCatId) &&
        tc.gender === gender
    );

    const clubObj = clubs.find((c) => c.id === clubId);
    const clubName = clubId === 'custom' ? customClubName : clubObj?.name || 'СК';

    const newParticipant: Participant = {
      id: `p_${Date.now()}`,
      tournamentId: 'tourn1',
      clubId: clubId === 'custom' ? 'c_custom' : clubId,
      clubName,
      city: athleteCity.trim() || clubObj?.city || 'Бишкек',
      country: athleteCountry.trim() || 'Кыргызстан',
      categoryId: targetTournamentCat?.id || 'tc1',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate,
      beltRank,
      declaredWeightKg: Number(declaredWeight),
      actualWeightKg: isWeighedIn ? (actualWeight !== null ? Number(actualWeight) : Number(declaredWeight)) : null,
      isWeighedIn,
      isMedicalCleared,
      status: isWeighedIn ? 'weighed_in' : 'registered',
      licenseNumber: licenseNumber.trim()
    };

    onAddParticipant(newParticipant);

    setRegistrationSuccess(
      `Спортсмен ${newParticipant.lastName} ${newParticipant.firstName} успешно зарегистрирован в категорию "${currentWeightDef?.name || 'Ката'}" (${clubName})!`
    );

    // Reset inputs for next registration
    setFirstName('');
    setLastName('');
    setLicenseNumber(`KGZ-KRT-${Math.floor(1000 + Math.random() * 9000)}`);
    setTimeout(() => setRegistrationSuccess(null), 5000);
  };

  // ==========================================
  // PLAYOFF BRACKET GENERATOR STATE
  // ==========================================
  const [selectedDrawCategory, setSelectedDrawCategory] = useState<string>(
    tournamentCategories[0]?.id || 'tc1'
  );
  const [seedingMethod, setSeedingMethod] = useState<'club_separation' | 'random' | 'ranked'>('club_separation');
  const [targetTatamiId, setTargetTatamiId] = useState<string>('t1');
  const [bracketStartTime, setBracketStartTime] = useState<string>('12:00');
  const [boutIntervalMinutes, setBoutIntervalMinutes] = useState<number>(10);
  const [generatedSummary, setGeneratedSummary] = useState<{
    boutsCount: number;
    participantsCount: number;
    tatamiNumber: number;
    categoryTitle: string;
  } | null>(null);
  const [seedingProtectionReport, setSeedingProtectionReport] = useState<any>(null);

  // Athletes registered in the chosen draw category
  const categoryAthletes = useMemo(() => {
    return participants.filter(
      (p) => p.categoryId === selectedDrawCategory || (!p.categoryId && selectedDrawCategory === 'tc1')
    );
  }, [participants, selectedDrawCategory]);

  const activeCategoryObj = tournamentCategories.find((tc) => tc.id === selectedDrawCategory);

  // Automatically assign tatami on category change based on division rules
  React.useEffect(() => {
    if (activeCategoryObj && tatamis.length > 0) {
      const autoTat = getAutoAssignedTatami(activeCategoryObj, tatamis);
      setTargetTatamiId(autoTat.tatami.id);
    }
  }, [selectedDrawCategory, activeCategoryObj, tatamis]);

  const autoTatamiPreview = useMemo(() => {
    if (!activeCategoryObj || tatamis.length === 0) return null;
    return getAutoAssignedTatami(activeCategoryObj, tatamis);
  }, [activeCategoryObj, tatamis]);

  // Intelligent Playoff Generation Logic
  const handleExecuteDraw = () => {
    if (categoryAthletes.length < 2) {
      alert('Для генерации сетки плей-офф необходимо как минимум 2 участника в категории!');
      return;
    }

    const tatamiObj = tatamis.find((t) => t.id === targetTatamiId) || tatamis[0];
    const categoryTitle = `${activeCategoryObj?.ageCategoryName || 'Взрослые 18+'} · ${activeCategoryObj?.weightCategoryName || '-75 кг'}`;

    // Determine Bracket Depth (Power of 2: 4, 8, 16)
    const count = categoryAthletes.length;
    let bracketSize = 4;
    if (count > 8) bracketSize = 16;
    else if (count > 4) bracketSize = 8;

    let bracketSlots: (Participant | null)[] = [];

    if (seedingMethod === 'club_separation') {
      // Official WKF Algorithm: Strict Club, City and Country separation in Round 1 & Round 2
      const { slots, report } = seedWkfBracketWithProtection(categoryAthletes, bracketSize);
      bracketSlots = slots;
      setSeedingProtectionReport(report);
    } else {
      let seededAthletes = [...categoryAthletes];
      if (seedingMethod === 'random') {
        seededAthletes.sort(() => Math.random() - 0.5);
      } else if (seedingMethod === 'ranked') {
        const beltWeights: Record<string, number> = {
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
        seededAthletes.sort((a, b) => (beltWeights[b.beltRank] || 0) - (beltWeights[a.beltRank] || 0));
      }
      for (let i = 0; i < bracketSize; i++) {
        bracketSlots.push(seededAthletes[i] || null);
      }
      setSeedingProtectionReport(null);
    }

    // 3. Generate Rounds
    // E.g. For bracketSize = 8:
    // Quarter-finals: 4 bouts (indices 0 vs 1, 2 vs 3, 4 vs 5, 6 vs 7)
    // Semi-finals: 2 bouts
    // Final: 1 bout
    // Bronze: 1 bout
    const generatedBouts: Bout[] = [];
    const [startH, startM] = bracketStartTime.split(':').map(Number);
    let currentMinuteOffset = 0;

    const computeTime = (offsetMins: number) => {
      const totalMinutes = startH * 60 + startM + offsetMins;
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    let boutCounter = tatamiObj.number * 100 + 10;

    if (bracketSize === 8) {
      // 1/4 Final (4 bouts)
      const qfBouts: Bout[] = [];
      for (let i = 0; i < 4; i++) {
        const aka = bracketSlots[i * 2];
        const ao = bracketSlots[i * 2 + 1];
        boutCounter++;
        const b: Bout = {
          id: `bout_gen_${Date.now()}_qf_${i}`,
          tournamentId: 'tourn1',
          categoryId: selectedDrawCategory,
          categoryName: categoryTitle,
          tatamiId: tatamiObj.id,
          tatamiNumber: tatamiObj.number,
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
          timerSecondsRemaining: 180
        };
        currentMinuteOffset += boutIntervalMinutes;
        qfBouts.push(b);
        generatedBouts.push(b);
      }

      // Semi-finals (2 bouts)
      for (let i = 0; i < 2; i++) {
        boutCounter++;
        const b: Bout = {
          id: `bout_gen_${Date.now()}_sf_${i}`,
          tournamentId: 'tourn1',
          categoryId: selectedDrawCategory,
          categoryName: categoryTitle,
          tatamiId: tatamiObj.id,
          tatamiNumber: tatamiObj.number,
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
          timerSecondsRemaining: 180
        };
        currentMinuteOffset += boutIntervalMinutes;
        generatedBouts.push(b);
      }

      // Bronze Match
      boutCounter++;
      generatedBouts.push({
        id: `bout_gen_${Date.now()}_bronze`,
        tournamentId: 'tourn1',
        categoryId: selectedDrawCategory,
        categoryName: categoryTitle,
        tatamiId: tatamiObj.id,
        tatamiNumber: tatamiObj.number,
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
        timerSecondsRemaining: 180
      });
      currentMinuteOffset += boutIntervalMinutes;

      // Final (Gold Match)
      boutCounter++;
      generatedBouts.push({
        id: `bout_gen_${Date.now()}_final`,
        tournamentId: 'tourn1',
        categoryId: selectedDrawCategory,
        categoryName: categoryTitle,
        tatamiId: tatamiObj.id,
        tatamiNumber: tatamiObj.number,
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
    } else {
      // 4-competitor direct semi-finals
      for (let i = 0; i < 2; i++) {
        const aka = bracketSlots[i * 2];
        const ao = bracketSlots[i * 2 + 1];
        boutCounter++;
        generatedBouts.push({
          id: `bout_gen_${Date.now()}_sf_${i}`,
          tournamentId: 'tourn1',
          categoryId: selectedDrawCategory,
          categoryName: categoryTitle,
          tatamiId: tatamiObj.id,
          tatamiNumber: tatamiObj.number,
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
        currentMinuteOffset += boutIntervalMinutes;
      }

      // Final
      boutCounter++;
      generatedBouts.push({
        id: `bout_gen_${Date.now()}_final`,
        tournamentId: 'tourn1',
        categoryId: selectedDrawCategory,
        categoryName: categoryTitle,
        tatamiId: tatamiObj.id,
        tatamiNumber: tatamiObj.number,
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

    onGenerateBracket(generatedBouts, selectedDrawCategory);

    setGeneratedSummary({
      boutsCount: generatedBouts.length,
      participantsCount: categoryAthletes.length,
      tatamiNumber: tatamiObj.number,
      categoryTitle
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with RBAC Role Switcher */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider">
              <span
                className={`px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 font-bold ${
                  isAdmin
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                <span>
                  {isAdmin
                    ? 'Роль RBAC: Администратор (Полный доступ)'
                    : 'Роль RBAC: Участник / Учреждение (Ограниченный кабинет)'}
                </span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
              {isAdmin
                ? 'Панель администратора соревнований'
                : 'Ограниченный кабинет участника и спортивного учреждения'}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {isAdmin
                ? 'Полный административный контроль: создание, изменение, архивация и удаление турниров с подтверждением, жеребьевка и управление БД.'
                : 'Кабинет приглашённого клуба и участника: подача заявок на регистрацию, просмотр актуальных и архивных турниров, сеток и прямых трансляций (без прав на изменение или удаление турниров).'}
            </p>
          </div>

          {/* Right: Quick Metrics */}
          <div className="flex items-center gap-2.5 text-xs font-mono shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              Спортсменов: <span className="font-bold text-white">{participants.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              Поединков: <span className="font-bold text-rose-400">{bouts.length}</span>
            </div>
          </div>
        </div>

        {/* Sub-tab navigation (Filtered by RBAC) */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveAdminSubtab('events')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeAdminSubtab === 'events'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>
              {isAdmin
                ? 'Создание, управление и Архив событий'
                : 'Реестр и Архив турниров (просмотр)'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
              {localTournaments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminSubtab('register')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeAdminSubtab === 'register'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Регистрация участника</span>
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveAdminSubtab('draw')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAdminSubtab === 'draw'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Генератор сетки плей-офф</span>
              </button>
              <button
                onClick={() => setActiveAdminSubtab('status')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAdminSubtab === 'status'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Мандатная комиссия ({participants.filter(p => p.isWeighedIn).length}/{participants.length})</span>
              </button>
              <button
                onClick={() => setActiveAdminSubtab('reset')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAdminSubtab === 'reset'
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Очистка данных (1 клик)</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigateTab('virtual_studios')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5 text-sky-400" />
                <span>Сейчас на татами (LIVE)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('coach')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Кабинет клуба / Заявка команды</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 0. TOURNAMENT EVENTS MANAGER TAB                                 */}
      {/* ================================================================= */}
      {activeAdminSubtab === 'events' && (
        <TournamentEventsManager
          tournaments={localTournaments}
          currentUserRole={currentUserRole}
          onRoleChange={onRoleChange}
          selectedTournament={selectedTournament}
          onSelectTournament={onSelectTournament}
          onAddTournament={(t) => {
            if (!isAdmin) return;
            setLocalTournaments((prev) => [t, ...prev]);
            if (onAddTournament) onAddTournament(t);
          }}
          onUpdateTournament={(t) => {
            if (!isAdmin) return;
            setLocalTournaments((prev) => prev.map((item) => (item.id === t.id ? t : item)));
            if (onUpdateTournament) onUpdateTournament(t);
          }}
          onDeleteTournament={(id) => {
            if (!isAdmin) return;
            setLocalTournaments((prev) => prev.filter((item) => item.id !== id));
            if (onDeleteTournament) onDeleteTournament(id);
          }}
          onNavigateToDetails={(t) => {
            if (onSelectTournament) onSelectTournament(t);
            onNavigateTab('tournament_details');
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 1. PARTICIPANT REGISTRATION FORM TAB                             */}
      {/* ================================================================= */}
      {activeAdminSubtab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-rose-400" />
                  <span>Форма электронной заявки спортсмена</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Заполните персональные данные, спортивную квалификацию и соревновательный дивизион
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Таблица: participants
              </span>
            </div>

            {registrationSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{registrationSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Row 1: Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Фамилия спортсмена <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="напр. Турдубаев"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Имя спортсмена <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="напр. Артур"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Row 2: Club & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Клуб / Спортивная школа <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClubId(val);
                      if (val !== 'custom') {
                        const c = clubs.find((item) => item.id === val);
                        if (c) setAthleteCity(c.city);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                    <option value="custom">+ Добавить другой клуб...</option>
                  </select>

                  {clubId === 'custom' && (
                    <input
                      type="text"
                      placeholder="Введите название нового клуба..."
                      value={customClubName}
                      onChange={(e) => setCustomClubName(e.target.value)}
                      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  )}

                  {/* Mandatory City & Country inputs for WKF seeding protection */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Город (city) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={athleteCity}
                        onChange={(e) => setAthleteCity(e.target.value)}
                        placeholder="Город..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Страна (country) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={athleteCountry}
                        onChange={(e) => setAthleteCountry(e.target.value)}
                        placeholder="Страна..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Пол участника
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                        gender === 'male'
                          ? 'bg-rose-950/60 border-rose-600 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Мужской
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                        gender === 'female'
                          ? 'bg-rose-950/60 border-rose-600 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Женский
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Birth Date & Belt Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Дата рождения
                    </label>
                    <span className="text-[11px] font-mono text-rose-400">
                      Возраст: {calculatedAge} лет
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Квалификация (Пояс / Дан)
                  </label>
                  <select
                    value={beltRank}
                    onChange={(e) => setBeltRank(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="white_10kyu">Белый пояс (10 кю)</option>
                    <option value="yellow_8kyu">Желтый пояс (8 кю)</option>
                    <option value="orange_7kyu">Оранжевый пояс (7 кю)</option>
                    <option value="green_6kyu">Зеленый пояс (6 кю)</option>
                    <option value="blue_4kyu">Синий пояс (4 кю)</option>
                    <option value="brown_3kyu">Коричневый пояс (3 кю)</option>
                    <option value="brown_1kyu">Коричневый пояс (1 кю)</option>
                    <option value="black_1dan">Черный пояс 1 Дан</option>
                    <option value="black_2dan">Черный пояс 2 Дан</option>
                    <option value="black_3dan_plus">Черный пояс 3+ Дан</option>
                  </select>
                </div>
              </div>

              {/* Division Section: Age + Weight Categories */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-900 pb-2">
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Выбор соревновательной категории турнира</span>
                  </span>
                  <span>WKF Rules</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Discipline */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Дисциплина
                    </label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="kumite">Кумитэ (Поединки)</option>
                      <option value="kata">Ката (Формальные комплексы)</option>
                    </select>
                  </div>

                  {/* Age Category Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Возрастная категория
                    </label>
                    <select
                      value={selectedAgeCatId}
                      onChange={(e) => setSelectedAgeCatId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {ageCategories.map((ac) => (
                        <option key={ac.id} value={ac.id}>
                          {ac.name} ({ac.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Weight Category Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Весовая категория
                    </label>
                    {discipline === 'kata' ? (
                      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 italic">
                        Не применяется для Ката
                      </div>
                    ) : (
                      <select
                        value={selectedWeightCatId}
                        onChange={(e) => setSelectedWeightCatId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      >
                        {availableWeightCategories.map((wc) => (
                          <option key={wc.id} value={wc.id}>
                            {wc.name} ({wc.minWeightKg} - {wc.maxWeightKg ? `${wc.maxWeightKg} кг` : '∞'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Declared Weight & Real-time validation */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Заявленный вес спортсмена (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={declaredWeight}
                      onChange={(e) => setDeclaredWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-slate-400 mb-1">
                      Проверка границ категории:
                    </span>
                    <div
                      className={`p-2 rounded-lg text-[11px] font-mono flex items-center gap-1.5 ${
                        weightValidation.valid
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {weightValidation.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      )}
                      <span className="truncate">{weightValidation.message}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Number & Approvals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Спортивный паспорт / Лицензия
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMedicalCleared}
                      onChange={(e) => setIsMedicalCleared(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">
                      Медицинский допуск врача соревнований подтвержден
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWeighedIn}
                      onChange={(e) => setIsWeighedIn(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">
                      Контрольное взвешивание уже пройдено
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFirstName('');
                    setLastName('');
                  }}
                  className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
                >
                  Очистить форму
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Зарегистрировать в базу данных</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Guidance & Rules (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                Регламент регистрации WKF
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                При подаче заявки система проверяет возраст спортсмена на дату турнира 
                и подбирает соответствующую категорию.
              </p>
              <div className="space-y-2 text-xs font-mono text-slate-400 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900">
                  <span className="text-slate-200 block font-bold">1. Дети (U10, U12):</span>
                  <span>Время боя 90 секунд, облегченный весовой ряд.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900">
                  <span className="text-slate-200 block font-bold">2. Кадеты (14-15 лет):</span>
                  <span>Время боя 2 минуты, веса -52, -57, -63, -70, +70 кг.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900">
                  <span className="text-slate-200 block font-bold">3. Взрослые (18+):</span>
                  <span>Чистое время 3 минуты, олимпийские категории WKF.</span>
                </div>
              </div>
            </div>

            {/* Recently registered list */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Последние зарегистрированные</h4>
                <span className="text-[11px] font-mono text-slate-500">Всего: {participants.length}</span>
              </div>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {participants.slice(-5).reverse().map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{p.lastName} {p.firstName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{p.declaredWeightKg} кг</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                      <span>{p.clubName}</span>
                      <span className="text-emerald-400 font-mono">
                        {p.isWeighedIn ? 'Взвешен' : 'Заявлен'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. PLAYOFF BRACKET GENERATOR ENGINE TAB                           */}
      {/* ================================================================= */}
      {activeAdminSubtab === 'draw' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Алгоритм автоматической жеребьевки и генерации сетки</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Генератор олимпийской сетки плей-офф WKF
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Формирует поединки 1/4, 1/2, финал и бой за бронзу с привязкой к татами и расчетным временем начала.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('bracket')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Просмотр текущей сетки</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Generated Success Banner */}
            {generatedSummary && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Сетка плей-офф успешно сгенерирована!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab('bracket')}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Смотреть сетку
                    </button>
                    <button
                      onClick={() => onNavigateTab('schedule')}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Расписание на татами
                    </button>
                  </div>
                </div>
                <p className="text-slate-300">
                  Для дивизиона <span className="font-bold text-white">{generatedSummary.categoryTitle}</span> создано{' '}
                  <span className="font-bold text-white">{generatedSummary.boutsCount} поединков</span> на{' '}
                  <span className="font-bold text-white">Татами №{generatedSummary.tatamiNumber}</span> для{' '}
                  <span className="font-bold text-white">{generatedSummary.participantsCount} участников</span>.
                </p>
              </div>
            )}

            {/* Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Col 1: Select Category */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    1. Выберите категорию турнира для жеребьевки:
                  </label>
                  <select
                    value={selectedDrawCategory}
                    onChange={(e) => setSelectedDrawCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                  >
                    {tournamentCategories.map((tc) => {
                      const count = participants.filter((p) => p.categoryId === tc.id || (!p.categoryId && tc.id === 'tc1')).length;
                      return (
                        <option key={tc.id} value={tc.id}>
                          {tc.ageCategoryName} · {tc.weightCategoryName || 'Ката'} ({count} спортсменов)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Athletes list for this category */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Участники в категории:</span>
                    <span className="font-bold text-white">{categoryAthletes.length}</span>
                  </div>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto text-xs">
                    {categoryAthletes.map((a, i) => (
                      <div key={a.id} className="p-1.5 bg-slate-900 rounded border border-slate-900 flex items-center justify-between">
                        <span className="text-white font-medium truncate">
                          {i + 1}. {a.lastName} {a.firstName}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] shrink-0">
                          {a.clubName?.replace('СК ', '').replace('Додзё ', '') || 'Клуб'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Col 2: Seeding Strategy */}
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  2. Алгоритм посева и жеребьевки:
                </label>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSeedingMethod('club_separation')}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      seedingMethod === 'club_separation'
                        ? 'bg-rose-950/50 border-rose-600 ring-1 ring-rose-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-rose-400" />
                        <span>Разведение WKF: Клуб, Город и Страна</span>
                      </span>
                      {seedingMethod === 'club_separation' && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Гарантированное разведение: поединки между представителями одного клуба, города или страны невозможны в первых двух кругах.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeedingMethod('ranked')}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      seedingMethod === 'ranked'
                        ? 'bg-rose-950/50 border-rose-600 ring-1 ring-rose-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-sky-400" />
                        <span>Посев по квалификации (Данам)</span>
                      </span>
                      {seedingMethod === 'ranked' && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Старшие черные пояса распределяются на противоположные полюса сетки.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeedingMethod('random')}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      seedingMethod === 'random'
                        ? 'bg-rose-950/50 border-rose-600 ring-1 ring-rose-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Случайная слепая жеребьевка</span>
                      </span>
                      {seedingMethod === 'random' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Абсолютно случайное перемешивание слотов сетки.
                    </p>
                  </button>
                </div>
              </div>

              {/* Col 3: Tatami & Schedule Parameters */}
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  3. Параметры назначения на татами:
                </label>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-400">
                        Назначенное татами:
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        Авто-выбор по дивизиону
                      </span>
                    </div>
                    <select
                      value={targetTatamiId}
                      onChange={(e) => setTargetTatamiId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                    >
                      {tatamis.map((t) => (
                        <option key={t.id} value={t.id}>
                          Татами №{t.number} ({t.name})
                        </option>
                      ))}
                    </select>

                    {autoTatamiPreview && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-950/30 border border-rose-900/50 text-[10px] text-slate-300">
                        <div className="text-rose-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Назначено для дивизиона: Татами №{autoTatamiPreview.tatami.number}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5 font-mono">{autoTatamiPreview.reason}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Время старта:
                      </label>
                      <input
                        type="time"
                        value={bracketStartTime}
                        onChange={(e) => setBracketStartTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Интервал (мин):
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={boutIntervalMinutes}
                        onChange={(e) => setBoutIntervalMinutes(parseInt(e.target.value) || 10)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Формат сетки:</span>
                      <span className="font-mono text-white">Плей-офф WKF</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Утешение за бронзу:</span>
                      <span className="font-mono text-emerald-400">Включено</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteDraw}
                  className="w-full py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Сгенерировать сетку плей-офф</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. MANDATE & WEIGH-IN STATUS TAB                                  */}
      {/* ================================================================= */}
      {activeAdminSubtab === 'status' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Готовность категорий к проведению соревнований
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Контроль прохождения мандатной комиссии и допуска участников к жеребьевке
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('participants')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Открыть реестр взвешивания
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournamentCategories.map((tc) => {
                const catAthletes = participants.filter((p) => p.categoryId === tc.id || (!p.categoryId && tc.id === 'tc1'));
                const weighedCount = catAthletes.filter((p) => p.isWeighedIn).length;
                const isReady = catAthletes.length >= 2 && weighedCount >= 2;

                return (
                  <div key={tc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {tc.weightCategoryName || 'Ката'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                        {tc.ageCategoryName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Заявлено: {catAthletes.length}</span>
                      <span>Взвешено: {weighedCount}</span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full"
                        style={{
                          width: `${catAthletes.length ? (weighedCount / catAthletes.length) * 100 : 0}%`
                        }}
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span
                        className={`text-[11px] font-mono ${
                          isReady ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isReady ? '✓ Готово к жеребьевке' : 'Ожидает взвешивания'}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedDrawCategory(tc.id);
                          setActiveAdminSubtab('draw');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Жеребьевка →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ONE-CLICK DATABASE CLEANUP & RESET TOOL                                */}
      {/* ========================================================================= */}
      {activeAdminSubtab === 'reset' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>АДМИНИСТРАТИВНЫЙ ИНСТРУМЕНТ · ТОЛЬКО ДЛЯ АДМИНИСТРАТОРОВ</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Очистка сетки, протоколов и баллов в 1 клик
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Быстрое обнуление результатов турнира или восстановление тестовых данных. 
                Структура базы данных, таблицы, категории, клубы и список участников полностью сохраняются.
              </p>
            </div>

            {onOpenResetDialog && (
              <button
                onClick={onOpenResetDialog}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Открыть окно очистки данных</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-mono">
                <Trash2 className="w-4 h-4" />
                <span>Сетка плей-офф и баллы</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Сбрасывает текущий счёт (0:0), победителей, штрафы и переводит все поединки в статус 'scheduled'. 
                Участники остаются распределенными по слотам.
              </p>
              <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Затронуто поединков: <strong>{bouts.length}</strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-mono">
                <ShieldAlert className="w-4 h-4" />
                <span>Судейские протоколы</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Полная очистка реестра протоколов <code className="text-rose-400">referee_protocols</code> и 
                истории подтверждённых оценок <code className="text-rose-400">bout_scores</code> без повреждения схемы.
              </p>
              <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Очистка таблиц: <span className="text-emerald-400">TRUNCATE CASCADE</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Восстановление демо-данных</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                В один клик возвращает эталонный демонстрационный турнир WKF: завершённые бои 1/8, 1/4, полуфиналы, 
                заверенные протоколы и живой медальный зачет клубов.
              </p>
              <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Эталонный датасет: <span className="text-amber-400">SAMPLE_BOUTS + PROTOCOLS</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                Целостность базы данных: <strong className="text-white">13 таблиц PostgreSQL</strong> защищены от удаления
              </span>
            </div>

            {onOpenResetDialog && (
              <button
                onClick={onOpenResetDialog}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/80 rounded-xl font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Параметры очистки →</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
