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
  Lock,
  Layers,
  ChevronDown,
  GripVertical,
  ListChecks,
  Workflow,
  Check
} from 'lucide-react';
import { hashForTab, isPlainClick, manageHash } from '../utils/routes';
import { WORKFLOW_STEPS, stepText } from '../utils/workflow';
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
  | 'event_setup'
  | 'plan'
  | 'manage';

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
  /** Coach/athlete tapped an organizer item: they see it, but it is closed for them. */
  onLockedTab?: (label: string) => void;
  /** Inside the tournament workflow: the menu shows its numbered stages and the current one. */
  workflow?: { eventId: string; title: string; step: number; done: Record<number, boolean>; onStep: (n: number) => void };
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  /** Shown, but closed for this role: a tap only explains why. */
  locked?: boolean;
}

interface NavSection {
  key: string;
  title?: string;
  items: NavItem[];
}

// Per-browser menu preferences: which sections are closed, and the organizer's own order of items.
const COLLAPSED_KEY = 'tatami_menu_collapsed';
const ORDER_KEY = 'tatami_menu_order';
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the choice simply is not remembered */
  }
}

/** Items in the saved order; items the saved order does not know keep their place at the end. */
function applyOrder(items: NavItem[], order: string[] | undefined): NavItem[] {
  if (!order?.length) return items;
  const pos = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return items.map((item, i) => ({ item, i })).sort((a, b) => pos(a.item.id) - pos(b.item.id) || a.i - b.i).map((x) => x.item);
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
  onOpenPrivacyModal,
  onLockedTab, workflow}) => {
  const appContext = useApp();
  const language = propLanguage || appContext.language;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const tr = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);

  const isAdmin = role === 'admin';
  // Organizer: runs their own tournaments (invited by the site owner)
  const isOrganizer = role === 'organizer';
  const isSignedIn = role !== 'guest';
  // Coaches and athletes see the organizer menu too (so they know what the site can do), but it stays closed for them.
  const seesLockedOrganizer = role === 'club_coach' || role === 'athlete';

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
        isSignedIn && !isAdmin && !isOrganizer
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
      // The organizer runs everything from «Управление турниром» (stages 1–6), so these are for referees, secretaries and doctors
      items: isAdmin || isOrganizer
        ? []
        : [
            { id: 'manage' as NavTabId, label: tr('Управление турниром', 'Мелдешти башкаруу', 'Run the tournament'), icon: Workflow },
            { id: 'scoreboard' as NavTabId, label: tr('Татами: бои и пульты', 'Татами: беттештер', 'Tatami: bouts & consoles'), icon: Tv },
            { id: 'participants' as NavTabId, label: tr('Взвешивание и допуск', 'Таразалоо жана уруксат', 'Weigh-in & clearance'), icon: Scale }
          ]
    },
    {
      key: 'organizer',
      title: tr('Организатор', 'Уюштуруучу', 'Organizer'),
      items: seesLockedOrganizer
        ? // Coaches and athletes: one locked line instead of the whole organizer list (keeps the menu short)
          [
            {
              id: 'admin' as NavTabId,
              label: tr('Для организаторов', 'Уюштуруучулар үчүн', 'For organizers'),
              icon: ShieldCheck,
              locked: true
            }
          ]
        : isAdmin
          ? [
              // One entry point for running a tournament; the stages (categories, weigh-in, draw, bouts, documents) live inside it
              { id: 'manage' as NavTabId, label: tr('Управление турниром', 'Мелдешти башкаруу', 'Run the tournament'), icon: Workflow },
              { id: 'admin' as NavTabId, label: tr('Турниры и пользователи', 'Мелдештер жана колдонуучулар', 'Events & users'), icon: ShieldCheck },
              { id: 'athletes' as NavTabId, label: tr('Мои спортсмены', 'Менин спортчуларым', 'My athletes'), icon: Users },
              { id: 'acquiring' as NavTabId, label: tr('Оплата взносов', 'Төгүмдөрдү төлөө', 'Fee payments'), icon: CreditCard },
              { id: 'screens' as NavTabId, label: tr('Экраны и QR-коды', 'Экрандар жана QR', 'Screens & QR'), icon: QrCode },
              { id: 'lan' as NavTabId, label: tr('Работа без интернета', 'Интернетсиз режим', 'Offline (LAN)'), icon: Wifi }
            ]
          : isOrganizer
            ? [
                { id: 'manage' as NavTabId, label: tr('Управление турниром', 'Мелдешти башкаруу', 'Run the tournament'), icon: Workflow },
                { id: 'admin' as NavTabId, label: tr('Мои турниры', 'Менин мелдештерим', 'My tournaments'), icon: ShieldCheck },
                { id: 'athletes' as NavTabId, label: tr('Мои спортсмены', 'Менин спортчуларым', 'My athletes'), icon: Users }
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
  // Sections with a title open and close with the arrow (remembered in this browser).
  const [closedSections, setClosedSections] = useState<string[]>(() => readJson<string[]>(COLLAPSED_KEY, []));
  const toggleSection = (key: string) => {
    const next = closedSections.includes(key) ? closedSections.filter((k) => k !== key) : [...closedSections, key];
    setClosedSections(next);
    writeJson(COLLAPSED_KEY, next);
  };

  // The organizer may drag items with the mouse to change their order inside a section.
  const canReorder = isAdmin;
  const [menuOrder, setMenuOrder] = useState<Record<string, string[]>>(() => readJson<Record<string, string[]>>(ORDER_KEY, {}));
  const [dragging, setDragging] = useState<{ section: string; id: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ section: string; id: string; after: boolean } | null>(null);

  // «Управление турниром» always stays the first line of its section, whatever order was saved earlier
  const pinFirst = (items: NavItem[]) => [...items.filter((i) => i.id === 'manage'), ...items.filter((i) => i.id !== 'manage')];
  const sections = rawSections
    .map((s) => ({ ...s, items: pinFirst(applyOrder(s.items.filter((i) => i.locked || canAccess(i.id, role)), canReorder ? menuOrder[s.key] : undefined)) }))
    .filter((s) => s.items.length > 0);

  const moveItem = (sectionKey: string, fromId: string, toId: string, after: boolean) => {
    const section = sections.find((x) => x.key === sectionKey);
    if (!section || fromId === toId) return;
    const ids = section.items.map((i) => i.id as string).filter((id) => id !== fromId);
    const at = ids.indexOf(toId);
    if (at === -1) return;
    ids.splice(after ? at + 1 : at, 0, fromId);
    const next = { ...menuOrder, [sectionKey]: ids };
    setMenuOrder(next);
    writeJson(ORDER_KEY, next);
  };
  const resetOrder = () => {
    setMenuOrder({});
    writeJson(ORDER_KEY, {});
  };
  const hasCustomOrder = canReorder && Object.keys(menuOrder).length > 0;

  // Phone / tablet: press and hold an item, then move the finger. Items move only inside their own section,
  // so «Категории и жеребьёвка» never lands among the referee items.
  const touchDrag = React.useRef<{
    section: string;
    id: string;
    startX: number;
    startY: number;
    timer: ReturnType<typeof setTimeout> | null;
    active: boolean;
    target: { section: string; id: string; after: boolean } | null;
  } | null>(null);
  const suppressClick = React.useRef(false);
  const lastTouch = React.useRef(0);
  const moveItemRef = React.useRef(moveItem);
  moveItemRef.current = moveItem;

  const endTouchDrag = () => {
    const t = touchDrag.current;
    if (t?.timer) clearTimeout(t.timer);
    touchDrag.current = null;
    setDragging(null);
    setDropTarget(null);
    // The click that follows a long press is skipped; if none comes, normal taps work again shortly.
    if (suppressClick.current) setTimeout(() => (suppressClick.current = false), 400);
  };

  React.useEffect(() => {
    if (!canReorder) return;
    const onMove = (e: TouchEvent) => {
      const t = touchDrag.current;
      if (!t) return;
      const touch = e.touches[0];
      if (!t.active) {
        // The finger moved before the hold finished: this is a scroll, not a drag.
        if (Math.abs(touch.clientX - t.startX) > 8 || Math.abs(touch.clientY - t.startY) > 8) endTouchDrag();
        return;
      }
      e.preventDefault(); // keep the menu from scrolling while an item is carried
      const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>('[data-menu-id]');
      if (!el || el.dataset.menuSection !== t.section || el.dataset.menuId === t.id) {
        t.target = null;
        setDropTarget(null);
        return;
      }
      const box = el.getBoundingClientRect();
      const target = { section: t.section, id: el.dataset.menuId!, after: touch.clientY > box.top + box.height / 2 };
      t.target = target;
      setDropTarget(target);
    };
    const onEnd = () => {
      const t = touchDrag.current;
      if (t?.active && t.target) moveItemRef.current(t.section, t.id, t.target.id, t.target.after);
      endTouchDrag();
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', endTouchDrag);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', endTouchDrag);
    };
  }, [canReorder]);

  const startTouchDrag = (sectionKey: string, id: string, e: React.TouchEvent) => {
    if (!canReorder || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const state = { section: sectionKey, id, startX: touch.clientX, startY: touch.clientY, timer: null as ReturnType<typeof setTimeout> | null, active: false, target: null };
    state.timer = setTimeout(() => {
      state.active = true;
      suppressClick.current = true; // the finger lifts on the item: do not open the page
      setDragging({ section: sectionKey, id });
      try {
        navigator.vibrate?.(25);
      } catch {
        /* no vibration on this device */
      }
    }, 450);
    touchDrag.current = state;
  };

  const compact = isCollapsed && !isMobileOpen;

  const showLocked = (item: NavItem) => {
    onLockedTab?.(item.label);
    if (isMobileOpen) onToggleMobile();
  };

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
          {/* Tournament workflow: the menu turns into the list of numbered stages, current one highlighted */}
          {workflow && activeTab === 'manage' && (
            <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)]/40 p-1.5">
              {!compact && (
                <div className="px-2 pt-1 pb-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">{tr('Управление турниром', 'Мелдешти башкаруу', 'Run the tournament')}</div>
                  <div className="text-sm font-semibold text-[var(--app-text-primary)] truncate" translate="no" title={workflow.title}>{workflow.title}</div>
                </div>
              )}
              <ol className="space-y-0.5">
                {WORKFLOW_STEPS.map((st) => {
                  const current = st.n === workflow.step;
                  const done = workflow.done[st.n];
                  return (
                    <li key={st.n}>
                      <a
                        href={manageHash(workflow.eventId, st.n)}
                        aria-current={current ? 'step' : undefined}
                        title={stepText(language, st.label)}
                        onClick={(e) => {
                          if (!isPlainClick(e)) return; // Ctrl/Cmd-click or «Open in new tab»
                          e.preventDefault();
                          workflow.onStep(st.n);
                          if (isMobileOpen) onToggleMobile();
                        }}
                        className={`flex items-center gap-2.5 rounded-lg ${compact ? 'justify-center p-2' : 'px-2 py-1.5 min-h-[38px]'} ${
                          current ? 'bg-[var(--accent)] text-white font-semibold' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] hover:text-[var(--app-text-primary)]'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            current ? 'bg-white text-[var(--accent)]' : done ? 'bg-emerald-600 text-white' : 'bg-[var(--app-surface-subtle)] text-[var(--app-text-primary)]'
                          }`}
                        >
                          {done && !current ? <Check className="w-3.5 h-3.5" /> : st.n}
                        </span>
                        {!compact && <span className="text-sm truncate">{stepText(language, st.label)}</span>}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {sections.map((section) => (
            <div key={section.key}>
              {section.title && !compact && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  aria-expanded={!closedSections.includes(section.key)}
                  className="w-full flex items-center gap-1.5 px-3 pb-1.5 pt-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer"
                >
                  <span className="flex-1 text-left">{section.title}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${closedSections.includes(section.key) ? '-rotate-90' : ''}`} aria-hidden="true" />
                </button>
              )}
              {section.title && compact && <div className="mx-3 mb-2 border-t border-[var(--app-border)]" />}
              {!(section.title && !compact && closedSections.includes(section.key)) && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.id);
                  if (item.locked) {
                    return (
                      <button
                        key={`${section.key}-${item.id}`}
                        type="button"
                        onClick={() => showLocked(item)}
                        aria-disabled="true"
                        title={`${item.label} — ${tr('только для организатора', 'уюштуруучу үчүн гана', 'organizer only')}`}
                        className={`w-full flex items-center gap-3 rounded-lg text-left cursor-not-allowed text-[var(--app-text-muted)] opacity-60 hover:opacity-80 ${
                          compact ? 'justify-center p-2.5' : 'px-3 py-2 min-h-[40px]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        {!compact && <span className="text-sm truncate flex-1">{item.label}</span>}
                        {!compact && <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  }
                  return (
                    <a
                      key={`${section.key}-${item.id}`}
                      href={hashForTab(item.id)}
                      data-menu-id={item.id}
                      data-menu-section={section.key}
                      onTouchStart={(e) => {
                        lastTouch.current = Date.now();
                        startTouchDrag(section.key, item.id, e);
                      }}
                      onContextMenu={(e) => {
                        // Phone: a long press moves the item. Mouse right-click keeps the browser menu («Open in new tab»).
                        if (canReorder && Date.now() - lastTouch.current < 1500) e.preventDefault();
                      }}
                      style={canReorder ? { WebkitTouchCallout: 'none' } : undefined}
                      draggable={canReorder && !compact}
                      onDragStart={(e) => {
                        if (!canReorder) return;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', item.id);
                        setDragging({ section: section.key, id: item.id });
                      }}
                      onDragOver={(e) => {
                        if (!dragging || dragging.section !== section.key || dragging.id === item.id) return;
                        e.preventDefault();
                        const box = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > box.top + box.height / 2;
                        if (dropTarget?.id !== item.id || dropTarget.after !== after) setDropTarget({ section: section.key, id: item.id, after });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragging && dropTarget) moveItem(section.key, dragging.id, dropTarget.id, dropTarget.after);
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      onClick={(e) => {
                        if (suppressClick.current) {
                          suppressClick.current = false;
                          e.preventDefault();
                          return;
                        }
                        if (!isPlainClick(e)) return; // Ctrl/Cmd-click opens a new tab
                        e.preventDefault();
                        select(item.id);
                      }}
                      title={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`group w-full flex items-center gap-3 rounded-lg text-left transition-colors cursor-pointer ${
                        compact ? 'justify-center p-2.5' : 'px-3 py-2 min-h-[40px]'
                      } ${dragging?.id === item.id && dragging.section === section.key ? 'opacity-40' : ''} ${
                        dropTarget?.id === item.id && dropTarget.section === section.key
                          ? dropTarget.after
                            ? 'shadow-[inset_0_-2px_0_var(--accent)]'
                            : 'shadow-[inset_0_2px_0_var(--accent)]'
                          : ''
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
                      {canReorder && !compact && (
                        <GripVertical
                          className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-60 cursor-grab"
                          aria-label={tr('Перетащите, чтобы поменять место', 'Ордун алмаштыруу үчүн сүйрөңүз', 'Drag to move')}
                        />
                      )}
                    </a>
                  );
                })}
              </div>
              )}
            </div>
          ))}
          {hasCustomOrder && !compact && (
            <button type="button" onClick={resetOrder} className="px-3 text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer">
              {tr('Вернуть обычный порядок меню', 'Менюнун кадимки тартибин кайтаруу', 'Restore the default menu order')}
            </button>
          )}
        </nav>

        {!compact && onOpenPrivacyModal && (
          <div className="px-5 py-3 border-t border-[var(--app-border)] text-xs">
            <button onClick={onOpenPrivacyModal} className="text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer">
              {tr('Правовая информация', 'Укуктук маалымат', 'Legal information')}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
