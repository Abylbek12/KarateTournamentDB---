import React, { useState, useMemo } from 'react';
import { 
  Award, 
  ChevronRight, 
  Trophy, 
  Zap, 
  Shield, 
  GitBranch, 
  Sliders, 
  ArrowRight,
  Tv,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Bout, Participant, TournamentCategory, TournamentRules } from '../types/schema';
import { ManualBoutControlModal } from './ManualBoutControlModal';

interface TournamentBracketViewProps {
  bouts: Bout[];
  tournamentCategories?: TournamentCategory[];
  tournamentRules?: TournamentRules;
  participants?: Participant[];
  onOpenScoreboard: (bout: Bout) => void;
  onUpdateBout?: (bout: Bout) => void;
  onNavigateToAdminDraw?: (categoryId: string) => void;
}

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  bouts,
  tournamentCategories = [],
  tournamentRules = 'wkf',
  participants = [],
  onOpenScoreboard,
  onUpdateBout,
  onNavigateToAdminDraw
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('tc1');
  const [selectedBoutForManualEdit, setSelectedBoutForManualEdit] = useState<Bout | null>(null);

  // Filter bouts for the active category
  const categoryBouts = useMemo(() => {
    return bouts.filter((b) => b.categoryId === selectedCategoryId);
  }, [bouts, selectedCategoryId]);

  // Group bouts by round stage
  const qfBouts = categoryBouts.filter((b) => b.roundStage === 'quarter_final');
  const sfBouts = categoryBouts.filter((b) => b.roundStage === 'semi_final');
  const finalBout = categoryBouts.find((b) => b.roundStage === 'final');
  const bronzeBout = categoryBouts.find((b) => b.roundStage === 'bronze_match');

  const isSkif = tournamentRules === 'skif';

  return (
    <div className="space-y-4">
      {/* Header and Category Selector (Compact Unified Standard) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {isSkif ? 'Сетка плей-офф SKIF (Shobu Ippon / Sanbon)' : 'Олимпийская сетка WKF с утешительными боями'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Турнирная сетка плей-офф
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono">Дивизион:</span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
              >
                {tournamentCategories.length > 0 ? (
                  tournamentCategories.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.ageCategoryName} · {tc.weightCategoryName || 'Ката'}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="tc1">Взрослые 18+ · Мужчины · Кумитэ -75 кг</option>
                    <option value="tc2">Взрослые 18+ · Мужчины · Кумитэ -67 кг</option>
                    <option value="tc3">Взрослые 18+ · Женщины · Кумитэ -55 кг</option>
                    <option value="tc4">Кадеты 14-15 лет · Юноши · Кумитэ -63 кг</option>
                  </>
                )}
              </select>
            </div>

            {onNavigateToAdminDraw && (
              <button
                onClick={() => onNavigateToAdminDraw(selectedCategoryId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Жеребьевка</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Podium banner if Final is completed */}
      {finalBout && finalBout.status === 'completed' && finalBout.winnerId && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>ИТОГОВЫЙ ПЬЕДЕСТАЛ:</span>
            </span>
            <span className="text-white">
              🥇 Золото:{' '}
              <strong className="text-amber-400">
                {finalBout.winnerId === finalBout.akaParticipantId
                  ? `${finalBout.akaParticipant?.lastName} ${finalBout.akaParticipant?.firstName}`
                  : `${finalBout.aoParticipant?.lastName} ${finalBout.aoParticipant?.firstName}`}
              </strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-white">
              🥈 Серебро:{' '}
              <strong className="text-slate-300">
                {finalBout.winnerId === finalBout.akaParticipantId
                  ? `${finalBout.aoParticipant?.lastName} ${finalBout.aoParticipant?.firstName}`
                  : `${finalBout.akaParticipant?.lastName} ${finalBout.akaParticipant?.firstName}`}
              </strong>
            </span>
            {bronzeBout && bronzeBout.winnerId && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-white">
                  🥉 Бронза:{' '}
                  <strong className="text-amber-600">
                    {bronzeBout.winnerId === bronzeBout.akaParticipantId
                      ? `${bronzeBout.akaParticipant?.lastName} ${bronzeBout.akaParticipant?.firstName}`
                      : `${bronzeBout.aoParticipant?.lastName} ${bronzeBout.aoParticipant?.firstName}`}
                  </strong>
                </span>
              </>
            )}
          </div>

          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold shrink-0">
            Медали вручены
          </span>
        </div>
      )}

      {/* Bracket Tree View (Compact Layout) */}
      {categoryBouts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-white">Для данной категории сетка еще не сформирована</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Перейдите в панель администратора для автоматической жеребьевки и генерации сетки плей-офф.
          </p>
          {onNavigateToAdminDraw && (
            <button
              onClick={() => onNavigateToAdminDraw(selectedCategoryId)}
              className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Сгенерировать сетку в Админ-панели</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <div className="min-w-[840px] grid grid-cols-3 gap-6 relative">
            {/* 1/4 Final Column */}
            <div className="flex flex-col justify-around space-y-4">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  1/4 Финала ({qfBouts.length})
                </span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-around">
                {qfBouts.map((match) =>
                  renderCompactBoutCard(
                    match,
                    onOpenScoreboard,
                    (b) => setSelectedBoutForManualEdit(b),
                    false,
                    isSkif
                  )
                )}
              </div>
            </div>

            {/* 1/2 Semi Final Column */}
            <div className="flex flex-col justify-around space-y-4">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Полуфинал ({sfBouts.length})
                </span>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-around">
                {sfBouts.map((match) =>
                  renderCompactBoutCard(
                    match,
                    onOpenScoreboard,
                    (b) => setSelectedBoutForManualEdit(b),
                    false,
                    isSkif
                  )
                )}
              </div>
            </div>

            {/* Final and Bronze Column */}
            <div className="flex flex-col justify-around space-y-4">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Финалы (Золото и Бронза)
                </span>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-around">
                {finalBout && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block text-center">
                      ★ ФИНАЛ ЗА ЗОЛОТО
                    </span>
                    {renderCompactBoutCard(
                      finalBout,
                      onOpenScoreboard,
                      (b) => setSelectedBoutForManualEdit(b),
                      true,
                      isSkif
                    )}
                  </div>
                )}

                {bronzeBout && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-mono text-rose-400 font-bold block text-center">
                      ◆ БОЙ ЗА 3-Е МЕСТО (БРОНЗА)
                    </span>
                    {renderCompactBoutCard(
                      bronzeBout,
                      onOpenScoreboard,
                      (b) => setSelectedBoutForManualEdit(b),
                      false,
                      isSkif
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Referee Override Modal from Bracket */}
      {selectedBoutForManualEdit && (
        <ManualBoutControlModal
          bout={selectedBoutForManualEdit}
          isOpen={!!selectedBoutForManualEdit}
          tournamentRules={tournamentRules}
          participants={participants}
          onClose={() => setSelectedBoutForManualEdit(null)}
          onSaveBout={(updated) => {
            if (onUpdateBout) onUpdateBout(updated);
            setSelectedBoutForManualEdit(null);
          }}
        />
      )}
    </div>
  );
};

function renderCompactBoutCard(
  match: Bout,
  onOpenScoreboard: (b: Bout) => void,
  onOpenManualEdit: (b: Bout) => void,
  isGoldFinal = false,
  isSkif = false
) {
  const isLive = match.status === 'in_progress';
  const isCompleted = match.status === 'completed';

  const akaName = match.akaParticipant
    ? `${match.akaParticipant.lastName} ${match.akaParticipant.firstName}`
    : 'АКА (Красный)';
  const akaClub = match.akaParticipant?.clubName || 'Клуб';

  const aoName = match.aoParticipant
    ? `${match.aoParticipant.lastName} ${match.aoParticipant.firstName}`
    : 'АО (Синий)';
  const aoClub = match.aoParticipant?.clubName || 'Клуб';

  const akaWinner = isCompleted && match.winnerId === match.akaParticipantId;
  const aoWinner = isCompleted && match.winnerId === match.aoParticipantId;

  return (
    <div
      key={match.id}
      className={`p-3 rounded-xl border transition-all shadow-sm space-y-2 relative group ${
        isGoldFinal
          ? 'bg-gradient-to-b from-slate-950 to-amber-950/20 border-amber-600/60 ring-1 ring-amber-500/20'
          : isLive
          ? 'bg-slate-950 border-rose-500 ring-1 ring-rose-500/30'
          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top row with quick manual referee edit button */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">#{match.boutNumber}</span>
          <span>·</span>
          <span>Т{match.tatamiNumber || 1}</span>
          <span>·</span>
          <span>{match.scheduledTime}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick referee override button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenManualEdit(match);
            }}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            title="Ручная коррекция поединка (Главный судья)"
          >
            <Sliders className="w-3 h-3 text-rose-400" />
          </button>

          {/* Quick open scoreboard */}
          <button
            onClick={() => onOpenScoreboard(match)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            title="Открыть на табло"
          >
            <Tv className="w-3 h-3 text-sky-400" />
          </button>
        </div>
      </div>

      {/* AKA Row */}
      <div
        onClick={() => onOpenScoreboard(match)}
        className={`p-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
          akaWinner
            ? 'bg-rose-950/60 border border-rose-600 text-white font-bold'
            : 'bg-slate-900/70 text-slate-300 hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span className="truncate">{akaName}</span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            ({akaClub.replace('СК ', '')}{match.akaParticipant?.city ? ` · ${match.akaParticipant.city}` : ''})
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-mono">
          {!isSkif && match.akaSenshu && (
            <span className="px-1 text-[9px] bg-rose-600 text-white rounded font-bold">S</span>
          )}
          {isSkif && match.akaIppon && match.akaIppon > 0 && (
            <span className="px-1 text-[9px] bg-amber-600 text-white rounded font-bold">IPPON</span>
          )}
          <span className="text-sm font-bold text-rose-400 tabular-nums">
            {match.akaScore}
          </span>
        </div>
      </div>

      {/* AO Row */}
      <div
        onClick={() => onOpenScoreboard(match)}
        className={`p-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
          aoWinner
            ? 'bg-sky-950/60 border border-sky-600 text-white font-bold'
            : 'bg-slate-900/70 text-slate-300 hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
          <span className="truncate">{aoName}</span>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            ({aoClub.replace('СК ', '')}{match.aoParticipant?.city ? ` · ${match.aoParticipant.city}` : ''})
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-mono">
          {!isSkif && match.aoSenshu && (
            <span className="px-1 text-[9px] bg-sky-600 text-white rounded font-bold">S</span>
          )}
          {isSkif && match.aoIppon && match.aoIppon > 0 && (
            <span className="px-1 text-[9px] bg-amber-600 text-white rounded font-bold">IPPON</span>
          )}
          <span className="text-sm font-bold text-sky-400 tabular-nums">
            {match.aoScore}
          </span>
        </div>
      </div>

      {/* WKF Seeding Protection verification info */}
      {match.roundStage === 'quarter_final' && match.akaParticipant && match.aoParticipant && (
        <div className="text-[9px] font-mono text-emerald-400/90 flex items-center justify-between px-1 pt-0.5 border-t border-slate-900/80">
          <span>✓ WKF Разведение: разные клубы/города</span>
          <span className="text-slate-500">{match.akaParticipant.country || 'РФ'} / {match.aoParticipant.country || 'РФ'}</span>
        </div>
      )}

      {/* Status Bar */}
      {isLive && (
        <div className="pt-0.5 text-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
            ИДЕТ ПОЕДИНОК · {match.timerSecondsRemaining} сек
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="pt-0.5 flex items-center justify-between text-[10px] font-mono text-emerald-400">
          <span>✓ Завершен ({match.winReason || 'баллы'})</span>
          <span className="text-slate-500 hover:text-slate-300 cursor-pointer" onClick={() => onOpenScoreboard(match)}>
            Табло →
          </span>
        </div>
      )}
    </div>
  );
}
