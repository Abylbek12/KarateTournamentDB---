import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Award, 
  Filter, 
  Maximize2, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Tv,
  Users
} from 'lucide-react';
import { Bout, Tatami, RoundStage } from '../types/schema';

interface TatamiScheduleViewProps {
  tatamis: Tatami[];
  bouts: Bout[];
  onOpenScoreboard: (bout: Bout) => void;
  onAddBout?: () => void;
}

export const TatamiScheduleView: React.FC<TatamiScheduleViewProps> = ({
  tatamis,
  bouts,
  onOpenScoreboard,
  onAddBout
}) => {
  const [selectedTatamiId, setSelectedTatamiId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredBouts = bouts.filter((b) => {
    const matchesTatami = selectedTatamiId === 'all' || b.tatamiId === selectedTatamiId;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesTatami && matchesStatus;
  });

  const activeBout = bouts.find((b) => b.status === 'in_progress');
  const scheduledCount = bouts.filter((b) => b.status === 'scheduled').length;
  const completedCount = bouts.filter((b) => b.status === 'completed').length;
  const inProgressCount = bouts.filter((b) => b.status === 'in_progress').length;

  const roundStageLabels: Record<RoundStage, string> = {
    'round_1_16': '1/16 Финала',
    'round_1_8': '1/8 Финала',
    'quarter_final': '1/4 Финала',
    'semi_final': 'Полуфинал',
    'repechage': 'Утешительный бой',
    'bronze_match': 'Поединок за бронзу',
    'final': 'ФИНАЛ (Золото)'
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Area */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Tv className="w-3.5 h-3.5" />
              <span>Таблица bouts & tatamis в реальном времени</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Расписание поединков по татами
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Управление потоком поединков, вызов спортсменов АКА (Красный) и АО (Синий), 
              электронное судейское табло и хронометраж чистого времени по правилам WKF.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">В бою:</span>
              <span className="font-bold text-white">{inProgressCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">В очереди:</span>
              <span className="font-bold text-amber-400">{scheduledCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Завершено:</span>
              <span className="font-bold text-sky-400">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Tatami Selector & Status Filters */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tatami Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedTatamiId('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedTatamiId === 'all'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Все татами ({bouts.length})
            </button>
            {tatamis.map((tatami) => {
              const count = bouts.filter((b) => b.tatamiId === tatami.id).length;
              return (
                <button
                  key={tatami.id}
                  onClick={() => setSelectedTatamiId(tatami.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedTatamiId === tatami.id
                      ? 'bg-rose-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Татами №{tatami.number} ({count})
                </button>
              );
            })}
          </div>

          {/* Status selector buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            {[
              { id: 'all', label: 'Все статусы' },
              { id: 'in_progress', label: 'Идёт бой' },
              { id: 'scheduled', label: 'Ожидают' },
              { id: 'completed', label: 'Завершены' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bouts List */}
      <div className="space-y-4">
        {filteredBouts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-2">
            <p className="text-sm font-medium">Поединков с выбранными критериями не найдено</p>
            <p className="text-xs text-slate-500">Попробуйте изменить выбранное татами или сбросить фильтр статуса.</p>
          </div>
        ) : (
          filteredBouts.map((bout) => {
            const isLive = bout.status === 'in_progress';
            const isCompleted = bout.status === 'completed';

            const akaWinner = isCompleted && bout.winnerId === bout.akaParticipantId;
            const aoWinner = isCompleted && bout.winnerId === bout.aoParticipantId;

            return (
              <div
                key={bout.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLive
                    ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-rose-500/80 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Bout Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-900">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white">
                      Бой #{bout.boutNumber}
                    </span>
                    <span className="text-xs font-semibold text-rose-400 font-mono">
                      Татами №{bout.tatamiNumber || 1}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs font-medium text-slate-300">
                      {roundStageLabels[bout.roundStage] || bout.roundStage}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400">
                      {bout.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Time or Status badge */}
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{bout.scheduledTime}</span>
                    </div>

                    {isLive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        LIVE ({formatSeconds(bout.timerSecondsRemaining)})
                      </span>
                    )}

                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold">
                        Завершен
                      </span>
                    )}

                    {/* Open Scoreboard CTA */}
                    <button
                      onClick={() => onOpenScoreboard(bout)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
                        isLive
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{isLive ? 'Управление табло' : 'Открыть табло'}</span>
                    </button>
                  </div>
                </div>

                {/* Match Opponents Grid: AKA (Red) vs AO (Blue) */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AKA (Red) Block */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    akaWinner 
                      ? 'bg-rose-950/30 border-rose-600/60 ring-1 ring-rose-500/40' 
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                          AKA · Красный
                        </span>
                      </div>
                      {bout.akaParticipant?.clubName && (
                        <span className="text-xs text-slate-400 font-mono">
                          {bout.akaParticipant.clubName}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {bout.akaParticipant ? `${bout.akaParticipant.lastName} ${bout.akaParticipant.firstName}` : 'Спортсмен АКА'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                          <span>{bout.akaParticipant?.declaredWeightKg} кг</span>
                          <span>·</span>
                          <span>{bout.akaParticipant?.beltRank.replace('_', ' ')}</span>
                          {bout.akaSenshu && (
                            <span className="px-1.5 py-0.2 bg-rose-950 border border-rose-600 text-rose-300 text-[10px] rounded font-bold">
                              SENSHU
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score display */}
                      <div className="text-3xl font-black text-rose-400 font-mono tabular-nums">
                        {bout.akaScore}
                      </div>
                    </div>

                    {akaWinner && (
                      <div className="mt-2 pt-2 border-t border-rose-900/40 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Победитель ({bout.winReason})</span>
                      </div>
                    )}
                  </div>

                  {/* AO (Blue) Block */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    aoWinner 
                      ? 'bg-sky-950/30 border-sky-600/60 ring-1 ring-sky-500/40' 
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                          AO · Синий
                        </span>
                      </div>
                      {bout.aoParticipant?.clubName && (
                        <span className="text-xs text-slate-400 font-mono">
                          {bout.aoParticipant.clubName}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">
                          {bout.aoParticipant ? `${bout.aoParticipant.lastName} ${bout.aoParticipant.firstName}` : 'Спортсмен АО'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                          <span>{bout.aoParticipant?.declaredWeightKg} кг</span>
                          <span>·</span>
                          <span>{bout.aoParticipant?.beltRank.replace('_', ' ')}</span>
                          {bout.aoSenshu && (
                            <span className="px-1.5 py-0.2 bg-sky-950 border border-sky-600 text-sky-300 text-[10px] rounded font-bold">
                              SENSHU
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score display */}
                      <div className="text-3xl font-black text-sky-400 font-mono tabular-nums">
                        {bout.aoScore}
                      </div>
                    </div>

                    {aoWinner && (
                      <div className="mt-2 pt-2 border-t border-sky-900/40 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Победитель ({bout.winReason})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
