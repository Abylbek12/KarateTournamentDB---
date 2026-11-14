import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  CheckCircle2, 
  Tv, 
  Shield, 
  Activity, 
  RefreshCw,
  Zap,
  Save,
  Sliders,
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  Database,
  Flag,
  UserCheck,
  CheckCheck,
  Download,
  Share2
} from 'lucide-react';
import { 
  Bout, 
  Participant, 
  WinReason, 
  Tatami, 
  TournamentRules, 
  RefereeProtocol, 
  BoutEvent,
  UserRole
} from '../types/schema';
import { ManualBoutControlModal } from './ManualBoutControlModal';

export interface JudgeVote {
  judgeIndex: number; // 0..3 (J1..J4)
  color: 'none' | 'aka' | 'ao';
  technique: 'yuko' | 'waza_ari' | 'ippon';
}

interface OnlineScoreboardProps {
  tatamis: Tatami[];
  bouts: Bout[];
  participants: Participant[];
  initialBoutId?: string;
  tournamentRules?: TournamentRules;
  currentUserRole?: UserRole;
  protocols?: RefereeProtocol[];
  onRulesChange?: (rules: TournamentRules) => void;
  onUpdateBout: (updatedBout: Bout) => void;
  onSaveProtocol?: (protocol: RefereeProtocol) => void;
  onNavigateToBracket?: () => void;
  onNavigateToProtocols?: (boutId?: string) => void;
}

export const OnlineScoreboard: React.FC<OnlineScoreboardProps> = ({
  tatamis,
  bouts,
  participants,
  initialBoutId,
  tournamentRules = 'wkf',
  currentUserRole = 'admin',
  protocols = [],
  onRulesChange,
  onUpdateBout,
  onSaveProtocol,
  onNavigateToBracket,
  onNavigateToProtocols
}) => {
  // Tatami selection
  const [selectedTatamiId, setSelectedTatamiId] = useState<string>(
    tatamis[0]?.id || 't1'
  );

  // Available bouts on selected tatami
  const tatamiBouts = bouts.filter((b) => b.tatamiId === selectedTatamiId);

  // Current active bout on this tatami (or selected)
  const [currentBoutId, setCurrentBoutId] = useState<string>(
    initialBoutId || tatamiBouts[0]?.id || bouts[0]?.id || ''
  );

  const activeBout = bouts.find((b) => b.id === currentBoutId) || tatamiBouts[0] || bouts[0];

  // Active rule mode: local or global
  const [currentRules, setCurrentRules] = useState<TournamentRules>(
    activeBout?.ruleSystem || tournamentRules || 'wkf'
  );

  // SKIF format: Shobu Ippon vs Shobu Sanbon
  const [skifFormat, setSkifFormat] = useState<'shobu_ippon' | 'shobu_sanbon'>(
    activeBout?.skifFormat || 'shobu_sanbon'
  );

  // Scoreboard match state (WKF)
  const [akaScore, setAkaScore] = useState(activeBout?.akaScore || 0);
  const [aoScore, setAoScore] = useState(activeBout?.aoScore || 0);
  const [akaSenshu, setAkaSenshu] = useState(activeBout?.akaSenshu || false);
  const [aoSenshu, setAoSenshu] = useState(activeBout?.aoSenshu || false);
  const [akaPenaltiesC1, setAkaPenaltiesC1] = useState(activeBout?.akaPenaltiesC1 || 0);
  const [aoPenaltiesC1, setAoPenaltiesC1] = useState(activeBout?.aoPenaltiesC1 || 0);
  const [akaPenaltiesC2, setAkaPenaltiesC2] = useState(activeBout?.akaPenaltiesC2 || 0);
  const [aoPenaltiesC2, setAoPenaltiesC2] = useState(activeBout?.aoPenaltiesC2 || 0);

  // SKIF specific state
  const [akaWazaAri, setAkaWazaAri] = useState(activeBout?.akaWazaAri || 0);
  const [aoWazaAri, setAoWazaAri] = useState(activeBout?.aoWazaAri || 0);
  const [akaIppon, setAkaIppon] = useState(activeBout?.akaIppon || 0);
  const [aoIppon, setAoIppon] = useState(activeBout?.aoIppon || 0);
  const [akaSkifPenalties, setAkaSkifPenalties] = useState(activeBout?.akaSkifPenalties || 0);
  const [aoSkifPenalties, setAoSkifPenalties] = useState(activeBout?.aoSkifPenalties || 0);
  const [akaJogai, setAkaJogai] = useState(activeBout?.akaJogai || 0);
  const [aoJogai, setAoJogai] = useState(activeBout?.aoJogai || 0);
  const [isEnchoSen, setIsEnchoSen] = useState(activeBout?.isEnchoSen || false);

  // Shared timer & match state
  const [timerSeconds, setTimerSeconds] = useState(activeBout?.timerSecondsRemaining || 120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | undefined>(activeBout?.winnerId);
  const [winReason, setWinReason] = useState<WinReason | undefined>(activeBout?.winReason);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [advancementNotice, setAdvancementNotice] = useState<string | null>(null);
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; text: string; side?: 'aka' | 'ao' }>>([]);
  const [doctorSeconds, setDoctorSeconds] = useState<number | null>(null);

  // Manual Referee Override Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Corner Judges (Fukushin 1..4) Interactive Flag Console state
  const [judgeVotes, setJudgeVotes] = useState<JudgeVote[]>([
    { judgeIndex: 0, color: 'none', technique: 'yuko' },
    { judgeIndex: 1, color: 'none', technique: 'yuko' },
    { judgeIndex: 2, color: 'none', technique: 'yuko' },
    { judgeIndex: 3, color: 'none', technique: 'yuko' },
  ]);
  const [quorumNotice, setQuorumNotice] = useState<{ text: string; side: 'aka' | 'ao' } | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'flags' | 'kata' | 'protocol' | 'vr'>('flags');

  // Video Review Card (VR Kansa)
  const [videoReviewState, setVideoReviewState] = useState<{
    akaUsed: boolean;
    aoUsed: boolean;
    inReview: boolean;
    initiatorSide?: 'aka' | 'ao';
    outcome?: 'upheld' | 'dismissed';
  }>({
    akaUsed: false,
    aoUsed: false,
    inReview: false
  });

  // Kata Scoring Console (5-7 judges)
  const [kataJudgesAka, setKataJudgesAka] = useState<number[]>([7.8, 8.2, 8.4, 7.9, 8.1, 8.3, 8.0]);
  const [kataJudgesAo, setKataJudgesAo] = useState<number[]>([7.6, 8.0, 8.1, 7.8, 7.9, 8.2, 7.7]);
  const [kataSelectedFighter, setKataSelectedFighter] = useState<'aka' | 'ao'>('aka');

  // Database Protocol Persistence Feedback
  const [protocolSavedNotice, setProtocolSavedNotice] = useState<string | null>(null);
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [generatedSql, setGeneratedSql] = useState<string>('');

  // Audio synthesizer for arena gong/buzzer
  const playSound = (type: 'gong' | 'buzzer' | 'point' | 'warning') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'gong') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else if (type === 'buzzer') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else if (type === 'point') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Ignore audio failure
    }
  };

  // Sync state when active bout changes
  useEffect(() => {
    if (activeBout) {
      setAkaScore(activeBout.akaScore || 0);
      setAoScore(activeBout.aoScore || 0);
      setAkaSenshu(activeBout.akaSenshu || false);
      setAoSenshu(activeBout.aoSenshu || false);
      setAkaPenaltiesC1(activeBout.akaPenaltiesC1 || 0);
      setAoPenaltiesC1(activeBout.aoPenaltiesC1 || 0);
      setAkaPenaltiesC2(activeBout.akaPenaltiesC2 || 0);
      setAoPenaltiesC2(activeBout.aoPenaltiesC2 || 0);

      // SKIF sync
      setAkaWazaAri(activeBout.akaWazaAri || (activeBout.akaScore > 0 ? Math.floor(activeBout.akaScore / 2) : 0));
      setAoWazaAri(activeBout.aoWazaAri || (activeBout.aoScore > 0 ? Math.floor(activeBout.aoScore / 2) : 0));
      setAkaIppon(activeBout.akaIppon || 0);
      setAoIppon(activeBout.aoIppon || 0);
      setAkaSkifPenalties(activeBout.akaSkifPenalties || 0);
      setAoSkifPenalties(activeBout.aoSkifPenalties || 0);
      setAkaJogai(activeBout.akaJogai || 0);
      setAoJogai(activeBout.aoJogai || 0);
      setIsEnchoSen(activeBout.isEnchoSen || false);
      setSkifFormat(activeBout.skifFormat || 'shobu_sanbon');

      setTimerSeconds(activeBout.timerSecondsRemaining ?? 120);
      setIsTimerRunning(activeBout.status === 'in_progress');
      setWinnerId(activeBout.winnerId);
      setWinReason(activeBout.winReason);
      setEventLogs([
        {
          time: '00:00',
          text: `Загружен поединок #${activeBout.boutNumber} (${activeBout.roundStage}) · Регламент: ${
            currentRules === 'skif' ? 'SKIF (Shobu Ippon/Sanbon)' : 'WKF'
          }`
        }
      ]);
    }
  }, [activeBout?.id, currentRules]);

  // Sync rule system if prop changes
  useEffect(() => {
    if (tournamentRules && tournamentRules !== currentRules) {
      setCurrentRules(tournamentRules);
    }
  }, [tournamentRules]);

  // Net time timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === 16) {
            playSound('warning');
          }
          if (prev <= 1) {
            setIsTimerRunning(false);
            playSound('buzzer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Doctor 10-second timer
  useEffect(() => {
    let docInterval: any = null;
    if (doctorSeconds !== null && doctorSeconds > 0) {
      docInterval = setInterval(() => {
        setDoctorSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(docInterval);
  }, [doctorSeconds]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === '1') {
        if (currentRules === 'skif') {
          addSkifWazaAri('aka');
        } else {
          addWkfPoint('aka', 1, 'Юко');
        }
      } else if (e.key === '2') {
        if (currentRules === 'skif') {
          addSkifIppon('aka');
        } else {
          addWkfPoint('aka', 2, 'Ваза-ари');
        }
      } else if (e.key === '3') {
        if (currentRules === 'wkf') addWkfPoint('aka', 3, 'Иппон');
      } else if (e.key === '4') {
        if (currentRules === 'skif') {
          addSkifWazaAri('ao');
        } else {
          addWkfPoint('ao', 1, 'Юко');
        }
      } else if (e.key === '5') {
        if (currentRules === 'skif') {
          addSkifIppon('ao');
        } else {
          addWkfPoint('ao', 2, 'Ваза-ари');
        }
      } else if (e.key === '6') {
        if (currentRules === 'wkf') addWkfPoint('ao', 3, 'Иппон');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimerRunning, akaScore, aoScore, akaSenshu, aoSenshu, akaWazaAri, aoWazaAri, currentRules, timerSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isTimerRunning) {
      playSound('gong');
      setIsTimerRunning(true);
      setEventLogs((prev) => [
        { time: formatTime(timerSeconds), text: 'ХАДЗИМЭ: Поединок запущен' },
        ...prev
      ]);
    } else {
      setIsTimerRunning(false);
      setEventLogs((prev) => [
        { time: formatTime(timerSeconds), text: 'ЯМЭ: Поединок приостановлен' },
        ...prev
      ]);
    }
  };

  // Rule switcher
  const handleToggleRules = (targetRule: TournamentRules) => {
    setCurrentRules(targetRule);
    if (onRulesChange) onRulesChange(targetRule);
    setEventLogs((prev) => [
      {
        time: formatTime(timerSeconds),
        text: `Смена регламента соревнований на: ${targetRule.toUpperCase()} (${
          targetRule === 'skif' ? 'Shotokan Shobu Ippon/Sanbon' : 'WKF Olympic'
        })`
      },
      ...prev
    ]);
  };

  // =========================================================================
  // WKF SCORING LOGIC
  // =========================================================================
  const checkWkfMercyRule = (newAka: number, newAo: number) => {
    const diff = Math.abs(newAka - newAo);
    if (diff >= 8) {
      playSound('buzzer');
      setIsTimerRunning(false);
      const leadingSide = newAka > newAo ? 'aka' : 'ao';
      const winnerName = leadingSide === 'aka' ? akaName : aoName;
      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `ПРАВИЛО РАЗНИЦЫ 8 ОЧКОВ: Досрочная победа ${winnerName}!`
        },
        ...prev
      ]);
      handleDeclareWinner(leadingSide, 'mercy_rule_8pt');
    }
  };

  const addWkfPoint = (side: 'aka' | 'ao', points: number, label: string) => {
    playSound('point');
    if (side === 'aka') {
      const nextScore = akaScore + points;
      setAkaScore(nextScore);

      let senshuGained = false;
      if (!akaSenshu && !aoSenshu && akaScore === 0 && aoScore === 0) {
        setAkaSenshu(true);
        senshuGained = true;
      }

      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `АКА: +${points} балл (${label})${senshuGained ? ' + SENSHU' : ''}`,
          side: 'aka'
        },
        ...prev
      ]);

      checkWkfMercyRule(nextScore, aoScore);
    } else {
      const nextScore = aoScore + points;
      setAoScore(nextScore);

      let senshuGained = false;
      if (!akaSenshu && !aoSenshu && akaScore === 0 && aoScore === 0) {
        setAoSenshu(true);
        senshuGained = true;
      }

      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `АО: +${points} балл (${label})${senshuGained ? ' + SENSHU' : ''}`,
          side: 'ao'
        },
        ...prev
      ]);

      checkWkfMercyRule(akaScore, nextScore);
    }
  };

  // =========================================================================
  // REFEREE QUORUM CONSENSUS ENGINE (Fukushin 1..4 Flag System)
  // =========================================================================
  const handleJudgeVote = (
    judgeIndex: number, 
    color: 'none' | 'aka' | 'ao', 
    technique: 'yuko' | 'waza_ari' | 'ippon'
  ) => {
    const updatedVotes = judgeVotes.map((v) => 
      v.judgeIndex === judgeIndex ? { ...v, color, technique } : v
    );
    setJudgeVotes(updatedVotes);

    if (color !== 'none') {
      const matchingJudges = updatedVotes.filter((v) => v.color === color && v.technique === technique);
      // Quorum WKF: >= 2 corner judges agreeing on the same side and technique
      if (matchingJudges.length >= 2) {
        const pts = technique === 'yuko' ? 1 : technique === 'waza_ari' ? 2 : 3;
        const techName = technique === 'yuko' ? 'ЮКО (1 балл)' : technique === 'waza_ari' ? 'ВАЗА-АРИ (2 балла)' : 'ИППОН (3 балла)';
        const judgesList = matchingJudges.map((j) => `Судья ${j.judgeIndex + 1}`).join(', ');

        if (color === 'aka') {
          addWkfPoint('aka', pts, `${techName} · [Кворум: ${judgesList}]`);
        } else {
          addWkfPoint('ao', pts, `${techName} · [Кворум: ${judgesList}]`);
        }

        setQuorumNotice({
          text: `✓ КВОРУМ СУДЕЙ: ${color.toUpperCase()} ${techName} [${judgesList}] ПОДТВЕРЖДЕНО!`,
          side: color
        });

        // Auto reset flags after 2s
        setTimeout(() => {
          setJudgeVotes([
            { judgeIndex: 0, color: 'none', technique: 'yuko' },
            { judgeIndex: 1, color: 'none', technique: 'yuko' },
            { judgeIndex: 2, color: 'none', technique: 'yuko' },
            { judgeIndex: 3, color: 'none', technique: 'yuko' }
          ]);
          setQuorumNotice(null);
        }, 2200);
      }
    }
  };

  // Video Review (VR Kansa)
  const handleTriggerVideoReview = (side: 'aka' | 'ao') => {
    playSound('warning');
    setIsTimerRunning(false);
    setVideoReviewState((prev) => ({
      ...prev,
      inReview: true,
      initiatorSide: side,
      akaUsed: side === 'aka' ? true : prev.akaUsed,
      aoUsed: side === 'ao' ? true : prev.aoUsed
    }));
    setEventLogs((prev) => [
      {
        time: formatTime(timerSeconds),
        text: `ВИДЕОПОВТОР VR: Запрос тренера ${side.toUpperCase()} на пересмотр эпизода. Арбитр Канса изучает запись.`,
        side
      },
      ...prev
    ]);
  };

  const handleResolveVideoReview = (verdict: 'upheld' | 'dismissed', pointsToAdd?: { side: 'aka' | 'ao'; pts: number }) => {
    playSound(verdict === 'upheld' ? 'point' : 'buzzer');
    const side = videoReviewState.initiatorSide || 'aka';
    setVideoReviewState((prev) => ({ ...prev, inReview: false, outcome: verdict }));

    if (verdict === 'upheld' && pointsToAdd) {
      if (pointsToAdd.side === 'aka') {
        addWkfPoint('aka', pointsToAdd.pts, 'Решение VR: Оценка подтверждена');
      } else {
        addWkfPoint('ao', pointsToAdd.pts, 'Решение VR: Оценка подтверждена');
      }
      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `РЕШЕНИЕ VR: Запрос тренера ${side.toUpperCase()} УДОВЛЕТВОРЕН. Начислено +${pointsToAdd.pts} балла.`,
          side: pointsToAdd.side
        },
        ...prev
      ]);
    } else {
      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `РЕШЕНИЕ VR: Запрос тренера ${side.toUpperCase()} ОТКЛОНЕН. Карточка VR аннулирована.`,
          side
        },
        ...prev
      ]);
    }
  };

  // Kata Scoring Calculation (Trimmed min/max + WKF formula)
  const calculateKataTotal = (scores: number[]) => {
    if (scores.length < 3) return 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, sorted.length - 1);
    const sum = trimmed.reduce((acc, v) => acc + v, 0);
    return Math.round(sum * 10) / 10;
  };

  const handleApplyKataScore = (fighter: 'aka' | 'ao') => {
    playSound('point');
    const scores = fighter === 'aka' ? kataJudgesAka : kataJudgesAo;
    const total = calculateKataTotal(scores);
    const fighterName = fighter === 'aka' ? akaName : aoName;

    const updatedBout: Bout = {
      ...activeBout,
      discipline: 'kata',
      akaKataScore: fighter === 'aka' ? total : activeBout.akaKataScore,
      aoKataScore: fighter === 'ao' ? total : activeBout.aoKataScore,
      akaScore: fighter === 'aka' ? Math.round(total) : activeBout.akaScore,
      aoScore: fighter === 'ao' ? Math.round(total) : activeBout.aoScore
    };
    onUpdateBout(updatedBout);

    setEventLogs((prev) => [
      {
        time: formatTime(timerSeconds),
        text: `СУДЕЙСТВО КАТА: Выступление ${fighterName}. Итоговый балл: ${total.toFixed(1)} [Оценки: ${scores.join(', ')}]`,
        side: fighter
      },
      ...prev
    ]);
  };

  // Instant Certify & Persist Protocol into PostgreSQL
  const handleCertifyAndPersistProtocol = () => {
    playSound('gong');
    const nowTime = new Date().toLocaleTimeString('ru-RU');
    const protoNumber = activeBout.refereeProtocolId || `PR-2026-T${activeBout.tatamiNumber || 1}-${activeBout.boutNumber}`;

    const newProtocol: RefereeProtocol = {
      id: `prot_${activeBout.id}_${Date.now()}`,
      protocolNumber: protoNumber,
      boutId: activeBout.id,
      tournamentId: activeBout.tournamentId || 'tourn1',
      tournamentName: 'Чемпионат по карате 2026',
      categoryId: activeBout.categoryId,
      categoryName: activeBout.categoryName || 'Категория WKF',
      discipline: activeBout.discipline || 'kumite',
      tatamiNumber: activeBout.tatamiNumber || 1,
      roundStage: activeBout.roundStage,
      akaParticipantId: activeBout.akaParticipantId,
      aoParticipantId: activeBout.aoParticipantId,
      akaParticipantName: akaName,
      aoParticipantName: aoName,
      akaClub: activeBout.akaParticipant?.clubName || 'СК',
      aoClub: activeBout.aoParticipant?.clubName || 'СК',
      shushinRefereeName: 'Суханов Д. О. (МК-В)',
      kansaArbitratorName: 'Белов А. Г. (МК-А)',
      fukushinReferees: ['Кузнецов И. В.', 'Смирнов В. М.', 'Орлов П. С.', 'Михайлов А. Д.'],
      scoreSummary: `${akaScore}:${aoScore} (${winnerId === activeBout.akaParticipantId ? 'Победа АКА' : winnerId === activeBout.aoParticipantId ? 'Победа АО' : 'Ничья'})`,
      winnerName: winnerId === activeBout.akaParticipantId ? akaName : winnerId === activeBout.aoParticipantId ? aoName : 'Не определен',
      winReason: winReason || 'points_lead',
      videoReviewUsed: videoReviewState.akaUsed || videoReviewState.aoUsed,
      protestFiled: false,
      protestStatus: 'none',
      certifiedAt: nowTime,
      notes: `Протокол заверен с табло татами №${activeBout.tatamiNumber}. Итоговый счет: ${akaScore}:${aoScore}.`
    };

    if (onSaveProtocol) {
      onSaveProtocol(newProtocol);
    }

    const updatedBout: Bout = {
      ...activeBout,
      refereeProtocolId: newProtocol.id,
      status: 'completed',
      winnerId: winnerId || (akaScore > aoScore ? activeBout.akaParticipantId : activeBout.aoParticipantId),
      winReason: winReason || 'points_lead'
    };
    onUpdateBout(updatedBout);

    // Prepare SQL transaction
    const sql = `BEGIN;
INSERT INTO referee_protocols (
  id, protocol_number, bout_id, tournament_id, category_id,
  discipline, tatami_number, round_stage, aka_participant_name,
  ao_participant_name, score_summary, winner_name, win_reason,
  shushin_referee_name, certified_at, notes
) VALUES (
  '${newProtocol.id}', '${newProtocol.protocolNumber}', '${newProtocol.boutId}',
  '${newProtocol.tournamentId}', '${newProtocol.categoryId}', '${newProtocol.discipline}',
  ${newProtocol.tatamiNumber}, '${newProtocol.roundStage}', '${newProtocol.akaParticipantName.replace(/'/g, "''")}',
  '${newProtocol.aoParticipantName.replace(/'/g, "''")}', '${newProtocol.scoreSummary}', '${newProtocol.winnerName.replace(/'/g, "''")}',
  '${newProtocol.winReason}', '${newProtocol.shushinRefereeName.replace(/'/g, "''")}', '${newProtocol.certifiedAt}',
  '${newProtocol.notes}'
) ON CONFLICT (id) DO UPDATE SET score_summary = EXCLUDED.score_summary, certified_at = EXCLUDED.certified_at;

UPDATE bouts SET
  status = 'completed',
  aka_score = ${akaScore},
  ao_score = ${aoScore},
  referee_protocol_id = '${newProtocol.id}'
WHERE id = '${activeBout.id}';
COMMIT;`;

    setGeneratedSql(sql);
    setProtocolSavedNotice(`Протокол №${protoNumber} официально заверен и записан в базу данных PostgreSQL!`);
    setTimeout(() => setProtocolSavedNotice(null), 5000);
  };

  // =========================================================================
  // SKIF SCORING LOGIC (Shobu Ippon / Shobu Sanbon)
  // =========================================================================
  const addSkifWazaAri = (side: 'aka' | 'ao') => {
    playSound('point');
    if (side === 'aka') {
      const nextWazaAri = akaWazaAri + 1;
      const nextScore = akaScore + 1;
      setAkaWazaAri(nextWazaAri);
      setAkaScore(nextScore);

      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `АКА: ВАЗА-АРИ (Waza-ari) +0.5 pt [Всего: ${nextWazaAri}]`,
          side: 'aka'
        },
        ...prev
      ]);

      // Awaseté Ippon check (2 Waza-ari = Awaseté Ippon!)
      if (nextWazaAri >= 2 && skifFormat === 'shobu_ippon') {
        playSound('gong');
        setIsTimerRunning(false);
        setEventLogs((prev) => [
          {
            time: formatTime(timerSeconds),
            text: `АВАЗИТЕ ИППОН (Awaseté Ippon): 2 Ваза-ари! Досрочная победа АКА!`,
            side: 'aka'
          },
          ...prev
        ]);
        handleDeclareWinner('aka', 'awasete_ippon');
      } else if (skifFormat === 'shobu_sanbon' && (nextWazaAri + akaIppon * 2) >= 6) {
        playSound('gong');
        setIsTimerRunning(false);
        handleDeclareWinner('aka', 'shobu_sanbon_win');
      }
    } else {
      const nextWazaAri = aoWazaAri + 1;
      const nextScore = aoScore + 1;
      setAoWazaAri(nextWazaAri);
      setAoScore(nextScore);

      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `АО: ВАЗА-АРИ (Waza-ari) +0.5 pt [Всего: ${nextWazaAri}]`,
          side: 'ao'
        },
        ...prev
      ]);

      if (nextWazaAri >= 2 && skifFormat === 'shobu_ippon') {
        playSound('gong');
        setIsTimerRunning(false);
        setEventLogs((prev) => [
          {
            time: formatTime(timerSeconds),
            text: `АВАЗИТЕ ИППОН (Awaseté Ippon): 2 Ваза-ари! Досрочная победа АО!`,
            side: 'ao'
          },
          ...prev
        ]);
        handleDeclareWinner('ao', 'awasete_ippon');
      } else if (skifFormat === 'shobu_sanbon' && (nextWazaAri + aoIppon * 2) >= 6) {
        playSound('gong');
        setIsTimerRunning(false);
        handleDeclareWinner('ao', 'shobu_sanbon_win');
      }
    }
  };

  const addSkifIppon = (side: 'aka' | 'ao') => {
    playSound('gong');
    if (side === 'aka') {
      const nextIppon = akaIppon + 1;
      const nextScore = akaScore + 2;
      setAkaIppon(nextIppon);
      setAkaScore(nextScore);

      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `АКА: ЧИСТЫЙ ИППОН (Ippon)!`,
          side: 'aka'
        },
        ...prev
      ]);

      // In Shobu Ippon, 1 Ippon ends the match instantly!
      if (skifFormat === 'shobu_ippon') {
        setIsTimerRunning(false);
        handleDeclareWinner('aka', 'ippon_direct');
      } else if (skifFormat === 'shobu_sanbon' && nextIppon >= 3) {
        setIsTimerRunning(false);
        handleDeclareWinner('aka', 'shobu_sanbon_win');
      }
    } else {
      const nextIppon = aoIppon + 1;
      const nextScore = aoScore + 2;
      setAoIppon(nextIppon);
      setAoScore(nextScore);

      setEventLogs((prev) => [
        {
          time: formatTime(timerSeconds),
          text: `АО: ЧИСТЫЙ ИППОН (Ippon)!`,
          side: 'ao'
        },
        ...prev
      ]);

      if (skifFormat === 'shobu_ippon') {
        setIsTimerRunning(false);
        handleDeclareWinner('ao', 'ippon_direct');
      } else if (skifFormat === 'shobu_sanbon' && nextIppon >= 3) {
        setIsTimerRunning(false);
        handleDeclareWinner('ao', 'shobu_sanbon_win');
      }
    }
  };

  const removePoint = (side: 'aka' | 'ao') => {
    if (side === 'aka' && akaScore > 0) {
      setAkaScore((prev) => prev - 1);
      if (akaWazaAri > 0) setAkaWazaAri((prev) => prev - 1);
      setEventLogs((prev) => [
        { time: formatTime(timerSeconds), text: 'АКА: Отмена балла (-1)', side: 'aka' },
        ...prev
      ]);
    } else if (side === 'ao' && aoScore > 0) {
      setAoScore((prev) => prev - 1);
      if (aoWazaAri > 0) setAoWazaAri((prev) => prev - 1);
      setEventLogs((prev) => [
        { time: formatTime(timerSeconds), text: 'АО: Отмена балла (-1)', side: 'ao' },
        ...prev
      ]);
    }
  };

  // Penalties WKF
  const addWkfPenalty = (side: 'aka' | 'ao', category: 'c1' | 'c2') => {
    playSound('warning');
    if (side === 'aka') {
      if (category === 'c1') {
        const nextVal = (akaPenaltiesC1 + 1) % 5;
        setAkaPenaltiesC1(nextVal);
        if (nextVal === 4) {
          playSound('buzzer');
          setWinnerId(activeBout.aoParticipantId);
          setWinReason('hansoku_dq');
          setIsTimerRunning(false);
          setEventLogs((prev) => [
            { time: formatTime(timerSeconds), text: 'АКА: ХАНСОКУ C1 (Дисквалификация). Победа АО!', side: 'aka' },
            ...prev
          ]);
        }
      } else {
        const nextVal = (akaPenaltiesC2 + 1) % 5;
        setAkaPenaltiesC2(nextVal);
        if (timerSeconds <= 15 && akaSenshu) setAkaSenshu(false);
        if (nextVal === 4) {
          playSound('buzzer');
          setWinnerId(activeBout.aoParticipantId);
          setWinReason('hansoku_dq');
          setIsTimerRunning(false);
          setEventLogs((prev) => [
            { time: formatTime(timerSeconds), text: 'АКА: ХАНСОКУ C2 Дзёгай. Победа АО!', side: 'aka' },
            ...prev
          ]);
        }
      }
    } else {
      if (category === 'c1') {
        const nextVal = (aoPenaltiesC1 + 1) % 5;
        setAoPenaltiesC1(nextVal);
        if (nextVal === 4) {
          playSound('buzzer');
          setWinnerId(activeBout.akaParticipantId);
          setWinReason('hansoku_dq');
          setIsTimerRunning(false);
          setEventLogs((prev) => [
            { time: formatTime(timerSeconds), text: 'АО: ХАНСОКУ C1 (Дисквалификация). Победа АКА!', side: 'ao' },
            ...prev
          ]);
        }
      } else {
        const nextVal = (aoPenaltiesC2 + 1) % 5;
        setAoPenaltiesC2(nextVal);
        if (timerSeconds <= 15 && aoSenshu) setAoSenshu(false);
        if (nextVal === 4) {
          playSound('buzzer');
          setWinnerId(activeBout.akaParticipantId);
          setWinReason('hansoku_dq');
          setIsTimerRunning(false);
          setEventLogs((prev) => [
            { time: formatTime(timerSeconds), text: 'АО: ХАНСОКУ C2 Дзёгай. Победа АКА!', side: 'ao' },
            ...prev
          ]);
        }
      }
    }
  };

  // Penalties SKIF (Keikoku -> Chui -> Hansoku-Chui -> Hansoku)
  const addSkifPenalty = (side: 'aka' | 'ao', type: 'penalty' | 'jogai') => {
    playSound('warning');
    const penaltyLabels = ['Нет', 'Кейкоку (Keikoku)', 'Чуй (Chui)', 'Хансоку-чуй (H-Chui)', 'ХАНСОКУ (DQ)'];
    if (side === 'aka') {
      if (type === 'penalty') {
        const next = (akaSkifPenalties + 1) % 5;
        setAkaSkifPenalties(next);
        setEventLogs((prev) => [
          { time: formatTime(timerSeconds), text: `АКА: Нарушение SKIF: ${penaltyLabels[next]}`, side: 'aka' },
          ...prev
        ]);
        if (next === 4) {
          handleDeclareWinner('ao', 'hansoku_dq');
        }
      } else {
        const next = (akaJogai + 1) % 5;
        setAkaJogai(next);
        setEventLogs((prev) => [
          { time: formatTime(timerSeconds), text: `АКА: Дзёгай SKIF (Выход ${next}/4)`, side: 'aka' },
          ...prev
        ]);
        if (next === 4) {
          handleDeclareWinner('ao', 'hansoku_dq');
        }
      }
    } else {
      if (type === 'penalty') {
        const next = (aoSkifPenalties + 1) % 5;
        setAoSkifPenalties(next);
        setEventLogs((prev) => [
          { time: formatTime(timerSeconds), text: `АО: Нарушение SKIF: ${penaltyLabels[next]}`, side: 'ao' },
          ...prev
        ]);
        if (next === 4) {
          handleDeclareWinner('aka', 'hansoku_dq');
        }
      } else {
        const next = (aoJogai + 1) % 5;
        setAoJogai(next);
        setEventLogs((prev) => [
          { time: formatTime(timerSeconds), text: `АО: Дзёгай SKIF (Выход ${next}/4)`, side: 'ao' },
          ...prev
        ]);
        if (next === 4) {
          handleDeclareWinner('aka', 'hansoku_dq');
        }
      }
    }
  };

  // Declare Winner and Save to DB with Playoff Progression
  const handleDeclareWinner = (targetSide: 'aka' | 'ao', reason: WinReason) => {
    playSound('gong');
    const targetWinnerId = targetSide === 'aka' ? activeBout.akaParticipantId : activeBout.aoParticipantId;
    const winnerName = targetSide === 'aka'
      ? activeBout.akaParticipant ? `${activeBout.akaParticipant.lastName} ${activeBout.akaParticipant.firstName}` : 'АКА'
      : activeBout.aoParticipant ? `${activeBout.aoParticipant.lastName} ${activeBout.aoParticipant.firstName}` : 'АО';

    setWinnerId(targetWinnerId);
    setWinReason(reason);
    setIsTimerRunning(false);

    const updated: Bout = {
      ...activeBout,
      ruleSystem: currentRules,
      skifFormat,
      akaScore,
      aoScore,
      akaSenshu,
      aoSenshu,
      akaPenaltiesC1,
      aoPenaltiesC1,
      akaPenaltiesC2,
      aoPenaltiesC2,
      akaWazaAri,
      aoWazaAri,
      akaIppon,
      aoIppon,
      akaSkifPenalties,
      aoSkifPenalties,
      akaJogai,
      aoJogai,
      isEnchoSen,
      timerSecondsRemaining: timerSeconds,
      winnerId: targetWinnerId,
      winReason: reason,
      status: 'completed'
    };

    onUpdateBout(updated);

    let nextStageMsg = 'Результат зафиксирован в базе данных.';
    if (activeBout.roundStage === 'quarter_final') {
      nextStageMsg = `Победитель ${winnerName} АВТОМАТИЧЕСКИ ПРОДВИНУТ в Полуфинал сетки!`;
    } else if (activeBout.roundStage === 'semi_final') {
      nextStageMsg = `Победитель ${winnerName} АВТОМАТИЧЕСКИ ПРОДВИНУТ в ФИНАЛ за Золото!`;
    } else if (activeBout.roundStage === 'final') {
      nextStageMsg = `ЧЕМПИОН ОПРЕДЕЛЕН: ${winnerName} завоевывает ЗОЛОТО!`;
    }

    setAdvancementNotice(nextStageMsg);
    setEventLogs((prev) => [
      { time: formatTime(timerSeconds), text: `ПОБЕДА: ${targetSide.toUpperCase()} (${reason}). ${nextStageMsg}` },
      ...prev
    ]);
  };

  const handleSaveOnly = () => {
    const updated: Bout = {
      ...activeBout,
      ruleSystem: currentRules,
      skifFormat,
      akaScore,
      aoScore,
      akaSenshu,
      aoSenshu,
      akaPenaltiesC1,
      aoPenaltiesC1,
      akaPenaltiesC2,
      aoPenaltiesC2,
      akaWazaAri,
      aoWazaAri,
      akaIppon,
      aoIppon,
      akaSkifPenalties,
      aoSkifPenalties,
      akaJogai,
      aoJogai,
      isEnchoSen,
      timerSecondsRemaining: timerSeconds,
      winnerId,
      winReason,
      status: winnerId ? 'completed' : isTimerRunning ? 'in_progress' : 'scheduled'
    };
    onUpdateBout(updated);
    setAdvancementNotice('Протокол поединка успешно сохранен в базе данных.');
    setTimeout(() => setAdvancementNotice(null), 3000);
  };

  // Next Bout Switcher
  const handleLoadNextBout = () => {
    const currentIndex = tatamiBouts.findIndex((b) => b.id === activeBout.id);
    if (currentIndex >= 0 && currentIndex < tatamiBouts.length - 1) {
      setCurrentBoutId(tatamiBouts[currentIndex + 1].id);
      setAdvancementNotice(null);
    }
  };

  const isSkif = currentRules === 'skif';

  const akaName = activeBout?.akaParticipant
    ? `${activeBout.akaParticipant.lastName} ${activeBout.akaParticipant.firstName}`
    : 'АКА (Красный)';
  const aoName = activeBout?.aoParticipant
    ? `${activeBout.aoParticipant.lastName} ${activeBout.aoParticipant.firstName}`
    : 'АО (Синий)';

  return (
    <div className="space-y-4">
      {/* Top Banner: Rules Switcher & Tatami Navigation (Compact Unified Standard) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rule Switcher Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => handleToggleRules('wkf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  currentRules === 'wkf'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>WKF (Олимпийское)</span>
              </button>
              <button
                onClick={() => handleToggleRules('skif')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  currentRules === 'skif'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>SKIF (Сётокан Shobu)</span>
              </button>
            </div>

            {/* If SKIF, toggle Shobu Ippon vs Sanbon */}
            {isSkif && (
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">Формат:</span>
                <button
                  onClick={() => setSkifFormat('shobu_ippon')}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    skifFormat === 'shobu_ippon' ? 'bg-amber-500 text-black' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  Shobu Ippon (до 1 Иппона)
                </button>
                <button
                  onClick={() => setSkifFormat('shobu_sanbon')}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    skifFormat === 'shobu_sanbon' ? 'bg-amber-500 text-black' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  Shobu Sanbon (до 3 Иппонов)
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chief Referee Manual Override Button */}
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-rose-300 hover:text-rose-200 border border-rose-900/60 text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Открыть панель Главного судьи для прямой коррекции баллов и статусов"
            >
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>Ручная коррекция</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors border ${
                soundEnabled
                  ? 'bg-slate-950 border-emerald-600/60 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{soundEnabled ? 'Звук' : 'Без звука'}</span>
            </button>

            {/* Next match */}
            <button
              onClick={handleLoadNextBout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>След. бой</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tatami & Match Switcher Row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {tatamis.map((t) => {
              const count = bouts.filter((b) => b.tatamiId === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTatamiId(t.id);
                    const firstOnTatami = bouts.find((b) => b.tatamiId === t.id);
                    if (firstOnTatami) setCurrentBoutId(firstOnTatami.id);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedTatamiId === t.id
                      ? 'bg-rose-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Татами №{t.number} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-mono shrink-0">Выбор боя:</span>
            <select
              value={currentBoutId}
              onChange={(e) => setCurrentBoutId(e.target.value)}
              className="w-full sm:w-80 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs text-white focus:outline-none focus:border-rose-500 font-medium truncate"
            >
              {tatamiBouts.map((b) => (
                <option key={b.id} value={b.id}>
                  Бой #{b.boutNumber} · {b.roundStage} ({b.akaParticipant?.lastName || 'АКА'} vs {b.aoParticipant?.lastName || 'АО'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advancement Notice Banner */}
      {advancementNotice && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/80 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{advancementNotice}</span>
          </div>
          {onNavigateToBracket && (
            <button
              onClick={onNavigateToBracket}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm flex items-center gap-1"
            >
              <span>В сетку</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Quorum Consensus Notice Banner */}
      {quorumNotice && (
        <div className={`p-4 rounded-xl border-2 shadow-lg flex items-center justify-between gap-3 animate-fadeIn ${
          quorumNotice.side === 'aka'
            ? 'bg-rose-950/95 border-rose-500 text-rose-100'
            : 'bg-sky-950/95 border-sky-500 text-sky-100'
        }`}>
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <CheckCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{quorumNotice.text}</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-black/40 text-xs font-mono font-semibold">
            WKF Consensus Engine
          </span>
        </div>
      )}

      {/* Protocol Saved to DB Banner */}
      {protocolSavedNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/95 border-2 border-emerald-500 text-emerald-100 text-sm font-semibold flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{protocolSavedNotice}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setShowSqlDialog(true)}
              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              SQL Транзакция
            </button>
            {onNavigateToProtocols && (
              <button
                onClick={() => onNavigateToProtocols(activeBout?.id)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded-lg border border-emerald-700 transition-colors"
              >
                Все протоколы →
              </button>
            )}
          </div>
        </div>
      )}

      {/* UNIFIED COMPACT ELECTRONIC SCOREBOARD DISPLAY */}
      <div className="rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-xl overflow-hidden">
        {/* Compact Arena Subheader */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold text-white">
              ТАТАМИ №{activeBout?.tatamiNumber || 1}
            </span>
            <span className="text-rose-400 font-semibold uppercase">
              БОЙ #{activeBout?.boutNumber}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{activeBout?.roundStage?.toUpperCase()}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 truncate max-w-xs">{activeBout?.categoryName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isSkif ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {isSkif ? `SKIF: ${skifFormat === 'shobu_ippon' ? 'Shobu Ippon' : 'Shobu Sanbon'}` : 'WKF: 8-pt Gap / Senshu'}
            </span>

            {winnerId && (
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 rounded text-emerald-300 font-bold flex items-center gap-1 animate-pulse">
                <Award className="w-3.5 h-3.5" />
                <span>ПОБЕДА: {winnerId === activeBout.akaParticipantId ? 'АКА' : 'АО'} ({winReason})</span>
              </span>
            )}
          </div>
        </div>

        {/* Central 3-Column Arena Display: AKA (5 cols) | CLOCK (2 cols) | AO (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* ========================================================= */}
          {/* 1. AKA (RED) FIGHTER HALF (5 COLS)                       */}
          {/* ========================================================= */}
          <div className={`lg:col-span-5 p-5 flex flex-col justify-between transition-colors ${
            winnerId === activeBout?.akaParticipantId ? 'bg-rose-950/20' : 'bg-slate-950'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 ring-4 ring-rose-500/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                    AKA · КРАСНЫЙ
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeBout?.akaParticipant?.clubName || 'СК'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight truncate">
                {akaName}
              </h3>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <span>{activeBout?.akaParticipant?.declaredWeightKg} кг</span>
                <span>·</span>
                <span>{activeBout?.akaParticipant?.beltRank?.replace('_', ' ')}</span>
              </div>

              {/* Big Score Digit + Advantage Badge */}
              <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border border-rose-900/60 flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-rose-300 font-bold block">
                    БАЛЛЫ АКА
                  </span>
                  {!isSkif ? (
                    <button
                      onClick={() => {
                        if (akaSenshu) setAkaSenshu(false);
                        else {
                          setAkaSenshu(true);
                          setAoSenshu(false);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        akaSenshu
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                          : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                      }`}
                    >
                      SENSHU {akaSenshu ? '★' : ''}
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-amber-400 font-bold space-y-0.5">
                      <div>Waza-ari: {akaWazaAri}</div>
                      <div>Ippon: {akaIppon}</div>
                    </div>
                  )}
                </div>

                <div className="text-6xl sm:text-7xl font-black text-rose-400 font-mono tabular-nums tracking-tighter">
                  {akaScore}
                </div>
              </div>

              {/* Scoring Actions Adapted to Rules */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{isSkif ? 'ПРИЕМЫ SKIF (SHOBU):' : 'БАЛЛЫ WKF:'}</span>
                  <button
                    onClick={() => removePoint('aka')}
                    className="text-slate-400 hover:text-rose-400 underline font-mono flex items-center gap-0.5 text-[10px]"
                  >
                    <Minus className="w-3 h-3" />
                    <span>Отмена</span>
                  </button>
                </div>

                {!isSkif ? (
                  /* WKF 3-button grid (+1, +2, +3) */
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => addWkfPoint('aka', 1, 'Юко')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-rose-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-rose-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-rose-400 font-mono">+1 ЮКО</span>
                      <span className="text-[9px] text-slate-400">Цуки</span>
                    </button>
                    <button
                      onClick={() => addWkfPoint('aka', 2, 'Ваза-ари')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-rose-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-rose-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-rose-400 font-mono">+2 ВАЗА-АРИ</span>
                      <span className="text-[9px] text-slate-400">Тюдан</span>
                    </button>
                    <button
                      onClick={() => addWkfPoint('aka', 3, 'Иппон')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-rose-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-rose-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-rose-400 font-mono">+3 ИППОН</span>
                      <span className="text-[9px] text-slate-400">Дзёдан/бросок</span>
                    </button>
                  </div>
                ) : (
                  /* SKIF 2-button grid (+1 Waza-ari, +2 Ippon) */
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addSkifWazaAri('aka')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-rose-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-rose-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-rose-400 font-mono">ВАЗА-АРИ (+0.5)</span>
                      <span className="text-[9px] text-slate-400">Waza-ari (2 = Awaseté)</span>
                    </button>
                    <button
                      onClick={() => addSkifIppon('aka')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-amber-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-amber-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-amber-400 font-mono">ИППОН (+1.0)</span>
                      <span className="text-[9px] text-slate-400">Чистая победа (Ippon)</span>
                    </button>
                  </div>
                )}

                {/* PENALTIES TRACK */}
                <div className="pt-2">
                  {!isSkif ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addWkfPenalty('aka', 'c1')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300">C1: Контакт</span>
                          <span className="text-amber-400 font-bold">{akaPenaltiesC1}/4</span>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`flex-1 h-1.5 rounded-full ${
                                akaPenaltiesC1 >= step ? 'bg-amber-500' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </button>

                      <button
                        onClick={() => addWkfPenalty('aka', 'c2')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300">C2: Дзёгай</span>
                          <span className="text-amber-400 font-bold">{akaPenaltiesC2}/4</span>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`flex-1 h-1.5 rounded-full ${
                                akaPenaltiesC2 >= step ? 'bg-amber-500' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </button>
                    </div>
                  ) : (
                    /* SKIF Penalties Track */
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <button
                        onClick={() => addSkifPenalty('aka', 'penalty')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left"
                      >
                        <div className="flex justify-between">
                          <span className="text-slate-300">SKIF Чуй:</span>
                          <span className="text-amber-400 font-bold">{akaSkifPenalties}/4</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                          {['Норма', 'Keikoku', 'Chui', 'H-Chui', 'Hansoku'][akaSkifPenalties]}
                        </span>
                      </button>

                      <button
                        onClick={() => addSkifPenalty('aka', 'jogai')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left"
                      >
                        <div className="flex justify-between">
                          <span className="text-slate-300">Дзёгай:</span>
                          <span className="text-amber-400 font-bold">{akaJogai}/4</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                          {akaJogai === 4 ? 'Дзёгай Хансоку' : `Выход ${akaJogai}/4`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AKA Victory Declaration Row */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
              <button
                onClick={() => handleDeclareWinner('aka', isSkif ? 'points_lead' : 'points_lead')}
                className="flex-1 py-2 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Победа АКА
              </button>
              {!isSkif ? (
                <button
                  onClick={() => handleDeclareWinner('aka', 'senshu_advantage')}
                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-850 text-rose-300 border border-slate-800 rounded-lg text-xs font-mono"
                  title="Победа по правилу первого балла Senshu"
                >
                  Senshu
                </button>
              ) : (
                <button
                  onClick={() => handleDeclareWinner('aka', 'awasete_ippon')}
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-slate-800 rounded-lg text-[11px] font-mono"
                  title="Победа Awaseté Ippon (2 Waza-ari)"
                >
                  Awaseté
                </button>
              )}
              <button
                onClick={() => handleDeclareWinner('aka', 'hantei_decision')}
                className="py-2 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono"
                title="Решение судей Хантей"
              >
                Хантей
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CENTRAL TIMER & ACTIONS (2 COLS)                      */}
          {/* ========================================================= */}
          <div className="lg:col-span-2 p-4 bg-slate-900/60 flex flex-col justify-between items-center text-center space-y-4">
            <div className="w-full space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                ЧИСТОЕ ВРЕМЯ БОЯ
              </span>

              {/* CLOCK DISPLAY */}
              <div
                className={`py-4 px-2 rounded-2xl bg-slate-950 border-2 transition-all font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-wider ${
                  timerSeconds <= 15 && isTimerRunning
                    ? 'border-amber-500 text-amber-400 shadow-md shadow-amber-500/20 animate-pulse'
                    : isTimerRunning
                    ? 'border-emerald-500/80 text-emerald-400'
                    : 'border-slate-800 text-slate-200'
                }`}
              >
                {formatTime(timerSeconds)}
              </div>

              {timerSeconds <= 15 && timerSeconds > 0 && (
                <div className="py-0.5 px-2 bg-amber-950/80 border border-amber-500 text-amber-300 rounded text-[10px] font-mono font-bold animate-pulse">
                  ATOSHI BARAKU (15 сек)
                </div>
              )}

              {/* Big Hajime / Yame */}
              <button
                onClick={toggleTimer}
                className={`w-full py-3 px-3 rounded-xl font-bold text-xs sm:text-sm font-mono flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'ЯМЭ (ПАУЗА)' : 'ХАДЗИМЭ (СТАРТ)'}</span>
              </button>

              {/* Quick Time Adjust */}
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setTimerSeconds((prev) => prev + 10)}
                  className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
                >
                  +10 сек
                </button>
                <button
                  onClick={() => setTimerSeconds((prev) => Math.max(0, prev - 10))}
                  className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px]"
                >
                  -10 сек
                </button>
              </div>

              {/* Encho-sen (SKIF Sudden Death) */}
              {isSkif && (
                <button
                  onClick={() => {
                    setIsEnchoSen(true);
                    setTimerSeconds(60);
                    setIsTimerRunning(false);
                    setEventLogs((prev) => [
                      { time: '01:00', text: 'ЭНТЁ-СЭН (Encho-sen): Дополнительное время до 1-го действия (Sudden Death)!' },
                      ...prev
                    ]);
                  }}
                  className="w-full py-1.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 rounded-lg border border-amber-800/80 text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Энтё-сэн (+1 мин)</span>
                </button>
              )}

              {/* Doctor 10s */}
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setDoctorSeconds(10);
                  playSound('warning');
                }}
                className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] font-mono rounded-lg border border-slate-800 flex items-center justify-center gap-1"
              >
                <Activity className="w-3 h-3 text-rose-400" />
                <span>Врач (10с) {doctorSeconds !== null ? `[${doctorSeconds}]` : ''}</span>
              </button>
            </div>

            <button
              onClick={handleSaveOnly}
              className="w-full py-2 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сохранить</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* 3. AO (BLUE) FIGHTER HALF (5 COLS)                       */}
          {/* ========================================================= */}
          <div className={`lg:col-span-5 p-5 flex flex-col justify-between transition-colors ${
            winnerId === activeBout?.aoParticipantId ? 'bg-sky-950/20' : 'bg-slate-950'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                    AO · СИНИЙ
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeBout?.aoParticipant?.clubName || 'СК'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight truncate">
                {aoName}
              </h3>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <span>{activeBout?.aoParticipant?.declaredWeightKg} кг</span>
                <span>·</span>
                <span>{activeBout?.aoParticipant?.beltRank?.replace('_', ' ')}</span>
              </div>

              {/* Big Score Digit + Advantage Badge */}
              <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 border border-sky-900/60 flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-sky-300 font-bold block">
                    БАЛЛЫ АО
                  </span>
                  {!isSkif ? (
                    <button
                      onClick={() => {
                        if (aoSenshu) setAoSenshu(false);
                        else {
                          setAoSenshu(true);
                          setAkaSenshu(false);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        aoSenshu
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-400'
                          : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                      }`}
                    >
                      SENSHU {aoSenshu ? '★' : ''}
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-sky-400 font-bold space-y-0.5">
                      <div>Waza-ari: {aoWazaAri}</div>
                      <div>Ippon: {aoIppon}</div>
                    </div>
                  )}
                </div>

                <div className="text-6xl sm:text-7xl font-black text-sky-400 font-mono tabular-nums tracking-tighter">
                  {aoScore}
                </div>
              </div>

              {/* Scoring Actions Adapted to Rules */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{isSkif ? 'ПРИЕМЫ SKIF (SHOBU):' : 'БАЛЛЫ WKF:'}</span>
                  <button
                    onClick={() => removePoint('ao')}
                    className="text-slate-400 hover:text-sky-400 underline font-mono flex items-center gap-0.5 text-[10px]"
                  >
                    <Minus className="w-3 h-3" />
                    <span>Отмена</span>
                  </button>
                </div>

                {!isSkif ? (
                  /* WKF 3-button grid (+1, +2, +3) */
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => addWkfPoint('ao', 1, 'Юко')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-sky-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-sky-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-sky-400 font-mono">+1 ЮКО</span>
                      <span className="text-[9px] text-slate-400">Цуки</span>
                    </button>
                    <button
                      onClick={() => addWkfPoint('ao', 2, 'Ваза-ари')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-sky-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-sky-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-sky-400 font-mono">+2 ВАЗА-АРИ</span>
                      <span className="text-[9px] text-slate-400">Тюдан</span>
                    </button>
                    <button
                      onClick={() => addWkfPoint('ao', 3, 'Иппон')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-sky-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-sky-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-sky-400 font-mono">+3 ИППОН</span>
                      <span className="text-[9px] text-slate-400">Дзёдан/бросок</span>
                    </button>
                  </div>
                ) : (
                  /* SKIF 2-button grid (+1 Waza-ari, +2 Ippon) */
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addSkifWazaAri('ao')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-sky-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-sky-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-sky-400 font-mono">ВАЗА-АРИ (+0.5)</span>
                      <span className="text-[9px] text-slate-400">Waza-ari (2 = Awaseté)</span>
                    </button>
                    <button
                      onClick={() => addSkifIppon('ao')}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-amber-950/80 active:scale-95 text-white rounded-xl border border-slate-800 hover:border-amber-700/80 transition-all flex flex-col items-center shadow-sm"
                    >
                      <span className="text-xs font-black text-amber-400 font-mono">ИППОН (+1.0)</span>
                      <span className="text-[9px] text-slate-400">Чистая победа (Ippon)</span>
                    </button>
                  </div>
                )}

                {/* PENALTIES TRACK */}
                <div className="pt-2">
                  {!isSkif ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addWkfPenalty('ao', 'c1')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300">C1: Контакт</span>
                          <span className="text-amber-400 font-bold">{aoPenaltiesC1}/4</span>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`flex-1 h-1.5 rounded-full ${
                                aoPenaltiesC1 >= step ? 'bg-amber-500' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </button>

                      <button
                        onClick={() => addWkfPenalty('ao', 'c2')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300">C2: Дзёгай</span>
                          <span className="text-amber-400 font-bold">{aoPenaltiesC2}/4</span>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`flex-1 h-1.5 rounded-full ${
                                aoPenaltiesC2 >= step ? 'bg-amber-500' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </button>
                    </div>
                  ) : (
                    /* SKIF Penalties Track */
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <button
                        onClick={() => addSkifPenalty('ao', 'penalty')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left"
                      >
                        <div className="flex justify-between">
                          <span className="text-slate-300">SKIF Чуй:</span>
                          <span className="text-amber-400 font-bold">{aoSkifPenalties}/4</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                          {['Норма', 'Keikoku', 'Chui', 'H-Chui', 'Hansoku'][aoSkifPenalties]}
                        </span>
                      </button>

                      <button
                        onClick={() => addSkifPenalty('ao', 'jogai')}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left"
                      >
                        <div className="flex justify-between">
                          <span className="text-slate-300">Дзёгай:</span>
                          <span className="text-amber-400 font-bold">{aoJogai}/4</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                          {aoJogai === 4 ? 'Дзёгай Хансоку' : `Выход ${aoJogai}/4`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AO Victory Declaration Row */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
              <button
                onClick={() => handleDeclareWinner('ao', isSkif ? 'points_lead' : 'points_lead')}
                className="flex-1 py-2 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Победа АО
              </button>
              {!isSkif ? (
                <button
                  onClick={() => handleDeclareWinner('ao', 'senshu_advantage')}
                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-850 text-sky-300 border border-slate-800 rounded-lg text-xs font-mono"
                  title="Победа по правилу первого балла Senshu"
                >
                  Senshu
                </button>
              ) : (
                <button
                  onClick={() => handleDeclareWinner('ao', 'awasete_ippon')}
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-slate-800 rounded-lg text-[11px] font-mono"
                  title="Победа Awaseté Ippon (2 Waza-ari)"
                >
                  Awaseté
                </button>
              )}
              <button
                onClick={() => handleDeclareWinner('ao', 'hantei_decision')}
                className="py-2 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono"
                title="Решение судей Хантей"
              >
                Хантей
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Protocol Footer Strip */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-white shrink-0">ПРОТОКОЛ БОЯ:</span>
            <span className="text-slate-400 truncate">
              {eventLogs.length > 0 ? eventLogs[0].text : 'Ожидание событий поединка...'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span>Статус: <strong className="text-white">{activeBout?.status}</strong></span>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="text-rose-400 hover:text-rose-300 underline"
            >
              Правка протокола
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE REFEREE CONSOLE & REAL-TIME PROTOCOL PERSISTENCE               */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-0">
        {/* Console Header & Tabs */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Судейский пульт и фиксация протокола в БД</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
                  {currentRules === 'skif' ? 'SKIF Shobu' : 'WKF Quorum System'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Автоматическая валидация оценок 4 боковых судей (кворум ≥ 2 флажков), оценка Ката и мгновенная запись в PostgreSQL
              </p>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveConsoleTab('flags')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === 'flags' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Флажки судей (Кумитэ)</span>
            </button>
            <button
              onClick={() => setActiveConsoleTab('kata')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === 'kata' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Судейство Ката</span>
            </button>
            <button
              onClick={() => setActiveConsoleTab('vr')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === 'vr' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Видеоповтор VR</span>
            </button>
            <button
              onClick={() => setActiveConsoleTab('protocol')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeConsoleTab === 'protocol' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Протокол в БД</span>
            </button>
          </div>
        </div>

        {/* Console Tab Content */}
        <div className="p-5">
          {/* TAB 1: CORNER JUDGES (FUKUSHIN 1..4) FLAG QUORUM CONSOLE */}
          {activeConsoleTab === 'flags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-rose-400" /> Угловые судьи татами (Фукушин 1–4)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Правило WKF: оценка присуждается при совпадении выбора минимум 2 судей
                </span>
              </div>

              {/* 4 Corner Judges Flags Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((judgeIdx) => {
                  const vote = judgeVotes[judgeIdx];
                  const hasVoted = vote.color !== 'none';

                  return (
                    <div
                      key={judgeIdx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        vote.color === 'aka'
                          ? 'bg-rose-950/40 border-rose-600 shadow-md ring-1 ring-rose-500/30'
                          : vote.color === 'ao'
                          ? 'bg-sky-950/40 border-sky-600 shadow-md ring-1 ring-sky-500/30'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Судья {judgeIdx + 1}
                        </span>
                        {hasVoted ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            vote.color === 'aka' ? 'bg-rose-600 text-white' : 'bg-sky-600 text-white'
                          }`}>
                            {vote.color} · {vote.technique}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Торимасэн (нет)</span>
                        )}
                      </div>

                      {/* Flag Buttons: AKA column & AO column */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        {/* AKA Flags */}
                        <div className="space-y-1">
                          <button
                            onClick={() => handleJudgeVote(judgeIdx, 'aka', 'yuko')}
                            className={`w-full py-1.5 px-1 rounded text-center transition-all ${
                              vote.color === 'aka' && vote.technique === 'yuko'
                                ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400'
                                : 'bg-slate-900 hover:bg-rose-950/70 text-rose-300 border border-slate-800'
                            }`}
                          >
                            +1 Юко
                          </button>
                          <button
                            onClick={() => handleJudgeVote(judgeIdx, 'aka', 'waza_ari')}
                            className={`w-full py-1.5 px-1 rounded text-center transition-all ${
                              vote.color === 'aka' && vote.technique === 'waza_ari'
                                ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400'
                                : 'bg-slate-900 hover:bg-rose-950/70 text-rose-300 border border-slate-800'
                            }`}
                          >
                            +2 Ваза-ари
                          </button>
                          <button
                            onClick={() => handleJudgeVote(judgeIdx, 'aka', 'ippon')}
                            className={`w-full py-1.5 px-1 rounded text-center transition-all ${
                              vote.color === 'aka' && vote.technique === 'ippon'
                                ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400'
                                : 'bg-slate-900 hover:bg-rose-950/70 text-rose-300 border border-slate-800'
                            }`}
                          >
                            +3 Иппон
                          </button>
                        </div>

                        {/* AO Flags */}
                        <div className="space-y-1">
                          <button
                            onClick={() => handleJudgeVote(judgeIdx, 'ao', 'yuko')}
                            className={`w-full py-1.5 px-1 rounded text-center transition-all ${
                              vote.color === 'ao' && vote.technique === 'yuko'
                                ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400'
                                : 'bg-slate-900 hover:bg-sky-950/70 text-sky-300 border border-slate-800'
                            }`}
                          >
                            +1 Юко
                          </button>
                          <button
                            onClick={() => handleJudgeVote(judgeIdx, 'ao', 'waza_ari')}
                            className={`w-full py-1.5 px-1 rounded text-center transition-all ${
                              vote.color === 'ao' && vote.technique === 'waza_ari'
                                ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400'
                                : 'bg-slate-900 hover:bg-sky-950/70 text-sky-300 border border-slate-800'
                            }`}
                          >
                            +2 Ваза-ари
                          </button>
                          <button
                            onClick={() => handleJudgeVote(judgeIdx, 'ao', 'ippon')}
                            className={`w-full py-1.5 px-1 rounded text-center transition-all ${
                              vote.color === 'ao' && vote.technique === 'ippon'
                                ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-400'
                                : 'bg-slate-900 hover:bg-sky-950/70 text-sky-300 border border-slate-800'
                            }`}
                          >
                            +3 Иппон
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJudgeVote(judgeIdx, 'none', 'yuko')}
                        className="w-full mt-2 py-1 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white rounded text-[10px] font-mono transition-colors"
                      >
                        Сбросить флаг
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Shushin Central Referee Controls & Quick Certification */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Статус кворума судей:</span>
                  {judgeVotes.filter((v) => v.color !== 'none').length >= 2 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCheck className="w-4 h-4" /> Большинство зафиксировано
                    </span>
                  ) : (
                    <span className="text-slate-500">Ожидание согласования оценок (нужно ≥2)</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setJudgeVotes([
                        { judgeIndex: 0, color: 'none', technique: 'yuko' },
                        { judgeIndex: 1, color: 'none', technique: 'yuko' },
                        { judgeIndex: 2, color: 'none', technique: 'yuko' },
                        { judgeIndex: 3, color: 'none', technique: 'yuko' },
                      ]);
                    }}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                  >
                    Сбросить все флаги
                  </button>

                  <button
                    onClick={handleCertifyAndPersistProtocol}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Зафиксировать протокол в PostgreSQL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KATA EVALUATION CONSOLE */}
          {activeConsoleTab === 'kata' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h5 className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Судейская коллегия Ката (5–7 судей WKF)
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Автоматический отсев наименьшей и наибольшей оценки (Trimmed Min/Max) и расчет взвешенного балла
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setKataSelectedFighter('aka')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                      kataSelectedFighter === 'aka' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Оценка АКА ({calculateKataTotal(kataJudgesAka).toFixed(1)})
                  </button>
                  <button
                    onClick={() => setKataSelectedFighter('ao')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                      kataSelectedFighter === 'ao' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Оценка АО ({calculateKataTotal(kataJudgesAo).toFixed(1)})
                  </button>
                </div>
              </div>

              {/* 7 Judges Score Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {(kataSelectedFighter === 'aka' ? kataJudgesAka : kataJudgesAo).map((score, idx) => {
                  const currentList = kataSelectedFighter === 'aka' ? kataJudgesAka : kataJudgesAo;
                  const sorted = [...currentList].sort((a, b) => a - b);
                  const isMin = score === sorted[0];
                  const isMax = score === sorted[sorted.length - 1];

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isMin || isMax
                          ? 'bg-slate-950/60 border-slate-800/80 opacity-60'
                          : kataSelectedFighter === 'aka'
                          ? 'bg-rose-950/20 border-rose-800/80'
                          : 'bg-sky-950/20 border-sky-800/80'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-slate-400 mb-1">
                        Судья {idx + 1}
                      </div>
                      <div className="text-xl font-black font-mono text-white mb-2">
                        {score.toFixed(1)}
                      </div>
                      <input
                        type="range"
                        min="5.0"
                        max="10.0"
                        step="0.1"
                        value={score}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (kataSelectedFighter === 'aka') {
                            const next = [...kataJudgesAka];
                            next[idx] = val;
                            setKataJudgesAka(next);
                          } else {
                            const next = [...kataJudgesAo];
                            next[idx] = val;
                            setKataJudgesAo(next);
                          }
                        }}
                        className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="text-[9px] font-mono mt-1 text-slate-500">
                        {isMin ? 'Мин. (отброс)' : isMax ? 'Макс. (отброс)' : 'Учитывается'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation Strip */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400">Итоговый балл выступления ({kataSelectedFighter.toUpperCase()}): </span>
                  <span className="text-lg font-black text-rose-400 ml-1">
                    {calculateKataTotal(kataSelectedFighter === 'aka' ? kataJudgesAka : kataJudgesAo).toFixed(1)}
                  </span>
                  <span className="text-slate-500 text-[11px] ml-2">(отброшены Min и Max)</span>
                </div>

                <button
                  onClick={() => handleApplyKataScore(kataSelectedFighter)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>Вывести балл на табло и зафиксировать в БД</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO REVIEW (VR KANSA) */}
          {activeConsoleTab === 'vr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-sky-400" /> Видеоповтор VR (Video Review Panel)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Арбитр Канса / Главный судья татами
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AKA VR Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-rose-400 uppercase">
                      Карточка тренера АКА (Красный)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      videoReviewState.akaUsed ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {videoReviewState.akaUsed ? 'Использована' : 'Доступна'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Тренер имеет право на 1 запрос пересмотра оценки за поединок. При удовлетворении карточка сохраняется.
                  </p>
                  <button
                    disabled={videoReviewState.akaUsed || videoReviewState.inReview}
                    onClick={() => handleTriggerVideoReview('aka')}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono transition-colors"
                  >
                    Запрос пересмотра тренером АКА
                  </button>
                </div>

                {/* AO VR Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-sky-400 uppercase">
                      Карточка тренера АО (Синий)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      videoReviewState.aoUsed ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {videoReviewState.aoUsed ? 'Использована' : 'Доступна'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Тренер имеет право на 1 запрос пересмотра оценки за поединок. При удовлетворении карточка сохраняется.
                  </p>
                  <button
                    disabled={videoReviewState.aoUsed || videoReviewState.inReview}
                    onClick={() => handleTriggerVideoReview('ao')}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono transition-colors"
                  >
                    Запрос пересмотра тренером АО
                  </button>
                </div>
              </div>

              {/* VR In Review Decision Panel */}
              {videoReviewState.inReview && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-2 border-amber-500/80 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                    <span>ИДЕТ РАССМОТРЕНИЕ ВИДЕОПОВТОРА (ЗАПРОС {videoReviewState.initiatorSide?.toUpperCase()})</span>
                    <span>АРБИТР КАНСА</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <button
                      onClick={() => handleResolveVideoReview('upheld', { side: videoReviewState.initiatorSide || 'aka', pts: 1 })}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                    >
                      Подтвердить Юко (+1)
                    </button>
                    <button
                      onClick={() => handleResolveVideoReview('upheld', { side: videoReviewState.initiatorSide || 'aka', pts: 2 })}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                    >
                      Подтвердить Ваза-ари (+2)
                    </button>
                    <button
                      onClick={() => handleResolveVideoReview('upheld', { side: videoReviewState.initiatorSide || 'aka', pts: 3 })}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                    >
                      Подтвердить Иппон (+3)
                    </button>
                    <button
                      onClick={() => handleResolveVideoReview('dismissed')}
                      className="py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                    >
                      Отклонить (Карточка сгорает)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATABASE PROTOCOL ACTIONS */}
          {activeConsoleTab === 'protocol' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" /> Официальный протокол поединка и PostgreSQL DML
                </span>
                <span className="text-slate-400 text-[11px]">
                  Таблицы: referee_protocols · bout_scores · bouts
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Номер протокола</span>
                    <strong className="text-white text-sm">
                      {activeBout.refereeProtocolId || `PR-2026-T${activeBout.tatamiNumber || 1}-${activeBout.boutNumber}`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Текущий счет</span>
                    <strong className="text-rose-400 text-sm">
                      {akaScore} (АКА) : {aoScore} (АО)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Статус фиксации</span>
                    <span className="text-emerald-400 font-bold">
                      {activeBout.refereeProtocolId ? '✓ Синхронизирован' : 'Черновик оператора'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={() => setShowSqlDialog(true)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5 text-rose-400" />
                    <span>Показать SQL</span>
                  </button>

                  {onNavigateToProtocols && (
                    <button
                      onClick={() => onNavigateToProtocols(activeBout.id)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-sky-400 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Открыть бланк протокола</span>
                    </button>
                  )}

                  <button
                    onClick={handleCertifyAndPersistProtocol}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Заверить и записать в БД</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SQL Dialog Modal */}
      {showSqlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-2xl w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> POSTGRESQL ТРАНЗАКЦИЯ ФИКСАЦИИ ПРОТОКОЛА
              </span>
              <button
                onClick={() => setShowSqlDialog(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                [✕]
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-80 selection:bg-rose-500 selection:text-white">
              {generatedSql || `-- Транзакция фиксации протокола поединка #${activeBout.boutNumber}
BEGIN;
INSERT INTO referee_protocols (id, protocol_number, bout_id, aka_participant_name, ao_participant_name, score_summary, certified_at)
VALUES ('prot_${activeBout.id}', 'PR-2026-T${activeBout.tatamiNumber}-${activeBout.boutNumber}', '${activeBout.id}', '${akaName}', '${aoName}', '${akaScore}:${aoScore}', CURRENT_TIMESTAMP);
UPDATE bouts SET aka_score = ${akaScore}, ao_score = ${aoScore}, status = 'completed' WHERE id = '${activeBout.id}';
COMMIT;`}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([generatedSql], { type: 'text/sql' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `protocol_${activeBout.boutNumber}.sql`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать .sql</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Referee Override Modal */}
      {isManualModalOpen && activeBout && (
        <ManualBoutControlModal
          bout={activeBout}
          isOpen={isManualModalOpen}
          tournamentRules={currentRules}
          participants={participants}
          onClose={() => setIsManualModalOpen(false)}
          onSaveBout={(updated) => {
            onUpdateBout(updated);
            setIsManualModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
