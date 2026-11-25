import React, { useState } from 'react';
import { 
  Video,
  ClipboardList,
  QrCode,
  LayoutGrid,
  UserCircle2,
  Database, 
  Tv, 
  Trophy, 
  Layers, 
  Users, 
  FileCode, 
  Scale, 
  Award,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Download,
  ShieldCheck,
  UserPlus,
  Server,
  ChevronRight,
  ArrowLeft,
  Menu,
  Bot,
  Stethoscope,
  Film,
  Moon,
  Sun,
  Type,
  Languages,
  Bell,
  CreditCard,
  Stamp,
  LogIn,
  Lock,
  X,
  GraduationCap,
  MessageSquare,
  ChevronDown,
  LogOut,
  BadgeCheck,
  Trash2,
  Archive
} from 'lucide-react';
import { isTournamentDateExpired, TournamentEventsManager } from './components/TournamentEventsManager';
import { Sidebar } from './components/Sidebar';

import { TournamentShowcase } from './components/TournamentShowcase';
import { DEMO_EVENTS, EventItem, EventActionType } from './data/eventsData';
import { SenseiAiChatbot } from './components/SenseiAiChatbot';
import { AboutUsView, HelpFaqView } from './components/InfoPages';
import { RankingsPanel, ClubsPanel, LiveNowPanel } from './components/CommunityViews';
import { MyEntriesPanel, FeesPanel } from './components/EntriesPanels';
import { AthletesPanel } from './components/AthletesPanel';
import { AuthModal, PrivacyPolicyModal } from './components/AuthAndPrivacyModals';
import { LegalPage, legalHash } from './components/LegalPage';
import { SAMPLE_NOTIFICATIONS, playNotificationSound } from './data/sampleAcquiringAndExports';
import { generateProtectedWkfCategoryBouts } from './utils/wkfBracketSeeding';
import { Language } from './utils/translations';

import { 
  SAMPLE_BOUTS, 
  SAMPLE_PARTICIPANTS, 
  SAMPLE_TATAMIS, 
  SAMPLE_CLUBS,
  SAMPLE_AGE_CATEGORIES,
  SAMPLE_WEIGHT_CATEGORIES,
  SAMPLE_TOURNAMENT_CATEGORIES,
  SAMPLE_REFEREE_PROTOCOLS,
  SAMPLE_TOURNAMENTS,
  durationForCategory,
  belongsToEvent
} from './data/sampleTournamentData';
import { Bout, Participant, TournamentRules, RefereeProtocol, UserRole, EventCategory, TournamentCategory, TournamentRegistrationConfig, Tournament, AppNotification, AuthenticatedUserProfile } from './types/schema';

import { AppProvider, useApp } from './context/AppContext';
import { useGlobalDomTranslator, trLang } from './utils/globalDomTranslator';
import { useServerSyncedState } from './utils/useServerSyncedState';
import { canAccess, ROLE_LABELS, roleLabel, type AccessRole } from './utils/access';
import { applyBoutResult } from './utils/bracketProgression';
import { AccessGate } from './components/AccessGate';
import { BrandMark, BrandWordmark } from './components/BrandLogo';
import { UsersRolesPanel } from './components/UsersRolesPanel';
import { InviteLinksPanel } from './components/InviteLinksPanel';
import { PublicBracketsView, PublicResultsView, PublicLiveView, PublicCategoriesView } from './components/PublicEventViews';
import { BoutConsole } from './components/BoutConsole';
import { EntryForm, QuickCategories } from './components/EntryForm';
import { WorkflowHeader, WorkflowFooter, EventBasicsForm } from './components/TournamentWorkflow';
import { workflowStatus } from './utils/workflow';
import { EventSetupPanel } from './components/EventSetupPanel';
import { activeEntries, categoryName } from './utils/eventCategories';
import { getDeviceKey, setDeviceKey } from './utils/liveStream';
import { startServerClock } from './utils/serverClock';
import { hashForTab, tabFromHash, isEventTab, isPlainClick, manageHash } from './utils/routes';
import { pickCurrentTournament, localToday, readRememberedTournament, rememberTournament } from './utils/currentTournament';
import { eventTitle } from './utils/eventI18n';
import { TatamiDisplay, CallRoomDisplay, TatamiControl, upcomingOf } from './components/TatamiScreens';
import { MyAccountPanel } from './components/MyAccountPanel';
import { RoleGuide } from './components/RoleGuide';
import { PrintDocuments, parsePrintRequest } from './components/PrintDocuments';
import { DocumentsPanel } from './components/DocumentsPanel';
import { LaunchPanel } from './components/LaunchPanel';
import { TatamiOverview } from './components/TatamiOverview';
import { OfflinePanel } from './components/OfflinePanel';
import { AUTH_CACHE_KEY, readCachedUser, writeCachedUser } from './utils/authCache';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScreenSkeleton, EventPageSkeleton, EventHeaderSkeleton, TableSkeleton } from './components/Skeletons';
import { animate } from 'motion/mini';
import { fetchJson } from './utils/globalErrors';

// Heavy screens are loaded on demand so the first page opens faster.
const ParticipantsManager = React.lazy(() => import('./components/ParticipantsManager').then((m) => ({ default: m.ParticipantsManager })));
const TournamentInfoDetailView = React.lazy(() => import('./components/TournamentInfoDetailView').then((m) => ({ default: m.TournamentInfoDetailView })));
const TournamentDivisionsPricingView = React.lazy(() => import('./components/TournamentDivisionsPricingView').then((m) => ({ default: m.TournamentDivisionsPricingView })));

const ScreensQrPanel = React.lazy(() => import('./components/ScreensQrPanel').then((m) => ({ default: m.ScreensQrPanel })));
const TournamentPlan = React.lazy(() => import('./components/TournamentPlan').then((m) => ({ default: m.TournamentPlan })));

// A screen still downloading: its grey outline instead of «Загрузка…»
const ScreenLoader = () => <ScreenSkeleton />;

function AppContent() {
  const { 
    theme, 
    setTheme,
    toggleTheme, 
    language, 
    setLanguage,
    toggleLanguage, 
    isBoldReadability, 
    toggleBoldReadability, 
    t, 
    localizeTournament 
  } = useApp();

  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);

  // Start on the screen from the link (#live_scoring;id=...), so the address is not rewritten before tournaments load
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return tabFromHash(window.location.hash)?.tab || 'tournaments';
    } catch {
      return 'tournaments';
    }
  });
  // Tournament workflow (#manage;id=…;step=N): which numbered stage is open
  const [workflowStep, setWorkflowStep] = useState<number>(() => {
    try {
      return tabFromHash(window.location.hash)?.step || 1;
    } catch {
      return 1;
    }
  });
  const inStep = (n: number) => activeTab === 'manage' && workflowStep === n;
  // Moving to another screen: the content fades in softly (opacity only — nothing jumps, cheap on phones)
  const mainRef = React.useRef<HTMLElement>(null);
  const firstScreenRef = React.useRef(true);
  React.useEffect(() => {
    if (firstScreenRef.current) {
      firstScreenRef.current = false;
      return;
    }
    const el = mainRef.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const a = animate(el, { opacity: [0.35, 1] }, { duration: 0.24, ease: [0.16, 1, 0.3, 1] });
    return () => a.stop();
  }, [activeTab, workflowStep]);
  useGlobalDomTranslator(language, activeTab);
  const [tournaments, setTournaments] = useState<EventItem[]>([]);
  // Until the server list arrives, tournament pages show «loading», not the demo placeholder tournament
  const [tournamentsLoaded, setTournamentsLoaded] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament>(DEMO_EVENTS[0]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem>(DEMO_EVENTS[0]);
  const [tournamentRules, setTournamentRules] = useState<TournamentRules>('wkf');
  // Signed-in user: restored at once from the browser (no «please sign in» flash on reload), then confirmed by the server
  const [currentUser, setCurrentUserState] = useState<AuthenticatedUserProfile | null>(() => readCachedUser());
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => readCachedUser()?.role || 'club_coach');
  // Every change of the signed-in user is remembered in the browser for the next reload
  const setCurrentUser = React.useCallback((u: AuthenticatedUserProfile | null) => {
    setCurrentUserState(u);
    writeCachedUser(u);
  }, []);
  // What the visitor may see: 'guest' until signed in.
  const effectiveRole: AccessRole = currentUser ? currentUserRole : 'guest';
  // Organizer: runs only the tournaments they created; admin: all. The server checks the same rule.
  const isOrganizer = effectiveRole === 'organizer';
  const ownsEvent = (ev?: { ownerId?: string } | null) =>
    effectiveRole === 'admin' || (isOrganizer && !!ev && !!currentUser && ev.ownerId === currentUser.id);


  // Role switching is a UI preview only; real permissions are enforced by the server session.
  // Nobody can switch to Administrator without signing in as an administrator.
  const requestRoleChange = (role: UserRole) => {
    if (role === currentUserRole) return;
    if (currentUser?.role === 'admin' || role === 'club_coach' || role === currentUser?.role) {
      setCurrentUserRole(role);
      return;
    }
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
    setGlobalSystemToast(
      tr(
        'Чтобы получить эту роль, войдите в аккаунт с соответствующими правами.',
        'Бул ролду алуу үчүн тиешелүү укуктары бар аккаунтка кириңиз.',
        'Sign in with an account that has this role to use it.'
      )
    );
    setTimeout(() => setGlobalSystemToast(null), 4000);
  };

  // Old screens were merged into new ones: keep old links and bookmarks working
  React.useEffect(() => {
    const moved: Record<string, string> = {
      bracket: 'event_setup',
      schedule: 'scoreboard',
      referee_vr: 'scoreboard',
      protocols: 'exports',
      doctor: 'participants',
      tournament_details: 'event_info',
      engine: 'event_setup',
      categories: 'event_setup',
      accounting: 'acquiring',
      video_analytics: 'tournaments'
    };
    if (moved[activeTab]) setActiveTab(moved[activeTab]);
  }, [activeTab]);

  // The AI assistant is shown only when the server has an AI key
  const [aiAssistantEnabled, setAiAssistantEnabled] = React.useState(false);
  React.useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAiAssistantEnabled(!!d.aiEnabled))
      .catch(() => {});
  }, []);

  // One clock for every device (bout timers are timestamps)
  React.useEffect(() => startServerClock(), []);

  // Unified tournaments registry fetch on mount (and again from «Повторить» after a failure)
  const [tournamentsError, setTournamentsError] = useState(false);
  const loadTournaments = React.useCallback(() => {
    setTournamentsError(false);
    setTournamentsLoaded(false);
    fetchJson<{ events?: EventItem[] }>('/api/events')
      .then(({ ok, data }) => {
        if (!ok) {
          setTournamentsError(true);
          return;
        }
        // The server list is the truth: after «Подготовка к запуску» it can be empty.
        if (data?.events && Array.isArray(data.events)) {
          setTournaments(data.events);
          if (data.events.length > 0) {
            // A tournament named in the link wins over the default one
            const linked = tabFromHash(window.location.hash)?.eventId;
            // Otherwise the organizer's own choice, the tournament running today, or the nearest upcoming one
            const linkedEvent = linked ? data.events.find((e: EventItem) => e.id === linked) : undefined;
            const current = linkedEvent || pickCurrentTournament<EventItem>(data.events, localToday(), readRememberedTournament()) || data.events[0];
            setSelectedEvent(current);
            setSelectedTournament(current);
          }
        }
      })
      .finally(() => setTournamentsLoaded(true));
  }, []);
  React.useEffect(() => loadTournaments(), [loadTournaments]);

  // Verify and fetch authenticated session on mount
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          // The role from the server wins (it may have been changed by the admin)
          if (data.user.role) setCurrentUserRole(data.user.role);
        } else {
          // The session ended (signed out elsewhere, expired): forget the remembered profile
          setCurrentUser(null);
          setCurrentUserRole('club_coach');
        }
      })
      // No answer (no internet, server error): keep the remembered profile, the server still checks every action
      .catch(() => {});
    // Sign-in / sign-out in another tab of this browser
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_CACHE_KEY) return;
      const u = readCachedUser();
      setCurrentUserState(u);
      setCurrentUserRole(u?.role || 'club_coach');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setCurrentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    setCurrentUserRole('club_coach');
    setGlobalSystemToast('Сессия завершена. Вы вышли из учетной записи.');
    setTimeout(() => setGlobalSystemToast(null), 4000);
  };

  const handleAddTournament = async (newTournament: Tournament) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'organizer') {
      setGlobalSystemToast(
        tr(
          'Доступ запрещён (RBAC): создание турниров доступно только Администратору.',
          'Кирүүгө тыюу салынган (RBAC): мелдештерди түзүү Администраторго гана жеткиликтүү.',
          'Access Denied (RBAC): creating tournaments is restricted to Administrators.'
        )
      );
      setTimeout(() => setGlobalSystemToast(null), 4000);
      return;
    }

    const isCustomUpload = Boolean(
      newTournament.imageUrl && !newTournament.imageUrl.startsWith('/src/assets/images/')
    );
    const asEvent: EventItem = {
      ...newTournament,
      imageUrl: newTournament.imageUrl,
      emblemType: isCustomUpload ? 'custom_upload' : ((newTournament as any).emblemType || 'pcl'),
      locationLabel: (newTournament as any).locationLabel || (newTournament.city ? `${newTournament.country || ''}, ${newTournament.city}` : ''),
      dateLabel: (newTournament as any).dateLabel || `${newTournament.startDate} - ${newTournament.endDate}`,
      availableActions: (newTournament as any).availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring'],
      // The creator owns the tournament (the server sets the same)
      ownerId: currentUser?.id
    } as EventItem;

    setTournaments((prev) => [asEvent, ...prev]);
    setSelectedTournament(asEvent);
    setSelectedEvent(asEvent);
    if (newTournament.rulesType) setTournamentRules(newTournament.rulesType);

    try {
      const saveResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asEvent)
      });
      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => ({}));
        setGlobalSystemToast(err.error || tr('Сервер отклонил сохранение турнира.', 'Сервер мелдешти сактоодон баш тартты.', 'The server rejected saving the tournament.'));
        setTimeout(() => setGlobalSystemToast(null), 5000);
        return;
      }
    } catch {
      setGlobalSystemToast(tr('Нет связи с сервером: изменения не сохранены.', 'Сервер менен байланыш жок: өзгөртүүлөр сакталган жок.', 'No connection to server: changes not saved.'));
      setTimeout(() => setGlobalSystemToast(null), 5000);
      return;
    }

    setGlobalSystemToast(
      tr(
        `✓ Турнир «${asEvent.title}» создан. Дальше — по этапам 1–6 сверху.`,
        `✓ «${asEvent.title}» мелдеши түзүлдү. Андан ары — жогорудагы 1–6 кадамдар боюнча.`,
        `✓ Tournament "${asEvent.title}" created. Next — stages 1–6 at the top.`
      )
    );
    setTimeout(() => setGlobalSystemToast(null), 6000);
    // Straight to stage 1 of the tournament workflow: event, rules, disciplines and categories, fees on one page
    setWorkflowStep(1);
    setActiveTab('manage');
  };

  const handleUpdateTournament = async (updatedTournament: Tournament) => {
    if (!ownsEvent(tournaments.find((t) => t.id === updatedTournament.id) as { ownerId?: string } | undefined)) {
      setGlobalSystemToast(
        tr(
          'Доступ запрещён (RBAC): редактирование турниров доступно только Администратору.',
          'Кирүүгө тыюу салынган (RBAC): мелдештерди өзгөртүү Администраторго гана жеткиликтүү.',
          'Access Denied (RBAC): editing tournaments is restricted to Administrators.'
        )
      );
      setTimeout(() => setGlobalSystemToast(null), 4000);
      return;
    }

    const isCustomUpload = Boolean(
      updatedTournament.imageUrl && !updatedTournament.imageUrl.startsWith('/src/assets/images/')
    );
    const asEvent: EventItem = {
      ...updatedTournament,
      imageUrl: updatedTournament.imageUrl,
      emblemType: isCustomUpload ? 'custom_upload' : ((updatedTournament as any).emblemType || 'pcl'),
      locationLabel: (updatedTournament as any).locationLabel || (updatedTournament.city ? `${updatedTournament.country || ''}, ${updatedTournament.city}` : ''),
      dateLabel: (updatedTournament as any).dateLabel || `${updatedTournament.startDate} - ${updatedTournament.endDate}`,
      availableActions: (updatedTournament as any).availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring']
    };

    setTournaments((prev) => prev.map((t) => (t.id === asEvent.id ? asEvent : t)));
    if (selectedTournament.id === asEvent.id) setSelectedTournament(asEvent);
    if (selectedEvent.id === asEvent.id) setSelectedEvent(asEvent);
    if (updatedTournament.rulesType) setTournamentRules(updatedTournament.rulesType);

    try {
      const saveResponse = await fetch(`/api/events/${asEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asEvent)
      });
      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => ({}));
        setGlobalSystemToast(err.error || tr('Сервер отклонил сохранение турнира.', 'Сервер мелдешти сактоодон баш тартты.', 'The server rejected saving the tournament.'));
        setTimeout(() => setGlobalSystemToast(null), 5000);
        return;
      }
    } catch {
      setGlobalSystemToast(tr('Нет связи с сервером: изменения не сохранены.', 'Сервер менен байланыш жок: өзгөртүүлөр сакталган жок.', 'No connection to server: changes not saved.'));
      setTimeout(() => setGlobalSystemToast(null), 5000);
      return;
    }

    setGlobalSystemToast(
      tr(
        `✓ Изменения турнира «${asEvent.title}» синхронизированы с витриной!`,
        `✓ «${asEvent.title}» мелдешинин өзгөртүүлөрү витрина менен синхрондоштурулду!`,
        `✓ Changes to tournament "${asEvent.title}" synced with showcase!`
      )
    );
    setTimeout(() => setGlobalSystemToast(null), 5000);
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!ownsEvent(tournaments.find((t) => t.id === tournamentId) as { ownerId?: string } | undefined)) {
      setGlobalSystemToast(
        tr(
          'Доступ запрещён (RBAC): удаление турниров доступно только Администратору.',
          'Кирүүгө тыюу салынган (RBAC): мелдештерди өчүрүү Администраторго гана жеткиликтүү.',
          'Access Denied (RBAC): deleting tournaments is restricted to Administrators.'
        )
      );
      setTimeout(() => setGlobalSystemToast(null), 4000);
      return;
    }

    const targetTournament = tournaments.find((t) => t.id === tournamentId);
    const titleLabel = targetTournament?.title || tournamentId;

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(tournamentId)}`, {
        method: 'DELETE'
      });
      if (!response.ok && response.status !== 404) {
        setGlobalSystemToast(
          tr(
            `Ошибка сервера при удалении события «${titleLabel}»`,
            `«${titleLabel}» мелдешин өчүрүүдө сервер катасы`,
            `Server error while deleting event "${titleLabel}"`
          )
        );
        setTimeout(() => setGlobalSystemToast(null), 4000);
        return;
      }
    } catch {
      // Proceed with local state update if offline
    }

    setTournaments((prev) => {
      const filtered = prev.filter((t) => t.id !== tournamentId);
      if (selectedTournament.id === tournamentId && filtered.length > 0) {
        setSelectedTournament(filtered[0]);
      }
      if (selectedEvent.id === tournamentId && filtered.length > 0) {
        setSelectedEvent(filtered[0]);
      }
      return filtered;
    });

    setGlobalSystemToast(
      tr(
        `✓ DELETE-запрос выполнен: событие «${titleLabel}» удалено из базы и списка турниров.`,
        `✓ DELETE-сурамы аткарылды: «${titleLabel}» мелдеши базадан жана тизмеден өчүрүлдү.`,
        `✓ DELETE request completed: event "${titleLabel}" removed from database and tournament list.`
      )
    );
    setTimeout(() => setGlobalSystemToast(null), 4500);
  };

  // Participants, bouts and protocols are stored on the server and shared between devices.
  // TVs, consoles and print pages need only the bouts list often (fewer requests on Vercel)
  const standaloneScreen = React.useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return !!q.get('screen') || !!q.get('print');
  }, []);
  const sharedStateOptions = {
    canWrite: !!currentUser,
    onError: (message: string) => {
      setGlobalSystemToast(message);
      setTimeout(() => setGlobalSystemToast(null), 6000);
    }
  };
  // Bouts are saved one by one (PUT /api/bouts) so several tatami can work at the same time.
  // How often each screen asks the server for changes (the free hosting has a monthly request limit):
  // every second only where bouts are live; slower on bracket and result pages; rarely everywhere else.
  const LIVE_TABS = ['scoreboard', 'virtual_studios', 'event_live_scoring'];
  const SLOW_LIVE_TABS = ['plan', 'event_brackets', 'event_results', 'event_medals', 'participants', 'event_setup', 'screens', 'exports'];
  const boutsPollMs = standaloneScreen || LIVE_TABS.includes(activeTab) || inStep(5) ? 1000 : SLOW_LIVE_TABS.includes(activeTab) || activeTab === 'manage' ? 5000 : 30_000;
  const entriesTabs = ['plan', 'participants', 'event_setup', 'registration', 'acquiring', 'athletes', 'exports', 'scoreboard', 'manage'];
  const dataPollMs = standaloneScreen ? 60_000 : entriesTabs.includes(activeTab) ? 5000 : 30_000;
  const [bouts, setBoutsState, boutSync] = useServerSyncedState<Bout[]>('bouts', [], { ...sharedStateOptions, autoSave: false, pollMs: boutsPollMs });
  const eventLoading = (isEventTab(activeTab) || activeTab === 'manage') && activeTab !== 'event_setup' && !tournamentsLoaded;
  // Tatami of the selected tournament (at least the ones bouts are already assigned to)
  // Stages of «Управление турниром»: officials and admin for every tournament, an organizer only for their own
  const canRunEvent = canAccess('manage', effectiveRole) && (!isOrganizer || ownsEvent(selectedEvent as { ownerId?: string }));
  const tatamiNumbers = React.useMemo(() => {
    const ev = selectedEvent as EventItem & { tatamiCount?: number };
    const planned = Math.min(12, Math.max(1, Number(ev.tatamiCount || ev.ringsCount) || 4));
    // Only this tournament's bouts: another tournament's tatami 4 must not add a «Татами 4» here
    const used = bouts.filter((b) => belongsToEvent(b.tournamentId, selectedEvent.id)).reduce((m, b) => Math.max(m, b.tatamiNumber || 0), 0);
    return Array.from({ length: Math.max(planned, Math.min(used, 12)) }, (_, i) => i + 1);
  }, [selectedEvent, bouts]);

  const boutsRef = React.useRef(bouts);
  boutsRef.current = bouts;
  const saveBouts = React.useCallback(async (changed: Bout[], replaceAll: boolean) => {
    if (changed.length === 0 && !replaceAll) return;
    const deviceKey = getDeviceKey();
    try {
      const res = await fetch('/api/bouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(deviceKey ? { 'x-device-key': deviceKey } : {}) },
        body: JSON.stringify({ bouts: changed, replaceAll })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGlobalSystemToast(data.error || 'Сервер не сохранил изменения боя.');
        setTimeout(() => setGlobalSystemToast(null), 6000);
      }
    } catch {
      setGlobalSystemToast('Нет связи с сервером: изменения боя не сохранены.');
      setTimeout(() => setGlobalSystemToast(null), 6000);
    }
  }, []);
  const setBouts = React.useCallback(
    (update: Bout[] | ((prev: Bout[]) => Bout[])) => {
      const prev = boutsRef.current;
      const next = typeof update === 'function' ? update(prev) : update;
      if (next === prev) return;
      boutsRef.current = next;
      setBoutsState(next);
      const prevById = new Map(prev.map((b) => [b.id, JSON.stringify(b)]));
      const removed = prev.some((b) => !next.some((n) => n.id === b.id));
      const changed = next.filter((b) => prevById.get(b.id) !== JSON.stringify(b));
      boutSync.holdPulls(1500);
      saveBouts(removed ? next : changed, removed);
    },
    [setBoutsState, boutSync, saveBouts]
  );
  const [participants, setParticipants, participantSync] = useServerSyncedState<Participant[]>('participants', [], {
    ...sharedStateOptions,
    pollMs: dataPollMs,
    // Athletes and coaches submit entries through /api/entries; only officials edit the list.
    canWrite: !!currentUser && ['admin', 'organizer', 'chief_referee', 'scorekeeper', 'medical_officer'].includes(currentUser.role)
  });
  const [protocols, setProtocols] = useServerSyncedState<RefereeProtocol[]>('protocols', [], { ...sharedStateOptions, pollMs: standaloneScreen ? 60_000 : ['exports', 'scoreboard'].includes(activeTab) ? 10_000 : 60_000 });
  // Tournament categories created by the organizer (server-stored).
  const [eventCategories, setEventCategories, categorySync] = useServerSyncedState<EventCategory[]>('categories', [], {
    ...sharedStateOptions,
    pollMs: dataPollMs,
    canWrite: !!currentUser && ['admin', 'organizer', 'chief_referee'].includes(currentUser.role)
  });
  const [activeScoreboardBout, setActiveScoreboardBout] = useState<Bout | null>(null);
  const [editTournamentRequest, setEditTournamentRequest] = useState<string | null>(null);
  const [createTournamentRequest, setCreateTournamentRequest] = useState<number | null>(null);
  const [selectedConsoleBoutId, setSelectedConsoleBoutId] = useState<string>(SAMPLE_BOUTS[0].id);
  const [isGlobalManualModalOpen, setIsGlobalManualModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'confirm_profile'>('login');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [globalSystemToast, setGlobalSystemToast] = useState<string | null>(null);
  // 'info' = a calm notice (e.g. «this section is for the organizer»), not a success message.
  const [infoToastText, setInfoToastText] = useState<string | null>(null);
  const toastTone: 'ok' | 'info' = globalSystemToast && globalSystemToast === infoToastText ? 'info' : 'ok';
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const showLockedNotice = (label: string) => {
    const text = tr(
        `«${label}» — раздел организатора турнира. Он открывается только администратору сайта. Если вы проводите турнир, напишите администратору, чтобы он выдал вам доступ.`,
        `«${label}» — мелдешти уюштуруучунун бөлүмү. Ал сайттын администраторуна гана ачылат. Эгер мелдеш өткөрсөңүз, администраторго жазыңыз, ал сизге уруксат берет.`,
        `«${label}» is the tournament organizer's section. Only the site administrator can open it. If you run a tournament, write to the administrator to get access.`
    );
    setInfoToastText(text);
    setGlobalSystemToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setGlobalSystemToast((cur) => (cur === text ? null : cur)), 6000);
  };
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Live Notifications & Operational Alert Dispatcher State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isSoundAlertsEnabled, setIsSoundAlertsEnabled] = useState<boolean>(true);
  const [incomingLiveToast, setIncomingLiveToast] = useState<AppNotification | null>(null);

  // Global State Listener for Expired Event Dates Across All Interface Sections (Auto-Moves to Archive, Never Auto-Deletes)
  const notifiedExpiredEventIdsRef = React.useRef<Set<string>>(new Set());
  const [dismissedExpiredBanner, setDismissedExpiredBanner] = useState<boolean>(false);
  const [globalPendingDeleteTournament, setGlobalPendingDeleteTournament] = useState<Tournament | null>(null);

  const expiredEventsList = React.useMemo(
    () => tournaments.filter((ev) => isTournamentDateExpired(ev.endDate)),
    [tournaments]
  );

  const evaluateAllEventsExpiration = React.useCallback(() => {
    const expiredNow = tournaments.filter((ev) => isTournamentDateExpired(ev.endDate));
    if (expiredNow.length === 0) return;

    // Automatically move any expired tournament into Archive status ('completed') instead of deleting it
    const needsArchiveStatusUpdate = expiredNow.some((ev) => ev.status !== 'completed');
    if (needsArchiveStatusUpdate) {
      setTournaments((prev) =>
        prev.map((ev) =>
          isTournamentDateExpired(ev.endDate) && ev.status !== 'completed'
            ? { ...ev, status: 'completed' }
            : ev
        )
      );
    }

    const newlyExpired = expiredNow.filter((ev) => !notifiedExpiredEventIdsRef.current.has(ev.id));
    if (newlyExpired.length > 0) {
      newlyExpired.forEach((ev) => notifiedExpiredEventIdsRef.current.add(ev.id));
      setDismissedExpiredBanner(false);

      const latestExpired = newlyExpired[0];
      const reminderNotif: AppNotification = {
        id: `notif-expired-${latestExpired.id}-${Date.now()}`,
        title: tr(
          'Автоматический перенос в Архив',
          'Архивге автоматтык которуу',
          'Automatic Transfer to Archive'
        ),
        message:
          newlyExpired.length === 1
            ? tr(
                `Срок события «${latestExpired.title}» (${latestExpired.endDate}) истёк. Турнир автоматически перемещён во вкладку «Архив» (без удаления).`,
                `«${latestExpired.title}» (${latestExpired.endDate}) мелдешинин мөөнөтү өттү. Мелдеш автоматтык түрдө «Архив» өтмөгүнө которулду (өчүрүүсүз).`,
                `Event "${latestExpired.title}" (${latestExpired.endDate}) has passed its end date and was automatically moved to the "Archive" tab (without deletion).`
              )
            : tr(
                `Завершённые события (${expiredNow.length}, включая «${latestExpired.title}») автоматически перемещены во вкладку «Архив» вместо удаления.`,
                `Мөөнөтү аяктаган мелдештер (${expiredNow.length}, «${latestExpired.title}» кошо) өчүрүүнүн ордуна автоматтык түрдө «Архив» өтмөгүнө которулду.`,
                `${expiredNow.length} concluded events (including "${latestExpired.title}") were automatically moved to the "Archive" tab instead of being deleted.`
              ),
        category: 'schedule',
        severity: 'urgent',
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isRead: false,
        actionLabel: tr('Открыть Архив', 'Архивди ачуу', 'Open Archive'),
        actionTab: 'admin'
      };

      setNotifications((prev) => [reminderNotif, ...prev]);
    }
  }, [tournaments, language]);

  // Run global date verification whenever tournaments or activeTab changes, plus interval & custom event listener
  React.useEffect(() => {
    evaluateAllEventsExpiration();
  }, [evaluateAllEventsExpiration, activeTab]);

  React.useEffect(() => {
    const handleCustomCheck = () => {
      evaluateAllEventsExpiration();
      setDismissedExpiredBanner(false);
    };
    window.addEventListener('apsatarov-check-expired-events', handleCustomCheck);
    const intervalId = window.setInterval(evaluateAllEventsExpiration, 30000);
    return () => {
      window.removeEventListener('apsatarov-check-expired-events', handleCustomCheck);
      window.clearInterval(intervalId);
    };
  }, [evaluateAllEventsExpiration]);





  const handleUpdateParticipantFee = (participantId: string, status: 'paid' | 'pending' | 'exempt' | 'refunded') => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, feePaymentStatus: status } : p))
    );
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'tournaments': return language === 'ru' ? 'События' : 'Events';
      case 'event_info': return `${eventTitle(selectedEvent, language)} — Информация`;
      case 'event_categories_prices': return `${eventTitle(selectedEvent, language)} — Категории и цены`;
      case 'event_brackets': return `${eventTitle(selectedEvent, language)} — Сетки`;
      case 'event_medals': return `${eventTitle(selectedEvent, language)} — Медали`;
      case 'event_live_scoring': return `${eventTitle(selectedEvent, language)} — Live Scoring`;
      case 'event_results': return `${eventTitle(selectedEvent, language)} — Результаты`;
      case 'studios': return language === 'ru' ? 'Клубы' : 'Clubs';
      case 'virtual_studios': return language === 'ru' ? 'Сейчас на татами' : 'Live now';
      case 'about': return language === 'ru' ? 'О платформе Apsatarov' : language === 'ky' ? 'Apsatarov жөнүндө' : 'About Apsatarov';
      case 'help': return language === 'ru' ? 'Помощь и FAQ' : language === 'ky' ? 'Жардам жана FAQ' : 'Help & FAQ';
      case 'coach': return language === 'ru' ? 'Мои заявки и оплата' : 'My entries & fees';
      case 'athletes': return language === 'ky' ? 'Менин спортчуларым' : language === 'en' ? 'My athletes' : 'Мои спортсмены';
      case 'rankings': return language === 'ru' ? 'Рейтинги' : 'Rankings';
      case 'acquiring': return language === 'ru' ? 'Взносы' : 'Entry fees';
      case 'scoreboard': return language === 'ru' ? 'Татами' : 'Tatami';
      case 'exports': return language === 'ru' ? 'Документы и печать' : 'Documents & Printing';
      case 'lan': return language === 'ru' ? 'Работа без интернета' : 'Offline mode';
      case 'participants': return language === 'ru' ? 'База участников' : 'Athlete Database';
      case 'admin': return language === 'ru' ? 'Панель администратора' : 'Admin Panel';
      case 'registration': return language === 'ru' ? 'Электронная регистрация' : 'Online Registration';
      default: return 'Apsatarov';
    }
  };

  const [isTrainingMenuOpen, setIsTrainingMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // Close the profile menu on a tap/click anywhere outside it (and on Esc)
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isProfileMenuOpen) return;
    let closed = false;
    const onDown = (e: Event) => {
      if (closed) return;
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        closed = true;
        setIsProfileMenuOpen(false);
        // This tap only closes the menu: don't also press whatever is under the finger
        const swallow = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        document.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => document.removeEventListener('click', swallow, { capture: true } as any), 400);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsProfileMenuOpen(false);
    const events = ['pointerdown', 'mousedown', 'touchstart'] as const;
    events.forEach((t) => document.addEventListener(t, onDown, true));
    document.addEventListener('keydown', onKey);
    return () => {
      events.forEach((t) => document.removeEventListener(t, onDown, true));
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileMenuOpen]);

  // The address bar follows the screen (see the history effect below)
  const navigateWithHash = (tab: string, eventId?: string) => {
    if (eventId && eventId !== selectedEvent.id) {
      const ev = tournaments.find((t) => t.id === eventId);
      if (ev) {
        setSelectedEvent(ev);
        setSelectedTournament(ev);
      }
    }
    setActiveTab(tab);
  };

  const handleSelectTournamentAction = (item: EventItem, action: EventActionType) => {
    setSelectedEvent(item);
    setSelectedTournament(item);
    if (item.rulesType) setTournamentRules(item.rulesType);

    if (action === 'info') {
      navigateWithHash('event_info', item.id);
    } else if (action === 'categories_prices') {
      navigateWithHash('event_categories_prices', item.id);
    } else if (action === 'brackets') {
      navigateWithHash('event_brackets', item.id);
    } else if (action === 'results') {
      navigateWithHash('event_results', item.id);
    } else if (action === 'medals') {
      navigateWithHash('event_medals', item.id);
    } else if (action === 'live_scoring') {
      navigateWithHash('event_live_scoring', item.id);
    }
  };

  // Tournament Online Registration & Local LAN Hub configuration
  const [registrationConfig, setRegistrationConfig] = useState<TournamentRegistrationConfig>({
    isRegistrationOpen: true,
    registrationDeadline: '2026-11-04T18:00',
    shareableToken: 'bishkek-cup-2026-open',
    allowPublicSelfRegistration: true,
    venueWifiSsid: 'Karate-Arena-5G',
    venueLocalServerIp: '192.168.1.100',
    offlineModeActive: true
  });

  // Screens opened from QR codes (see the standalone screens block below).
  const [screenMode] = useState<{ kind: 'tatami' | 'calls' | 'control'; tatami: number } | null>(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const kind = q.get('screen');
      const tatami = Math.max(1, Number(q.get('t')) || 1);
      if (kind === 'tatami' || kind === 'calls' || kind === 'control') {
        if (kind === 'control' && q.get('key')) {
          setDeviceKey(q.get('key'));
          q.delete('key'); // keep the secret out of the address bar and history
          window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
        }
        return { kind, tatami };
      }
    } catch {
      /* ignore */
    }
    return null;
  });
  const [printRequest] = useState(() => parsePrintRequest(window.location.search));
  const [deviceOk, setDeviceOk] = useState<boolean | null>(null);
  React.useEffect(() => {
    if (screenMode?.kind !== 'control') return;
    const key = getDeviceKey();
    if (!key) {
      setDeviceOk(false);
      return;
    }
    fetch('/api/device', { headers: { 'x-device-key': key } })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => setDeviceOk(ok && d.tatamiNumber === screenMode.tatami))
      .catch(() => setDeviceOk(null));
  }, [screenMode]);

  // Invitation links: ?join=athlete | ?join=coach (public) and ?invite=<secret> (staff, created by admin).
  const [inviteRole, setInviteRole] = useState<UserRole | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const join = params.get('join');
    const token = params.get('invite');
    if (!join && !token) return;
    // Read the link once and take it out of the address bar: otherwise every page reload
    // reopened the sign-up window (and the secret invitation stayed in the browser history).
    params.delete('join');
    params.delete('invite');
    const rest = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${rest ? '?' + rest : ''}${window.location.hash}`);

    const openFor = async (open: () => void) => {
      // Already signed in: no sign-up window
      const me = await fetch('/api/auth/me').then((r) => r.json()).catch(() => null);
      if (!me?.authenticated) open();
    };
    if (join === 'athlete' || join === 'coach') {
      openFor(() => {
        setInviteRole(join === 'coach' ? 'club_coach' : 'athlete');
        setAuthModalMode('register');
        setIsAuthModalOpen(true);
      });
    } else if (token) {
      openFor(() => fetch(`/api/invites/${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setInviteRole(data.role);
            setInviteToken(token);
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          } else {
            setGlobalSystemToast(data.error || 'Ссылка-приглашение недействительна.');
            setTimeout(() => setGlobalSystemToast(null), 6000);
          }
        })
        .catch(() => {}));
    }
  }, []);

  // Deep-link hash support (#home, #studios, #info;id=..., ?locale=ru)
  React.useEffect(() => {
    const syncFromLocation = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const tab = urlParams.get('tab');
        const tatami = urlParams.get('tatami');
        const locale = urlParams.get('locale');

        if (locale === 'en' && language !== 'en') {
          setLanguage('en');
        } else if (locale === 'ru' && language !== 'ru') {
          setLanguage('ru');
        } else if (locale === 'ky' && language !== 'ky') {
          setLanguage('ky');
        }

        if (window.location.hash === '#login') {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
          return;
        }
        const route = tabFromHash(window.location.hash);
        if (route) {
          if (route.eventId) {
            const matchedEvent = tournaments.find((e) => e.id === route.eventId);
            if (matchedEvent) {
              setSelectedEvent(matchedEvent);
              setSelectedTournament(matchedEvent);
            }
          }
          if (route.tab === 'manage') setWorkflowStep(route.step || 1);
          setActiveTab(route.tab);
          return;
        }

        if (mode === 'registration' || mode === 'vinted' || tab === 'registration' || tab === 'vinted_reg') {
          setActiveTab('registration');
        } else if (tab) {
          setActiveTab(tab);
        } else if (tatami) {
          setActiveTab('schedule');
        }
      } catch {
        // Ignore URL parsing errors
      }
    };

    syncFromLocation();
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [tournaments]);

  // Every screen change becomes a browser history step, so the phone's Back button
  // returns to the previous screen instead of leaving the site.
  React.useEffect(() => {
    if (screenMode || printRequest) return;
    // The workflow address names a tournament: wait for the real list (not the placeholder event)
    if (activeTab === 'manage' && !tournamentsLoaded) return;
    const target = activeTab === 'manage' ? manageHash(selectedEvent.id, workflowStep) : hashForTab(activeTab, isEventTab(activeTab) ? selectedEvent.id : undefined);
    if (window.location.hash === target) return;
    const current = tabFromHash(window.location.hash);
    // Same page, the link only adds details (e.g. the category of a bracket «;c=…»): keep it
    if (activeTab !== 'manage' && current && current.tab === activeTab && (!isEventTab(activeTab) || current.eventId === selectedEvent.id) && window.location.hash.includes(';')) return;
    // Opening a link to a tournament page before the tournament list has loaded: keep it
    if (current && current.tab === activeTab && current.eventId && !tournaments.some((t) => t.id === current.eventId)) return;
    if (!window.location.hash && activeTab === 'tournaments') {
      window.history.replaceState(null, '', target);
      return;
    }
    window.history.pushState(null, '', target);
  }, [activeTab, selectedEvent.id, workflowStep, tournamentsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps


  // 1-Click Database Reset Handler (Preserving Database Schema)

  // Automatic playoff bracket progression when a bout finishes
  /** Draw for one organizer category: bracket from its active entries on the chosen tatami. */
  const handleDrawCategory = (def: EventCategory, tatamiNumber: number, startTime?: string) => {
    const entries = activeEntries(participants, def.id);
    const tatami = SAMPLE_TATAMIS.find((t) => t.number === tatamiNumber) || ({ ...SAMPLE_TATAMIS[0], id: `tatami-${tatamiNumber}`, number: tatamiNumber, name: `Татами ${tatamiNumber}` } as typeof SAMPLE_TATAMIS[0]);
    const generatorCategory = {
      id: def.id,
      tournamentId: def.tournamentId,
      // Team kata is judged like kata; team kumite and the organizer's own disciplines run as bouts
      discipline: def.discipline === 'team_kata' ? 'kata' : def.discipline === 'team_kumite' || def.discipline === 'other' ? 'kumite' : def.discipline,
      gender: def.gender === 'mixed' ? 'male' : def.gender,
      bracketType: 'olympic_with_repechage',
      assignedTatamiId: tatami.id
    } as unknown as TournamentCategory;
    const { bouts: catBouts } = generateProtectedWkfCategoryBouts(generatorCategory, entries, [tatami], {
      durationSeconds: def.durationSeconds,
      categoryTitle: categoryName(def),
      startTime
    });
    setBouts((prev) => [...prev.filter((b) => b.categoryId !== def.id), ...catBouts]);
    setParticipants((prev) => prev.map((pp) => (entries.some((e) => e.id === pp.id) ? { ...pp, status: 'draw_seeded' } : pp)));
    setGlobalSystemToast(`Жеребьёвка проведена: ${categoryName(def)} — ${catBouts.length} боёв на татами ${tatami.number}`);
    setTimeout(() => setGlobalSystemToast(null), 5000);
  };

  const handleWithdrawEntry = async (entryId: string) => {
    const res = await fetch(`/api/entries/${encodeURIComponent(entryId)}/withdraw`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGlobalSystemToast(data.error || 'Не удалось отозвать заявку');
      setTimeout(() => setGlobalSystemToast(null), 5000);
    }
  };

  const handleUpdateBout = (updatedBout: Bout) => {
    // Winner moves to the next round (any bracket size); repechage for the two bronzes is kept in sync.
    const find = (id?: string) => (id ? participants.find((p) => p.id === id) : undefined);
    const mode = eventCategories.find((c) => c.id === updatedBout.categoryId)?.thirdPlace;
    setBouts((prev) => applyBoutResult(prev, updatedBout, find, mode));
  };

  const handleUpdateParticipant = (updatedParticipant: Participant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
  };






  // Full backup of the server data (admin only): tournaments, entries, bouts, categories, accounts without passwords.
  const handleExportSql = () => {
    window.location.href = '/api/admin/backup';
  };





  // Standalone Fullscreen Online Registration Page
  // ---------------------------------------------------------------------------
  // Standalone screens opened from links / QR codes (no menu, no sign-in):
  //   ?screen=tatami&t=1           spectator scoreboard for tatami 1 (TV / projector)
  //   ?screen=calls                warm-up area: who is on every tatami and who is next
  //   ?screen=control&t=1&key=...  secretary console for tatami 1 (tablet / laptop)
  // ---------------------------------------------------------------------------
  // Printable documents: ?print=bracket|results|medals|entries|bout|diplomas&e=<event>&c=<category>&b=<bout>
  if (printRequest) {
    // Documents wait for the server data: otherwise a sheet printed in the first seconds says «no draw yet»
    return (
      <PrintDocuments
        request={printRequest}
        tournaments={tournaments}
        categories={eventCategories}
        bouts={bouts}
        participants={participants}
        loading={!tournamentsLoaded || !boutSync.loaded || !categorySync.loaded || !participantSync.loaded}
      />
    );
  }

  if (screenMode) {
    // A crash on a tatami screen tries again with the next data update (nobody may be near the TV)
    if (screenMode.kind === 'tatami')
      return (
        <ErrorBoundary scope="app" resetKey={bouts}>
          <TatamiDisplay tatamiNumber={screenMode.tatami} bouts={bouts} rules={tournamentRules} />
        </ErrorBoundary>
      );
    if (screenMode.kind === 'calls')
      return (
        <ErrorBoundary scope="app" resetKey={bouts}>
          <CallRoomDisplay bouts={bouts} tatamiNumbers={tatamiNumbers} />
        </ErrorBoundary>
      );
    return (
      <ErrorBoundary scope="app">
        <TatamiControl tatamiNumber={screenMode.tatami} bouts={bouts} rules={tournamentRules} deviceOk={deviceOk} onChange={handleUpdateBout} />
        {globalSystemToast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] rounded-xl bg-black/85 text-white text-sm px-4 py-2">{globalSystemToast}</div>
        )}
      </ErrorBoundary>
    );
  }


  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f0f2f5] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => navigateWithHash(tab)}
        tournamentRules={tournamentRules}
        onRulesChange={setTournamentRules}
        currentUserRole={effectiveRole}
        onRoleChange={requestRoleChange}
        selectedTournament={selectedTournament}
        onOpenResetDialog={() => setIsResetModalOpen(true)}
        onExportSql={handleExportSql}
        onOpenManualControl={() => setIsGlobalManualModalOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onToggleMobile={() => setIsMobileNavOpen(!isMobileNavOpen)}
        language={language}
        onOpenPrivacyModal={() => { window.location.hash = legalHash('privacy'); }}
        onLockedTab={showLockedNotice}
        workflow={
          activeTab === 'manage' && canAccess('manage', effectiveRole) && tournamentsLoaded
            ? {
                eventId: selectedEvent.id,
                title: eventTitle(selectedEvent, language),
                step: workflowStep,
                done: workflowStatus(selectedEvent.id, eventCategories, participants, bouts).done,
                onStep: (n) => {
                  setWorkflowStep(n);
                  document.querySelector('main')?.parentElement?.scrollTo({ top: 0 });
                }
              }
            : undefined
        }
      />

      {/* Main Stretched Content Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto bg-[#f0f2f5]">
        {/* Top Context Bar: top navigation header (Responsive for Mobile, Tablet & Desktop) */}
        <header className="sticky top-0 z-30 bg-[#f0f2f5] px-3 sm:px-6 h-14 sm:h-15 flex items-center justify-between gap-2 shrink-0 border-b border-slate-200/50">
          {/* Left: Brand Logo & Social Icons */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Button (40x40px touch target) */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden min-w-[40px] min-h-[40px] p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={tr('Открыть меню навигации', 'Навигация менюсун ачуу', 'Open navigation menu')}
              aria-label={tr('Открыть меню навигации', 'Навигация менюсун ачуу', 'Open navigation menu')}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* brand logo on Top Bar */}
            <button
              onClick={() => setActiveTab('tournaments')}
              className="lg:hidden flex items-center gap-1.5 sm:gap-2 text-left group cursor-pointer focus:outline-none min-w-0"
              title="Apsatarov — на главную"
            >
              <BrandMark className="w-7 h-7 shrink-0" />
              <BrandWordmark className="text-lg sm:text-xl text-slate-800 group-hover:text-sky-600 transition-colors truncate" />
            </button>

          </div>

          {/* Right: Clean Header Bar (Alerts, Training & Unified Profile Menu with Role, Theme & Language) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 font-sans">

            {/* Language switch RU / KG / EN: always visible on computers and tablets (phones keep it in the profile menu) */}
            <div
              className="hidden sm:inline-flex items-center p-0.5 rounded-full border border-slate-200/90 bg-white shadow-2xs"
              role="radiogroup"
              aria-label={tr('Язык сайта', 'Сайттын тили', 'Site language')}
            >
              {(
                [
                  ['ru', 'RU', 'Русский'],
                  ['ky', 'KG', 'Кыргызча'],
                  ['en', 'EN', 'English']
                ] as const
              ).map(([code, short, full]) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={language === code}
                  title={full}
                  onClick={() => setLanguage(code)}
                  className={`h-7 min-w-[34px] px-2 rounded-full text-[11px] font-bold tracking-wide transition-colors cursor-pointer ${
                    language === code ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {short}
                </button>
              ))}
            </div>

            {/* ========================================================
                UNIFIED PROFILE & SETTINGS MENU (Role RBAC, Theme, Language & Account)
               ======================================================== */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsTrainingMenuOpen(false);
                }}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 px-2.5 py-1.5 sm:py-1 rounded-full border border-slate-200/90 shadow-2xs transition-colors cursor-pointer min-h-[36px] sm:min-h-0"
                title={tr(
                  'Меню профиля: роль доступа (RBAC), тема оформления, язык и аккаунт',
                  'Профиль менюсу: кирүү ролу (RBAC), тема, тил жана аккаунт',
                  'Profile Menu: RBAC role, color theme, language & account'
                )}
              >
                {/* One short label only: the role (or "Sign in" for guests). Name and email live inside the menu. */}
                <span
                  className={`text-xs font-semibold max-w-[140px] truncate ${
                    effectiveRole === 'admin'
                      ? 'text-rose-600'
                      : effectiveRole === 'guest'
                        ? 'text-slate-800'
                        : 'text-sky-700'
                  }`}
                >
                  {effectiveRole === 'guest' ? tr('Войти', 'Кирүү', 'Sign in') : roleLabel(effectiveRole, language)}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <>

                  <div className="pop-in fixed left-3 right-3 top-14 max-h-[calc(100dvh-8rem)] overflow-y-auto sm:absolute sm:left-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 sm:max-h-none sm:overflow-visible rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-xs space-y-3 animate-fadeIn">
                    {/* 1. User Account Header */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                              currentUserRole === 'admin' ? 'bg-rose-600' : 'bg-sky-600'
                            }`}
                          >
                            {currentUser?.fullName
                              ? currentUser.fullName.charAt(0).toUpperCase()
                              : currentUserRole === 'admin'
                              ? 'A'
                              : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {currentUser?.fullName ||
                                (currentUserRole === 'admin'
                                  ? tr('Администратор системы', 'Системанын администратору', 'System Administrator')
                                  : tr('Кабинет участника', 'Катышуучу кабинети', 'Participant Cabinet'))}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {currentUser?.email ||
                                (currentUserRole === 'admin'
                                  ? tr('Полный административный доступ', 'Толук административдик укук', 'Full administrative control')
                                  : tr('Ограниченный кабинет (RBAC)', 'Чектелген кабинет (RBAC)', 'Restricted cabinet (RBAC)'))}
                            </div>
                          </div>
                        </div>

                        {currentUser && (
                          <span className="p-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200 shrink-0" title={tr('Подтвержден', 'Ырасталган', 'Verified')}>
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {currentUser ? (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              setAuthModalMode('confirm_profile');
                              setIsAuthModalOpen(true);
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-center"
                          >
                            {tr('Данные профиля', 'Профиль маалыматы', 'Profile Details')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              handleLogout();
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>{tr('Выйти', 'Чыгуу', 'Log Out')}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              setAuthModalMode('login');
                              setIsAuthModalOpen(true);
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors cursor-pointer text-center shadow-2xs"
                          >
                            {tr('Вход', 'Кирүү', 'Log In')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              setAuthModalMode('register');
                              setIsAuthModalOpen(true);
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer text-center"
                          >
                            {tr('Регистрация', 'Каттоо', 'Register')}
                          </button>
                        </div>
                      )}
                    </div>

                    {currentUser?.role === 'admin' && (<>
                    {/* 2. RBAC Role Selection (Администратор vs. Участник / Учреждение) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                          <span>{tr('Роль доступа (RBAC)', 'Кирүү ролу (RBAC)', 'Access Role (RBAC)')}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {currentUserRole === 'admin'
                            ? tr('Полный доступ', 'Толук укук', 'Full Access')
                            : tr('Ограниченный', 'Чектелген', 'Limited')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        <button
                          type="button"
                          onClick={() => requestRoleChange('admin')}
                          className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                            currentUserRole === 'admin'
                              ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 font-bold'
                              : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>
                              <span className="block leading-tight">
                                {tr('Администратор', 'Администратор', 'Administrator')}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {tr('Полный контроль, архив и удаление', 'Толук көзөмөл, архив жана өчүрүү', 'Full control, archive & delete')}
                              </span>
                            </span>
                          </span>
                          {currentUserRole === 'admin' && <span className="text-rose-600 font-bold">✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => requestRoleChange('club_coach')}
                          className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                            currentUserRole !== 'admin'
                              ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 font-bold'
                              : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-sky-500 shrink-0" />
                            <span>
                              <span className="block leading-tight">
                                {tr('Участник / Учреждение', 'Катышуучу / Мекеме', 'Participant / Institution')}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {tr('Регистрация и просмотр трансляций', 'Каттоо жана түз эфирди көрүү', 'Registration & live broadcasts')}
                              </span>
                            </span>
                          </span>
                          {currentUserRole !== 'admin' && <span className="text-sky-600 font-bold">✓</span>}
                        </button>
                      </div>
                    </div>

                    </>)}
                    {/* 3. Theme Switcher (Яркая / Чёрная) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        {theme === 'light' ? (
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>{tr('Тема оформления', 'Теманы тандоо', 'Appearance Theme')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{tr('Яркая', 'Жарык', 'Bright')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-800 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{tr('Чёрная', 'Кара', 'Dark')}</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. Language Selection (RU / KY / EN) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5 text-teal-500" />
                        <span>{tr('Язык интерфейса', 'Интерфейстин тили', 'Interface Language')}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLanguage('ru')}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            language === 'ru'
                              ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 font-bold'
                              : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="text-sm leading-none">🇷🇺</span>
                          <span className="text-[11px]">Русский</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLanguage('ky')}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            language === 'ky'
                              ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 font-bold'
                              : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="text-sm leading-none">🇰🇬</span>
                          <span className="text-[11px]">Кыргызча</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            language === 'en'
                              ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 font-bold'
                              : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="text-sm leading-none">🇺🇸</span>
                          <span className="text-[11px]">English</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Incoming Emergency / Critical Live Toast Banner */}
        {incomingLiveToast && (
          <div className="bg-rose-950/95 border-b border-rose-500 text-white px-4 py-2.5 shadow-2xl backdrop-blur sticky top-16 z-30 flex items-center justify-between text-xs sm:text-sm tabular-nums animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <span className="font-bold text-rose-300 uppercase">[{incomingLiveToast.title}]:</span>
              <span className="text-white">{incomingLiveToast.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {incomingLiveToast.actionTab && (
                <button
                  onClick={() => {
                    setActiveTab(incomingLiveToast.actionTab!);
                    setIncomingLiveToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tabular-nums transition-colors cursor-pointer"
                >
                  {incomingLiveToast.actionLabel || 'Перейти'}
                </button>
              )}
              <button
                onClick={() => setIncomingLiveToast(null)}
                className="text-rose-300 hover:text-white text-xs px-2 py-0.5 rounded bg-rose-900/60"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Global Toast if active */}
        {globalSystemToast && (
          <div
            role="status"
            className={`${toastTone === 'info' ? 'bg-slate-800/95 border-slate-600' : 'bg-emerald-600/90 border-emerald-500'} text-white border-b px-4 py-2.5 shadow-lg backdrop-blur sticky top-16 z-20 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-fadeIn`}
          >
            <span className="flex items-center gap-2">
              {toastTone === 'info' ? <Lock className="w-4 h-4 shrink-0 text-slate-300" /> : <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-200" />}
              {globalSystemToast}
            </span>
            <button 
              onClick={() => setGlobalSystemToast(null)}
              className={`${toastTone === 'info' ? 'text-slate-300 bg-slate-700/80' : 'text-emerald-200 bg-emerald-800/60'} hover:text-white text-xs px-2 py-0.5 rounded shrink-0`}
            >
              ✕ {tr('Закрыть', 'Жабуу', 'Close')}
            </button>
          </div>
        )}

        {/* Concluded tournaments: a small button on the right opens the archive (no big banner) */}
        {effectiveRole === 'admin' && expiredEventsList.length > 0 && activeTab !== 'admin' && (
          <div className="px-3 sm:px-6 lg:px-8 pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                navigateWithHash('admin');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('apsatarov-open-archive-tab'));
                }, 50);
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-medium text-[var(--app-text-secondary)] hover:border-amber-500 hover:text-amber-700 transition-colors cursor-pointer shadow-2xs"
              title={tr(
                'Турниры, у которых прошли даты, автоматически переносятся в архив (не удаляются)',
                'Мөөнөтү өткөн мелдештер архивге автоматтык түрдө которулат (өчүрүлбөйт)',
                'Tournaments whose dates have passed are moved to the archive automatically (not deleted)'
              )}
            >
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              {tr('Архив завершённых турниров', 'Аяктаган мелдештер архиви', 'Concluded tournaments archive')}
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500/15 text-amber-700 text-[11px] font-semibold inline-flex items-center justify-center">
                {expiredEventsList.length}
              </span>
            </button>
          </div>
        )}

        {/* Full-width Stretched Content Area */}
        <main
          ref={mainRef}
          className={`flex-1 w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 space-y-4 ${
            // Video pages use the whole width so several tatami fit side by side
            activeTab === 'virtual_studios' || activeTab === 'event_live_scoring' ? 'max-w-none' : 'max-w-7xl'
          }`}
        >
          {/* A crash in one screen shows a calm message here; the menu and the rest of the site keep working */}
          <ErrorBoundary scope="section" resetKey={`${activeTab}|${workflowStep}|${selectedEvent.id}`}>
          <React.Suspense fallback={<ScreenLoader />}>
          {/* One «current tournament» for every working screen: chosen here, used by tatami, weigh-in, draw, screens, fees, documents */}
          {canAccess(activeTab, effectiveRole) &&
            tournaments.length > 0 &&
            (['plan', 'scoreboard', 'participants', 'event_setup', 'screens', 'exports'].includes(activeTab) || (activeTab === 'acquiring' && effectiveRole === 'admin')) &&
            (() => {
              const today = localToday();
              const ev = selectedEvent;
              const end = ev.endDate || ev.startDate;
              const running = !!ev.startDate && ev.startDate <= today && !!end && end >= today;
              const days = ev.startDate ? Math.round((new Date(ev.startDate).getTime() - new Date(today).getTime()) / 86400000) : null;
              const badge = running
                ? { text: tr('Идёт сегодня', 'Бүгүн өтүүдө', 'Running today'), cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' }
                : end && end < today
                  ? { text: tr('Завершён', 'Аяктады', 'Finished'), cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30' }
                  : days !== null && days > 0
                    ? { text: tr(`Через ${days} дн.`, `${days} күндөн кийин`, `In ${days} days`), cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30' }
                    : null;
              return (
                <div className="theme-keep rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 flex flex-wrap items-center gap-2">
                  <label htmlFor="current-tournament" className="text-sm font-semibold text-[var(--app-text-primary)] shrink-0">
                    {tr('Турнир:', 'Мелдеш:', 'Tournament:')}
                  </label>
                  <select
                    id="current-tournament"
                    translate="no"
                    value={ev.id}
                    onChange={(e) => {
                      const next = tournaments.find((t) => t.id === e.target.value);
                      if (!next) return;
                      setSelectedEvent(next);
                      setSelectedTournament(next);
                      rememberTournament(next.id);
                    }}
                    className="flex-1 min-w-0 sm:flex-none sm:min-w-[320px] max-w-full h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm font-medium"
                  >
                    {!tournaments.some((t) => t.id === ev.id) && <option value={ev.id}>{eventTitle(ev, language)}</option>}
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {eventTitle(t, language)}
                        {t.startDate ? ` · ${t.startDate}` : ''}
                      </option>
                    ))}
                  </select>
                  {badge && <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${badge.cls}`}>{badge.text}</span>}
                  <span className="hidden md:inline text-xs text-[var(--app-text-muted)]">
                    {tr('Один выбор для всех рабочих разделов', 'Бардык жумушчу бөлүмдөр үчүн бир тандоо', 'One choice for all working screens')}
                  </span>
                </div>
              );
            })()}
          {!canAccess(activeTab, effectiveRole) ? (
            <AccessGate
              role={effectiveRole}
              onLogin={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              onRegister={() => {
                setAuthModalMode('register');
                setIsAuthModalOpen(true);
              }}
              onGoHome={() => navigateWithHash('tournaments')}
            />
          ) : (<>
          {/* 1. События (Tournaments showcase with Category-Dependent Hover Options + RBAC) */}
          {activeTab === 'tournaments' && (
            <TournamentShowcase
              tournaments={tournaments}
              loading={!tournamentsLoaded}
              loadFailed={tournamentsError && tournaments.length === 0}
              onRetry={loadTournaments}
              currentUserRole={currentUserRole}
              onRoleChange={requestRoleChange}
              onSelectTournament={(t) => {
                setSelectedTournament(t);
                const matched = DEMO_EVENTS.find((e) => e.id === t.id);
                if (matched) setSelectedEvent(matched);
                else setSelectedEvent(t as EventItem);
                if (t.rulesType) setTournamentRules(t.rulesType);
                setActiveTab('event_info');
              }}
              onSelectAction={(t, action) => handleSelectTournamentAction(t, action)}
              onStartRegistration={(t) => {
                setSelectedTournament(t);
                if (t.rulesType) setTournamentRules(t.rulesType);
                setActiveTab('registration');
              }}
              onOpenScoreboard={() => setActiveTab('scoreboard')}
              onOpenBracket={() => setActiveTab('bracket')}
              onOpenCreateTournament={() => {
                setCreateTournamentRequest(Date.now());
                navigateWithHash('admin');
              }}
              onRequestDeleteTournament={(t) => setGlobalPendingDeleteTournament(t)}
              onOpenLiveBroadcast={() => navigateWithHash('virtual_studios')}
            />
          )}

          {/* Tournament pages wait for the tournament list (slow mobile internet) */}
          {eventLoading && <EventPageSkeleton />}

          {/* ===== Tournament workflow: numbered stages on one page ===== */}
          {activeTab === 'manage' && !eventLoading && canAccess('manage', effectiveRole) && (
            <WorkflowHeader
              event={selectedEvent as unknown as Tournament}
              step={workflowStep}
              status={workflowStatus(selectedEvent.id, eventCategories, participants, bouts)}
              language={language}
              onStep={(n) => {
                setWorkflowStep(n);
                document.querySelector('main')?.parentElement?.scrollTo({ top: 0 });
              }}
              onBack={() => navigateWithHash('admin')}
              tournaments={tournaments.filter((t) => (!(t as { isArchived?: boolean }).isArchived || t.id === selectedEvent.id) && (!isOrganizer || ownsEvent(t as { ownerId?: string }) || t.id === selectedEvent.id)) as unknown as Tournament[]}
              onSelectEvent={(id) => {
                const ev = tournaments.find((x) => x.id === id);
                if (!ev) return;
                setSelectedEvent(ev);
                setSelectedTournament(ev);
                rememberTournament(ev.id);
              }}
            />
          )}
          {activeTab === 'manage' && !eventLoading && isOrganizer && !canRunEvent && (
            // An organizer opened somebody else's tournament: they can look, not run it
            <div className="theme-keep rounded-2xl border border-amber-400 bg-[var(--app-surface)] p-5 space-y-3">
              <div className="font-semibold text-[var(--app-text-primary)]">
                {tr('Это не ваш турнир — его ведёт другой организатор.', 'Бул сиздин мелдеш эмес — аны башка уюштуруучу жүргүзөт.', 'This is not your tournament — another organizer runs it.')}
              </div>
              <p className="text-sm text-[var(--app-text-secondary)]">
                {tr('Смотреть его можно как обычный посетитель: сетки, результаты, медали. Управлять можно только своими турнирами.', 'Аны кадимки конок катары көрө аласыз: торчолор, жыйынтыктар, медалдар. Өз мелдештериңизди гана башкара аласыз.', 'You can view it like any visitor: brackets, results, medals. You can run only your own tournaments.')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigateWithHash('admin')} className="h-10 px-4 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold cursor-pointer">{tr('Мои турниры', 'Менин мелдештерим', 'My tournaments')}</button>
                <button onClick={() => handleSelectTournamentAction(selectedEvent, 'brackets')} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer">{tr('Смотреть сетки', 'Торчолорду көрүү', 'View brackets')}</button>
              </div>
            </div>
          )}
          {inStep(1) && !eventLoading && canRunEvent && (
            <div className="space-y-4">
              <EventBasicsForm
                key={selectedEvent.id}
                event={selectedEvent as unknown as Tournament}
                language={language}
                onSave={ownsEvent(selectedEvent as { ownerId?: string }) ? handleUpdateTournament : undefined}
              />
              <QuickCategories
                key={`qc-${selectedEvent.id}`}
                tournamentId={selectedEvent.id}
                language={language}
                heading={tr('1.2 Дисциплины: быстро добавить категории', '1.2 Дисциплиналар: категорияларды тез кошуу', '1.2 Disciplines: add categories quickly')}
                intro={tr(
                  'Отметьте индивидуальные и командные ката и кумитэ, пол и возраст — сайт создаст категории (абсолютный вес). Весовые категории WKF — ниже.',
                  'Жеке жана командалык ката менен кумитэни, жынысты жана жашты белгилеңиз — сайт категорияларды түзөт (абсолюттук салмак). WKF салмак категориялары — төмөндө.',
                  'Tick individual and team kata and kumite, gender and age — the site creates the categories (open weight). WKF weight classes are below.'
                )}
                buttonText={tr('Добавить категории', 'Категорияларды кошуу', 'Add categories')}
                onAdd={(cats) => setEventCategories((prev) => [...prev, ...cats])}
              />
              <h2 className="text-lg font-bold text-[var(--app-text-primary)] pt-1">
                1.3 {tr('Категории по весам и взносы', 'Салмак боюнча категориялар жана төгүмдөр', 'Weight categories & fees')}
              </h2>
              <EventSetupPanel
                key={`setup-${selectedEvent.id}`}
                mode="setup"
                hidePicker
                tournaments={tournaments}
                initialTournamentId={selectedEvent.id}
                categories={eventCategories}
                onChangeCategories={setEventCategories}
                participants={participants}
                bouts={bouts}
                tatamiNumbers={tatamiNumbers}
                onDraw={handleDrawCategory}
                onWithdraw={handleWithdrawEntry}
                onUpdateTournament={ownsEvent(selectedEvent as { ownerId?: string }) ? handleUpdateTournament : undefined}
              />
            </div>
          )}
          {inStep(2) && !eventLoading && currentUser && canRunEvent && (
            <EntryForm
              key={`entries-${selectedEvent.id}`}
              tournaments={tournaments}
              categories={eventCategories}
              participants={participants}
              currentUser={currentUser}
              initialTournamentId={selectedEvent.id}
              onAddCategories={(cats) => setEventCategories((prev) => [...prev, ...cats])}
            />
          )}
          {inStep(4) && !eventLoading && canRunEvent && (
            <div className="space-y-4">
              <EventSetupPanel
                key={`draw-${selectedEvent.id}`}
                mode="draw"
                hidePicker
                tournaments={tournaments}
                initialTournamentId={selectedEvent.id}
                categories={eventCategories}
                onChangeCategories={setEventCategories}
                participants={participants}
                bouts={bouts}
                tatamiNumbers={tatamiNumbers}
                onDraw={handleDrawCategory}
                onWithdraw={handleWithdrawEntry}
              />
              <div className="flex flex-wrap gap-2">
                <a href={`/?print=schedule&e=${encodeURIComponent(selectedEvent.id)}&lang=${language}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]">
                  {tr('Расписание по татами / PDF', 'Татамилер боюнча расписание / PDF', 'Schedule by tatami / PDF')}
                </a>
                <a href={`/?print=bracket&e=${encodeURIComponent(selectedEvent.id)}&lang=${language}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]">
                  {tr('Все сетки / PDF', 'Бардык торчолор / PDF', 'All brackets / PDF')}
                </a>
                <a href={hashForTab('event_brackets', selectedEvent.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]">
                  {tr('Сетки на сайте', 'Сайттагы торчолор', 'Brackets on the site')}
                </a>
              </div>
            </div>
          )}
          {inStep(6) && !eventLoading && canRunEvent && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {([
                  ['event_results', tr('Результаты на сайте', 'Сайттагы жыйынтыктар', 'Results on the site')],
                  ['event_medals', tr('Медальный зачёт', 'Медалдык эсеп', 'Medal table')],
                  ['event_brackets', tr('Сетки с результатами', 'Жыйынтыктары менен торчолор', 'Brackets with results')]
                ] as const).map(([tab, text]) => (
                  <a key={tab} href={hashForTab(tab, selectedEvent.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]">
                    {text}
                  </a>
                ))}
              </div>
              <DocumentsPanel key={`docs-${selectedEvent.id}`} hidePicker tournaments={tournaments} initialTournamentId={selectedEvent.id} categories={eventCategories} bouts={bouts} />
            </div>
          )}

          {/* 1.1 Информация о событии (Matching video at 00:27-00:30) */}
          {activeTab === 'event_info' && !eventLoading && (
            <TournamentInfoDetailView
              tournament={selectedEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action as EventActionType)}
              onStartRegistration={() => {
                setSelectedTournament(selectedEvent);
                setActiveTab('registration');
              }}
              entriesCount={participants.filter((p) => belongsToEvent(p.tournamentId, selectedEvent.id) && p.status !== 'withdrawn').length}
              onEdit={
                ownsEvent(selectedEvent as { ownerId?: string })
                  ? () => {
                      setEditTournamentRequest(selectedEvent.id);
                      navigateWithHash('admin');
                    }
                  : undefined
              }
            />
          )}

          {/* 1.2 Категории и цены (Matching video at 00:32-00:36) */}
          {/* Categories are still on their way: outline of the page, not the «no categories» variant */}
          {activeTab === 'event_categories_prices' && !eventLoading && !categorySync.loaded && (
            <div className="space-y-5 pb-8">
              <EventHeaderSkeleton />
              <TableSkeleton rows={7} cols={4} label={['Загружаем категории…', 'Категориялар жүктөлүүдө…', 'Loading categories…']} />
            </div>
          )}
          {activeTab === 'event_categories_prices' && !eventLoading && categorySync.loaded && eventCategories.some((c) => c.tournamentId === selectedEvent.id) && (
            <PublicCategoriesView
              event={selectedEvent}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              eventCategories={eventCategories}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
              onEnter={() => {
                setSelectedTournament(selectedEvent);
                navigateWithHash('registration');
              }}
            />
          )}
          {activeTab === 'event_categories_prices' && !eventLoading && categorySync.loaded && !eventCategories.some((c) => c.tournamentId === selectedEvent.id) && (
            <TournamentDivisionsPricingView
              tournament={selectedEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action as EventActionType)}
            />
          )}

          {/* 1.3 Сетки по площадкам и времени (Matching video at 01:40-01:54) */}
          {activeTab === 'event_brackets' && !eventLoading && (
            <PublicBracketsView
              event={selectedEvent}
              eventCategories={eventCategories}
              loading={!boutSync.loaded}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 1.4 Медали (Matching video at 01:27) */}
          {activeTab === 'event_medals' && !eventLoading && (
            <PublicResultsView mode="medals"
              event={selectedEvent}
              loading={!boutSync.loaded}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 1.5 Результаты поединков и пьедестал */}
          {activeTab === 'event_results' && !eventLoading && (
            <PublicResultsView mode="results"
              event={selectedEvent}
              loading={!boutSync.loaded}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 1.6 Live Scoring Настройки & 4-Татами Монитор (Matching video at 00:48 & 01:13) */}
          {activeTab === 'event_live_scoring' && !eventLoading && (
            <PublicLiveView
              event={selectedEvent}
              loading={!boutSync.loaded}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 2. Детали конкретного турнира */}

          {/* 3. Студии и Клубы (#studios) */}
          {activeTab === 'studios' && <ClubsPanel tournaments={tournaments} bouts={bouts} participants={participants} />}


          {/* 3.1 Личный кабинет тренера (Командная заявка) */}
          {(activeTab === 'coach' || (activeTab === 'acquiring' && effectiveRole !== 'admin')) && currentUser && !participantSync.loaded && (
            <TableSkeleton rows={5} cols={4} label={['Загружаем заявки…', 'Табыштамалар жүктөлүүдө…', 'Loading entries…']} />
          )}
          {(activeTab === 'coach' || (activeTab === 'acquiring' && effectiveRole !== 'admin')) && currentUser && participantSync.loaded && (
            <MyEntriesPanel
              user={currentUser}
              tournaments={tournaments}
              categories={eventCategories}
              participants={participants}
              bouts={bouts}
              currency="сом"
              onWithdraw={handleWithdrawEntry}
              onNewEntry={() => navigateWithHash('registration')}
            />
          )}

          {/* 3.2 «Мои спортсмены»: база спортсменов тренера или родителя (#athletes) */}
          {activeTab === 'athletes' && currentUser && <AthletesPanel user={currentUser} onNewEntry={() => navigateWithHash('registration')} />}

          {/* 4. Рейтинги и Аналитика (#rankings) */}
          {activeTab === 'rankings' && <RankingsPanel tournaments={tournaments} bouts={bouts} participants={participants} />}



          {(activeTab === 'scoreboard' || (inStep(5) && !eventLoading && canRunEvent)) && (
            <TatamiOverview
              key={selectedEvent.id}
              hidePicker
              tournaments={tournaments}
              initialTournamentId={selectedEvent.id}
              bouts={bouts}
              tatamiNumbers={tatamiNumbers}
              canScore={['admin', 'organizer', 'chief_referee', 'tatami_referee', 'scorekeeper'].includes(effectiveRole)}
              onOpenLiveNow={() => navigateWithHash('virtual_studios')}
              onOpenConsole={(b) => {
                setSelectedConsoleBoutId(b.id);
                setActiveScoreboardBout(b);
              }}
            />
          )}





          {activeTab === 'acquiring' && effectiveRole === 'admin' && (
            <FeesPanel
              key={selectedEvent.id}
              hidePicker
              tournaments={tournaments}
              initialTournamentId={selectedEvent.id}
              categories={eventCategories}
              participants={participants}
              currency="сом"
              onSetFee={handleUpdateParticipantFee}
            />
          )}

          {/* 5.4 Официальный экспорт протоколов и результатов */}
          {activeTab === 'exports' && (
            <DocumentsPanel key={selectedEvent.id} hidePicker tournaments={tournaments} initialTournamentId={selectedEvent.id} categories={eventCategories} bouts={bouts} />
          )}

          {activeTab === 'admin' && (effectiveRole === 'admin' || isOrganizer) && (
            <div className="max-w-4xl mx-auto w-full space-y-5">
            <TournamentEventsManager
              tournaments={isOrganizer ? tournaments.filter((t) => ownsEvent(t as { ownerId?: string })) : tournaments}
              currentUserRole={currentUserRole}
              onRoleChange={requestRoleChange}
              selectedTournament={selectedTournament}
              onSelectTournament={(t) => {
                setSelectedTournament(t);
                if (t.rulesType) setTournamentRules(t.rulesType);
              }}
              onAddTournament={handleAddTournament}
              onUpdateTournament={handleUpdateTournament}
              onDeleteTournament={handleDeleteTournament}
              onNavigateToDetails={(t) => handleSelectTournamentAction(t as EventItem, 'info')}
              editRequestId={editTournamentRequest}
              onEditRequestHandled={() => setEditTournamentRequest(null)}
              createRequestId={createTournamentRequest}
              onCreateRequestHandled={() => setCreateTournamentRequest(null)}
            />
              {effectiveRole === 'admin' && (
                <>
                  <UsersRolesPanel currentUserId={currentUser?.id} />
                  <InviteLinksPanel />
                  <LaunchPanel />
                </>
              )}
            </div>
          )}
          {activeTab === 'admin' && effectiveRole !== 'admin' && currentUser && (
            <MyAccountPanel
              user={currentUser}
              onNavigate={(tab) => navigateWithHash(tab)}
              onUserUpdated={(u) => setCurrentUser(u)}
            />
          )}



          {activeTab === 'registration' && currentUser && (
            <EntryForm
              tournaments={tournaments}
              categories={eventCategories}
              participants={participants}
              currentUser={currentUser}
              initialTournamentId={selectedTournament?.id}
              onAddCategories={
                currentUserRole === 'admin' || currentUserRole === 'chief_referee' || currentUserRole === 'organizer'
                  ? (cats) => setEventCategories((prev) => [...prev, ...cats])
                  : undefined
              }
            />
          )}

          {activeTab === 'event_setup' && (
            <EventSetupPanel
              key={selectedEvent.id}
              hidePicker
              tournaments={tournaments}
              initialTournamentId={selectedEvent.id}
              categories={eventCategories}
              onChangeCategories={setEventCategories}
              participants={participants}
              bouts={bouts}
              tatamiNumbers={tatamiNumbers}
              onDraw={handleDrawCategory}
              onWithdraw={handleWithdrawEntry}
              onUpdateTournament={ownsEvent(selectedEvent as { ownerId?: string }) ? handleUpdateTournament : undefined}
            />
          )}

          {activeTab === 'plan' && (
            <TournamentPlan event={selectedEvent} categories={eventCategories} participants={participants} bouts={bouts} onGo={(tab) => navigateWithHash(tab)} />
          )}

          {activeTab === 'screens' && (
            <ScreensQrPanel
              tatamiNumbers={tatamiNumbers}
              event={selectedEvent}
              tournaments={tournaments}
              onSelectEvent={(id) => {
                const ev = tournaments.find((x) => x.id === id);
                if (ev) {
                  setSelectedEvent(ev);
                  setSelectedTournament(ev);
                  rememberTournament(ev.id);
                }
              }}
              onEventUpdated={(ev) => {
                const merged = { ...selectedEvent, liveStreams: ev.liveStreams } as EventItem;
                setTournaments((prev) => prev.map((x) => (x.id === merged.id ? { ...x, liveStreams: merged.liveStreams } : x)));
                setSelectedEvent(merged);
              }}
            />
          )}

          {activeTab === 'lan' && <OfflinePanel onOpenScreens={() => navigateWithHash('screens')} />}


          {(activeTab === 'participants' || (inStep(3) && !eventLoading && canRunEvent)) && !participantSync.loaded && (
            <TableSkeleton rows={8} cols={5} label={['Загружаем участников…', 'Катышуучулар жүктөлүүдө…', 'Loading participants…']} />
          )}
          {(activeTab === 'participants' || (inStep(3) && !eventLoading && canRunEvent)) && participantSync.loaded && (
            <ParticipantsManager
              key={selectedEvent.id}
              hidePicker
              participants={participants}
              tournaments={tournaments}
              categories={eventCategories}
              defaultTournamentId={selectedEvent.id}
              onUpdateParticipant={handleUpdateParticipant}
              onNavigateToRegister={() => setActiveTab('admin')}
            />
          )}


          {activeTab === 'virtual_studios' && (
            <LiveNowPanel loading={!tournamentsLoaded || !boutSync.loaded} tournaments={tournaments} bouts={bouts} participants={participants} onOpen={(ev) => handleSelectTournamentAction(ev as EventItem, 'live_scoring')} />
          )}

          {activeTab === 'about' && (
            <AboutUsView language={language} />
          )}

          {activeTab === 'legal' && <LegalPage language={language as 'ru' | 'ky' | 'en'} />}

          {activeTab === 'help' && <RoleGuide initial={effectiveRole === 'club_coach' ? 'coach' : effectiveRole === 'admin' ? 'organizer' : ['tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer'].includes(effectiveRole) ? 'official' : 'athlete'} />}
          {activeTab === 'help' && (
            <HelpFaqView language={language} />
          )}

          {activeTab === 'manage' && !eventLoading && canRunEvent && (
            <WorkflowFooter
              eventId={selectedEvent.id}
              step={workflowStep}
              language={language}
              onStep={(n) => {
                setWorkflowStep(n);
                document.querySelector('main')?.parentElement?.scrollTo({ top: 0 });
              }}
            />
          )}

          </>)}
          </React.Suspense>
          </ErrorBoundary>
        </main>

        {/* ========================================================
            APSATAROV OFFICIAL FOOTER WITH PRIVACY POLICY & COMPACT BOT DOCK
           ======================================================== */}
        <footer className="theme-keep mt-auto border-t border-[var(--app-border)] bg-[var(--app-surface)] pt-10 pb-24 lg:pb-10 px-5 sm:px-8 text-[var(--app-text-secondary)]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-3">
              <a href="#home" onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigateWithHash('tournaments'); } }} className="flex items-center gap-2.5">
                <BrandMark className="w-9 h-9" />
                <span className="text-xl font-extrabold tracking-tight text-[var(--app-text-primary)]">
                  Apsatarov
                </span>
              </a>
              <p className="text-[15px] leading-relaxed text-[var(--app-text-secondary)] max-w-xs">
                {tr(
                  'Турниры по каратэ онлайн: заявки, жеребьёвка, табло и результаты — в одном месте.',
                  'Каратэ мелдештери онлайн: өтүнмөлөр, чүчүкулак, табло жана жыйынтыктар — бир жерде.',
                  'Karate tournaments online: entries, draw, scoreboards and results in one place.'
                )}
              </p>
            </div>

            {/* Sections */}
            <nav className="space-y-3" aria-label={tr('Разделы', 'Бөлүмдөр', 'Sections')}>
              <div className="text-sm font-semibold text-[var(--app-text-primary)]">{tr('Разделы', 'Бөлүмдөр', 'Sections')}</div>
              <ul className="space-y-2 text-[15px]">
                {([
                  ['tournaments', tr('Турниры', 'Мелдештер', 'Tournaments')],
                  ['virtual_studios', tr('Идут бои', 'Беттештер жүрүүдө', 'Live now')],
                  ['rankings', tr('Рейтинги', 'Рейтингдер', 'Rankings')],
                  ['studios', tr('Клубы', 'Клубдар', 'Clubs')]
                ] as const).map(([tab, label]) => (
                  <li key={tab}>
                    <a
                      href={hashForTab(tab)}
                      onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigateWithHash(tab); } }}
                      className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Help */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--app-text-primary)]">{tr('Помощь', 'Жардам', 'Help')}</div>
              <ul className="space-y-2 text-[15px]">
                <li>
                  <a href="#help" onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigateWithHash('help'); } }} className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {tr('Инструкция', 'Нускама', 'How it works')}
                  </a>
                </li>
                <li>
                  <a href="#about" onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigateWithHash('about'); } }} className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {tr('О платформе', 'Платформа жөнүндө', 'About')}
                  </a>
                </li>
                <li>
                  <a href={legalHash('privacy')} className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {tr('Политика обработки персональных данных', 'Жеке маалыматтарды иштетүү саясаты', 'Personal data policy')}
                  </a>
                </li>
                <li>
                  <a href={legalHash('terms')} className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {tr('Пользовательское соглашение', 'Колдонуучу келишими', 'Terms of use')}
                  </a>
                </li>
                <li>
                  <a href={legalHash('payment')} className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {tr('Оплата взносов и возврат', 'Төгүмдөрдү төлөө жана кайтаруу', 'Entry fees and refunds')}
                  </a>
                </li>
                {aiAssistantEnabled && (
                  <li>
                    <button onClick={() => window.dispatchEvent(new Event('open-sensei-ai'))} className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline transition-colors cursor-pointer">
                      <Bot className="w-4 h-4" /> {tr('Спросить ассистента', 'Жардамчыдан суроо', 'Ask the assistant')}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-6 border-t border-[var(--app-border)] flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--app-text-muted)]">
            <span>© {new Date().getFullYear()} Apsatarov</span>
            <span>{tr('Сделано для каратэ Кыргызстана', 'Кыргызстандын каратэси үчүн жасалган', 'Made for karate in Kyrgyzstan')}</span>
          </div>
        </footer>
      </div>

      {/* Chief Referee Manual Override Global Modal */}
      {isGlobalManualModalOpen && (
        <BoutConsole
          bout={bouts.find((b) => b.id === selectedConsoleBoutId) || bouts[0]}
          rules={tournamentRules}
          onChange={handleUpdateBout}
          onClose={() => setIsGlobalManualModalOpen(false)}
        />
      )}

      {/* Electronic Scoreboard Interactive Modal */}
      {activeScoreboardBout && (bouts.find((b) => b.id === activeScoreboardBout.id) || activeScoreboardBout) && (
        <BoutConsole
          bout={bouts.find((b) => b.id === activeScoreboardBout.id) || activeScoreboardBout}
          rules={tournamentRules}
          onChange={handleUpdateBout}
          onClose={() => setActiveScoreboardBout(null)}
          tatamiBouts={bouts.filter((b) => b.tatamiNumber === activeScoreboardBout.tatamiNumber)}
          onNextBout={() => {
            const next = upcomingOf(bouts, activeScoreboardBout.tatamiNumber ?? 1, activeScoreboardBout.id, 1)[0];
            if (next) setActiveScoreboardBout(next);
          }}
        />
      )}


      {/* AI assistant «Сенсей» (Claude) — only when the server has an AI key */}
      {aiAssistantEnabled && (
        <ErrorBoundary silent>
        <SenseiAiChatbot
          currentTournament={selectedTournament}
          tournamentRules={tournamentRules}
          participantCount={participants.length}
          tatamiCount={tatamiNumbers.length}
        />
        </ErrorBoundary>
      )}


      {/* Sign-in modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        currentUser={currentUser}
        onAuthenticated={(userProfile) => {
          setCurrentUser(userProfile);
          if (userProfile.role) setCurrentUserRole(userProfile.role);
          setGlobalSystemToast(`✓ Добро пожаловать, ${userProfile.fullName}! Профиль успешно подтвержден.`);
          setTimeout(() => setGlobalSystemToast(null), 5000);
        }}
        onLogout={handleLogout}
        language={language}
        // Secret staff invitation fixes the role; public links (?join=...) only pre-select athlete or coach
        lockedRole={inviteToken ? inviteRole : null}
        suggestedRole={inviteToken ? null : inviteRole}
        inviteToken={inviteToken}
      />

      {/* Official Privacy Policy & Data Protection Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        language={language}
      />

      {/* Global Delete Tournament Confirmation Dialog Modal ("Да" / "Нет") */}
      {globalPendingDeleteTournament && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setGlobalPendingDeleteTournament(null)}
        >
          <div
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-confirm-delete-title"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 id="global-confirm-delete-title" className="text-base font-bold text-white">
                  {tr(
                    'Подтверждение удаления турнира',
                    'Мелдешти өчүрүүнү тастыктоо',
                    'Confirm Tournament Deletion'
                  )}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tr(
                    `Вы действительно хотите удалить турнир «${globalPendingDeleteTournament.title}» (${globalPendingDeleteTournament.startDate} — ${globalPendingDeleteTournament.endDate}) из базы данных?`,
                    `Сиз чын эле «${globalPendingDeleteTournament.title}» (${globalPendingDeleteTournament.startDate} — ${globalPendingDeleteTournament.endDate}) мелдешин маалымат базасынан өчүргүңүз келеби?`,
                    `Are you sure you want to delete the tournament "${globalPendingDeleteTournament.title}" (${globalPendingDeleteTournament.startDate} — ${globalPendingDeleteTournament.endDate}) from the database?`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setGlobalPendingDeleteTournament(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold tabular-nums transition-colors cursor-pointer"
              >
                {tr('Нет', 'Жок', 'No')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = globalPendingDeleteTournament.id;
                  setGlobalPendingDeleteTournament(null);
                  handleDeleteTournament(targetId);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tabular-nums transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr('Да', 'Ооба', 'Yes')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MOBILE & TABLET THUMB-ZONE BOTTOM NAVIGATION BAR (lg:hidden)
         ======================================================== */}
      <nav
        className="theme-keep lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 pb-safe border-t backdrop-blur-md grid grid-cols-5 items-center px-1 select-none bg-[var(--app-surface)]/95 border-[var(--app-border)] text-[var(--app-text-secondary)]"
        aria-label={tr('Нижняя панель быстрой навигации', 'Төмөнкү ыкчам навигация панели', 'Mobile Bottom Navigation Bar')}
      >
        {/* Five buttons chosen for the role: what each person needs most at the tournament */}
        {(() => {
          type BottomItem = { key: string; label: string; icon: React.ElementType; active: boolean; onClick: () => void; live?: boolean };
          const go = (tab: string, label: string, icon: React.ElementType, also: string[] = [], live = false): BottomItem => ({
            key: tab,
            label,
            icon,
            live,
            active: activeTab === tab || also.includes(activeTab),
            onClick: () => navigateWithHash(tab)
          });
          const events = go('tournaments', tr('Турниры', 'Мелдештер', 'Events'), Calendar, ['event_info', 'event_categories_prices', 'event_results', 'event_medals']);
          const liveNow = go('virtual_studios', tr('Идут бои', 'Түз эфир', 'Live'), Video, ['event_live_scoring'], true);
          const brackets = go('event_brackets', tr('Сетки', 'Торчолор', 'Brackets'), Trophy);
          const tatami = go('scoreboard', tr('Татами', 'Татами', 'Tatami'), Tv);
          const menu: BottomItem = { key: 'menu', label: tr('Меню', 'Меню', 'Menu'), icon: Menu, active: isMobileNavOpen, onClick: () => setIsMobileNavOpen(true) };
          const cabinet = go('admin', tr('Кабинет', 'Кабинет', 'Account'), UserCircle2);
          const role = effectiveRole;
          const items: BottomItem[] =
            role === 'guest'
              ? [
                  events,
                  liveNow,
                  brackets,
                  {
                    key: 'login',
                    label: tr('Войти', 'Кирүү', 'Sign in'),
                    icon: LogIn,
                    active: false,
                    onClick: () => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }
                  },
                  menu
                ]
              : role === 'admin'
                ? [go('manage', tr('Турнир', 'Мелдеш', 'Run'), ClipboardList), events, tatami, go('screens', tr('Экраны', 'Экрандар', 'Screens'), QrCode), menu]
                : role === 'club_coach' || role === 'athlete'
                  ? [events, go('registration', tr('Заявка', 'Табыштама', 'Enter'), ClipboardList), go('athletes', tr('Спортсмены', 'Спортчулар', 'Athletes'), Users), liveNow, menu]
                  : [
                      // Officials: tatami console first; weigh-in for those who run it, otherwise brackets
                      canAccess('scoreboard', role) ? tatami : brackets,
                      canAccess('participants', role) ? go('participants', tr('Взвешивание', 'Таразалоо', 'Weigh-in'), Scale) : brackets,
                      liveNow,
                      cabinet,
                      menu
                    ];
          return items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                aria-current={item.active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
                  item.active ? 'text-[var(--accent)] font-semibold' : 'hover:text-[var(--app-text-primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.live && <span className="absolute top-2 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-red-600" aria-hidden />}
                <span className="text-[10.5px] leading-none truncate max-w-[74px] tracking-tight">{item.label}</span>
              </button>
            );
          });
        })()}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
