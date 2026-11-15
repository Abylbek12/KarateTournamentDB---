import React from 'react';
import { Database, Download, ShieldCheck, Sliders, UserCog, RotateCcw, AlertOctagon } from 'lucide-react';
import { TournamentRules, UserRole } from '../types/schema';

interface HeaderProps {
  activeTab: string;
  tournamentRules?: TournamentRules;
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onTabChange: (tab: string) => void;
  onRulesChange?: (rules: TournamentRules) => void;
  onOpenManualControl?: () => void;
  onOpenResetDialog?: () => void;
  onExportSql: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  tournamentRules = 'wkf',
  currentUserRole = 'admin',
  onRoleChange,
  onTabChange, 
  onRulesChange,
  onOpenManualControl,
  onOpenResetDialog,
  onExportSql 
}) => {
  const navItems = [
    { id: 'tournaments', label: '🏆 Витрина турниров' },
    { id: 'scoreboard', label: 'Онлайн-табло' },
    { id: 'protocols', label: 'Судейские протоколы' },
    { id: 'bracket', label: 'Сетка плей-офф' },
    { id: 'lan', label: 'Локальная сеть (LAN)' },
    { id: 'schedule', label: 'Расписание' },
    { id: 'accounting', label: 'Турниры и Клубы' },
    { id: 'analytics', label: 'Аналитика и зачёт' },
    { id: 'engine', label: 'Генератор дивизионов' },
    { id: 'admin', label: 'Админ-панель' },
    { id: 'participants', label: 'Участники' },
    { id: 'categories', label: 'Категории' },
    { id: 'schema', label: 'Схема БД' },
    { id: 'sql', label: 'PostgreSQL DDL' }
  ];

  const roleLabels: Record<UserRole, { label: string; icon: string; color: string; desc: string }> = {
    admin: { label: 'Администратор', icon: '👑', color: 'bg-rose-950/90 text-rose-300 border-rose-800', desc: 'Полный доступ (включая очистку БД)' },
    chief_referee: { label: 'Главный судья (ГСК)', icon: '⚖️', color: 'bg-amber-950/90 text-amber-300 border-amber-800', desc: 'Утверждение протоколов, апелляции VR' },
    tatami_referee: { label: 'Судья татами', icon: '🥋', color: 'bg-blue-950/90 text-blue-300 border-blue-800', desc: 'Флажки, табло, судейство Ката' },
    scorekeeper: { label: 'Оператор табло', icon: '⏱️', color: 'bg-emerald-950/90 text-emerald-300 border-emerald-800', desc: 'Ведение счета и хронометраж' },
    club_coach: { label: 'Тренер клуба', icon: '🥊', color: 'bg-purple-950/90 text-purple-300 border-purple-800', desc: 'Просмотр сетки и заявки (read-only)' },
    athlete: { label: 'Спортсмен', icon: '🥋', color: 'bg-sky-950/90 text-sky-300 border-sky-800', desc: 'Свои заявки и результаты' },
    medical_officer: { label: 'Врач соревнований', icon: '🩺', color: 'bg-teal-950/90 text-teal-300 border-teal-800', desc: 'Медицинский допуск и 10с травмы' }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text wordmark & Rules Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('tournaments')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
              title="Перейти на главную витрину турниров"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-900/40 group-hover:bg-blue-500 transition-colors">
                UX
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
                UventexKarate
              </span>
            </button>

            {/* Quick WKF / SKIF Rules Switcher in Header */}
            {onRulesChange && (
              <div className="hidden sm:flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 ml-2">
                <button
                  onClick={() => onRulesChange('wkf')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                    tournamentRules === 'wkf'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Правила WKF: Юко/Ваза-ари/Иппон, отрыв 8 очков, Senshu"
                >
                  WKF
                </button>
                <button
                  onClick={() => onRulesChange('skif')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                    tournamentRules === 'skif'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Правила SKIF: Сётокан Shobu Ippon/Sanbon, Ваза-ари/Иппон, Awaseté Ippon"
                >
                  SKIF
                </button>
              </div>
            )}
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-300">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 hover:text-white ${
                    isActive ? 'text-rose-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary actions & RBAC */}
          <div className="flex items-center gap-2 shrink-0">
            {/* RBAC Role Selector Dropdown */}
            {onRoleChange && (
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline ml-1.5">Роль:</span>
                <select
                  value={currentUserRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className={`text-xs font-mono font-bold py-1 px-2 rounded-md border focus:outline-none cursor-pointer transition-colors ${roleLabels[currentUserRole].color}`}
                  title={`Права доступа: ${roleLabels[currentUserRole].desc}`}
                >
                  <option value="admin">👑 Администратор</option>
                  <option value="chief_referee">⚖️ Главный судья (ГСК)</option>
                  <option value="tatami_referee">🥋 Судья татами</option>
                  <option value="scorekeeper">⏱️ Оператор табло</option>
                  <option value="club_coach">🥊 Тренер клуба</option>
                </select>
              </div>
            )}

            {/* 1-click DB Reset Shortcut Button (Exclusive for Admin) */}
            {currentUserRole === 'admin' && onOpenResetDialog && (
              <button
                onClick={onOpenResetDialog}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/70 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                title="Очистка сетки, протоколов и баллов в 1 клик с сохранением схемы базы данных"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Очистка данных</span>
              </button>
            )}

            {onOpenManualControl && (currentUserRole === 'admin' || currentUserRole === 'chief_referee') && (
              <button
                onClick={onOpenManualControl}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-rose-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-rose-900/60 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                title="Панель оператора / Главного судьи для ручной коррекции поединка"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Коррекция ГСК</span>
              </button>
            )}

            {/* Sensei AI Supreme Trigger Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-sensei-ai'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 hover:text-white bg-gradient-to-r from-blue-950/80 to-emerald-950/90 border border-emerald-600/60 hover:border-emerald-500 rounded-lg transition-all shadow-sm hover:shadow-emerald-900/40 whitespace-nowrap cursor-pointer"
              title="Открыть Sensei AI Supreme (Gemini 3.8 Flash) — лучший спортивный интеллект по каратэ"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sensei AI</span>
            </button>

            <button
              onClick={onExportSql}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              title="Скачать полный DDL скрипт PostgreSQL"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">schema.sql</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary nav row */}
        <div className="lg:hidden flex items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t border-slate-800/80">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-1 text-xs rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === item.id 
                  ? 'bg-rose-600 text-white font-medium' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
