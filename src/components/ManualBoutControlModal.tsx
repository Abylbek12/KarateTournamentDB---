import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sliders, 
  Save, 
  RotateCcw, 
  Award, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  HelpCircle,
  Plus,
  Minus,
  Shield,
  Zap,
  RefreshCw,
  Tv
} from 'lucide-react';
import { Bout, Participant, WinReason, BoutStatus, TournamentRules } from '../types/schema';

interface ManualBoutControlModalProps {
  bout: Bout | null;
  isOpen: boolean;
  tournamentRules: TournamentRules;
  participants: Participant[];
  onClose: () => void;
  onSaveBout: (updatedBout: Bout) => void;
}

export const ManualBoutControlModal: React.FC<ManualBoutControlModalProps> = ({
  bout,
  isOpen,
  tournamentRules,
  participants,
  onClose,
  onSaveBout
}) => {
  if (!isOpen || !bout) return null;

  // Local draft states for manual correction
  const [akaScore, setAkaScore] = useState(bout.akaScore || 0);
  const [aoScore, setAoScore] = useState(bout.aoScore || 0);
  const [akaSenshu, setAkaSenshu] = useState(bout.akaSenshu || false);
  const [aoSenshu, setAoSenshu] = useState(bout.aoSenshu || false);
  const [akaPenaltiesC1, setAkaPenaltiesC1] = useState(bout.akaPenaltiesC1 || 0);
  const [aoPenaltiesC1, setAoPenaltiesC1] = useState(bout.aoPenaltiesC1 || 0);
  const [akaPenaltiesC2, setAkaPenaltiesC2] = useState(bout.akaPenaltiesC2 || 0);
  const [aoPenaltiesC2, setAoPenaltiesC2] = useState(bout.aoPenaltiesC2 || 0);

  // SKIF specific draft states
  const [skifFormat, setSkifFormat] = useState<'shobu_ippon' | 'shobu_sanbon'>(
    bout.skifFormat || 'shobu_sanbon'
  );
  const [akaWazaAri, setAkaWazaAri] = useState(bout.akaWazaAri || 0);
  const [aoWazaAri, setAoWazaAri] = useState(bout.aoWazaAri || 0);
  const [akaIppon, setAkaIppon] = useState(bout.akaIppon || 0);
  const [aoIppon, setAoIppon] = useState(bout.aoIppon || 0);
  const [akaSkifPenalties, setAkaSkifPenalties] = useState(bout.akaSkifPenalties || 0);
  const [aoSkifPenalties, setAoSkifPenalties] = useState(bout.aoSkifPenalties || 0);
  const [akaJogai, setAkaJogai] = useState(bout.akaJogai || 0);
  const [aoJogai, setAoJogai] = useState(bout.aoJogai || 0);

  // Match control
  const [status, setStatus] = useState<BoutStatus>(bout.status || 'scheduled');
  const [winnerId, setWinnerId] = useState<string | undefined>(bout.winnerId);
  const [winReason, setWinReason] = useState<WinReason | undefined>(bout.winReason || 'points_lead');
  const [timerSeconds, setTimerSeconds] = useState(bout.timerSecondsRemaining ?? 120);

  // Audit trail note
  const [auditNote, setAuditNote] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('Главный судья (Татами 1)');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync when bout prop changes
  useEffect(() => {
    setAkaScore(bout.akaScore || 0);
    setAoScore(bout.aoScore || 0);
    setAkaSenshu(bout.akaSenshu || false);
    setAoSenshu(bout.aoSenshu || false);
    setAkaPenaltiesC1(bout.akaPenaltiesC1 || 0);
    setAoPenaltiesC1(bout.aoPenaltiesC1 || 0);
    setAkaPenaltiesC2(bout.akaPenaltiesC2 || 0);
    setAoPenaltiesC2(bout.aoPenaltiesC2 || 0);

    setSkifFormat(bout.skifFormat || 'shobu_sanbon');
    setAkaWazaAri(bout.akaWazaAri || 0);
    setAoWazaAri(bout.aoWazaAri || 0);
    setAkaIppon(bout.akaIppon || 0);
    setAoIppon(bout.aoIppon || 0);
    setAkaSkifPenalties(bout.akaSkifPenalties || 0);
    setAoSkifPenalties(bout.aoSkifPenalties || 0);
    setAkaJogai(bout.akaJogai || 0);
    setAoJogai(bout.aoJogai || 0);

    setStatus(bout.status || 'scheduled');
    setWinnerId(bout.winnerId);
    setWinReason(bout.winReason || 'points_lead');
    setTimerSeconds(bout.timerSecondsRemaining ?? 120);
    setSaveSuccessMsg(null);
  }, [bout.id]);

  const akaName = bout.akaParticipant
    ? `${bout.akaParticipant.lastName} ${bout.akaParticipant.firstName}`
    : 'АКА (Красный)';
  const aoName = bout.aoParticipant
    ? `${bout.aoParticipant.lastName} ${bout.aoParticipant.firstName}`
    : 'АО (Синий)';

  const handleApplyQuickNote = (note: string) => {
    setAuditNote(note);
  };

  const handleReopenBout = () => {
    setStatus('in_progress');
    setWinnerId(undefined);
    setAuditNote('Поединок возобновлен судейской коллегией для переигровки / коррекции');
  };

  const handleSave = () => {
    const existingNotes = bout.overrideNotes || [];
    const newNoteObj = auditNote.trim()
      ? [
          {
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            note: auditNote.trim(),
            operator: operatorName
          }
        ]
      : [];

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
      ruleSystem: tournamentRules === 'skif' ? 'skif' : 'wkf',
      skifFormat,
      akaWazaAri,
      aoWazaAri,
      akaIppon,
      aoIppon,
      akaSkifPenalties,
      aoSkifPenalties,
      akaJogai,
      aoJogai,
      status,
      winnerId: status === 'completed' ? winnerId : undefined,
      winReason: status === 'completed' ? winReason : undefined,
      timerSecondsRemaining: timerSeconds,
      overrideNotes: [...newNoteObj, ...existingNotes]
    };

    onSaveBout(updated);
    setSaveSuccessMsg('Изменения успешно применены! Сетка плей-офф и статистика пересчитаны.');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const isSkif = tournamentRules === 'skif' || bout.ruleSystem === 'skif';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl flex flex-col">
        {/* Header bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Панель ручного управления поединком</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isSkif ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {isSkif ? 'Правила SKIF' : 'Правила WKF'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Бой #{bout.boutNumber} · Татами №{bout.tatamiNumber || 1} · {bout.roundStage} · {bout.categoryName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification */}
        {saveSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Fighters Score Override Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AKA (RED) CARD */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/60 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-600" />
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">АКА (Красный)</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{bout.akaParticipant?.clubName}</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white truncate">{akaName}</h4>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Вес: {bout.akaParticipant?.declaredWeightKg} кг · Пояс: {bout.akaParticipant?.beltRank?.replace('_', ' ')}
                </div>
              </div>

              {/* Direct Score Adjustment */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-mono block">Текущие баллы:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setAkaScore(Math.max(0, akaScore - 1))}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={akaScore}
                      onChange={(e) => setAkaScore(parseInt(e.target.value) || 0)}
                      className="w-16 text-center font-mono text-2xl font-black bg-slate-950 border border-slate-700 rounded-lg text-rose-400 tabular-nums focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() => setAkaScore(akaScore + 1)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick point presets */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => setAkaScore(akaScore + 1)}
                    className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-rose-300 rounded border border-slate-700"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setAkaScore(akaScore + 2)}
                    className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-rose-300 rounded border border-slate-700"
                  >
                    +2
                  </button>
                  <button
                    onClick={() => setAkaScore(akaScore + 3)}
                    className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-rose-300 rounded border border-slate-700"
                  >
                    +3
                  </button>
                  <button
                    onClick={() => setAkaScore(0)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700 text-[10px]"
                  >
                    0
                  </button>
                </div>
              </div>

              {/* WKF Rules Controls */}
              {!isSkif ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-mono">Преимущество Senshu:</span>
                    <button
                      onClick={() => {
                        setAkaSenshu(!akaSenshu);
                        if (!akaSenshu) setAoSenshu(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        akaSenshu
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      SENSHU {akaSenshu ? '✓ Включен' : 'Отключен'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-400">Штрафы C1 (Контакт):</span>
                        <span className="font-bold text-amber-400">{akaPenaltiesC1}/4</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAkaPenaltiesC1(val)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold ${
                              akaPenaltiesC1 === val
                                ? 'bg-amber-500 text-black'
                                : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-400">Штрафы C2 (Дзёгай):</span>
                        <span className="font-bold text-amber-400">{akaPenaltiesC2}/4</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAkaPenaltiesC2(val)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold ${
                              akaPenaltiesC2 === val
                                ? 'bg-amber-500 text-black'
                                : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* SKIF Rules Controls */
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Ваза-ари (Waza-ari):</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-bold text-rose-400">{akaWazaAri}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setAkaWazaAri(Math.max(0, akaWazaAri - 1))}
                            className="px-2 py-0.5 bg-slate-800 rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => {
                              const next = akaWazaAri + 1;
                              setAkaWazaAri(next);
                              if (next >= 2) {
                                setWinReason('awasete_ippon');
                                setWinnerId(bout.akaParticipantId);
                                setStatus('completed');
                              }
                            }}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Иппон (Ippon):</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-bold text-rose-400">{akaIppon}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setAkaIppon(Math.max(0, akaIppon - 1))}
                            className="px-2 py-0.5 bg-slate-800 rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => {
                              setAkaIppon(akaIppon + 1);
                              setWinReason('ippon_direct');
                              setWinnerId(bout.akaParticipantId);
                              setStatus('completed');
                            }}
                            className="px-2 py-0.5 bg-amber-600 text-white rounded font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 text-[11px]">Штрафы SKIF (Кейкоку/Чуй/Хансоку):</span>
                      <span className="font-bold text-amber-400">{akaSkifPenalties}/4</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[10px]">
                      {['Нет', 'Keikoku', 'Chui', 'H-Chui', 'Hansoku'].map((lbl, idx) => (
                        <button
                          key={lbl}
                          onClick={() => setAkaSkifPenalties(idx)}
                          className={`py-1 rounded text-center truncate ${
                            akaSkifPenalties === idx ? 'bg-amber-500 text-black font-bold' : 'bg-slate-950 text-slate-400'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AO (BLUE) CARD */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-sky-900/60 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-xs font-mono font-bold text-sky-400 uppercase">АО (Синий)</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{bout.aoParticipant?.clubName}</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white truncate">{aoName}</h4>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Вес: {bout.aoParticipant?.declaredWeightKg} кг · Пояс: {bout.aoParticipant?.beltRank?.replace('_', ' ')}
                </div>
              </div>

              {/* Direct Score Adjustment */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-mono block">Текущие баллы:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setAoScore(Math.max(0, aoScore - 1))}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={aoScore}
                      onChange={(e) => setAoScore(parseInt(e.target.value) || 0)}
                      className="w-16 text-center font-mono text-2xl font-black bg-slate-950 border border-slate-700 rounded-lg text-sky-400 tabular-nums focus:outline-none focus:border-sky-500"
                    />
                    <button
                      onClick={() => setAoScore(aoScore + 1)}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick point presets */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => setAoScore(aoScore + 1)}
                    className="px-2 py-1 bg-slate-800 hover:bg-sky-950 text-sky-300 rounded border border-slate-700"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setAoScore(aoScore + 2)}
                    className="px-2 py-1 bg-slate-800 hover:bg-sky-950 text-sky-300 rounded border border-slate-700"
                  >
                    +2
                  </button>
                  <button
                    onClick={() => setAoScore(aoScore + 3)}
                    className="px-2 py-1 bg-slate-800 hover:bg-sky-950 text-sky-300 rounded border border-slate-700"
                  >
                    +3
                  </button>
                  <button
                    onClick={() => setAoScore(0)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700 text-[10px]"
                  >
                    0
                  </button>
                </div>
              </div>

              {/* WKF Rules Controls */}
              {!isSkif ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-mono">Преимущество Senshu:</span>
                    <button
                      onClick={() => {
                        setAoSenshu(!aoSenshu);
                        if (!aoSenshu) setAkaSenshu(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        aoSenshu
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      SENSHU {aoSenshu ? '✓ Включен' : 'Отключен'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-400">Штрафы C1 (Контакт):</span>
                        <span className="font-bold text-amber-400">{aoPenaltiesC1}/4</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAoPenaltiesC1(val)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold ${
                              aoPenaltiesC1 === val
                                ? 'bg-amber-500 text-black'
                                : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-400">Штрафы C2 (Дзёгай):</span>
                        <span className="font-bold text-amber-400">{aoPenaltiesC2}/4</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAoPenaltiesC2(val)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold ${
                              aoPenaltiesC2 === val
                                ? 'bg-amber-500 text-black'
                                : 'bg-slate-950 text-slate-400 hover:text-white'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* SKIF Rules Controls */
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Ваза-ари (Waza-ari):</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-bold text-sky-400">{aoWazaAri}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setAoWazaAri(Math.max(0, aoWazaAri - 1))}
                            className="px-2 py-0.5 bg-slate-800 rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => {
                              const next = aoWazaAri + 1;
                              setAoWazaAri(next);
                              if (next >= 2) {
                                setWinReason('awasete_ippon');
                                setWinnerId(bout.aoParticipantId);
                                setStatus('completed');
                              }
                            }}
                            className="px-2 py-0.5 bg-sky-600 text-white rounded font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Иппон (Ippon):</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-base font-bold text-sky-400">{aoIppon}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setAoIppon(Math.max(0, aoIppon - 1))}
                            className="px-2 py-0.5 bg-slate-800 rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => {
                              setAoIppon(aoIppon + 1);
                              setWinReason('ippon_direct');
                              setWinnerId(bout.aoParticipantId);
                              setStatus('completed');
                            }}
                            className="px-2 py-0.5 bg-amber-600 text-white rounded font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 text-[11px]">Штрафы SKIF (Кейкоку/Чуй/Хансоку):</span>
                      <span className="font-bold text-amber-400">{aoSkifPenalties}/4</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[10px]">
                      {['Нет', 'Keikoku', 'Chui', 'H-Chui', 'Hansoku'].map((lbl, idx) => (
                        <button
                          key={lbl}
                          onClick={() => setAoSkifPenalties(idx)}
                          className={`py-1 rounded text-center truncate ${
                            aoSkifPenalties === idx ? 'bg-amber-500 text-black font-bold' : 'bg-slate-950 text-slate-400'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Match Status & Decision Section */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-rose-400" />
              <span>Статус поединка, Победитель и Хронометраж</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Статус матча:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BoutStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="scheduled">Запланирован (scheduled)</option>
                  <option value="waiting_competitors">Ожидание спортсменов (waiting)</option>
                  <option value="in_progress">Идет поединок (in_progress)</option>
                  <option value="completed">Завершен (completed)</option>
                  <option value="cancelled">Отменен (cancelled)</option>
                </select>
              </div>

              {/* Winner Selection */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Победитель:</label>
                <select
                  value={winnerId || 'none'}
                  onChange={(e) => {
                    const val = e.target.value === 'none' ? undefined : e.target.value;
                    setWinnerId(val);
                    if (val) setStatus('completed');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="none">— Победитель не определен —</option>
                  <option value={bout.akaParticipantId}>АКА: {akaName}</option>
                  <option value={bout.aoParticipantId}>АО: {aoName}</option>
                </select>
              </div>

              {/* Win Reason */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Критерий победы:</label>
                <select
                  value={winReason || 'points_lead'}
                  onChange={(e) => setWinReason(e.target.value as WinReason)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="points_lead">Преимущество по очкам (Points Lead)</option>
                  <option value="senshu_advantage">Преимущество Senshu (Первый балл)</option>
                  <option value="mercy_rule_8pt">Отрыв 8 очков (WKF Mercy Rule)</option>
                  <option value="ippon_direct">Чистый Иппон (SKIF Ippon Direct)</option>
                  <option value="awasete_ippon">Два Ваза-ари (SKIF Awaseté Ippon)</option>
                  <option value="shobu_sanbon_win">Победа в Shobu Sanbon (3 Ippon)</option>
                  <option value="hantei_decision">Решение судей Хантей (Hantei)</option>
                  <option value="hansoku_dq">Дисквалификация Хансоку (DQ)</option>
                  <option value="kiken_injury">Отказ / Травма (Кикен)</option>
                  <option value="encho_sen_sudden_death">Внезапная смерть (Encho-sen)</option>
                </select>
              </div>
            </div>

            {/* Time Adjustments */}
            <div className="pt-2 border-t border-slate-850 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Остаток времени (сек):</span>
                </span>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-center"
                />
                <span className="text-slate-400">
                  ({Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTimerSeconds(180)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  3 мин
                </button>
                <button
                  onClick={() => setTimerSeconds(120)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  2 мин
                </button>
                <button
                  onClick={() => setTimerSeconds(Math.max(0, timerSeconds - 10))}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  -10с
                </button>
                <button
                  onClick={() => setTimerSeconds(timerSeconds + 10)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  +10с
                </button>
                <button
                  onClick={handleReopenBout}
                  className="px-3 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded border border-amber-600/40 flex items-center gap-1"
                  title="Возобновить бой, если он был случайно завершен"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Возобновить бой</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Reason & History Note */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Официальное основание судейской коррекции (Протокол / VR):</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="ФИО / Должность судьи"
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 w-52"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Видеоповтор VR: отмена балла',
                'Видеоповтор VR: подтверждение балла',
                'Коррекция хронометража секретариата',
                'Хантей: единогласное решение судей',
                'Медицинское снятие врача (Кикен)',
                'Техническая ошибка оператора татами'
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleApplyQuickNote(preset)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Введите примечание для протокола соревнований..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            {/* Existing override notes history */}
            {bout.overrideNotes && bout.overrideNotes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-850 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">История правок:</span>
                {bout.overrideNotes.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span className="text-slate-500">[{item.timestamp}]</span>
                    <span className="text-amber-400">{item.operator}:</span>
                    <span>{item.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Отмена
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Применить изменения в базе данных</span>
          </button>
        </div>
      </div>
    </div>
  );
};
