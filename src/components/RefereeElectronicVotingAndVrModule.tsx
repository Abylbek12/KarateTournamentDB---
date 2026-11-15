import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Flag, 
  Tv, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Pause, 
  FastForward, 
  Rewind, 
  ZoomIn, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Activity, 
  Clock, 
  Award, 
  FileText,
  ChevronRight,
  Maximize2,
  Minimize2,
  Flame,
  Info
} from 'lucide-react';
import { Bout, Participant, RefereeProtocol, TournamentRules, UserRole } from '../types/schema';
import { refereeAudio } from '../utils/refereeAudio';

export interface CornerJudgeState {
  id: number;
  name: string;
  position: 'NE' | 'SE' | 'SW' | 'NW';
  russianPosition: string;
  voteColor: 'none' | 'aka' | 'ao';
  voteTechnique: 'none' | 'yuko' | 'waza_ari' | 'ippon' | 'c1' | 'c2_jogai';
  timestamp?: string;
}

export interface VrChallenge {
  side: 'aka' | 'ao';
  requestedAtSecond: number;
  reason: string;
  status: 'pending' | 'upheld' | 'dismissed';
  notes?: string;
}

export interface RefereeElectronicVotingAndVrModuleProps {
  bouts: Bout[];
  activeBoutId?: string;
  participants: Participant[];
  currentUserRole?: UserRole;
  tournamentRules?: TournamentRules;
  onUpdateBout: (updatedBout: Bout) => void;
  onSaveProtocol?: (protocol: RefereeProtocol) => void;
  onNavigateToScoreboard?: (boutId: string) => void;
}

export const RefereeElectronicVotingAndVrModule: React.FC<RefereeElectronicVotingAndVrModuleProps> = ({
  bouts,
  activeBoutId,
  participants,
  currentUserRole = 'chief_referee',
  tournamentRules = 'wkf',
  onUpdateBout,
  onSaveProtocol,
  onNavigateToScoreboard
}) => {
  // Selected Bout
  const [selectedBoutId, setSelectedBoutId] = useState<string>(
    activeBoutId || bouts[0]?.id || ''
  );

  const currentBout = bouts.find((b) => b.id === selectedBoutId) || bouts[0];

  // ==============================================================
  // 1. ELECTRONIC CORNER JUDGES (FUKUSHIN J1-J4) STATE
  // ==============================================================
  const [judges, setJudges] = useState<CornerJudgeState[]>([
    { id: 1, name: 'Судья 1 (J1)', position: 'NE', russianPosition: 'Северо-Восток', voteColor: 'none', voteTechnique: 'none' },
    { id: 2, name: 'Судья 2 (J2)', position: 'SE', russianPosition: 'Юго-Восток', voteColor: 'none', voteTechnique: 'none' },
    { id: 3, name: 'Судья 3 (J3)', position: 'SW', russianPosition: 'Юго-Запад', voteColor: 'none', voteTechnique: 'none' },
    { id: 4, name: 'Судья 4 (J4)', position: 'NW', russianPosition: 'Северо-Запад', voteColor: 'none', voteTechnique: 'none' }
  ]);

  const [activeEditingJudge, setActiveEditingJudge] = useState<number | null>(null);

  // ==============================================================
  // 2. VIDEO REVIEW (VR) CONSOLE STATE
  // ==============================================================
  const [selectedCamera, setSelectedCamera] = useState<'cam1' | 'cam2' | 'cam3'>('cam1');
  const [isVrPlaying, setIsVrPlaying] = useState<boolean>(false);
  const [vrPlaybackSpeed, setVrPlaybackSpeed] = useState<0.25 | 0.5 | 1.0>(0.5);
  const [vrCurrentFrame, setVrCurrentFrame] = useState<number>(142);
  const [vrZoomActive, setVrZoomActive] = useState<boolean>(false);
  const [vrGridActive, setVrGridActive] = useState<boolean>(true);

  // ==============================================================
  // 3. COACH VR CHALLENGE CARDS STATE
  // ==============================================================
  // 1 challenge card per coach per match (retained if upheld, lost if dismissed)
  const [akaCardStatus, setAkaCardStatus] = useState<'available' | 'reviewing' | 'upheld' | 'dismissed'>('available');
  const [aoCardStatus, setAoCardStatus] = useState<'available' | 'reviewing' | 'upheld' | 'dismissed'>('available');
  const [activeChallenge, setActiveChallenge] = useState<VrChallenge | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState<boolean>(false);
  const [challengeTargetSide, setChallengeTargetSide] = useState<'aka' | 'ao'>('aka');
  const [selectedChallengeReason, setSelectedChallengeReason] = useState<string>('Неначисленный балл (Yuko +1 / Цуки)');

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Switch selected bout when prop changes
  useEffect(() => {
    if (activeBoutId) {
      setSelectedBoutId(activeBoutId);
    }
  }, [activeBoutId]);

  // Simulated VR Video frame progression when playing
  useEffect(() => {
    if (!isVrPlaying) return;
    const intervalTime = Math.round(100 / vrPlaybackSpeed);
    const interval = setInterval(() => {
      setVrCurrentFrame((prev) => {
        if (prev >= 300) return 1;
        return prev + 1;
      });
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isVrPlaying, vrPlaybackSpeed]);

  // ==============================================================
  // MAJORITY RULE CALCULATIONS (WKF 2026 ARTICLE 7 & 8)
  // ==============================================================
  const akaVotes = judges.filter((j) => j.voteColor === 'aka');
  const aoVotes = judges.filter((j) => j.voteColor === 'ao');

  // Find consensus technique
  const getConsensus = () => {
    if (akaVotes.length >= 2) {
      // Find most common technique among aka votes
      const techCounts: Record<string, number> = {};
      akaVotes.forEach((v) => {
        techCounts[v.voteTechnique] = (techCounts[v.voteTechnique] || 0) + 1;
      });
      const topTech = Object.keys(techCounts).sort((a, b) => techCounts[b] - techCounts[a])[0];
      return {
        side: 'aka' as const,
        count: akaVotes.length,
        technique: topTech || 'yuko',
        isMajority: true
      };
    }
    if (aoVotes.length >= 2) {
      const techCounts: Record<string, number> = {};
      aoVotes.forEach((v) => {
        techCounts[v.voteTechnique] = (techCounts[v.voteTechnique] || 0) + 1;
      });
      const topTech = Object.keys(techCounts).sort((a, b) => techCounts[b] - techCounts[a])[0];
      return {
        side: 'ao' as const,
        count: aoVotes.length,
        technique: topTech || 'yuko',
        isMajority: true
      };
    }
    return null;
  };

  const consensus = getConsensus();

  // Apply Judge Vote to a specific judge
  const handleSetJudgeVote = (
    judgeId: number, 
    color: 'none' | 'aka' | 'ao', 
    technique: 'none' | 'yuko' | 'waza_ari' | 'ippon' | 'c1' | 'c2_jogai'
  ) => {
    setJudges((prev) =>
      prev.map((j) =>
        j.id === judgeId
          ? { ...j, voteColor: color, voteTechnique: technique, timestamp: new Date().toLocaleTimeString() }
          : j
      )
    );
  };

  // Apply Consensus Score to Current Bout
  const handleApplyConsensus = () => {
    if (!consensus || !currentBout) return;

    let points = 1;
    if (consensus.technique === 'waza_ari') points = 2;
    if (consensus.technique === 'ippon') points = 3;

    if (consensus.technique === 'c1' || consensus.technique === 'c2_jogai') {
      // Penalty application
      const isC1 = consensus.technique === 'c1';
      const updated: Bout = {
        ...currentBout,
        akaPenaltiesC1: consensus.side === 'aka' && isC1 ? (currentBout.akaPenaltiesC1 || 0) + 1 : currentBout.akaPenaltiesC1,
        aoPenaltiesC1: consensus.side === 'ao' && isC1 ? (currentBout.aoPenaltiesC1 || 0) + 1 : currentBout.aoPenaltiesC1,
        akaPenaltiesC2: consensus.side === 'aka' && !isC1 ? (currentBout.akaPenaltiesC2 || 0) + 1 : currentBout.akaPenaltiesC2,
        aoPenaltiesC2: consensus.side === 'ao' && !isC1 ? (currentBout.aoPenaltiesC2 || 0) + 1 : currentBout.aoPenaltiesC2
      };
      onUpdateBout(updated);
      refereeAudio.playBuzzer();
      showToast(`Замечание ${isC1 ? 'C1' : 'C2'} вынесено спортсмену ${consensus.side.toUpperCase()} по решению судейского большинства!`);
    } else {
      // Point application
      const currentScore = consensus.side === 'aka' ? currentBout.akaScore : currentBout.aoScore;
      const otherScore = consensus.side === 'aka' ? currentBout.aoScore : currentBout.akaScore;
      let akaSenshu = currentBout.akaSenshu;
      let aoSenshu = currentBout.aoSenshu;

      // Auto Senshu check
      if (currentScore === 0 && otherScore === 0 && !akaSenshu && !aoSenshu) {
        if (consensus.side === 'aka') akaSenshu = true;
        else aoSenshu = true;
      }

      const updated: Bout = {
        ...currentBout,
        akaScore: consensus.side === 'aka' ? currentBout.akaScore + points : currentBout.akaScore,
        aoScore: consensus.side === 'ao' ? currentBout.aoScore + points : currentBout.aoScore,
        akaSenshu,
        aoSenshu
      };

      onUpdateBout(updated);
      refereeAudio.playPointChime(points);
      showToast(
        `✓ Балл +${points} (${consensus.technique.toUpperCase()}) начислен спортсмену ${consensus.side.toUpperCase()} по решению судейского большинства (${consensus.count} флага)!`
      );
    }

    // Reset flags after confirmation
    handleResetAllFlags();
  };

  const handleResetAllFlags = () => {
    setJudges((prev) =>
      prev.map((j) => ({ ...j, voteColor: 'none', voteTechnique: 'none' }))
    );
  };

  // Demo Presets
  const handleApplyPreset = (preset: 'aka_yuko_3' | 'ao_waza_2' | 'split_2_2') => {
    if (preset === 'aka_yuko_3') {
      setJudges([
        { id: 1, name: 'Судья 1 (J1)', position: 'NE', russianPosition: 'Северо-Восток', voteColor: 'aka', voteTechnique: 'yuko' },
        { id: 2, name: 'Судья 2 (J2)', position: 'SE', russianPosition: 'Юго-Восток', voteColor: 'aka', voteTechnique: 'yuko' },
        { id: 3, name: 'Судья 3 (J3)', position: 'SW', russianPosition: 'Юго-Запад', voteColor: 'aka', voteTechnique: 'yuko' },
        { id: 4, name: 'Судья 4 (J4)', position: 'NW', russianPosition: 'Северо-Запад', voteColor: 'none', voteTechnique: 'none' }
      ]);
      refereeAudio.playPointChime(1);
    } else if (preset === 'ao_waza_2') {
      setJudges([
        { id: 1, name: 'Судья 1 (J1)', position: 'NE', russianPosition: 'Северо-Восток', voteColor: 'ao', voteTechnique: 'waza_ari' },
        { id: 2, name: 'Судья 2 (J2)', position: 'SE', russianPosition: 'Юго-Восток', voteColor: 'none', voteTechnique: 'none' },
        { id: 3, name: 'Судья 3 (J3)', position: 'SW', russianPosition: 'Юго-Запад', voteColor: 'ao', voteTechnique: 'waza_ari' },
        { id: 4, name: 'Судья 4 (J4)', position: 'NW', russianPosition: 'Северо-Запад', voteColor: 'none', voteTechnique: 'none' }
      ]);
      refereeAudio.playPointChime(2);
    } else {
      setJudges([
        { id: 1, name: 'Судья 1 (J1)', position: 'NE', russianPosition: 'Северо-Восток', voteColor: 'aka', voteTechnique: 'yuko' },
        { id: 2, name: 'Судья 2 (J2)', position: 'SE', russianPosition: 'Юго-Восток', voteColor: 'ao', voteTechnique: 'yuko' },
        { id: 3, name: 'Судья 3 (J3)', position: 'SW', russianPosition: 'Юго-Запад', voteColor: 'aka', voteTechnique: 'waza_ari' },
        { id: 4, name: 'Судья 4 (J4)', position: 'NW', russianPosition: 'Северо-Запад', voteColor: 'ao', voteTechnique: 'yuko' }
      ]);
    }
  };

  // ==============================================================
  // COACH VR CHALLENGE HANDLING
  // ==============================================================
  const handleInitiateChallenge = (side: 'aka' | 'ao') => {
    setChallengeTargetSide(side);
    setIsChallengeModalOpen(true);
  };

  const handleConfirmChallengeLaunch = () => {
    if (!currentBout) return;

    const challenge: VrChallenge = {
      side: challengeTargetSide,
      requestedAtSecond: currentBout.timerSecondsRemaining,
      reason: selectedChallengeReason,
      status: 'pending'
    };

    setActiveChallenge(challenge);
    if (challengeTargetSide === 'aka') setAkaCardStatus('reviewing');
    else setAoCardStatus('reviewing');

    // Update bout VR state
    onUpdateBout({
      ...currentBout,
      vrReviewActive: true,
      vrReviewSide: challengeTargetSide,
      vrReviewReason: selectedChallengeReason
    });

    refereeAudio.playVrChallenge();
    setIsChallengeModalOpen(false);
    showToast(`🚩 ТРЕНЕР ${challengeTargetSide.toUpperCase()} ПОДАЛ VR ЧЕЛЛЕНДЖ! Главный судья переходит к видеоповтору.`);
  };

  const handleResolveChallenge = (verdict: 'upheld' | 'dismissed') => {
    if (!activeChallenge || !currentBout) return;

    const isAka = activeChallenge.side === 'aka';
    const upheld = verdict === 'upheld';

    if (upheld) {
      // Award requested point or adjust
      let delta = 1;
      if (selectedChallengeReason.includes('Waza-ari') || selectedChallengeReason.includes('+2')) delta = 2;
      if (selectedChallengeReason.includes('Ippon') || selectedChallengeReason.includes('+3')) delta = 3;

      const updated: Bout = {
        ...currentBout,
        akaScore: isAka ? currentBout.akaScore + delta : currentBout.akaScore,
        aoScore: !isAka ? currentBout.aoScore + delta : currentBout.aoScore,
        vrReviewActive: false
      };
      onUpdateBout(updated);

      if (isAka) setAkaCardStatus('upheld');
      else setAoCardStatus('upheld');

      refereeAudio.playChallengeVerdict(true);
      showToast(`✓ ЧЕЛЛЕНДЖ ОДОБРЕН (Upheld)! Баллы начислены спортсмену ${isAka ? 'AKA' : 'AO'}. Карточка тренера сохранена!`);
    } else {
      // Dismiss challenge -> Card is lost (dismissed)
      onUpdateBout({
        ...currentBout,
        vrReviewActive: false
      });

      if (isAka) setAkaCardStatus('dismissed');
      else setAoCardStatus('dismissed');

      refereeAudio.playChallengeVerdict(false);
      showToast(`✖ ЧЕЛЛЕНДЖ ОТКЛОНЕН (Dismissed). Решение на татами остается в силе. Карточка тренера ${isAka ? 'AKA' : 'AO'} СГОРЕЛА.`);
    }

    setActiveChallenge(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/80 text-amber-200 font-mono text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in duration-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-rose-400" />
              <span>WKF Referee Commission & Video Review System</span>
            </span>
            {currentBout.vrReviewActive && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 border border-amber-500 text-amber-300 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>ИДЕТ ВИДЕОПОВТОР VR</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1">
            Судейский пульт: Электронные флаги и видеоповторы (VR)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Система электронного голосования боковых судей (Fukushin J1–J4), симулятор видеоповторов спорных моментов и тренерские VR-челленджи
          </p>
        </div>

        {/* Bout Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-400">Поединок:</span>
            <select
              value={selectedBoutId}
              onChange={(e) => setSelectedBoutId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-500"
            >
              {bouts.map((b) => (
                <option key={b.id} value={b.id}>
                  Татами №{b.tatamiNumber || 1} · Бой #{b.boutNumber} · {b.akaParticipant?.lastName || 'AKA'} vs {b.aoParticipant?.lastName || 'AO'}
                </option>
              ))}
            </select>
          </div>

          {onNavigateToScoreboard && (
            <button
              onClick={() => onNavigateToScoreboard(currentBout.id)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-rose-400" />
              <span>Открыть на табло</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner: Coach VR Challenge Cards Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            VR
          </div>
          <div>
            <div className="text-xs font-bold font-mono text-white">Тренерские карточки видеочелленджа (WKF VR Cards)</div>
            <div className="text-[11px] text-slate-400 font-mono">1 запрос на поединок. Карточка сохраняется только при удовлетворении протеста.</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AKA Card */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-950 border border-rose-600/80 flex items-center gap-3">
            <div>
              <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">Тренер AKA (Красный)</div>
              <div className="text-xs font-mono font-bold text-white">
                {akaCardStatus === 'available' ? '✓ Карточка доступна' : akaCardStatus === 'reviewing' ? '● Идет проверка VR' : akaCardStatus === 'upheld' ? '✓ Удовлетворена (Сохранена)' : '✖ Сгорела (Отклонена)'}
              </div>
            </div>
            {akaCardStatus === 'available' && (
              <button
                onClick={() => handleInitiateChallenge('aka')}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono font-bold transition-all shadow cursor-pointer"
              >
                Челлендж 🚩
              </button>
            )}
          </div>

          {/* AO Card */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-950/80 to-slate-950 border border-blue-600/80 flex items-center gap-3">
            <div>
              <div className="text-[10px] font-mono text-blue-400 font-bold uppercase">Тренер AO (Синий)</div>
              <div className="text-xs font-mono font-bold text-white">
                {aoCardStatus === 'available' ? '✓ Карточка доступна' : aoCardStatus === 'reviewing' ? '● Идет проверка VR' : aoCardStatus === 'upheld' ? '✓ Удовлетворена (Сохранена)' : '✖ Сгорела (Отклонена)'}
              </div>
            </div>
            {aoCardStatus === 'available' && (
              <button
                onClick={() => handleInitiateChallenge('ao')}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold transition-all shadow cursor-pointer"
              >
                Челлендж 🚩
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Electronic Corner Flags (Left 6 cols) + Video Review Console (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: ELECTRONIC CORNER JUDGES (FUKUSHIN) & TATAMI 2D   */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Электронные флаги боковых судей (J1–J4)
                </h3>
              </div>

              {/* Reset flags */}
              <button
                onClick={handleResetAllFlags}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Сбросить все судейские флаги"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Сброс</span>
              </button>
            </div>

            {/* Tatami Aerial 2D Canvas View (8x8m Area) */}
            <div className="relative aspect-square max-w-[420px] mx-auto rounded-2xl bg-slate-950 border-2 border-slate-800 p-6 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Outer Blue Safety Zone */}
              <div className="absolute inset-4 rounded-xl border border-blue-900/50 bg-blue-950/20 pointer-events-none" />

              {/* Inner Red Competition Area (8x8m) */}
              <div className="absolute inset-12 rounded-lg border-2 border-rose-900/60 bg-gradient-to-br from-rose-950/30 via-slate-950 to-rose-950/30 flex flex-col items-center justify-center pointer-events-none">
                {/* Center Starting Lines (Aka & Ao marks) */}
                <div className="flex items-center gap-8 pointer-events-none">
                  <div className="w-10 h-1.5 bg-rose-600 rounded-full shadow-lg shadow-rose-900/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-10 h-1.5 bg-blue-600 rounded-full shadow-lg shadow-blue-900/50" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600 mt-2">
                  ТАМИ №{currentBout.tatamiNumber || 1} · 8×8м
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  Рефери Shushin
                </span>
              </div>

              {/* 4 Corner Judges Positioned on the Corners */}
              {/* Top Row: NW (J4) & NE (J1) */}
              <div className="flex items-center justify-between z-10">
                {/* J4: North-West */}
                <JudgeCornerNode
                  judge={judges[3]}
                  onSelectJudge={() => setActiveEditingJudge(4)}
                  isActive={activeEditingJudge === 4}
                />

                {/* J1: North-East */}
                <JudgeCornerNode
                  judge={judges[0]}
                  onSelectJudge={() => setActiveEditingJudge(1)}
                  isActive={activeEditingJudge === 1}
                />
              </div>

              {/* Bottom Row: SW (J3) & SE (J2) */}
              <div className="flex items-center justify-between z-10">
                {/* J3: South-West */}
                <JudgeCornerNode
                  judge={judges[2]}
                  onSelectJudge={() => setActiveEditingJudge(3)}
                  isActive={activeEditingJudge === 3}
                />

                {/* J2: South-East */}
                <JudgeCornerNode
                  judge={judges[1]}
                  onSelectJudge={() => setActiveEditingJudge(2)}
                  isActive={activeEditingJudge === 2}
                />
              </div>
            </div>

            {/* Quick Flag Presets for Demonstration */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Демонстрация сигналов:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleApplyPreset('aka_yuko_3')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                >
                  3 флага AKA (+1)
                </button>
                <button
                  onClick={() => handleApplyPreset('ao_waza_2')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                >
                  2 флага AO (+2)
                </button>
                <button
                  onClick={() => handleApplyPreset('split_2_2')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Спор (2 на 2)
                </button>
              </div>
            </div>

            {/* Majority Rule Consensus Alert Card */}
            {consensus ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Консенсус судейского большинства (WKF Article 7)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-emerald-900/60">
                    {consensus.count} из 4 судей
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-white">
                      {consensus.side === 'aka' ? 'КРАСНЫЙ (AKA)' : 'СИНИЙ (AO)'} —{' '}
                      <span className={consensus.side === 'aka' ? 'text-rose-400' : 'text-blue-400'}>
                        {consensus.technique.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {consensus.technique === 'yuko' ? '+1 балл (цуки чудан/дзёдан)' : consensus.technique === 'waza_ari' ? '+2 балла (гери чудан)' : consensus.technique === 'ippon' ? '+3 балла (гери дзёдан/подсечка)' : 'Дисциплинарное решение'}
                    </div>
                  </div>

                  <button
                    onClick={handleApplyConsensus}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 cursor-pointer"
                  >
                    Утвердить решение рефери ✓
                  </button>
                </div>
              </div>
            ) : akaVotes.length > 0 && aoVotes.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600 text-amber-200 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Мнения судей разделились ({akaVotes.length} AKA vs {aoVotes.length} AO). Решающее слово за главным рефери (Shushin).</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-500 text-center">
                Ожидание сигналов боковых судей (кликните на судью J1–J4 для подъема флага)
              </div>
            )}

            {/* Individual Judge Control Console */}
            {activeEditingJudge !== null && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                  <span>Пульт судьи J{activeEditingJudge}:</span>
                  <button
                    onClick={() => setActiveEditingJudge(null)}
                    className="text-slate-500 hover:text-white"
                  >
                    Закрыть ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* AKA Actions */}
                  <div className="space-y-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-900/50">
                    <span className="text-[10px] text-rose-400 font-bold">Флаг AKA (Красный):</span>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSetJudgeVote(activeEditingJudge, 'aka', 'yuko')}
                        className="w-full py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-bold cursor-pointer"
                      >
                        Yuko (+1)
                      </button>
                      <button
                        onClick={() => handleSetJudgeVote(activeEditingJudge, 'aka', 'waza_ari')}
                        className="w-full py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-bold cursor-pointer"
                      >
                        Waza-ari (+2)
                      </button>
                      <button
                        onClick={() => handleSetJudgeVote(activeEditingJudge, 'aka', 'ippon')}
                        className="w-full py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        Ippon (+3)
                      </button>
                    </div>
                  </div>

                  {/* AO Actions */}
                  <div className="space-y-1.5 p-2 rounded-lg bg-blue-950/40 border border-blue-900/50">
                    <span className="text-[10px] text-blue-400 font-bold">Флаг AO (Синий):</span>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSetJudgeVote(activeEditingJudge, 'ao', 'yuko')}
                        className="w-full py-1 rounded bg-blue-900/80 hover:bg-blue-800 text-white font-bold cursor-pointer"
                      >
                        Yuko (+1)
                      </button>
                      <button
                        onClick={() => handleSetJudgeVote(activeEditingJudge, 'ao', 'waza_ari')}
                        className="w-full py-1 rounded bg-blue-900/80 hover:bg-blue-800 text-white font-bold cursor-pointer"
                      >
                        Waza-ari (+2)
                      </button>
                      <button
                        onClick={() => handleSetJudgeVote(activeEditingJudge, 'ao', 'ippon')}
                        className="w-full py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                      >
                        Ippon (+3)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs font-mono">
                  <button
                    onClick={() => handleSetJudgeVote(activeEditingJudge, 'none', 'none')}
                    className="text-slate-400 hover:text-white"
                  >
                    Mienai (Не видел)
                  </button>
                  <button
                    onClick={() => handleSetJudgeVote(activeEditingJudge, 'aka', 'c1')}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    Замечание C1
                  </button>
                  <button
                    onClick={() => handleSetJudgeVote(activeEditingJudge, 'ao', 'c2_jogai')}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Выход Jogai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: VIDEO REVIEW (VR) CONSOLE & CHALLENGE LOG        */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Панель видеоповтора (Video Review / VR Console)
                </h3>
              </div>

              {/* Camera Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => setSelectedCamera('cam1')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedCamera === 'cam1' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Кам 1 (Центр)
                </button>
                <button
                  onClick={() => setSelectedCamera('cam2')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedCamera === 'cam2' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Кам 2 (Jogai)
                </button>
                <button
                  onClick={() => setSelectedCamera('cam3')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedCamera === 'cam3' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slow-Mo
                </button>
              </div>
            </div>

            {/* Simulated Live VR Video Screen with Canvas Animation */}
            <div className={`relative aspect-video rounded-2xl bg-slate-950 border-2 overflow-hidden shadow-2xl flex flex-col justify-between p-4 ${
              currentBout.vrReviewActive ? 'border-amber-500 shadow-amber-950/40' : 'border-slate-800'
            }`}>
              {/* Top Watermark Bar */}
              <div className="flex items-center justify-between text-[10px] font-mono z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-white uppercase tracking-wider">
                    WKF VR OFFICIAL · ТАТАМИ №{currentBout.tatamiNumber || 1}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-sm border border-slate-700">
                  {selectedCamera === 'cam1' ? 'HD CAMERA 1 · WIDE' : selectedCamera === 'cam2' ? 'HD CAMERA 2 · JOGAI LINE' : '4K ULTRA SLOW-MO · 240 FPS'}
                </div>
              </div>

              {/* Graphic Simulator of Karate Strike / Crosshair */}
              <div className="relative flex-1 flex items-center justify-center pointer-events-none">
                {/* Simulated Fighters */}
                <div className={`relative w-48 h-32 flex items-center justify-center transition-transform duration-300 ${
                  vrZoomActive ? 'scale-150' : 'scale-100'
                }`}>
                  {/* Aka Fighter (Red) */}
                  <div className="absolute left-8 bottom-4 w-12 h-24 rounded-t-lg bg-gradient-to-t from-slate-200 to-rose-600 border border-rose-400 flex flex-col items-center justify-between p-1 shadow-lg">
                    <span className="text-[8px] font-black text-white">AKA</span>
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                  </div>

                  {/* Ao Fighter (Blue) */}
                  <div className="absolute right-8 bottom-4 w-12 h-24 rounded-t-lg bg-gradient-to-t from-slate-200 to-blue-600 border border-blue-400 flex flex-col items-center justify-between p-1 shadow-lg">
                    <span className="text-[8px] font-black text-white">AO</span>
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                  </div>

                  {/* Precision Crosshair on Contact Zone */}
                  <div className="absolute top-10 left-20 w-8 h-8 rounded-full border border-amber-400/80 flex items-center justify-center animate-ping pointer-events-none" />
                  <div className="absolute top-10 left-20 w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                </div>

                {/* Jogai Line Grid Overlay if active */}
                {vrGridActive && (
                  <div className="absolute inset-0 border-b-2 border-dashed border-red-500/40 pointer-events-none" />
                )}

                {/* VR Review Overlay Alert */}
                {currentBout.vrReviewActive && (
                  <div className="absolute top-2 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 font-black font-mono text-xs shadow-lg animate-bounce uppercase">
                    ⚠ ПРОСМОТР ЧЕЛЛЕНДЖА: {currentBout.vrReviewReason || 'СПОРНЫЙ ЭПИЗОД'}
                  </div>
                )}
              </div>

              {/* Bottom Video Meta Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono z-10 bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-bold">
                  Кадр {vrCurrentFrame}/300 · 00:0{Math.floor(vrCurrentFrame / 60)}:{(vrCurrentFrame % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-slate-400">
                  Скорость: <strong className="text-white">{vrPlaybackSpeed}x</strong>
                </span>
              </div>
            </div>

            {/* Video Playback Transport Controls */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsVrPlaying(!isVrPlaying)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all shadow-md cursor-pointer ${
                    isVrPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                  title={isVrPlaying ? 'Пауза' : 'Воспроизведение'}
                >
                  {isVrPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => setVrCurrentFrame((prev) => Math.max(1, prev - 1))}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  title="Шаг на 1 кадр назад"
                >
                  -1 кадр
                </button>
                <button
                  onClick={() => setVrCurrentFrame((prev) => Math.min(300, prev + 1))}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                  title="Шаг на 1 кадр вперед"
                >
                  +1 кадр
                </button>
                <button
                  onClick={() => setVrCurrentFrame(1)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
                  title="Сброс на начало"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-mono">Скорость:</span>
                {[0.25, 0.5, 1.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setVrPlaybackSpeed(spd as 0.25 | 0.5 | 1.0)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      vrPlaybackSpeed === spd ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Zoom and Grid Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVrZoomActive(!vrZoomActive)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    vrZoomActive ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Увеличение зоны контакта"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVrGridActive(!vrGridActive)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    vrGridActive ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500'
                  }`}
                  title="Сетка линии татами"
                >
                  Линия ковра
                </button>
              </div>
            </div>

            {/* Verdict Decision Station for Active Challenge */}
            {activeChallenge && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-2 border-amber-500 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>ВЕРДИКТ СУПЕРВАЙЗЕРА VR (KANSA):</span>
                  </span>
                  <span className="text-xs font-mono text-white">
                    Заявитель: <strong className="text-amber-400 uppercase">{activeChallenge.side}</strong>
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Предмет челленджа: <strong className="text-white">{activeChallenge.reason}</strong>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleResolveChallenge('upheld')}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Одобрить (Upheld) ✓</span>
                  </button>

                  <button
                    onClick={() => handleResolveChallenge('dismissed')}
                    className="py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-mono font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Отклонить (Dismissed) ✖</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: LAUNCH COACH VR CHALLENGE                               */}
      {/* ============================================================== */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Запрос тренерского челленджа (VR Video Review)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Инициатор: <strong className="text-rose-400 uppercase">{challengeTargetSide}</strong> · Бой #{currentBout.boutNumber}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Выберите предмет видеопроверки (WKF):</label>
              <select
                value={selectedChallengeReason}
                onChange={(e) => setSelectedChallengeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="Неначисленный балл (Yuko +1 / Цуки)">1. Неначисленный балл (Yuko +1 / Цуки)</option>
                <option value="Неначисленный балл (Waza-ari +2 / Гери чудан)">2. Неначисленный балл (Waza-ari +2 / Гери чудан)</option>
                <option value="Неначисленный балл (Ippon +3 / Гери дзёдан)">3. Неначисленный балл (Ippon +3 / Гери дзёдан)</option>
                <option value="Нарушение C1: Жесткий контакт / удар после команды Ямэ">4. Нарушение C1: Жесткий контакт соперника / удар после Ямэ</option>
                <option value="Нарушение C2: Заступ соперника за линию татами (Jogai)">5. Нарушение C2: Заступ соперника за линию (Jogai)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-amber-400 font-bold">Правило сохранения карточки:</div>
              <div>• Если протест удовлетворен — карточка возвращается тренеру.</div>
              <div>• Если протест отклонен — карточка сгорает до конца поединка.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsChallengeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmChallengeLaunch}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-md cursor-pointer"
              >
                Начать видеопросмотр 🚩
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================================================
// HELPER COMPONENT: JUDGE CORNER NODE ON 2D TATAMI
// ==============================================================
interface JudgeCornerNodeProps {
  judge: CornerJudgeState;
  isActive: boolean;
  onSelectJudge: () => void;
}

const JudgeCornerNode: React.FC<JudgeCornerNodeProps> = ({
  judge,
  isActive,
  onSelectJudge
}) => {
  const isAka = judge.voteColor === 'aka';
  const isAo = judge.voteColor === 'ao';

  return (
    <button
      onClick={onSelectJudge}
      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 shadow-md ${
        isActive 
          ? 'bg-slate-900 border-amber-400 shadow-amber-950/60 ring-2 ring-amber-400/40' 
          : isAka 
          ? 'bg-rose-950/90 border-rose-500 shadow-rose-950/40' 
          : isAo 
          ? 'bg-blue-950/90 border-blue-500 shadow-blue-950/40' 
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono font-bold text-slate-300">
          J{judge.id}
        </span>
        <span className="text-[9px] text-slate-500 font-mono">
          ({judge.position})
        </span>
      </div>

      {/* Flag representation */}
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 border border-slate-800">
        {isAka ? (
          <div className="flex flex-col items-center animate-bounce">
            <span className="w-4 h-3 bg-rose-600 rounded-sm shadow-sm" />
            <span className="text-[8px] font-black text-rose-300 font-mono mt-0.5">
              {judge.voteTechnique.toUpperCase()}
            </span>
          </div>
        ) : isAo ? (
          <div className="flex flex-col items-center animate-bounce">
            <span className="w-4 h-3 bg-blue-600 rounded-sm shadow-sm" />
            <span className="text-[8px] font-black text-blue-300 font-mono mt-0.5">
              {judge.voteTechnique.toUpperCase()}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-600 font-mono font-bold">
            —
          </span>
        )}
      </div>
    </button>
  );
};
