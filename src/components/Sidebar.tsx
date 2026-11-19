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
  Stethoscope,
  CreditCard,
  Stamp,
  Video,
  HelpCircle,
  Target,
  LayoutGrid,
  Info,
  Trophy,
  UserCircle2,
  ClipboardList,
  Scale,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  QrCode,
  Layers
} from 'lucide-react';
import { hashForTab, isPlainClick } from '../utils/routes';
import { canAccess, type AccessRole } from '../utils/access';
import { TournamentRules, UserRole, Tournament } from '../types/schema';
import { Language } from '../utils/translations';
import { useApp } from '../context/AppContext';
import { BrandMark, BrandWordmark } from './BrandLogo';

export type NavTabId =
  | 'tournaments'
  | 'tournament_details'
  | 'studios'
  | 'virtual_studios'
  | 'rankings'
  | 'about'
  | 'help'
  | 'coach'
  | 'athletes'
  | 'acquiring'
  | 'scoreboard'
  | 'referee_vr'
  | 'doctor'
  | 'protocols'
  | 'exports'
  | 'bracket'
  | 'schedule'
  | 'lan'
  | 'participants'
  | 'admin'
  | 'registration'
  | 'screens'
  | 'event_setup';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: NavTabId) => void;
  tournamentRules: TournamentRules;
  onRulesChange: (rules: TournamentRules) => void;
  currentUserRole: AccessRole;
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

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  key: string;
  title?: string;
  items: NavItem[];
}

const EVENT_SUB_ROUTES = [
  'tournaments',
  'tournament_details',
  'event_info',
  'event_categories_prices',
  'event_brackets',
  'event_results',
  'event_medals',
  'event_live_scoring'
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUserRole: role,
  isMobileOpen,
  onToggleMobile,
  language: propLanguage,
  onOpenPrivacyModal
}) => {
  const appContext = useApp();
  const language = propLanguage || appContext.language;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const tr = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);

  const isAdmin = role === 'admin';
  const isSignedIn = role !== 'guest';

  const rawSections: NavSection[] = [
    {
      key: 'public',
      items: [
        { id: 'tournaments' as NavTabId, label: tr('Турниры', 'Мелдештер', 'Tournaments'), icon: LayoutGrid },
        { id: 'virtual_studios' as NavTabId, label: tr('Идут бои', 'Беттештер жүрүүдө', 'Live now'), icon: Video, badge: 'LIVE' },
        { id: 'rankings' as NavTabId, label: tr('Рейтинги', 'Рейтингдер', 'Rankings'), icon: Trophy },
        { id: 'studios' as NavTabId, label: tr('Клубы', 'Клубдар', 'Clubs'), icon: Target }
      ]
    },
    {
      key: 'member',
      title: tr('Мой кабинет', 'Менин кабинетим', 'My account'),
      items:
        isSignedIn && !isAdmin
          ? [
              { id: 'admin' as NavTabId, label: tr('Личный кабинет', 'Жеке кабинет', 'My account'), icon: UserCircle2 },
              { id: 'athletes' as NavTabId, label: tr('Мои спортсмены', 'Менин спортчуларым', 'My athletes'), icon: Users },
              { id: 'registration' as NavTabId, label: tr('Подать заявку', 'Табыштама берүү', 'Enter a tournament'), icon: ClipboardList },
              { id: 'acquiring' as NavTabId, label: tr('Мои заявки и оплата', 'Өтүнмөлөрүм жана төлөм', 'My entries & fees'), icon: CreditCard }
            ]
          : []
    },
    {
      key: 'officials',
      title: tr('Судейство', 'Калыстык', 'Officiating'),
      items: [
        { id: 'scoreboard' as NavTabId, label: tr('Татами: бои и пульты', 'Татами: беттештер', 'Tatami: bouts & consoles'), icon: Tv },
        { id: 'participants' as NavTabId, label: tr('Взвешивание и допуск', 'Таразалоо жана уруксат', 'Weigh-in & clearance'), icon: Scale },
        // Chief referee runs the draw too (admins have it under «Организатор»)
        ...(isAdmin ? [] : [{ id: 'event_setup' as NavTabId, label: tr('Категории и жеребьёвка', 'Категориялар жана чүчүкулак', 'Categories & draw'), icon: Layers }])
      ]
    },
    {
      key: 'organizer',
      title: tr('Организатор', 'Уюштуруучу', 'Organizer'),
      items: isAdmin
        ? [
            { id: 'admin' as NavTabId, label: tr('Турниры и пользователи', 'Мелдештер жана колдонуучулар', 'Events & users'), icon: ShieldCheck },
            { id: 'event_setup' as NavTabId, label: tr('Категории и жеребьёвка', 'Категориялар жана чүчүкулак', 'Categories & draw'), icon: Layers },
            { id: 'screens' as NavTabId, label: tr('Экраны и QR-коды', 'Экрандар жана QR', 'Screens & QR'), icon: QrCode },
            { id: 'acquiring' as NavTabId, label: tr('Взносы', 'Төгүмдөр', 'Entry fees'), icon: CreditCard },
            { id: 'exports' as NavTabId, label: tr('Документы и печать', 'Документтер жана басып чыгаруу', 'Documents & printing'), icon: Stamp },
            { id: 'lan' as NavTabId, label: tr('Работа без интернета', 'Интернетсиз режим', 'Offline (LAN)'), icon: Wifi }
          ]
        : []
    },
    {
      key: 'help',
      title: tr('Помощь', 'Жардам', 'Help'),
      items: [
        { id: 'help' as NavTabId, label: tr('Инструкция', 'Нускама', 'How it works'), icon: HelpCircle },
        { id: 'about' as NavTabId, label: tr('О платформе', 'Платформа жөнүндө', 'About'), icon: Info }
      ]
    }
  ];
  const sections = rawSections
    .map((s) => ({ ...s, items: s.items.filter((i) => canAccess(i.id, role)) }))
    .filter((s) => s.items.length > 0);

  const compact = isCollapsed && !isMobileOpen;

  const select = (id: NavTabId) => {
    onTabChange(id);
    if (isMobileOpen) onToggleMobile();
  };

  const isActive = (id: NavTabId) => activeTab === id || (id === 'tournaments' && EVENT_SUB_ROUTES.includes(activeTab));

  return (
    <>
      {isMobileOpen && <div onClick={onToggleMobile} className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-hidden="true" />}

      <aside
        className={`theme-keep fixed lg:sticky top-0 h-[100dvh] z-40 flex flex-col bg-[var(--app-surface)] border-r border-[var(--app-border)] transition-all duration-200 shrink-0 select-none ${
          compact ? 'w-72 lg:w-[68px]' : 'w-72 max-w-[85vw] lg:w-60'
        } ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
        aria-label={tr('Главное меню', 'Негизги меню', 'Main menu')}
      >
        {/* Brand */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-[var(--app-border)] shrink-0">
          {compact ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="mx-auto p-2 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
              title={tr('Развернуть меню', 'Менюну жаюу', 'Expand menu')}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button onClick={() => select('tournaments')} className="flex items-center gap-2 cursor-pointer min-w-0">
                <BrandMark className="w-7 h-7 shrink-0" />
                <BrandWordmark className="text-lg text-[var(--app-text-primary)]" />
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 rounded-lg text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
                title={tr('Свернуть меню', 'Менюну жыйноо', 'Collapse menu')}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleMobile}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
                aria-label={tr('Закрыть меню', 'Менюну жабуу', 'Close menu')}
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {sections.map((section) => (
            <div key={section.key}>
              {section.title && !compact && (
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                  {section.title}
                </div>
              )}
              {section.title && compact && <div className="mx-3 mb-2 border-t border-[var(--app-border)]" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.id);
                  return (
                    <a
                      key={`${section.key}-${item.id}`}
                      href={hashForTab(item.id)}
                      onClick={(e) => {
                        if (!isPlainClick(e)) return; // Ctrl/Cmd-click opens a new tab
                        e.preventDefault();
                        select(item.id);
                      }}
                      title={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 rounded-lg text-left transition-colors cursor-pointer ${
                        compact ? 'justify-center p-2.5' : 'px-3 py-2 min-h-[40px]'
                      } ${
                        active
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                          : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      {!compact && <span className="text-sm truncate flex-1">{item.label}</span>}
                      {!compact && item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">{item.badge}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!compact && onOpenPrivacyModal && (
          <div className="px-5 py-3 border-t border-[var(--app-border)] text-xs">
            <button onClick={onOpenPrivacyModal} className="text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer">
              {tr('Политика конфиденциальности', 'Купуялуулук саясаты', 'Privacy policy')}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
