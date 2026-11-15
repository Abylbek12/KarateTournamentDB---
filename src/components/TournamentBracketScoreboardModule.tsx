import { durationForCategory } from '../data/sampleTournamentData';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as E from '../utils/boutEngine';
import { 
  Trophy, 
  Tv, 
  GitBranch, 
  Shield, 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  Clock, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  Sliders, 
  Sparkles, 
  FileText, 
  UserCheck, 
  Activity, 
  Zap, 
  ArrowRight, 
  RefreshCw,
  LayoutGrid,
  Square,
  Flame,
  Check,
  ChevronRight,
  Filter,
  Eye,
  Flag,
  Share2
} from 'lucide-react';
import { 
  Tatami, 
  Bout, 
  Participant, 
  TournamentCategory, 
  TournamentRules, 
  RefereeProtocol, 
  UserRole, 
  WinReason,
  Club
} from '../types/schema';
import { generateProtectedWkfCategoryBouts, WkfSeedingReport } from '../utils/wkfBracketSeeding';
import { refereeAudio } from '../utils/refereeAudio';
import { RefereeElectronicVotingAndVrModule } from './RefereeElectronicVotingAndVrModule';

export interface TournamentBracketScoreboardModuleProps {
  tatamis: Tatami[];
  bouts: Bout[];
  participants: Participant[];
  tournamentCategories: TournamentCategory[];
  clubs: Club[];
  tournamentRules?: TournamentRules;
  currentUserRole?: UserRole;
  protocols?: RefereeProtocol[];
  initialBoutId?: string;
  initialSubTab?: 'multi_tatami' | 'bracket' | 'referee' | 'auto_draw' | 'vr';
  onRulesChange?: (rules: TournamentRules) => void;
  onUpdateBout: (bout: Bout) => void;
  onBatchUpdateBouts?: (bouts: Bout[]) => void;
  onSaveProtocol?: (protocol: RefereeProtocol) => void;
  onNavigateToProtocols?: (boutId?: string) => void;
}

export const TournamentBracketScoreboardModule: React.FC<TournamentBracketScoreboardModuleProps> = ({
  tatamis,
  bouts,
  participants,
  tournamentCategories,
  clubs,
  tournamentRules = 'wkf',
  currentUserRole = 'admin',
  protocols = [],
  initialBoutId,
  initialSubTab = 'multi_tatami',
  onRulesChange,
  onUpdateBout,
  onBatchUpdateBouts,
  onSaveProtocol,
  onNavigateToProtocols
}) => {
  // Main Sub-Tab selection
  const [activeSubTab, setActiveSubTab] = useState<'multi_tatami' | 'bracket' | 'referee' | 'auto_draw' | 'vr'>(initialSubTab);

  // Selected Category for bracket & auto draw
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    tournamentCategories[0]?.id || 'tc1'
  );

  // Focused Tatami for multi-tatami filter: 0 = all tatamis, 1..4 = specific tatami
  const [focusedTatamiNumber, setFocusedTatamiNumber] = useState<number>(0);

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Global Multi-Tatami Running Timers state: map of boutId -> boolean (isRunning)
  // Running clocks come from the bouts themselves (shared by every screen); `now` redraws them.
  const runningTimers = useMemo<Record<string, boolean>>(
    () => Object.fromEntries(bouts.map((b) => [b.id, E.isRunning(b)])),
    [bouts]
  );
  const [now, setNow] = useState(Date.now());
  const anyRunning = bouts.some((b) => E.isRunning(b));
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [anyRunning]);

  // Active Bout in Referee Console
  const [refereeBoutId, setRefereeBoutId] = useState<string>(
    initialBoutId || bouts[0]?.id || ''
  );

  // Referee Win Modal state
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [pendingWinnerSide, setPendingWinnerSide] = useState<'aka' | 'ao'>('aka');
  const [selectedWinReason, setSelectedWinReason] = useState<WinReason>('points_lead');

  // Fukushin (Corner Judges) flag votes in referee console
  const [fukushinVotes, setFukushinVotes] = useState<Array<{ judge: number; vote: 'none' | 'aka' | 'ao' }>>([
    { judge: 1, vote: 'none' },
    { judge: 2, vote: 'none' },
    { judge: 3, vote: 'none' },
    { judge: 4, vote: 'none' }
  ]);

  // Doctor 60s emergency timer in referee console
  const [doctorSeconds, setDoctorSeconds] = useState<number | null>(null);

  // System notification toast
  const [systemToast, setSystemToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setSystemToast({ message, type });
    setTimeout(() => setSystemToast(null), 4500);
  };

  // Ensure referee bout exists
  const activeRefereeBout = useMemo(() => {
    return bouts.find((b) => b.id === refereeBoutId) || bouts[0];
  }, [bouts, refereeBoutId]);

  // Sync initialSubTab when parent changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync initialBoutId when parent changes
  useEffect(() => {
    if (initialBoutId) {
      setRefereeBoutId(initialBoutId);
    }
  }, [initialBoutId]);

  // -------------------------------------------------------------
  // Clock events: 15-second signal and time-up (rules in utils/boutEngine.ts)
  // -------------------------------------------------------------
  const warnedRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    bouts.forEach((bout) => {
      if (!E.isRunning(bout)) return;
      const left = E.remainingSeconds(bout, now);
      if (left > E.WARNING_AT_SECONDS) warnedRef.current[bout.id] = false;
      else if (!warnedRef.current[bout.id] && left > 0) {
        warnedRef.current[bout.id] = true;
        if (soundEnabled) refereeAudio.playWarning15s();
      }
      if (left <= 0) {
        if (soundEnabled) refereeAudio.playGong();
        onUpdateBout(E.onTimeUp(bout, tournamentRules));
      }
    });
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Doctor 60s Countdown
  useEffect(() => {
    if (doctorSeconds === null || doctorSeconds <= 0) return;
    const docInterval = setInterval(() => {
      setDoctorSeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (soundEnabled) refereeAudio.playBuzzer();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(docInterval);
  }, [doctorSeconds, soundEnabled]);

  // Format MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Global Multi-Tatami Master Controls
  // -------------------------------------------------------------
  const handleStartAllTatamiTimers = () => {
    let startedCount = 0;
    tatamis.forEach((t) => {
      const tatamiBout = bouts.find((b) => b.tatamiId === t.id && b.status !== 'completed' && b.akaParticipantId && b.aoParticipantId);
      if (tatamiBout && !E.isRunning(tatamiBout) && E.remainingSeconds(tatamiBout) > 0) {
        onUpdateBout(E.startClock(tatamiBout));
        startedCount++;
      }
    });
    if (soundEnabled && startedCount > 0) refereeAudio.playBuzzer();
    showToast(`Запущен бой на ${startedCount} татами`, 'success');
  };

  const handlePauseAllTatamiTimers = () => {
    bouts.filter((b) => E.isRunning(b)).forEach((b) => onUpdateBout(E.stopClock(b)));
    showToast('Все татами поставлены на паузу', 'info');
  };

  const handleResetAllTatamiTimers = () => {
    const resetBouts = bouts.map((b) => (b.status === 'in_progress' ? E.resetClock(b) : b));
    if (onBatchUpdateBouts) onBatchUpdateBouts(resetBouts);
    else resetBouts.forEach((b) => onUpdateBout(b));
    showToast('Время идущих боёв возвращено к началу', 'info');
  };

  const handleToggleTimer = (boutId: string) => {
    const bout = bouts.find((b) => b.id === boutId);
    if (!bout) return;
    if (E.isRunning(bout)) {
      onUpdateBout(E.stopClock(bout));
    } else {
      const started = E.startClock(bout);
      if (started === bout) {
        showToast(bout.awaitingDecision ? 'Нужно решение судей (Хантей)' : 'Бой нельзя начать: нет пары или время вышло', 'warning');
        return;
      }
      if (soundEnabled) refereeAudio.playBuzzer();
      onUpdateBout(started);
    }
  };

  const handleAdjustTimer = (boutId: string, deltaSeconds: number) => {
    const bout = bouts.find((b) => b.id === boutId);
    if (bout) onUpdateBout(E.adjustClock(bout, deltaSeconds));
  };

  const handleResetSingleTimer = (boutId: string) => {
    const bout = bouts.find((b) => b.id === boutId);
    if (bout) onUpdateBout(E.resetClock(bout));
  };

  // -------------------------------------------------------------
  // Scoring (WKF rules from utils/boutEngine.ts)
  // -------------------------------------------------------------
  const handleAddPoints = (boutId: string, side: 'aka' | 'ao', delta: number) => {
    const bout = bouts.find((b) => b.id === boutId);
    if (!bout) return;
    const updated = E.addScore(bout, side, delta);
    if (updated === bout) return;
    if (soundEnabled && delta > 0) refereeAudio.playPointChime(delta);
    if (updated.winReason === 'mercy_rule_8pt' && bout.status !== 'completed') {
      showToast('Разница 8 очков — бой завершён', 'warning');
      if (soundEnabled) refereeAudio.playGong();
    }
    onUpdateBout(updated);
  };

  const handleToggleSenshu = (boutId: string, side: 'aka' | 'ao') => {
    const bout = bouts.find((b) => b.id === boutId);
    if (!bout) return;
    onUpdateBout(E.setSenshu(bout, side, !(side === 'aka' ? bout.akaSenshu : bout.aoSenshu)));
  };

  const handleAddPenalty = (boutId: string, side: 'aka' | 'ao', category: 'c1' | 'c2', delta: number) => {
    const bout = bouts.find((b) => b.id === boutId);
    if (!bout) return;
    const current =
      category === 'c1' ? (side === 'aka' ? bout.akaPenaltiesC1 : bout.aoPenaltiesC1) : side === 'aka' ? bout.akaPenaltiesC2 : bout.aoPenaltiesC2;
    const updated = E.setPenalty(bout, side, category, current + delta);
    if (updated.winReason === 'hansoku_dq' && bout.status !== 'completed') {
      showToast(`Хансоку (${category.toUpperCase()}): ${side === 'aka' ? 'АКА' : 'АО'} проигрывает бой`, 'warning');
    }
    onUpdateBout(updated);
  };

  // -------------------------------------------------------------
  // Match Finalization & Automatic Playoff Advancement
  // -------------------------------------------------------------
  const handleOpenWinModal = (side: 'aka' | 'ao') => {
    setPendingWinnerSide(side);
    setSelectedWinReason('points_lead');
    setIsWinModalOpen(true);
  };

  const handleConfirmFinishBout = () => {
    if (!activeRefereeBout) return;

    const winnerId = pendingWinnerSide === 'aka' 
      ? activeRefereeBout.akaParticipantId 
      : activeRefereeBout.aoParticipantId;

    if (!winnerId) {
      showToast('Ошибка: у победителя отсутствует ID участника', 'warning');
      setIsWinModalOpen(false);
      return;
    }

    const winnerParticipant = participants.find((p) => p.id === winnerId);
    const updatedBout: Bout = E.declareWinner(activeRefereeBout, pendingWinnerSide, selectedWinReason);

    // Update bout (App.tsx will automatically advance winner to next round!)
    onUpdateBout(updatedBout);

    // Create official referee protocol
    if (onSaveProtocol) {
      const newProtocol: RefereeProtocol = {
        id: `prot_${Date.now()}_${activeRefereeBout.id}`,
        protocolNumber: `WKF-PR-${activeRefereeBout.boutNumber}`,
        boutId: activeRefereeBout.id,
        tournamentId: activeRefereeBout.tournamentId || 'tourn1',
        categoryId: activeRefereeBout.categoryId,
        categoryName: activeRefereeBout.categoryName,
        discipline: activeRefereeBout.discipline || 'kumite',
        tatamiNumber: activeRefereeBout.tatamiNumber || 1,
        roundStage: activeRefereeBout.roundStage,
        akaParticipantId: activeRefereeBout.akaParticipantId,
        aoParticipantId: activeRefereeBout.aoParticipantId,
        akaParticipantName: `${activeRefereeBout.akaParticipant?.lastName || 'AKA'} ${activeRefereeBout.akaParticipant?.firstName || ''}`.trim(),
        aoParticipantName: `${activeRefereeBout.aoParticipant?.lastName || 'AO'} ${activeRefereeBout.aoParticipant?.firstName || ''}`.trim(),
        akaClub: activeRefereeBout.akaParticipant?.clubName || 'Клуб AKA',
        aoClub: activeRefereeBout.aoParticipant?.clubName || 'Клуб AO',
        shushinRefereeName: 'Белов А.Г. (Главный рефери)',
        kansaArbitratorName: 'Суханов Д.О.',
        fukushinReferees: ['Кузнецов И.В.', 'Ильин М.С.', 'Романова Е.П.', 'Морозов С.Н.'],
        scoreSummary: `${updatedBout.akaScore} : ${updatedBout.aoScore} (${selectedWinReason})`,
        winnerName: `${winnerParticipant?.lastName || ''} ${winnerParticipant?.firstName || ''}`.trim(),
        winReason: selectedWinReason === 'points_lead' ? 'Лидерство по очкам' : selectedWinReason === 'senshu_advantage' ? 'Преимущество первого очка (Senshu)' : 'Решение рефери (Хантей)',
        videoReviewUsed: false,
        protestFiled: false,
        certifiedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      };
      onSaveProtocol(newProtocol);
    }

    if (soundEnabled) refereeAudio.playGong();
    setIsWinModalOpen(false);

    showToast(
      `✓ Бой #${activeRefereeBout.boutNumber} завершен! Победитель (${winnerParticipant?.lastName}) автоматически продвинут в следующий раунд сетки!`,
      'success'
    );
  };

  // Fukushin Majority Rule
  const handleApplyJudgeVotes = () => {
    const akaVotes = fukushinVotes.filter((v) => v.vote === 'aka').length;
    const aoVotes = fukushinVotes.filter((v) => v.vote === 'ao').length;

    if (akaVotes >= 2) {
      handleAddPoints(activeRefereeBout.id, 'aka', 1);
      showToast(`Судейское большинство (Fukushin ${akaVotes}/4) подтвердило балл AKA!`, 'info');
      // Reset votes
      setFukushinVotes([
        { judge: 1, vote: 'none' },
        { judge: 2, vote: 'none' },
        { judge: 3, vote: 'none' },
        { judge: 4, vote: 'none' }
      ]);
    } else if (aoVotes >= 2) {
      handleAddPoints(activeRefereeBout.id, 'ao', 1);
      showToast(`Судейское большинство (Fukushin ${aoVotes}/4) подтвердило балл AO!`, 'info');
      setFukushinVotes([
        { judge: 1, vote: 'none' },
        { judge: 2, vote: 'none' },
        { judge: 3, vote: 'none' },
        { judge: 4, vote: 'none' }
      ]);
    } else {
      showToast('Нет судейского большинства (требуется минимум 2 одинаковых флага)', 'warning');
    }
  };

  // -------------------------------------------------------------
  // Automatic WKF Seeding Generation for Categories
  // -------------------------------------------------------------
  const [seedingReports, setSeedingReports] = useState<Record<string, WkfSeedingReport>>({});

  const handleGenerateAllBrackets = () => {
    let newAllBouts: Bout[] = [...bouts];
    const reports: Record<string, WkfSeedingReport> = {};

    tournamentCategories.forEach((cat) => {
      // Find participants declared for this category
      const categoryAthletes = participants.filter((p) => {
        if (p.categoryId === cat.id) return true;
        // Fallback matching by gender and weight
        if (cat.discipline === 'kata') return true;
        return p.gender === cat.gender;
      });

      if (categoryAthletes.length >= 2) {
        const { bouts: catBouts, report } = generateProtectedWkfCategoryBouts(
          cat,
          categoryAthletes,
          tatamis,
          { startTime: '12:00', boutIntervalMinutes: 12, durationSeconds: durationForCategory(cat) }
        );

        reports[cat.id] = report;

        // Replace existing bouts of this category or append
        newAllBouts = newAllBouts.filter((b) => b.categoryId !== cat.id).concat(catBouts);
      }
    });

    setSeedingReports(reports);

    if (onBatchUpdateBouts) {
      onBatchUpdateBouts(newAllBouts);
    } else {
      newAllBouts.forEach((b) => onUpdateBout(b));
    }

    showToast(
      `Сетки WKF успешно сгенерированы для ${Object.keys(reports).length} категорий с разведением клубов!`,
      'success'
    );
  };

  const handleGenerateSingleCategoryBracket = (categoryId: string) => {
    const cat = tournamentCategories.find((c) => c.id === categoryId);
    if (!cat) return;

    const categoryAthletes = participants.filter((p) => p.categoryId === categoryId || p.gender === cat.gender);
    if (categoryAthletes.length < 2) {
      showToast('В этой категории меньше 2 участников для построения сетки', 'warning');
      return;
    }

    const { bouts: catBouts, report } = generateProtectedWkfCategoryBouts(
      cat,
      categoryAthletes,
      tatamis,
      { startTime: '12:00', boutIntervalMinutes: 12, durationSeconds: durationForCategory(cat) }
    );

    setSeedingReports((prev) => ({ ...prev, [categoryId]: report }));

    const filtered = bouts.filter((b) => b.categoryId !== categoryId).concat(catBouts);
    if (onBatchUpdateBouts) {
      onBatchUpdateBouts(filtered);
    } else {
      catBouts.forEach((b) => onUpdateBout(b));
    }

    showToast(`Сетка WKF для «${cat.ageCategoryName} ${cat.weightCategoryName || ''}» построена! Назначено: Татами №${report.assignedTatami.number}`, 'success');
  };

  // -------------------------------------------------------------
  // Data calculations for active category bracket view
  // -------------------------------------------------------------
  const activeCategoryBouts = useMemo(() => {
    return bouts.filter((b) => b.categoryId === selectedCategoryId);
  }, [bouts, selectedCategoryId]);

  const activeCategory = useMemo(() => {
    return tournamentCategories.find((c) => c.id === selectedCategoryId) || tournamentCategories[0];
  }, [tournamentCategories, selectedCategoryId]);

  const qfBouts = activeCategoryBouts.filter((b) => b.roundStage === 'quarter_final');
  const sfBouts = activeCategoryBouts.filter((b) => b.roundStage === 'semi_final');
  const finalBout = activeCategoryBouts.find((b) => b.roundStage === 'final');
  const bronzeBout = activeCategoryBouts.find((b) => b.roundStage === 'bronze_match');

  // Filtered tatamis list
  const displayedTatamis = useMemo(() => {
    if (focusedTatamiNumber === 0) return tatamis;
    return tatamis.filter((t) => t.number === focusedTatamiNumber);
  }, [tatamis, focusedTatamiNumber]);

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {systemToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 font-mono text-xs transition-all animate-in fade-in duration-300 ${
          systemToast.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200' 
            : systemToast.type === 'warning'
            ? 'bg-amber-950/95 border-amber-500/80 text-amber-200'
            : 'bg-indigo-950/95 border-indigo-500/80 text-indigo-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{systemToast.message}</span>
        </div>
      )}

      {/* Modern Top Header & Master Mode Switcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800/90 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>WKF 2026 & SKIF Multi-Tatami Engine</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>4 Татами в локальной сети (LAN Hub)</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Управление турнирной сеткой и онлайн-табло
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Параллельное ведение поединков на нескольких коврах, автоматическая жеребьевка WKF и судейский пульт с продвижением
            </p>
          </div>

          {/* Unified Sub-Tabs Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => setActiveSubTab('multi_tatami')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'multi_tatami'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Мульти-табло (Татами 1-4)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => setActiveSubTab('bracket')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'bracket'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Сетка плей-офф</span>
            </button>

            <button
              onClick={() => setActiveSubTab('referee')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'referee'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Пульт судейства</span>
            </button>

            <button
              onClick={() => setActiveSubTab('auto_draw')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'auto_draw'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Авто-генератор сеток</span>
            </button>

            <button
              onClick={() => setActiveSubTab('vr')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'vr'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Флаги судей & VR</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-700">
                WKF VR
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SUB-TAB 1: PARALLEL MULTI-TATAMI LIVE SCOREBOARD (1-4)       */}
      {/* ============================================================= */}
      {activeSubTab === 'multi_tatami' && (
        <div className="space-y-6">
          {/* Master Tournament Operations Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                Управление турниром:
              </span>
              <button
                onClick={handleStartAllTatamiTimers}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Запустить таймеры на всех коврах, где есть активные пары"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Запустить все татами</span>
              </button>

              <button
                onClick={handlePauseAllTatamiTimers}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Пауза всех ковров</span>
              </button>

              <button
                onClick={handleResetAllTatamiTimers}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сброс времени</span>
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                  soundEnabled 
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
                title="Звуковой гонг и сирена по окончании раунда"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                <span>{soundEnabled ? 'Гонг: ВКЛ' : 'Гонг: ВЫКЛ'}</span>
              </button>
            </div>

            {/* Tatami Filter Selector (All or specific mat) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Фильтр ковров:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setFocusedTatamiNumber(0)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    focusedTatamiNumber === 0 ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Все 4 татами
                </button>
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setFocusedTatamiNumber(num)}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      focusedTatamiNumber === num ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Т-{num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4-Tatami Grid (2x2 or focused) */}
          <div className={`grid gap-5 ${focusedTatamiNumber === 0 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            {displayedTatamis.map((tatami) => {
              // Find active or first scheduled bout on this tatami
              const tatamiBouts = bouts.filter((b) => b.tatamiId === tatami.id);
              const activeBout = 
                tatamiBouts.find((b) => b.status === 'in_progress') ||
                tatamiBouts.find((b) => b.status === 'scheduled') ||
                tatamiBouts[0];

              const isTimerRunning = activeBout ? !!runningTimers[activeBout.id] : false;

              return (
                <div 
                  key={tatami.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between"
                >
                  {/* Tatami Card Header */}
                  <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black font-mono flex items-center justify-center text-xs shadow-sm">
                        {tatami.number}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">Татами №{tatami.number}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({tatami.locationZone})</span>
                        </div>
                        {activeBout && (
                          <div className="text-[11px] text-rose-400 font-mono">
                            Бой #{activeBout.boutNumber} · {activeBout.categoryName || 'Дивизион WKF'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeBout && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold flex items-center gap-1 ${
                          activeBout.status === 'in_progress'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                            : activeBout.status === 'completed'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${activeBout.status === 'in_progress' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {activeBout.status === 'in_progress' ? 'Идет поединок' : activeBout.status === 'completed' ? 'Завершен' : 'Ожидание'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tatami Bout Face-off Body */}
                  {activeBout ? (
                    <div className="p-4 space-y-4">
                      {/* Split AKA (Red) / AO (Blue) */}
                      <div className="grid grid-cols-12 gap-3 items-center">
                        {/* AKA (Red) */}
                        <div className="col-span-5 p-3 rounded-xl bg-gradient-to-b from-rose-950/50 to-slate-900 border border-rose-900/60 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold">
                                AKA · Красный
                              </span>
                              <div className="text-sm font-bold text-white mt-1 truncate">
                                {activeBout.akaParticipant?.lastName || 'AKA'} {activeBout.akaParticipant?.firstName || ''}
                              </div>
                              <div className="text-[10px] text-rose-300/80 font-mono truncate">
                                {activeBout.akaParticipant?.clubName || 'Клуб AKA'} · {activeBout.akaParticipant?.city || ''}
                              </div>
                            </div>
                            {activeBout.akaSenshu && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] font-mono tracking-wider">
                                SENSHU
                              </span>
                            )}
                          </div>

                          {/* Big Digital Score */}
                          <div className="flex items-center justify-between my-2">
                            <span className="text-4xl sm:text-5xl font-black font-mono text-rose-400 tracking-tight">
                              {activeBout.akaScore}
                            </span>

                            {/* Quick score buttons */}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleAddPoints(activeBout.id, 'aka', 1)}
                                  className="w-7 h-7 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                                  title="+1 Yuko"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleAddPoints(activeBout.id, 'aka', 2)}
                                  className="w-7 h-7 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                                  title="+2 Waza-ari"
                                >
                                  +2
                                </button>
                                <button
                                  onClick={() => handleAddPoints(activeBout.id, 'aka', 3)}
                                  className="w-7 h-7 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                                  title="+3 Ippon"
                                >
                                  +3
                                </button>
                              </div>
                              <button
                                onClick={() => handleToggleSenshu(activeBout.id, 'aka')}
                                className={`text-[10px] font-mono font-bold py-0.5 px-1 rounded transition-colors ${
                                  activeBout.akaSenshu ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {activeBout.akaSenshu ? '★ Есть Senshu' : '☆ Дать Senshu'}
                              </button>
                            </div>
                          </div>

                          {/* Penalties C1 / C2 */}
                          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-rose-900/40">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">C1:</span>
                              {[1, 2, 3, 4].map((dot) => (
                                <span
                                  key={dot}
                                  className={`w-2 h-2 rounded-full ${
                                    (activeBout.akaPenaltiesC1 || 0) >= dot ? 'bg-amber-400' : 'bg-slate-800'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">C2:</span>
                              {[1, 2, 3, 4].map((dot) => (
                                <span
                                  key={dot}
                                  className={`w-2 h-2 rounded-full ${
                                    (activeBout.akaPenaltiesC2 || 0) >= dot ? 'bg-rose-500' : 'bg-slate-800'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* CENTER: MATCH TIMER & STATUS */}
                        <div className="col-span-2 flex flex-col items-center justify-center text-center">
                          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider px-2 py-1 rounded-lg ${
                            isTimerRunning 
                              ? 'text-white bg-slate-950 border border-emerald-500/60 shadow-lg shadow-emerald-950/50' 
                              : 'text-slate-400 bg-slate-950/60 border border-slate-800'
                          }`}>
                            {E.formatClock(E.remainingSeconds(activeBout, now))}
                          </div>

                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => handleToggleTimer(activeBout.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all shadow-md cursor-pointer ${
                                isTimerRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                              }`}
                              title={isTimerRunning ? 'Пауза' : 'Старт таймера'}
                            >
                              {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>
                            <button
                              onClick={() => handleResetSingleTimer(activeBout.id)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                              title="Сброс таймера"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
                            <button
                              onClick={() => handleAdjustTimer(activeBout.id, -10)}
                              className="px-1 text-slate-400 hover:text-white"
                            >
                              -10s
                            </button>
                            <span className="text-slate-600">|</span>
                            <button
                              onClick={() => handleAdjustTimer(activeBout.id, 10)}
                              className="px-1 text-slate-400 hover:text-white"
                            >
                              +10s
                            </button>
                          </div>
                        </div>

                        {/* AO (Blue) */}
                        <div className="col-span-5 p-3 rounded-xl bg-gradient-to-b from-blue-950/50 to-slate-900 border border-blue-900/60 flex flex-col justify-between text-right">
                          <div className="flex items-start justify-between flex-row-reverse">
                            <div>
                              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">
                                AO · Синий
                              </span>
                              <div className="text-sm font-bold text-white mt-1 truncate">
                                {activeBout.aoParticipant?.lastName || 'AO'} {activeBout.aoParticipant?.firstName || ''}
                              </div>
                              <div className="text-[10px] text-blue-300/80 font-mono truncate">
                                {activeBout.aoParticipant?.clubName || 'Клуб AO'} · {activeBout.aoParticipant?.city || ''}
                              </div>
                            </div>
                            {activeBout.aoSenshu && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] font-mono tracking-wider">
                                SENSHU
                              </span>
                            )}
                          </div>

                          {/* Big Digital Score */}
                          <div className="flex items-center justify-between my-2 flex-row-reverse">
                            <span className="text-4xl sm:text-5xl font-black font-mono text-blue-400 tracking-tight">
                              {activeBout.aoScore}
                            </span>

                            {/* Quick score buttons */}
                            <div className="flex flex-col gap-1 items-end">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleAddPoints(activeBout.id, 'ao', 3)}
                                  className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                                  title="+3 Ippon"
                                >
                                  +3
                                </button>
                                <button
                                  onClick={() => handleAddPoints(activeBout.id, 'ao', 2)}
                                  className="w-7 h-7 rounded bg-blue-900/80 hover:bg-blue-800 text-white font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                                  title="+2 Waza-ari"
                                >
                                  +2
                                </button>
                                <button
                                  onClick={() => handleAddPoints(activeBout.id, 'ao', 1)}
                                  className="w-7 h-7 rounded bg-blue-900/80 hover:bg-blue-800 text-white font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                                  title="+1 Yuko"
                                >
                                  +1
                                </button>
                              </div>
                              <button
                                onClick={() => handleToggleSenshu(activeBout.id, 'ao')}
                                className={`text-[10px] font-mono font-bold py-0.5 px-1 rounded transition-colors ${
                                  activeBout.aoSenshu ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {activeBout.aoSenshu ? '★ Есть Senshu' : '☆ Дать Senshu'}
                              </button>
                            </div>
                          </div>

                          {/* Penalties C1 / C2 */}
                          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-blue-900/40 flex-row-reverse">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">C1:</span>
                              {[1, 2, 3, 4].map((dot) => (
                                <span
                                  key={dot}
                                  className={`w-2 h-2 rounded-full ${
                                    (activeBout.aoPenaltiesC1 || 0) >= dot ? 'bg-amber-400' : 'bg-slate-800'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">C2:</span>
                              {[1, 2, 3, 4].map((dot) => (
                                <span
                                  key={dot}
                                  className={`w-2 h-2 rounded-full ${
                                    (activeBout.aoPenaltiesC2 || 0) >= dot ? 'bg-rose-500' : 'bg-slate-800'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tatami Action Footer */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setRefereeBoutId(activeBout.id);
                              setActiveSubTab('referee');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-rose-400" />
                            <span>Открыть пульт рефери</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCategoryId(activeBout.categoryId);
                              setActiveSubTab('bracket');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                            <span>В сетке</span>
                          </button>
                        </div>

                        {/* Quick finish buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setRefereeBoutId(activeBout.id);
                              handleOpenWinModal('aka');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold font-mono transition-colors cursor-pointer"
                          >
                            Победа AKA 🏆
                          </button>
                          <button
                            onClick={() => {
                              setRefereeBoutId(activeBout.id);
                              handleOpenWinModal('ao');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-bold font-mono transition-colors cursor-pointer"
                          >
                            Победа AO 🏆
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      Татами свободно. Назначьте бой из расписания или сгенерируйте сетки.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 2: INTERACTIVE PLAYOFF BRACKET & ADVANCEMENT           */}
      {/* ============================================================= */}
      {activeSubTab === 'bracket' && (
        <div className="space-y-6">
          {/* Category Selector Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                Категория турнира:
              </span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
              >
                {tournamentCategories.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.ageCategoryName} · {tc.weightCategoryName || 'Индивидуальное Ката'} ({tc.discipline === 'kata' ? 'Ката' : 'Кумитэ'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerateSingleCategoryBracket(selectedCategoryId)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Перестроить сетку с защитой WKF</span>
              </button>
            </div>
          </div>

          {/* Podium Banner if Final is completed */}
          {finalBout && finalBout.status === 'completed' && finalBout.winnerId && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 text-sm">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>ИТОГОВЫЙ ПЬЕДЕСТАЛ ДИВИЗИОНА:</span>
                </span>
                <span className="text-white">
                  🥇 Золото:{' '}
                  <strong className="text-amber-300 font-bold">
                    {finalBout.winnerId === finalBout.akaParticipantId
                      ? `${finalBout.akaParticipant?.lastName} ${finalBout.akaParticipant?.firstName} (${finalBout.akaParticipant?.clubName})`
                      : `${finalBout.aoParticipant?.lastName} ${finalBout.aoParticipant?.firstName} (${finalBout.aoParticipant?.clubName})`}
                  </strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-white">
                  🥈 Серебро:{' '}
                  <strong className="text-slate-300">
                    {finalBout.winnerId === finalBout.akaParticipantId
                      ? `${finalBout.aoParticipant?.lastName} ${finalBout.aoParticipant?.firstName} (${finalBout.aoParticipant?.clubName})`
                      : `${finalBout.akaParticipant?.lastName} ${finalBout.akaParticipant?.firstName} (${finalBout.akaParticipant?.clubName})`}
                  </strong>
                </span>
                {bronzeBout && bronzeBout.winnerId && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-white">
                      🥉 Бронза:{' '}
                      <strong className="text-amber-500">
                        {bronzeBout.winnerId === bronzeBout.akaParticipantId
                          ? `${bronzeBout.akaParticipant?.lastName} ${bronzeBout.akaParticipant?.firstName} (${bronzeBout.akaParticipant?.clubName})`
                          : `${bronzeBout.aoParticipant?.lastName} ${bronzeBout.aoParticipant?.firstName} (${bronzeBout.aoParticipant?.clubName})`}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Elimination Tree Layout */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
            <div className="min-w-[850px] grid grid-cols-3 gap-6">
              {/* Column 1: Quarterfinals (or 1/8) */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-800">
                  <span>1/4 Финала</span>
                  <span className="text-rose-400 font-semibold">{qfBouts.length} боев</span>
                </div>

                {qfBouts.length > 0 ? (
                  qfBouts.map((bout, idx) => (
                    <BoutBracketCard
                      key={bout.id}
                      bout={bout}
                      onOpenReferee={() => {
                        setRefereeBoutId(bout.id);
                        setActiveSubTab('referee');
                      }}
                    />
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs font-mono text-slate-500">
                    Четвертьфиналы не требуются (4 участника)
                  </div>
                )}
              </div>

              {/* Column 2: Semifinals */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-800">
                  <span>1/2 Финала</span>
                  <span className="text-rose-400 font-semibold">{sfBouts.length} боя</span>
                </div>

                {sfBouts.map((bout) => (
                  <BoutBracketCard
                    key={bout.id}
                    bout={bout}
                    onOpenReferee={() => {
                      setRefereeBoutId(bout.id);
                      setActiveSubTab('referee');
                    }}
                  />
                ))}

                {/* Bronze match block */}
                {bronzeBout && (
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Поединок за 3-е место (Бронза)</span>
                    </div>
                    <BoutBracketCard
                      bout={bronzeBout}
                      isBronze
                      onOpenReferee={() => {
                        setRefereeBoutId(bronzeBout.id);
                        setActiveSubTab('referee');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Column 3: Grand Final */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-amber-900/60">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>ФИНАЛ (ЗОЛОТО)</span>
                  </span>
                  <span className="text-amber-400">1st Place</span>
                </div>

                {finalBout ? (
                  <BoutBracketCard
                    bout={finalBout}
                    isFinal
                    onOpenReferee={() => {
                      setRefereeBoutId(finalBout.id);
                      setActiveSubTab('referee');
                    }}
                  />
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs font-mono text-slate-500">
                    Финал будет определен после завершения 1/2
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 3: COMPREHENSIVE REFEREE STATION                      */}
      {/* ============================================================= */}
      {activeSubTab === 'referee' && activeRefereeBout && (
        <div className="space-y-6">
          {/* Referee Match Selector Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                Выбор поединка:
              </span>
              <select
                value={refereeBoutId}
                onChange={(e) => setRefereeBoutId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
              >
                {bouts.map((b) => (
                  <option key={b.id} value={b.id}>
                    Татами №{b.tatamiNumber || 1} · Бой #{b.boutNumber} · {b.roundStage} · {b.categoryName || 'WKF'} ({b.akaParticipant?.lastName || 'AKA'} vs {b.aoParticipant?.lastName || 'AO'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                Татами: <strong className="text-white">№{activeRefereeBout.tatamiNumber || 1}</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">
                Статус: <strong className="text-rose-400">{activeRefereeBout.status}</strong>
              </span>
            </div>
          </div>

          {/* Big Master Digital Board for Shushin / Scorekeeper */}
          <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 shadow-2xl space-y-6">
            {/* Top Match Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono">
              <div className="text-slate-400">
                Категория: <strong className="text-white">{activeRefereeBout.categoryName}</strong>
              </div>
              <div className="text-slate-400">
                Этап: <strong className="text-rose-400 uppercase">{activeRefereeBout.roundStage}</strong>
              </div>
            </div>

            {/* Split AKA / AO Main Station */}
            <div className="grid grid-cols-12 gap-6 items-center">
              {/* AKA (Red) Station */}
              <div className="col-span-12 md:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-rose-950/70 to-slate-900 border-2 border-rose-600 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-mono text-xs font-black uppercase tracking-wider">
                    AKA (Красный)
                  </span>
                  {activeRefereeBout.akaSenshu && (
                    <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black text-xs font-mono">
                      ★ SENSHU
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">
                    {activeRefereeBout.akaParticipant?.lastName || 'AKA'} {activeRefereeBout.akaParticipant?.firstName || ''}
                  </h3>
                  <p className="text-xs text-rose-300 font-mono mt-0.5">
                    {activeRefereeBout.akaParticipant?.clubName || 'Клуб'} · {activeRefereeBout.akaParticipant?.city || ''}
                  </p>
                </div>

                {/* Score Counter */}
                <div className="flex items-center justify-center py-2">
                  <span className="text-7xl sm:text-8xl font-black font-mono text-rose-400 tracking-tighter">
                    {activeRefereeBout.akaScore}
                  </span>
                </div>

                {/* WKF Point Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'aka', 1)}
                    className="py-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-mono font-bold text-sm transition-transform active:scale-95 shadow-md flex flex-col items-center cursor-pointer"
                  >
                    <span>+1 Yuko</span>
                    <span className="text-[10px] text-rose-300 font-normal">Цуки</span>
                  </button>
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'aka', 2)}
                    className="py-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-mono font-bold text-sm transition-transform active:scale-95 shadow-md flex flex-col items-center cursor-pointer"
                  >
                    <span>+2 Waza</span>
                    <span className="text-[10px] text-rose-300 font-normal">Гери туловище</span>
                  </button>
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'aka', 3)}
                    className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-sm transition-transform active:scale-95 shadow-md flex flex-col items-center cursor-pointer"
                  >
                    <span>+3 Ippon</span>
                    <span className="text-[10px] text-rose-200 font-normal">Дзёдан / подсечка</span>
                  </button>
                </div>

                {/* Decrement & Senshu */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'aka', -1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    -1 Отмена очка
                  </button>
                  <button
                    onClick={() => handleToggleSenshu(activeRefereeBout.id, 'aka')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      activeRefereeBout.akaSenshu
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {activeRefereeBout.akaSenshu ? '★ Снять Senshu' : '☆ Дать Senshu'}
                  </button>
                </div>

                {/* Penalties C1 & C2 */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-950 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Штрафы C1 (Контакт):</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'aka', 'c1', -1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-amber-400 font-bold px-1.5">{activeRefereeBout.akaPenaltiesC1 || 0}/4</span>
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'aka', 'c1', 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Штрафы C2 (Поведение/Выход):</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'aka', 'c2', -1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-rose-400 font-bold px-1.5">{activeRefereeBout.akaPenaltiesC2 || 0}/4</span>
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'aka', 'c2', 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER: MATCH CLOCK & SPECIAL REFEREE TIMERS */}
              <div className="col-span-12 md:col-span-2 flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <div className="text-xs font-mono uppercase text-slate-400 font-bold mb-1">
                    Таймер поединка
                  </div>
                  <div className={`text-4xl sm:text-5xl font-black font-mono tracking-wider px-4 py-2 rounded-2xl ${
                    runningTimers[activeRefereeBout.id]
                      ? 'text-white bg-slate-900 border-2 border-emerald-500 shadow-xl'
                      : 'text-slate-400 bg-slate-900 border border-slate-800'
                  }`}>
                    {E.formatClock(E.remainingSeconds(activeRefereeBout, now))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleTimer(activeRefereeBout.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl cursor-pointer ${
                      runningTimers[activeRefereeBout.id] 
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/60' 
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60'
                    }`}
                  >
                    {runningTimers[activeRefereeBout.id] ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={() => handleResetSingleTimer(activeRefereeBout.id)}
                    className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Doctor 60s Countdown */}
                <div className="w-full pt-3 border-t border-slate-800 text-center">
                  <div className="text-[11px] font-mono text-slate-400 mb-1">Врач 60с (WKF):</div>
                  {doctorSeconds !== null ? (
                    <div className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-700 text-rose-300 font-mono font-bold text-sm animate-pulse flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>{doctorSeconds}s осталось</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDoctorSeconds(60)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Activity className="w-3.5 h-3.5 text-rose-400" />
                      <span>Запустить 60с</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveSubTab('vr');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-amber-600/50 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Видеоповтор VR & Флаги</span>
                </button>

                {/* Big Finish Bout Button */}
                <button
                  onClick={() => handleOpenWinModal(activeRefereeBout.akaScore >= activeRefereeBout.aoScore ? 'aka' : 'ao')}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-amber-950/60 transition-all cursor-pointer"
                >
                  ✓ Завершить бой
                </button>
              </div>

              {/* AO (Blue) Station */}
              <div className="col-span-12 md:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-blue-950/70 to-slate-900 border-2 border-blue-600 shadow-xl space-y-4 text-right">
                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono text-xs font-black uppercase tracking-wider">
                    AO (Синий)
                  </span>
                  {activeRefereeBout.aoSenshu && (
                    <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black text-xs font-mono">
                      ★ SENSHU
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">
                    {activeRefereeBout.aoParticipant?.lastName || 'AO'} {activeRefereeBout.aoParticipant?.firstName || ''}
                  </h3>
                  <p className="text-xs text-blue-300 font-mono mt-0.5">
                    {activeRefereeBout.aoParticipant?.clubName || 'Клуб'} · {activeRefereeBout.aoParticipant?.city || ''}
                  </p>
                </div>

                {/* Score Counter */}
                <div className="flex items-center justify-center py-2">
                  <span className="text-7xl sm:text-8xl font-black font-mono text-blue-400 tracking-tighter">
                    {activeRefereeBout.aoScore}
                  </span>
                </div>

                {/* WKF Point Action Buttons */}
                <div className="grid grid-cols-3 gap-2 flex-row-reverse">
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'ao', 3)}
                    className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-sm transition-transform active:scale-95 shadow-md flex flex-col items-center cursor-pointer"
                  >
                    <span>+3 Ippon</span>
                    <span className="text-[10px] text-blue-200 font-normal">Дзёдан / подсечка</span>
                  </button>
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'ao', 2)}
                    className="py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-mono font-bold text-sm transition-transform active:scale-95 shadow-md flex flex-col items-center cursor-pointer"
                  >
                    <span>+2 Waza</span>
                    <span className="text-[10px] text-blue-300 font-normal">Гери туловище</span>
                  </button>
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'ao', 1)}
                    className="py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-mono font-bold text-sm transition-transform active:scale-95 shadow-md flex flex-col items-center cursor-pointer"
                  >
                    <span>+1 Yuko</span>
                    <span className="text-[10px] text-blue-300 font-normal">Цуки</span>
                  </button>
                </div>

                {/* Decrement & Senshu */}
                <div className="flex items-center justify-between pt-2 flex-row-reverse">
                  <button
                    onClick={() => handleAddPoints(activeRefereeBout.id, 'ao', -1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  >
                    -1 Отмена очка
                  </button>
                  <button
                    onClick={() => handleToggleSenshu(activeRefereeBout.id, 'ao')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      activeRefereeBout.aoSenshu
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {activeRefereeBout.aoSenshu ? '★ Снять Senshu' : '☆ Дать Senshu'}
                  </button>
                </div>

                {/* Penalties C1 & C2 */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-blue-950 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono flex-row-reverse">
                    <span className="text-slate-400">Штрафы C1 (Контакт):</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'ao', 'c1', -1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-amber-400 font-bold px-1.5">{activeRefereeBout.aoPenaltiesC1 || 0}/4</span>
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'ao', 'c1', 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono flex-row-reverse">
                    <span className="text-slate-400">Штрафы C2 (Поведение/Выход):</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'ao', 'c2', -1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-rose-400 font-bold px-1.5">{activeRefereeBout.aoPenaltiesC2 || 0}/4</span>
                      <button
                        onClick={() => handleAddPenalty(activeRefereeBout.id, 'ao', 'c2', 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Corner Judges (Fukushin J1-J4) Interactive Flag Console */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5 text-rose-400" />
                  <span>Боковые судьи (Fukushin J1–J4): Голосование флагами</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  При совпадении 2+ флагов активируется быстрое подтверждение балла
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {fukushinVotes.map((v, i) => (
                  <div key={v.judge} className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-500 font-bold px-1">J{v.judge}:</span>
                    <button
                      onClick={() => {
                        const copy = [...fukushinVotes];
                        copy[i].vote = copy[i].vote === 'aka' ? 'none' : 'aka';
                        setFukushinVotes(copy);
                      }}
                      className={`px-2 py-0.5 rounded transition-colors font-bold ${
                        v.vote === 'aka' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      AKA
                    </button>
                    <button
                      onClick={() => {
                        const copy = [...fukushinVotes];
                        copy[i].vote = copy[i].vote === 'ao' ? 'none' : 'ao';
                        setFukushinVotes(copy);
                      }}
                      className={`px-2 py-0.5 rounded transition-colors font-bold ${
                        v.vote === 'ao' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      AO
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleApplyJudgeVotes}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Применить решение флагов
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 4: AUTO-BRACKET GENERATOR (WKF SEEDING ENGINE)        */}
      {/* ============================================================= */}
      {activeSubTab === 'auto_draw' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  WKF Article 4 & 5 Compliant Draw
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Интеллектуальная жеребьевка WKF после онлайн-регистрации
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Алгоритм стохастического поиска гарантирует строгое разведение представителей одного клуба, города или страны в 1-м и 2-м кругах
                </p>
              </div>

              <button
                onClick={handleGenerateAllBrackets}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-rose-950/60 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Сгенерировать сетки для всех категорий</span>
              </button>
            </div>

            {/* Quick Audit Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono">Всего категорий:</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{tournamentCategories.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono">Зарегистрировано атлетов:</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{participants.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono">Разведение клубов:</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">100% Защита</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono">Татами в ротации:</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">4 площадки</div>
              </div>
            </div>
          </div>

          {/* Categories Grid for manual single generation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournamentCategories.map((cat) => {
              const catAthletes = participants.filter((p) => p.categoryId === cat.id || p.gender === cat.gender);
              const catBouts = bouts.filter((b) => b.categoryId === cat.id);
              const report = seedingReports[cat.id];

              return (
                <div key={cat.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {cat.ageCategoryName} · {cat.weightCategoryName || 'Индивидуальное Ката'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {catAthletes.length} атлетов
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      Дисциплина: <strong className="text-rose-400">{cat.discipline === 'kata' ? 'Ката' : 'Кумитэ'}</strong> · Сетка: {catBouts.length} боев
                    </div>

                    {report && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
                        ✓ WKF защита активна: Конфликтов R1/R2 = {report.r1ConflictsCount + report.r2ConflictsCount}. Назначено: Татами №{report.assignedTatami.number}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setActiveSubTab('bracket');
                      }}
                      className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <span>Посмотреть сетку</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleGenerateSingleCategoryBracket(cat.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Жеребьевка дивизиона
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 5: ELECTRONIC CORNER FLAGS & VIDEO REVIEW (VR)        */}
      {/* ============================================================= */}
      {activeSubTab === 'vr' && (
        <RefereeElectronicVotingAndVrModule
          bouts={bouts}
          activeBoutId={refereeBoutId}
          participants={participants}
          currentUserRole={currentUserRole}
          tournamentRules={tournamentRules}
          onUpdateBout={onUpdateBout}
          onSaveProtocol={onSaveProtocol}
          onNavigateToScoreboard={(bId) => {
            setRefereeBoutId(bId);
            setActiveSubTab('referee');
          }}
        />
      )}

      {/* ============================================================= */}
      {/* REFEREE WIN DECLARATION MODAL                                 */}
      {/* ============================================================= */}
      {isWinModalOpen && activeRefereeBout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Утверждение победы в поединке</h3>
                <p className="text-xs text-slate-400 font-mono">Бой #{activeRefereeBout.boutNumber} · {activeRefereeBout.categoryName}</p>
              </div>
            </div>

            {/* Winner Side Radio */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPendingWinnerSide('aka')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  pendingWinnerSide === 'aka'
                    ? 'bg-rose-950/80 border-rose-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-rose-400 uppercase">Победитель AKA</div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">
                  {activeRefereeBout.akaParticipant?.lastName || 'AKA'}
                </div>
                <div className="text-xs font-mono text-rose-300/80 mt-1">
                  Очки: {activeRefereeBout.akaScore}
                </div>
              </button>

              <button
                onClick={() => setPendingWinnerSide('ao')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  pendingWinnerSide === 'ao'
                    ? 'bg-blue-950/80 border-blue-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-blue-400 uppercase">Победитель AO</div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">
                  {activeRefereeBout.aoParticipant?.lastName || 'AO'}
                </div>
                <div className="text-xs font-mono text-blue-300/80 mt-1">
                  Очки: {activeRefereeBout.aoScore}
                </div>
              </button>
            </div>

            {/* Win Reason Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Основание победы (WKF Article 10):</label>
              <select
                value={selectedWinReason}
                onChange={(e) => setSelectedWinReason(e.target.value as WinReason)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
              >
                <option value="points_lead">Лидерство по набранным очкам</option>
                <option value="senshu_advantage">Преимущество первого очка (Senshu)</option>
                <option value="mercy_rule_8pt">Преимущество в 8 очков (WKF Mercy Rule)</option>
                <option value="hantei_decision">Решение судейской коллегии (Хантей)</option>
                <option value="ippon_direct">Чистая победа (Иппон / Вадза-ари авасетэ)</option>
                <option value="hansoku_dq">Дисквалификация соперника (Хансоку)</option>
                <option value="kiken_injury">Отказ / травма соперника (Кикен)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Авто-продвижение в сетке: победитель перейдет в след. раунд</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Автоматически создастся судейский протокол ГСК</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsWinModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmFinishBout}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-colors shadow-md cursor-pointer"
              >
                Утвердить и продвинуть в сетке
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// HELPER COMPONENT: BOUT BRACKET NODE CARD
// =========================================================================
interface BoutBracketCardProps {
  bout: Bout;
  isFinal?: boolean;
  isBronze?: boolean;
  onOpenReferee: () => void;
}

const BoutBracketCard: React.FC<BoutBracketCardProps> = ({
  bout,
  isFinal,
  isBronze,
  onOpenReferee
}) => {
  const isCompleted = bout.status === 'completed';
  const isLive = bout.status === 'in_progress';
  const isAkaWinner = isCompleted && bout.winnerId === bout.akaParticipantId;
  const isAoWinner = isCompleted && bout.winnerId === bout.aoParticipantId;

  return (
    <div className={`rounded-xl border transition-all ${
      isFinal 
        ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/70 shadow-lg' 
        : isBronze 
        ? 'bg-gradient-to-b from-slate-900 to-amber-950/20 border-amber-700/60' 
        : isLive
        ? 'bg-slate-900 border-emerald-500/80 shadow-md shadow-emerald-950/30'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Node Header */}
      <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">Бой #{bout.boutNumber}</span>
          <span className="text-slate-500">·</span>
          <span className="text-rose-400 font-semibold">Татами {bout.tatamiNumber || 1}</span>
        </div>
        <div>
          {isLive ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LIVE</span>
            </span>
          ) : isCompleted ? (
            <span className="text-slate-400">✓ Завершен</span>
          ) : (
            <span className="text-slate-500">{bout.scheduledTime || '12:00'}</span>
          )}
        </div>
      </div>

      {/* Competitors */}
      <div className="p-2.5 space-y-1.5">
        {/* AKA */}
        <div className={`p-1.5 rounded-lg flex items-center justify-between transition-colors ${
          isAkaWinner ? 'bg-rose-950/80 border border-rose-600' : 'bg-slate-950/50'
        }`}>
          <div className="flex items-center gap-2 truncate pr-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className={`text-xs truncate ${isAkaWinner ? 'font-black text-rose-300' : 'text-slate-200'}`}>
              {bout.akaParticipant ? `${bout.akaParticipant.lastName} ${bout.akaParticipant.firstName}` : 'Победитель QF'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
            {bout.akaSenshu && <span className="text-[9px] text-amber-400 font-bold">★</span>}
            <span className={`font-bold ${isAkaWinner ? 'text-rose-400' : 'text-slate-400'}`}>
              {bout.akaScore}
            </span>
          </div>
        </div>

        {/* AO */}
        <div className={`p-1.5 rounded-lg flex items-center justify-between transition-colors ${
          isAoWinner ? 'bg-blue-950/80 border border-blue-600' : 'bg-slate-950/50'
        }`}>
          <div className="flex items-center gap-2 truncate pr-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className={`text-xs truncate ${isAoWinner ? 'font-black text-blue-300' : 'text-slate-200'}`}>
              {bout.aoParticipant ? `${bout.aoParticipant.lastName} ${bout.aoParticipant.firstName}` : 'Победитель QF'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
            {bout.aoSenshu && <span className="text-[9px] text-amber-400 font-bold">★</span>}
            <span className={`font-bold ${isAoWinner ? 'text-blue-400' : 'text-slate-400'}`}>
              {bout.aoScore}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Referee Action */}
      <div className="px-2.5 py-1.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-500 truncate">
          {bout.winReason ? bout.winReason : bout.status === 'scheduled' ? 'Ожидает выхода' : 'В процессе'}
        </span>
        <button
          onClick={onOpenReferee}
          className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
        >
          <span>Судейство</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
