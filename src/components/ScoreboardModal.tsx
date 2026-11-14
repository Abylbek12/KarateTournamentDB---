import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Award, AlertTriangle, Clock, Plus, Shield } from 'lucide-react';
import { Bout, WinReason } from '../types/schema';

interface ScoreboardModalProps {
  bout: Bout | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveBout: (updatedBout: Bout) => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  bout,
  isOpen,
  onClose,
  onSaveBout
}) => {
  if (!isOpen || !bout) return null;

  const [akaScore, setAkaScore] = useState(bout.akaScore);
  const [aoScore, setAoScore] = useState(bout.aoScore);
  const [akaSenshu, setAkaSenshu] = useState(bout.akaSenshu);
  const [aoSenshu, setAoSenshu] = useState(bout.aoSenshu);
  const [akaPenaltiesC1, setAkaPenaltiesC1] = useState(bout.akaPenaltiesC1);
  const [aoPenaltiesC1, setAoPenaltiesC1] = useState(bout.aoPenaltiesC1);
  const [akaPenaltiesC2, setAkaPenaltiesC2] = useState(bout.akaPenaltiesC2);
  const [aoPenaltiesC2, setAoPenaltiesC2] = useState(bout.aoPenaltiesC2);
  const [timerSeconds, setTimerSeconds] = useState(bout.timerSecondsRemaining);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | undefined>(bout.winnerId);
  const [winReason, setWinReason] = useState<WinReason | undefined>(bout.winReason);
  const [logs, setLogs] = useState<string[]>([]);

  // Synchronize with selected bout
  useEffect(() => {
    setAkaScore(bout.akaScore);
    setAoScore(bout.aoScore);
    setAkaSenshu(bout.akaSenshu);
    setAoSenshu(bout.aoSenshu);
    setAkaPenaltiesC1(bout.akaPenaltiesC1);
    setAoPenaltiesC1(bout.aoPenaltiesC1);
    setAkaPenaltiesC2(bout.akaPenaltiesC2);
    setAoPenaltiesC2(bout.aoPenaltiesC2);
    setTimerSeconds(bout.timerSecondsRemaining);
    setIsTimerRunning(bout.status === 'in_progress');
    setWinnerId(bout.winnerId);
    setWinReason(bout.winReason);
  }, [bout]);

  // Timer countdown interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addScore = (color: 'aka' | 'ao', points: number, typeName: string) => {
    if (color === 'aka') {
      const newScore = akaScore + points;
      setAkaScore(newScore);
      // Auto assign Senshu if first point scored in match
      if (!akaSenshu && !aoSenshu && akaScore === 0 && aoScore === 0) {
        setAkaSenshu(true);
        setLogs((prev) => [`[${formatTime(timerSeconds)}] АКА: +${points} (${typeName}) + SENSHU`, ...prev]);
      } else {
        setLogs((prev) => [`[${formatTime(timerSeconds)}] АКА: +${points} (${typeName})`, ...prev]);
      }
    } else {
      const newScore = aoScore + points;
      setAoScore(newScore);
      if (!akaSenshu && !aoSenshu && akaScore === 0 && aoScore === 0) {
        setAoSenshu(true);
        setLogs((prev) => [`[${formatTime(timerSeconds)}] АО: +${points} (${typeName}) + SENSHU`, ...prev]);
      } else {
        setLogs((prev) => [`[${formatTime(timerSeconds)}] АО: +${points} (${typeName})`, ...prev]);
      }
    }
  };

  const toggleSenshu = (color: 'aka' | 'ao') => {
    if (color === 'aka') {
      if (akaSenshu) {
        setAkaSenshu(false);
      } else {
        setAkaSenshu(true);
        setAoSenshu(false); // DB constraint: NOT (aka_senshu AND ao_senshu)
      }
    } else {
      if (aoSenshu) {
        setAoSenshu(false);
      } else {
        setAoSenshu(true);
        setAkaSenshu(false); // DB constraint
      }
    }
  };

  const handleDeclareWinner = (targetColor: 'aka' | 'ao', reason: WinReason) => {
    const targetId = targetColor === 'aka' ? bout.akaParticipantId : bout.aoParticipantId;
    setWinnerId(targetId);
    setWinReason(reason);
    setIsTimerRunning(false);
  };

  const handleSave = () => {
    const isCompleted = !!winnerId || timerSeconds === 0;
    const updated: Bout = {
      ...bout,
      akaScore,
      aoScore,
      akaSenshu,
      aoSenshu,
      akaPenaltiesC1,
      aoPenaltiesC1,
      akaPenaltiesC2,
      aoPenaltiesC2,
      timerSecondsRemaining: timerSeconds,
      winnerId,
      winReason,
      status: isCompleted ? 'completed' : 'in_progress'
    };
    onSaveBout(updated);
    onClose();
  };

  const akaName = bout.akaParticipant 
    ? `${bout.akaParticipant.lastName} ${bout.akaParticipant.firstName}` 
    : 'АКА (Красный)';
  const aoName = bout.aoParticipant 
    ? `${bout.aoParticipant.lastName} ${bout.aoParticipant.firstName}` 
    : 'АО (Синий)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Top bar modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <div className="text-xs text-slate-400 font-mono">
              Татами №{bout.tatamiNumber || 1} · Поединок #{bout.boutNumber} · {bout.roundStage.toUpperCase()}
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {bout.categoryName || 'Официальный поединок WKF'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Timer & Arena Header */}
        <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 font-mono text-3xl font-bold tracking-wider text-amber-400 tabular-nums">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>{formatTime(timerSeconds)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
                  isTimerRunning 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'ЯМЭ (Пауза)' : 'ХАДЗИМЭ (Старт)'}</span>
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(120);
                }}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                title="Сброс таймера на 2 мин"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimerSeconds((prev) => prev + 10)}
                className="px-2.5 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono"
                title="Добавить 10 секунд"
              >
                +10s
              </button>
            </div>
          </div>

          {/* Quick Winner Tag */}
          {winnerId && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-semibold">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>
                Победитель: {winnerId === bout.akaParticipantId ? 'АКА (Красный)' : 'АО (Синий)'} ({winReason})
              </span>
            </div>
          )}
        </div>

        {/* Scoreboard Two Sides Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* AKA (RED) SIDE */}
          <div className={`p-6 flex flex-col justify-between transition-colors ${winnerId === bout.akaParticipantId ? 'bg-rose-950/20' : 'bg-slate-900'}`}>
            <div>
              {/* Fighter Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                    AKA · Красный пояс
                  </span>
                </div>
                {bout.akaParticipant?.clubName && (
                  <span className="text-xs text-slate-400 font-mono">
                    {bout.akaParticipant.clubName}
                  </span>
                )}
              </div>
              <h4 className="text-xl font-bold text-white mt-1">
                {akaName}
              </h4>

              {/* Big Score Box */}
              <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-950 border border-rose-900/40 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-rose-300 uppercase tracking-wider font-semibold">Баллы</span>
                  <button
                    onClick={() => toggleSenshu('aka')}
                    className={`mt-2 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                      akaSenshu 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    SENSHU {akaSenshu ? '✓' : ''}
                  </button>
                </div>
                <div className="text-6xl font-black text-rose-400 font-mono tabular-nums tracking-tight">
                  {akaScore}
                </div>
              </div>

              {/* Scoring Controls */}
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">Начисление баллов (WKF):</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addScore('aka', 1, 'Юко')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-rose-900/60 text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="font-bold text-rose-400">+1 ЮКО</span>
                    <span className="text-[10px] text-slate-400">Цуки (рука)</span>
                  </button>
                  <button
                    onClick={() => addScore('aka', 2, 'Ваза-ари')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-rose-900/60 text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="font-bold text-rose-400">+2 ВАЗА-АРИ</span>
                    <span className="text-[10px] text-slate-400">Тюдан гэри</span>
                  </button>
                  <button
                    onClick={() => addScore('aka', 3, 'Иппон')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-rose-900/60 text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="font-bold text-rose-400">+3 ИППОН</span>
                    <span className="text-[10px] text-slate-400">Дзёдан / бросок</span>
                  </button>
                </div>

                {/* Penalties C1 / C2 */}
                <div className="pt-2">
                  <div className="text-xs text-slate-400 font-medium mb-1.5">Предупреждения (Штрафы):</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setAkaPenaltiesC1((prev) => (prev < 4 ? prev + 1 : 0))}
                      className="py-2 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex justify-between items-center"
                    >
                      <span>C1 (Контакт)</span>
                      <span className="font-mono font-bold text-amber-400">{akaPenaltiesC1}/4</span>
                    </button>
                    <button
                      onClick={() => setAkaPenaltiesC2((prev) => (prev < 4 ? prev + 1 : 0))}
                      className="py-2 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex justify-between items-center"
                    >
                      <span>C2 (Дзёгай)</span>
                      <span className="font-mono font-bold text-amber-400">{akaPenaltiesC2}/4</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Buttons for AKA */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
              <button
                onClick={() => handleDeclareWinner('aka', 'points_lead')}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Победа АКА (Баллы)
              </button>
              <button
                onClick={() => handleDeclareWinner('aka', 'hantei_decision')}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                title="Победа АКА по решению судей Хантей"
              >
                Хантей
              </button>
            </div>
          </div>

          {/* AO (BLUE) SIDE */}
          <div className={`p-6 flex flex-col justify-between transition-colors ${winnerId === bout.aoParticipantId ? 'bg-sky-950/20' : 'bg-slate-900'}`}>
            <div>
              {/* Fighter Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                    AO · Синий пояс
                  </span>
                </div>
                {bout.aoParticipant?.clubName && (
                  <span className="text-xs text-slate-400 font-mono">
                    {bout.aoParticipant.clubName}
                  </span>
                )}
              </div>
              <h4 className="text-xl font-bold text-white mt-1">
                {aoName}
              </h4>

              {/* Big Score Box */}
              <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-950 border border-sky-900/40 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-sky-300 uppercase tracking-wider font-semibold">Баллы</span>
                  <button
                    onClick={() => toggleSenshu('ao')}
                    className={`mt-2 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                      aoSenshu 
                        ? 'bg-sky-600 text-white shadow-md' 
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    SENSHU {aoSenshu ? '✓' : ''}
                  </button>
                </div>
                <div className="text-6xl font-black text-sky-400 font-mono tabular-nums tracking-tight">
                  {aoScore}
                </div>
              </div>

              {/* Scoring Controls */}
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">Начисление баллов (WKF):</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addScore('ao', 1, 'Юко')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-sky-900/60 text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="font-bold text-sky-400">+1 ЮКО</span>
                    <span className="text-[10px] text-slate-400">Цуки (рука)</span>
                  </button>
                  <button
                    onClick={() => addScore('ao', 2, 'Ваза-ари')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-sky-900/60 text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="font-bold text-sky-400">+2 ВАЗА-АРИ</span>
                    <span className="text-[10px] text-slate-400">Тюдан гэри</span>
                  </button>
                  <button
                    onClick={() => addScore('ao', 3, 'Иппон')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-sky-900/60 text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors flex flex-col items-center gap-0.5"
                  >
                    <span className="font-bold text-sky-400">+3 ИППОН</span>
                    <span className="text-[10px] text-slate-400">Дзёдан / бросок</span>
                  </button>
                </div>

                {/* Penalties C1 / C2 */}
                <div className="pt-2">
                  <div className="text-xs text-slate-400 font-medium mb-1.5">Предупреждения (Штрафы):</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setAoPenaltiesC1((prev) => (prev < 4 ? prev + 1 : 0))}
                      className="py-2 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex justify-between items-center"
                    >
                      <span>C1 (Контакт)</span>
                      <span className="font-mono font-bold text-amber-400">{aoPenaltiesC1}/4</span>
                    </button>
                    <button
                      onClick={() => setAoPenaltiesC2((prev) => (prev < 4 ? prev + 1 : 0))}
                      className="py-2 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 flex justify-between items-center"
                    >
                      <span>C2 (Дзёгай)</span>
                      <span className="font-mono font-bold text-amber-400">{aoPenaltiesC2}/4</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Buttons for AO */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
              <button
                onClick={() => handleDeclareWinner('ao', 'points_lead')}
                className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Победа АО (Баллы)
              </button>
              <button
                onClick={() => handleDeclareWinner('ao', 'hantei_decision')}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                title="Победа АО по решению судей Хантей"
              >
                Хантей
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            БД Таблица: bouts (UUID: {bout.id}) · Журнал протокола: bout_scores
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
            >
              Сохранить в базу данных
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
