import React, { useState } from 'react';
import { 
  Tv, 
  FileText, 
  GitBranch, 
  Calendar, 
  Wifi, 
  Users, 
  ShieldCheck, 
  Shield,
  Database, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Stethoscope,
  Film,
  CreditCard,
  Stamp,
  ChevronDown,
  Video,
  HelpCircle,
  Target,
  LayoutGrid,
  Briefcase,
  Trophy,
  Sliders,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  Lock
} from 'lucide-react';
import { TournamentRules, UserRole, Tournament } from '../types/schema';
import { Language } from '../utils/translations';
import { useApp } from '../context/AppContext';

export type NavTabId = 
  | 'tournaments' 
  | 'tournament_details'
  | 'studios' 
  | 'virtual_studios'
  | 'rankings' 
  | 'about'
  | 'help'
  | 'coach'
  | 'acquiring'
  | 'scoreboard' 
  | 'referee_vr'
  | 'doctor'
  | 'video_analytics'
  | 'protocols' 
  | 'exports'
  | 'bracket' 
  | 'schedule' 
  | 'lan' 
  | 'participants' 
  | 'admin' 
  | 'schema' 
  | 'sql' 
  | 'registration';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: NavTabId) => void;
  tournamentRules: TournamentRules;
  onRulesChange: (rules: TournamentRules) => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedTournament: Tournament;
  onOpenResetDialog: () => void;
  onExportSql: () => void;
  onOpenManualControl?: () => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  language?: Language;
  onOpenPrivacyModal?: () => void;
}

interface NavItemConfig {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUserRole,
  onRoleChange,
  selectedTournament,
  isMobileOpen,
  onToggleMobile,
  language: propLanguage,
  onOpenPrivacyModal
}) => {
  const appContext = useApp();
  const language = propLanguage || appContext.language;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<'tournament_mgmt' | 'admin_system' | 'info_links' | null>('tournament_mgmt');

  const isAdmin = currentUserRole === 'admin';

  const tr = (ru: string, ky: string, en: string) => {
    if (language === 'ky') return ky;
    if (language === 'en') return en;
    return ru;
  };

  // 1. Primary Top-Level Navigation (Only the most essential items remain directly visible)
  const primaryItems: NavItemConfig[] = [
    {
      id: 'tournaments',
      label: tr('События и Турниры', 'Мелдештер', 'Events & Tournaments'),
      icon: LayoutGrid
    },
    {
      id: 'studios',
      label: tr('Клубы и Додзё', 'Клубдар (Studios)', 'Studios & Clubs'),
      icon: Target
    },
    {
      id: 'virtual_studios',
      label: tr('Прямой эфир', 'Түз эфир (LIVE)', 'Virtual Studios'),
      icon: Video,
      badge: 'LIVE'
    },
    {
      id: 'rankings',
      label: tr('Рейтинги', 'Рейтингдер', 'Rankings'),
      icon: Trophy
    }
  ];

  // 2. Unified Tournament Management & Officiating Dropdown Group (Filtered by RBAC)
  const allTournamentManagementItems: (NavItemConfig & { adminOnly?: boolean })[] = [
    { id: 'registration', label: tr('Подача заявки (Регистрация)', 'Каттоо табыштамасы', 'Event Registration'), icon: UserCheck },
    { id: 'coach', label: tr('Кабинет клуба / Учреждения', 'Клуб / Мекеме кабинети', 'Club & Institution Cabinet'), icon: Users },
    { id: 'scoreboard', label: tr('Онлайн-Табло и Трансляции', 'Онлайн-Табло жана Түз эфир', 'Live Scoreboard & Stream'), icon: Tv },
    { id: 'bracket', label: tr('Сетки плей-офф', 'Плей-офф торчосу', 'Playoff Brackets'), icon: GitBranch },
    { id: 'schedule', label: tr('Расписание татами', 'Татами ырааттамасы', 'Tatami Schedule'), icon: Calendar },
    { id: 'participants', label: tr('База участников', 'Катышуучулар базасы', 'Athletes Roster'), icon: Users },
    { id: 'referee_vr', label: tr('Судейский VR и Флаги', 'Калыстар VR пульту', 'Referee VR & Flags'), icon: Shield, adminOnly: true },
    { id: 'protocols', label: tr('Протоколы поединков', 'Беттеш протоколдору', 'Match Protocols'), icon: FileText, adminOnly: true },
    { id: 'doctor', label: tr('Медконтроль (80с)', 'Медкөзөмөл (80с)', 'Medical Timer 80s'), icon: Stethoscope, adminOnly: true },
    { id: 'video_analytics', label: tr('Видеоаналитика', 'Видеоаналитика', 'Video Analytics'), icon: Film }
  ];

  const tournamentManagementItems = allTournamentManagementItems.filter(
    (item) => isAdmin || !item.adminOnly
  );

  // 3. Unified Administration & Infrastructure Dropdown Group (Full control for Admin, Archive/Read-only Cabinet for Participant)
  const adminSystemItems: NavItemConfig[] = isAdmin
    ? [
        { id: 'admin', label: tr('Управление событиями и Архив', 'Мелдештерди башкаруу жана Архив', 'Manage Events & Archive'), icon: ShieldCheck },
        { id: 'acquiring', label: tr('Эквайринг и взносы', 'Төлөмдөр жана взностор', 'Acquiring & Fees'), icon: CreditCard },
        { id: 'exports', label: tr('Экспорт протоколов', 'Протоколдорду экспорттоо', 'Official Exports'), icon: Stamp },
        { id: 'lan', label: tr('Локальный LAN-сервер', 'Локалдык LAN-сервер', 'Venue LAN Hub'), icon: Wifi },
        { id: 'schema', label: tr('База данных SQL', 'SQL маалымат базасы', 'PostgreSQL Schema'), icon: Database }
      ]
    : [
        { id: 'admin', label: tr('Кабинет участника и Архив', 'Катышуучу кабинети жана Архив', 'Participant Cabinet & Archive'), icon: UserCheck },
        { id: 'acquiring', label: tr('Оплата взносов клуба', 'Клуб взносторун төлөө', 'Club Fee Payments'), icon: CreditCard }
      ];

  // 4. Secondary Info & Support Links (Hidden inside compact dropdown)
  const secondaryInfoItems: NavItemConfig[] = [
    { id: 'about', label: tr('О платформе', 'Платформа жөнүндө', 'About Platform'), icon: Briefcase },
    { id: 'help', label: tr('Помощь и FAQ', 'Жардам жана FAQ', 'Help & FAQ'), icon: HelpCircle }
  ];

  const isEventSubRoute = [
    'tournaments',
    'tournament_details',
    'event_info',
    'event_categories_prices',
    'event_brackets',
    'event_results',
    'event_medals',
    'event_live_scoring'
  ].includes(activeTab);

  const isTournamentMgmtActive = tournamentManagementItems.some((i) => i.id === activeTab);
  const isAdminSystemActive = adminSystemItems.some((i) => i.id === activeTab);
  const isSecondaryInfoActive = secondaryInfoItems.some((i) => i.id === activeTab);

  const toggleGroup = (groupKey: 'tournament_mgmt' | 'admin_system' | 'info_links') => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenGroup(groupKey);
      return;
    }
    setOpenGroup((prev) => (prev === groupKey ? null : groupKey));
  };

  const handleSelectTab = (id: NavTabId) => {
    onTabChange(id);
    if (isMobileOpen) onToggleMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Collapsible Sidebar (Full-width touch drawer on mobile/tablet, collapsible on desktop) */}
      <aside
        className={`fixed lg:sticky top-0 h-[100dvh] z-40 flex flex-col bg-white border-r border-slate-200/90 shadow-xl lg:shadow-2xs transition-all duration-200 ease-in-out font-sans shrink-0 select-none ${
          isCollapsed ? 'w-72 max-w-[85vw] lg:w-[68px]' : 'w-72 max-w-[85vw] lg:w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Active Context Pill & Collapse Toggle */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
          {!isCollapsed || isMobileOpen ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg bg-gradient-to-br from-sky-600 to-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Sparkles className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs lg:text-[11px] font-bold uppercase tracking-wider text-slate-800 truncate">
                  {tr('Навигация', 'Чабыттоо', 'Navigation')}
                </div>
                <div className="text-[11px] lg:text-[10px] text-slate-400 truncate max-w-[160px] lg:max-w-[135px]" title={selectedTournament?.title}>
                  {selectedTournament?.title || 'Uventex Sport OS'}
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="mx-auto p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
              title={tr('Развернуть боковое меню', 'Менюну жаюу', 'Expand sidebar')}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title={tr('Свернуть меню', 'Менюну жыйноо', 'Collapse sidebar')}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button (44x44px touch target) */}
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label={tr('Закрыть меню', 'Менюну жабуу', 'Close menu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 no-scrollbar">
          {/* SECTION 1: ESSENTIAL PRIMARY LINKS */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {tr('Основное', 'Негизги', 'Main')}
              </div>
            )}

            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id || (item.id === 'tournaments' && isEventSubRoute);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  title={item.label}
                  className={`w-full min-h-[44px] lg:min-h-[38px] flex items-center gap-2.5 rounded-xl text-left transition-all cursor-pointer group relative ${
                    isCollapsed && !isMobileOpen ? 'justify-center p-2.5' : 'px-3 py-2.5 lg:py-2'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 font-bold ring-1 ring-emerald-200/90 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-600" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />

                  {(!isCollapsed || isMobileOpen) && (
                    <>
                      <span className="text-xs truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[9px] font-extrabold tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* SECTION 2: GROUPED DROPDOWN — TOURNAMENT MANAGEMENT / PARTICIPANT CABINET */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('tournament_mgmt')}
              title={
                isAdmin
                  ? tr('Управление турнирами', 'Мелдештерди башкаруу', 'Tournament Management')
                  : tr('Кабинет участника и трансляции', 'Катышуучу кабинети жана эфир', 'Member Cabinet & Streams')
              }
              className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                isCollapsed && !isMobileOpen ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } ${
                isTournamentMgmtActive
                  ? 'bg-sky-50/90 text-sky-900 font-bold ring-1 ring-sky-200/80'
                  : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Trophy
                  className={`w-4 h-4 shrink-0 ${
                    isTournamentMgmtActive ? 'text-sky-600' : 'text-slate-500'
                  }`}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-xs truncate">
                    {isAdmin
                      ? tr('Управление турниром', 'Мелдешти башкаруу', 'Tournament Control')
                      : tr('Регистрация и Трансляции', 'Каттоо жана Эфир', 'Registration & Streams')}
                  </span>
                )}
              </span>

              {(!isCollapsed || isMobileOpen) && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    openGroup === 'tournament_mgmt' || isTournamentMgmtActive ? 'rotate-180 text-sky-600' : ''
                  }`}
                />
              )}
            </button>

            {(!isCollapsed || isMobileOpen) && (openGroup === 'tournament_mgmt' || isTournamentMgmtActive) && (
              <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4 animate-fadeIn">
                {tournamentManagementItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActive = activeTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectTab(sub.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-sky-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: GROUPED DROPDOWN — ADMINISTRATION & ARCHIVE */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('admin_system')}
              title={
                isAdmin
                  ? tr('Администрирование (Полный доступ)', 'Администрациялоо (Толук укук)', 'Administration (Full Access)')
                  : tr('Кабинет учреждения и Архив', 'Мекеме кабинети жана Архив', 'Institution Cabinet & Archive')
              }
              className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                isCollapsed && !isMobileOpen ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } ${
                isAdminSystemActive
                  ? 'bg-indigo-50/90 text-indigo-900 font-bold ring-1 ring-indigo-200/80'
                  : 'text-slate-700 hover:bg-slate-100/80 font-semibold'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Sliders
                  className={`w-4 h-4 shrink-0 ${
                    isAdminSystemActive ? 'text-indigo-600' : 'text-slate-500'
                  }`}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-xs truncate">
                    {isAdmin
                      ? tr('Администрирование', 'Администрация', 'Administration')
                      : tr('Кабинет и Архив', 'Кабинет жана Архив', 'Cabinet & Archive')}
                  </span>
                )}
              </span>

              {(!isCollapsed || isMobileOpen) && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    openGroup === 'admin_system' || isAdminSystemActive ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              )}
            </button>

            {(!isCollapsed || isMobileOpen) && (openGroup === 'admin_system' || isAdminSystemActive) && (
              <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4 animate-fadeIn">
                {adminSystemItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActive = activeTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectTab(sub.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: SECONDARY LINKS DROPDOWN (Help, About, Privacy) */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('info_links')}
              title={tr('Справка и Документы', 'Маалымат жана Жардам', 'Info & Support')}
              className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                isCollapsed && !isMobileOpen ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } ${
                isSecondaryInfoActive
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-medium'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <HelpCircle className="w-4 h-4 shrink-0 text-slate-400" />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-xs truncate">
                    {tr('Справка и О нас', 'Маалымат жана Жардам', 'Help & Info')}
                  </span>
                )}
              </span>

              {(!isCollapsed || isMobileOpen) && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    openGroup === 'info_links' || isSecondaryInfoActive ? 'rotate-180 text-slate-700' : ''
                  }`}
                />
              )}
            </button>

            {(!isCollapsed || isMobileOpen) && (openGroup === 'info_links' || isSecondaryInfoActive) && (
              <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4 animate-fadeIn">
                {secondaryInfoItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActive = activeTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectTab(sub.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => onOpenPrivacyModal && onOpenPrivacyModal()}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {tr('Конфиденциальность', 'Купуялуулук саясаты', 'Privacy & Cookies')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Compact Collapse Toggle Footer */}
        <div className="p-2.5 border-t border-slate-100 shrink-0 bg-slate-50/60">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center gap-2 rounded-xl py-2 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title={isCollapsed ? tr('Развернуть меню', 'Менюну жаюу', 'Expand menu') : tr('Свернуть меню', 'Менюну жыйноо', 'Collapse menu')}
          >
            {!isCollapsed && (
              <span className="truncate">
                {tr('Компактный режим', 'Чакан режим', 'Compact Mode')}
              </span>
            )}
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
