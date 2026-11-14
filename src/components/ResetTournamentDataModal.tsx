import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  Database, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  Download, 
  ShieldAlert, 
  Layers, 
  Lock
} from 'lucide-react';
import { UserRole } from '../types/schema';

export interface ResetOptions {
  resetBoutScores: boolean;
  clearPlayoffBrackets: boolean;
  clearRefereeProtocols: boolean;
  resetWeighInStatus: boolean;
  restoreDefaultDemo: boolean;
}

interface ResetTournamentDataModalProps {
  isOpen: boolean;
  currentUserRole: UserRole;
  onClose: () => void;
  onConfirmReset: (options: ResetOptions) => void;
}

export const ResetTournamentDataModal: React.FC<ResetTournamentDataModalProps> = ({
  isOpen,
  currentUserRole,
  onClose,
  onConfirmReset
}) => {
  const [resetType, setResetType] = useState<'clean' | 'restore_demo'>('clean');
  const [resetBoutScores, setResetBoutScores] = useState(true);
  const [clearPlayoffBrackets, setClearPlayoffBrackets] = useState(false);
  const [clearRefereeProtocols, setClearRefereeProtocols] = useState(true);
  const [resetWeighInStatus, setResetWeighInStatus] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentUserRole === 'admin';

  // Generate corresponding PostgreSQL SQL script for the chosen options
  const generatedSql = `-- ========================================================================
-- БЕЗОПАСНАЯ ОЧИСТКА ДАННЫХ ТУРНИРА (С СОХРАНЕНИЕМ СТРУКТУРЫ БД)
-- Сгенерировано Административной панелью KarateTournamentDB
-- ========================================================================
BEGIN;

${clearRefereeProtocols ? `-- 1. Полная очистка судейских протоколов и баллов
TRUNCATE TABLE referee_protocols CASCADE;
TRUNCATE TABLE bout_scores CASCADE;` : '-- Протоколы сохранены'}

${resetBoutScores ? `-- 2. Сброс результатов всех поединков сетки
UPDATE bouts SET
  aka_score = 0,
  ao_score = 0,
  aka_senshu = FALSE,
  ao_senshu = FALSE,
  aka_penalties_c1 = 0,
  ao_penalties_c1 = 0,
  aka_penalties_c2 = 0,
  ao_penalties_c2 = 0,
  aka_waza_ari = 0,
  ao_waza_ari = 0,
  aka_ippon = 0,
  ao_ippon = 0,
  aka_skif_penalties = 0,
  ao_skif_penalties = 0,
  aka_jogai = 0,
  ao_jogai = 0,
  winner_id = NULL,
  win_reason = NULL,
  status = 'scheduled',
  referee_protocol_id = NULL,
  actual_start_time = NULL,
  actual_end_time = NULL;` : '-- Результаты поединков сохранены'}

${resetWeighInStatus ? `-- 3. Сброс статуса взвешивания участников
UPDATE participants SET
  status = 'registered',
  is_weighed_in = FALSE,
  actual_weight_kg = NULL;` : '-- Данные взвешивания участников сохранены'}

COMMIT;
-- Базовые структуры (таблицы, категории, клубы, пользователи) сохранены без изменений.
`;

  const handleExecute = () => {
    if (!isAdmin) return;
    if (resetType === 'clean' && confirmationInput.trim().toUpperCase() !== 'СБРОС') {
      return;
    }

    onConfirmReset({
      resetBoutScores,
      clearPlayoffBrackets: resetType === 'clean' ? clearPlayoffBrackets : false,
      clearRefereeProtocols,
      resetWeighInStatus: resetType === 'clean' ? resetWeighInStatus : false,
      restoreDefaultDemo: resetType === 'restore_demo'
    });
    onClose();
  };

  const handleDownloadSql = () => {
    const blob = new Blob([generatedSql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reset_tournament_database_${Date.now()}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="max-w-2xl w-full rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950/80 via-slate-950 to-rose-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Административная очистка и сброс данных</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                  ADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Сброс сетки, протоколов и баллов в один клик с полным сохранением схемы базы данных
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-mono transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* RBAC Notice if not Admin */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-mono flex items-center gap-3">
              <Lock className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-white mb-0.5">Доступ ограничен</strong>
                Операция очистки базы данных доступна исключительно с правами <strong>Администратора турнира</strong>. 
                Переключите роль в верхней панели Header на «👑 Администратор» для выполнения операции.
              </div>
            </div>
          )}

          {/* Reset Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setResetType('clean')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${
                resetType === 'clean'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Очистить турнир (Чистый лист)</span>
            </button>
            <button
              onClick={() => setResetType('restore_demo')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${
                resetType === 'restore_demo'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Восстановить эталонные демо-данные</span>
            </button>
          </div>

          {/* Explanation Banner */}
          {resetType === 'clean' ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Что остаётся неизменным в базе данных:</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside font-mono">
                <li>Таблицы структуры: <code className="text-emerald-400">users</code>, <code className="text-emerald-400">tournaments</code>, <code className="text-emerald-400">clubs</code></li>
                <li>Весовые и возрастные категории WKF / SKIF (<code className="text-emerald-400">tournament_categories</code>)</li>
                <li>Список зарегистрированных спортсменов (<code className="text-emerald-400">participants</code>)</li>
                <li>Настройки татами и расписания</li>
              </ul>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/60 text-xs text-amber-200 font-mono space-y-1">
              <strong className="block text-white font-bold">Восстановление заводского демонстрационного пула:</strong>
              <p className="text-slate-400">
                Будут загружены исходные поединки 1/8, 1/4, полуфиналов и финала, судейские протоколы татами №1 и №4 (Ката), 
                счет WKF/SKIF и полный состав судейской коллегии.
              </p>
            </div>
          )}

          {/* Granular Checkboxes for 'clean' mode */}
          {resetType === 'clean' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Параметры выборочной очистки:
              </span>

              <label className="flex items-center gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetBoutScores}
                  onChange={(e) => setResetBoutScores(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                />
                <span>
                  <strong>Сбросить баллы и результаты всех боев</strong> (aka_score=0, ao_score=0, статус 'scheduled')
                </span>
              </label>

              <label className="flex items-center gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clearRefereeProtocols}
                  onChange={(e) => setClearRefereeProtocols(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                />
                <span>
                  <strong>Удалить все судейские протоколы</strong> (очистка таблицы <code className="text-rose-400">referee_protocols</code> и <code className="text-rose-400">bout_scores</code>)
                </span>
              </label>

              <label className="flex items-center gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetWeighInStatus}
                  onChange={(e) => setResetWeighInStatus(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                />
                <span>
                  <strong>Сбросить отметки взвешивания спортсменов</strong> (is_weighed_in = false)
                </span>
              </label>

              <label className="flex items-center gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clearPlayoffBrackets}
                  onChange={(e) => setClearPlayoffBrackets(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                />
                <span>
                  <strong>Полная очистка сетки плей-офф</strong> (удалить все сгенерированные поединки турнира)
                </span>
              </label>
            </div>
          )}

          {/* Confirmation Input for Clean Mode */}
          {resetType === 'clean' && isAdmin && (
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">
                Для подтверждения операции введите слово <span className="text-rose-400 font-bold">СБРОС</span>:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="СБРОС"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 uppercase tracking-widest"
              />
            </div>
          )}

          {/* SQL Preview Toggler */}
          <div className="pt-2 flex items-center justify-between text-xs font-mono">
            <button
              onClick={() => setShowSql(!showSql)}
              className="text-slate-400 hover:text-white underline flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-rose-400" />
              <span>{showSql ? 'Скрыть SQL транзакцию' : 'Показать PostgreSQL SQL команду'}</span>
            </button>

            <button
              onClick={handleDownloadSql}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать reset.sql</span>
            </button>
          </div>

          {showSql && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-48 selection:bg-rose-500 selection:text-white">
              {generatedSql}
            </pre>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono transition-colors"
          >
            Отмена
          </button>

          <div className="flex items-center gap-3">
            <button
              disabled={!isAdmin || (resetType === 'clean' && confirmationInput.trim().toUpperCase() !== 'СБРОС')}
              onClick={handleExecute}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-md ${
                !isAdmin || (resetType === 'clean' && confirmationInput.trim().toUpperCase() !== 'СБРОС')
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  : resetType === 'clean'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {resetType === 'clean'
                  ? 'Выполнить полную очистку данных'
                  : 'Восстановить эталонные демо-данные'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
