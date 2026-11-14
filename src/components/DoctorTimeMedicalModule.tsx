import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Play, 
  Pause, 
  Plus, 
  Minus, 
  Scale, 
  UserCheck, 
  FileText, 
  Stethoscope, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  ChevronRight,
  Flame,
  Search,
  Users
} from 'lucide-react';
import { Participant, Bout, Tatami, UserRole } from '../types/schema';
import { refereeAudio } from '../utils/refereeAudio';
import { Language, t } from '../utils/translations';
import { useApp } from '../context/AppContext';

export interface MedicalIncident {
  id: string;
  tatamiNumber: number;
  boutNumber: number;
  athleteId: string;
  athleteName: string;
  athleteClub: string;
  injuryType: string;
  treatmentNotes: string;
  secondsElapsed: number;
  doctorVerdict: 'cleared' | 'cleared_bandaged' | 'kiken_unfit';
  timestamp: string;
  physicianName: string;
}

export interface DoctorTimeMedicalModuleProps {
  tatamis: Tatami[];
  bouts: Bout[];
  participants: Participant[];
  currentUserRole?: UserRole;
  language?: Language;
  onUpdateBout: (updatedBout: Bout) => void;
  onUpdateParticipant: (updatedParticipant: Participant) => void;
  onNavigateToScoreboard?: (boutId: string) => void;
}

export const DoctorTimeMedicalModule: React.FC<DoctorTimeMedicalModuleProps> = ({
  tatamis,
  bouts,
  participants,
  currentUserRole = 'medical_officer',
  language: propLanguage,
  onUpdateBout,
  onUpdateParticipant,
  onNavigateToScoreboard
}) => {
  const { language: contextLanguage } = useApp();
  const language = propLanguage || contextLanguage || 'ru';
  const [activeTab, setActiveTab] = useState<'call_panel' | 'clearance_form' | 'incident_log'>('call_panel');

  // Tatami Medical Timers State: map tatamiNumber -> { seconds: number, running: boolean, totalAllocated: number, status: string, targetSide: 'aka' | 'ao' }
  const [tatamiMedState, setTatamiMedState] = useState<Record<number, {
    seconds: number;
    running: boolean;
    totalAllocated: number;
    status: 'idle' | 'doctor_called' | 'in_progress' | 'cleared' | 'kiken';
    targetSide: 'aka' | 'ao';
  }>>({
    1: { seconds: 80, running: false, totalAllocated: 80, status: 'idle', targetSide: 'aka' },
    2: { seconds: 80, running: false, totalAllocated: 80, status: 'idle', targetSide: 'ao' },
    3: { seconds: 80, running: false, totalAllocated: 80, status: 'idle', targetSide: 'aka' },
    4: { seconds: 80, running: false, totalAllocated: 80, status: 'idle', targetSide: 'ao' }
  });

  // Incident log list
  const [incidentLogs, setIncidentLogs] = useState<MedicalIncident[]>([
    {
      id: 'med_1',
      tatamiNumber: 1,
      boutNumber: 104,
      athleteId: 'p2',
      athleteName: 'Артем Смирнов',
      athleteClub: 'Додзё "Бусидо"',
      injuryType: 'Носовое кровотечение (Epistaxis) после контакта рукой',
      treatmentNotes: 'Гемостатическая губка, тампонада носового хода, допущен к продолжению',
      secondsElapsed: 54,
      doctorVerdict: 'cleared_bandaged',
      timestamp: '12:35',
      physicianName: 'Д-р Федорова А.В.'
    },
    {
      id: 'med_2',
      tatamiNumber: 2,
      boutNumber: 202,
      athleteId: 'p5',
      athleteName: 'Олег Васильев',
      athleteClub: 'ЦБИ "Восток"',
      injuryType: 'Ушиб голеностопного сустава при падении',
      treatmentNotes: 'Охлаждающий спрей, иммобилизирующий тейп, осмотр связок без разрывов',
      secondsElapsed: 72,
      doctorVerdict: 'cleared_bandaged',
      timestamp: '11:50',
      physicianName: 'Д-р Федорова А.В.'
    }
  ]);

  // Form: Athlete Clearance & Weigh-in State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(participants[0]?.id || '');
  const [actualWeightInput, setActualWeightInput] = useState<number>(participants[0]?.actualWeightKg || participants[0]?.declaredWeightKg || 74.0);
  const [medicalVerdict, setMedicalVerdict] = useState<'cleared' | 'cleared_bandaged' | 'kiken_unfit'>('cleared');
  const [injuryDiagnosis, setInjuryDiagnosis] = useState<string>('Клинически здоров, без травматических повреждений');
  const [physicianNotes, setPhysicianNotes] = useState<string>('ЭКГ в норме, кожные покровы чистые, допущен к поединкам в полном объеме.');
  const [physicianName, setPhysicianName] = useState<string>('Д-р Федорова А.В. (Главный врач турнира)');
  const [athleteSearchQuery, setAthleteSearchQuery] = useState<string>('');

  // Toast message
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToast(null), 4500);
  };
  const setToastMessage = (msg: string) => setToast(msg);

  // Active athlete for clearance
  const activeAthlete = participants.find((p) => p.id === selectedAthleteId) || participants[0];

  // Sync athlete form when selectedAthlete changes
  useEffect(() => {
    if (activeAthlete) {
      setActualWeightInput(activeAthlete.actualWeightKg || activeAthlete.declaredWeightKg || 74.0);
      setMedicalVerdict(activeAthlete.isMedicalCleared ? 'cleared' : 'kiken_unfit');
    }
  }, [selectedAthleteId, activeAthlete]);

  // Doctor 80s Timers Ticking Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTatamiMedState((prev) => {
        let changed = false;
        const next = { ...prev };

        Object.keys(next).forEach((key) => {
          const matNum = Number(key);
          const state = next[matNum];
          if (state.running && state.seconds > 0) {
            changed = true;
            const newSec = state.seconds - 1;

            // Audio warnings
            if (newSec === 15) {
              refereeAudio.playWarning15s();
            } else if (newSec === 0) {
              refereeAudio.playDoctorSiren();
            }

            next[matNum] = {
              ...state,
              seconds: newSec,
              status: newSec === 0 ? 'idle' : state.status
            };
          }
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dispatch Doctor Call to Tatami
  const handleCallDoctor = (tatamiNum: number, side: 'aka' | 'ao') => {
    setTatamiMedState((prev) => ({
      ...prev,
      [tatamiNum]: {
        ...prev[tatamiNum],
        seconds: 80,
        running: true,
        totalAllocated: 80,
        status: 'in_progress',
        targetSide: side
      }
    }));

    refereeAudio.playDoctorSiren();
    showToast(`🚑 ВРАЧ ВЫЗВАН НА ТАТАМИ №${tatamiNum}! Активирован таймер WKF Doctor 80s Time (${side.toUpperCase()}).`);
  };

  // Emergency Match Stoppage
  const handleEmergencyStop = (tatamiNum: number) => {
    const tatamiBout = bouts.find((b) => b.tatamiNumber === tatamiNum && b.status === 'in_progress');
    if (tatamiBout) {
      onUpdateBout({ ...tatamiBout, status: 'scheduled' });
    }

    setTatamiMedState((prev) => ({
      ...prev,
      [tatamiNum]: {
        ...prev[tatamiNum],
        seconds: 80,
        running: true,
        totalAllocated: 80,
        status: 'in_progress'
      }
    }));

    refereeAudio.playEmergencyStop();
    refereeAudio.playDoctorSiren();
    showToast(`🛑 ЭКСТРЕННАЯ ОСТАНОВКА БОЯ НА ТАТАМИ №${tatamiNum}! Время остановлено, медицинская бригада на ковре.`);
  };

  // Adjust Timer Presets
  const handleSetTimerPreset = (tatamiNum: number, seconds: number) => {
    setTatamiMedState((prev) => ({
      ...prev,
      [tatamiNum]: {
        ...prev[tatamiNum],
        seconds,
        totalAllocated: seconds
      }
    }));
  };

  // Toggle Timer
  const handleToggleTimer = (tatamiNum: number) => {
    setTatamiMedState((prev) => {
      const current = prev[tatamiNum];
      const nextRunning = !current.running;
      if (nextRunning) refereeAudio.playBuzzer();
      return {
        ...prev,
        [tatamiNum]: {
          ...current,
          running: nextRunning,
          status: nextRunning ? 'in_progress' : current.status
        }
      };
    });
  };

  // Reset Timer
  const handleResetTimer = (tatamiNum: number) => {
    setTatamiMedState((prev) => ({
      ...prev,
      [tatamiNum]: {
        ...prev[tatamiNum],
        seconds: prev[tatamiNum].totalAllocated || 80,
        running: false,
        status: 'idle'
      }
    }));
  };

  // Clear athlete to fight after timeout
  const handleClearAthlete = (tatamiNum: number) => {
    const state = tatamiMedState[tatamiNum];
    const tatamiBout = bouts.find((b) => b.tatamiNumber === tatamiNum);
    const athlete = state.targetSide === 'aka' ? tatamiBout?.akaParticipant : tatamiBout?.aoParticipant;

    const newLog: MedicalIncident = {
      id: `incident_${Date.now()}`,
      tatamiNumber: tatamiNum,
      boutNumber: tatamiBout?.boutNumber || 101,
      athleteId: athlete?.id || 'unknown',
      athleteName: athlete ? `${athlete.lastName} ${athlete.firstName}` : `${state.targetSide.toUpperCase()}`,
      athleteClub: athlete?.clubName || 'Клуб',
      injuryType: 'Оказана медицинская помощь на ковре',
      treatmentNotes: 'Спортсмен осмотрен дежурным врачом, допущен к продолжению боя',
      secondsElapsed: (state.totalAllocated || 80) - state.seconds,
      doctorVerdict: 'cleared',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      physicianName: 'Д-р Федорова А.В.'
    };

    setIncidentLogs((prev) => [newLog, ...prev]);

    setTatamiMedState((prev) => ({
      ...prev,
      [tatamiNum]: {
        ...prev[tatamiNum],
        running: false,
        status: 'cleared'
      }
    }));

    refereeAudio.playPointChime(1);
    showToast(`✓ Спортсмен на Татами №${tatamiNum} ДОПУЩЕН К ПРОДОЛЖЕНИЮ ПОЕДИНКА!`);
  };

  // Withdraw athlete by injury (Kiken)
  const handleWithdrawAthleteKiken = (tatamiNum: number) => {
    const state = tatamiMedState[tatamiNum];
    const tatamiBout = bouts.find((b) => b.tatamiNumber === tatamiNum);
    if (!tatamiBout) return;

    const injuredSide = state.targetSide;
    const winnerId = injuredSide === 'aka' ? tatamiBout.aoParticipantId : tatamiBout.akaParticipantId;

    const updatedBout: Bout = {
      ...tatamiBout,
      status: 'completed',
      winnerId,
      winReason: 'kiken_injury',
      timerSecondsRemaining: 0
    };

    onUpdateBout(updatedBout);

    setTatamiMedState((prev) => ({
      ...prev,
      [tatamiNum]: {
        ...prev[tatamiNum],
        running: false,
        status: 'kiken'
      }
    }));

    refereeAudio.playEmergencyStop();
    showToast(`⚠️ СПОРТСМЕН СНЯТ ВРАЧОМ ПО ТРАВМЕ (KIKEN)! Победа присуждена сопернику.`);
  };

  // Save Medical Clearance and Weigh-in Form
  const handleSaveClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAthlete) return;

    const isCleared = medicalVerdict !== 'kiken_unfit';

    const updatedAthlete: Participant = {
      ...activeAthlete,
      actualWeightKg: Number(actualWeightInput),
      isWeighedIn: true,
      isMedicalCleared: isCleared,
      status: isCleared ? 'weighed_in' : 'withdrawn'
    };

    onUpdateParticipant(updatedAthlete);
    refereeAudio.playPointChime(2);
    showToast(`✓ Медицинский допуск и вес атлета ${updatedAthlete.lastName} ${updatedAthlete.firstName} зафиксированы!`);
  };

  const filteredAthletes = participants.filter((p) => {
    if (!athleteSearchQuery.trim()) return true;
    const q = athleteSearchQuery.toLowerCase();
    return (
      p.lastName.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      (p.clubName && p.clubName.toLowerCase().includes(q)) ||
      p.licenseNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-slate-900/95 border border-rose-500/80 text-rose-200 font-mono text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in duration-300">
          <Stethoscope className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-850 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-teal-400" />
              <span>{t('doctor.badge', language)}</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              Врач ГСК: <strong className="text-white">Д-р Федорова А.В.</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            {t('doctor.title', language)}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
            {t('doctor.desc', language)}
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => setActiveTab('call_panel')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'call_panel'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Doctor Time 80s</span>
          </button>

          <button
            onClick={() => setActiveTab('clearance_form')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clearance_form'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language !== 'en' ? 'Допуск и взвешивание' : 'Clearance & Weigh-in'}</span>
          </button>

          <button
            onClick={() => setActiveTab('incident_log')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'incident_log'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language !== 'en' ? 'Журнал травм' : 'Injury Registry'} ({incidentLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TATAMI DOCTOR TIME 80S PANEL                                       */}
      {/* ========================================================================= */}
      {activeTab === 'call_panel' && (
        <div className="space-y-6">
          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-800/60 text-teal-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                {language !== 'en'
                  ? 'Регламент соревнований: официальный лимит времени на осмотр и оказание помощи врачом — 80 секунд (Doctor 80s Time). Превышение времени без допуска влечет автоматическое снятие Kiken.'
                  : 'Competition Regulations: Official injury timeout allowance is 80 seconds (Doctor 80s Time). Exceeding time without clearance results in automatic Kiken withdrawal.'}
              </span>
            </div>
            <span className="font-bold text-white px-2 py-0.5 rounded bg-teal-900/60 shrink-0">
              Стандарт: 80 сек
            </span>
          </div>

          {/* 4 Tatami Medical Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((matNum) => {
              const med = tatamiMedState[matNum] || { seconds: 80, running: false, totalAllocated: 80, status: 'idle', targetSide: 'aka' };
              const tatamiBout = bouts.find((b) => b.tatamiNumber === matNum);
              const isRunning = med.running;

              return (
                <div
                  key={matNum}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                    isRunning
                      ? 'bg-gradient-to-b from-rose-950/70 via-slate-900 to-slate-900 border-rose-500 shadow-rose-950/30'
                      : med.status === 'cleared'
                      ? 'bg-slate-900 border-emerald-500/80'
                      : med.status === 'kiken'
                      ? 'bg-slate-900 border-slate-700 opacity-80'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-mono font-black text-xs flex items-center justify-center">
                        {matNum}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white">
                          Татами №{matNum}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {tatamiBout ? `Бой #${tatamiBout.boutNumber} · ${tatamiBout.categoryName || 'Дивизион'}` : 'Свободно'}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isRunning
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                        : med.status === 'cleared'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : med.status === 'kiken'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-rose-400' : 'bg-slate-500'}`} />
                      <span>
                        {isRunning ? 'ИДЕТ ОСМОТР (80s)' : med.status === 'cleared' ? '✓ ДОПУЩЕН' : med.status === 'kiken' ? 'СНЯТ (KIKEN)' : 'ШТАТНЫЙ РЕЖИМ'}
                      </span>
                    </span>
                  </div>

                  {/* Bout Matchup & Target Fighter */}
                  {tatamiBout && (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className={`p-2 rounded-lg border ${med.targetSide === 'aka' && isRunning ? 'bg-rose-950/80 border-rose-500 font-bold' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="text-[10px] text-rose-400 font-bold">AKA (Красный)</div>
                        <div className="text-white truncate mt-0.5">{tatamiBout.akaParticipant?.lastName || 'AKA'}</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${med.targetSide === 'ao' && isRunning ? 'bg-blue-950/80 border-blue-500 font-bold' : 'bg-slate-950 border-slate-800'}`}>
                        <div className="text-[10px] text-blue-400 font-bold">AO (Синий)</div>
                        <div className="text-white truncate mt-0.5">{tatamiBout.aoParticipant?.lastName || 'AO'}</div>
                      </div>
                    </div>
                  )}

                  {/* Large Digital Doctor Timer Display */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5 font-bold">
                      DOCTOR TIME REMAINING
                    </div>
                    <div className={`text-4xl sm:text-5xl font-black font-mono tracking-wider ${
                      isRunning && med.seconds <= 15
                        ? 'text-rose-400 animate-ping'
                        : isRunning
                        ? 'text-rose-300'
                        : 'text-white'
                    }`}>
                      {formatTime(med.seconds)}
                    </div>

                    {/* Presets Row */}
                    <div className="flex items-center gap-1.5 mt-3">
                      <button
                        onClick={() => handleSetTimerPreset(matNum, 80)}
                        className="px-2.5 py-1 rounded bg-slate-850 hover:bg-slate-800 text-teal-300 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        80s (Стандарт)
                      </button>
                      <button
                        onClick={() => handleSetTimerPreset(matNum, 60)}
                        className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] font-mono cursor-pointer"
                      >
                        60s
                      </button>
                      <button
                        onClick={() => handleSetTimerPreset(matNum, 120)}
                        className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] font-mono cursor-pointer"
                      >
                        120s
                      </button>
                      <button
                        onClick={() => handleSetTimerPreset(matNum, 30)}
                        className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] font-mono cursor-pointer"
                      >
                        30s
                      </button>
                    </div>

                    {/* Transport controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleToggleTimer(matNum)}
                        className={`px-4 py-1.5 rounded-lg text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer ${
                          isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isRunning ? 'Пауза' : 'Старт'}</span>
                      </button>

                      <button
                        onClick={() => handleResetTimer(matNum)}
                        className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="Сброс таймера"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Medical Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleCallDoctor(matNum, 'aka')}
                      className="py-2 px-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🚑 Вызов AKA</span>
                    </button>
                    <button
                      onClick={() => handleCallDoctor(matNum, 'ao')}
                      className="py-2 px-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🚑 Вызов AO</span>
                    </button>

                    <button
                      onClick={() => handleEmergencyStop(matNum)}
                      className="col-span-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer"
                    >
                      <AlertOctagon className="w-4 h-4" />
                      <span>{t('doctor.stop.emergency', language)}</span>
                    </button>
                  </div>

                  {/* Doctor Clearance / Withdrawal */}
                  {isRunning && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => handleClearAthlete(matNum)}
                        className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
                      >
                        <Check className="w-4 h-4" />
                        <span>Допустить к бою ✓</span>
                      </button>
                      <button
                        onClick={() => handleWithdrawAthleteKiken(matNum)}
                        className="py-2 rounded-xl bg-slate-800 hover:bg-rose-900 text-rose-300 font-mono font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Снять (Kiken) ✖</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATHLETE MEDICAL CLEARANCE & WEIGH-IN FORM                          */}
      {/* ========================================================================= */}
      {activeTab === 'clearance_form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Athlete Selector Column (4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>Спортсмены ({participants.length})</span>
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по фамилии, клубу..."
                value={athleteSearchQuery}
                onChange={(e) => setAthleteSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Scrollable Athletes List */}
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredAthletes.map((p) => {
                const isSelected = p.id === selectedAthleteId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedAthleteId(p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-950/80 border-rose-500 shadow-md text-white'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {p.lastName} {p.firstName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.clubName || 'Клуб'} · {p.city}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        p.isMedicalCleared ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {p.isMedicalCleared ? 'Допущен' : 'Не допущен'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {p.actualWeightKg ? `${p.actualWeightKg} кг` : `${p.declaredWeightKg} кг`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Column: Examination & Weigh-in (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <span>Протокол медосмотра и взвешивания атлета</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Спортсмен: <strong className="text-white">{activeAthlete.lastName} {activeAthlete.firstName}</strong> ({activeAthlete.clubName}, {activeAthlete.city})
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-xs font-mono text-slate-400 border border-slate-800">
                Лицензия: <strong className="text-white">{activeAthlete.licenseNumber}</strong>
              </span>
            </div>

            <form onSubmit={handleSaveClearance} className="space-y-6">
              {/* Row 1: Weigh-in verification */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-rose-400" />
                    <span>Контрольное взвешивание перед поединком</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Заявленный вес: <strong className="text-white">{activeAthlete.declaredWeightKg} кг</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Фактический вес на весах (кг) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={actualWeightInput}
                      onChange={(e) => setActualWeightInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Статус веса:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>В рамках категории (Допуск)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Medical verdict selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Медицинский вердикт дежурного врача соревнований:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMedicalVerdict('cleared')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      medicalVerdict === 'cleared'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">1. Полный допуск</div>
                    <div className="text-xs font-bold text-white mt-0.5">Допущен без ограничений</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMedicalVerdict('cleared_bandaged')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      medicalVerdict === 'cleared_bandaged'
                        ? 'bg-amber-950/80 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">2. С тейпированием</div>
                    <div className="text-xs font-bold text-white mt-0.5">Допуск с фиксацией сустава</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMedicalVerdict('kiken_unfit')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      medicalVerdict === 'kiken_unfit'
                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-rose-400 uppercase">3. Снятие врачом</div>
                    <div className="text-xs font-bold text-white mt-0.5">Не допущен (Kiken/Injury)</div>
                  </button>
                </div>
              </div>

              {/* Row 3: Diagnosis & Injury note */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Диагноз / Характер повреждения
                  </label>
                  <input
                    type="text"
                    value={injuryDiagnosis}
                    onChange={(e) => setInjuryDiagnosis(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    placeholder="напр. Ушиб мягких тканей лица, носовое кровотечение остановлено..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Заключение врача соревнований
                  </label>
                  <textarea
                    rows={3}
                    value={physicianNotes}
                    onChange={(e) => setPhysicianNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ФИО спортивного врача / лицензия
                  </label>
                  <input
                    type="text"
                    value={physicianName}
                    onChange={(e) => setPhysicianName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-teal-950/50 transition-all cursor-pointer"
                >
                  ✓ Зафиксировать допуск в реестре
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INJURY & MEDICAL INCIDENT LOG                                      */}
      {/* ========================================================================= */}
      {activeTab === 'incident_log' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Официальный журнал медицинских происшествий ГСК ({incidentLogs.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Фиксация согласно регламенту соревнований
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Время</th>
                    <th className="p-3">Татами / Бой</th>
                    <th className="p-3">Спортсмен & Клуб</th>
                    <th className="p-3">Травма / Причина</th>
                    <th className="p-3">Doctor Time</th>
                    <th className="p-3">Вердикт врача</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {incidentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3 text-slate-400">{log.timestamp}</td>
                      <td className="p-3 text-white font-bold">
                        Татами №{log.tatamiNumber} · Бой #{log.boutNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{log.athleteName}</div>
                        <div className="text-[10px] text-slate-400">{log.athleteClub}</div>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={log.injuryType}>
                        {log.injuryType}
                      </td>
                      <td className="p-3 font-bold text-teal-400">
                        {log.secondsElapsed}с
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.doctorVerdict === 'cleared'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : log.doctorVerdict === 'cleared_bandaged'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-700'
                        }`}>
                          {log.doctorVerdict === 'cleared' ? 'Допущен' : log.doctorVerdict === 'cleared_bandaged' ? 'Тейп/Повязка' : 'Снят (Kiken)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
