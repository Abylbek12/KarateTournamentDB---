import React, { useState } from 'react';
import { 
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
import { AuthModal, PrivacyPolicyModal } from './components/AuthAndPrivacyModals';
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
import { canAccess, ROLE_LABELS, type AccessRole } from './utils/access';
import { applyBoutResult } from './utils/bracketProgression';
import { AccessGate } from './components/AccessGate';
import { TatamiMark, TatamiWordmark } from './components/BrandLogo';
import { UsersRolesPanel } from './components/UsersRolesPanel';
import { InviteLinksPanel } from './components/InviteLinksPanel';
import { PublicBracketsView, PublicResultsView, PublicLiveView, PublicCategoriesView } from './components/PublicEventViews';
import { BoutConsole } from './components/BoutConsole';
import { EntryForm } from './components/EntryForm';
import { EventSetupPanel } from './components/EventSetupPanel';
import { activeEntries, categoryName } from './utils/eventCategories';
import { getDeviceKey, setDeviceKey } from './utils/liveStream';
import { startServerClock } from './utils/serverClock';
import { hashForTab, tabFromHash, isEventTab, isPlainClick } from './utils/routes';
import { TatamiDisplay, CallRoomDisplay, TatamiControl, upcomingOf } from './components/TatamiScreens';
import { MyAccountPanel } from './components/MyAccountPanel';
import { RoleGuide } from './components/RoleGuide';
import { PrintDocuments, parsePrintRequest } from './components/PrintDocuments';
import { DocumentsPanel } from './components/DocumentsPanel';
import { LaunchPanel } from './components/LaunchPanel';
import { TatamiOverview } from './components/TatamiOverview';
import { OfflinePanel } from './components/OfflinePanel';

// Heavy screens are loaded on demand so the first page opens faster.
const ParticipantsManager = React.lazy(() => import('./components/ParticipantsManager').then((m) => ({ default: m.ParticipantsManager })));
const TournamentInfoDetailView = React.lazy(() => import('./components/TournamentInfoDetailView').then((m) => ({ default: m.TournamentInfoDetailView })));
const TournamentDivisionsPricingView = React.lazy(() => import('./components/TournamentDivisionsPricingView').then((m) => ({ default: m.TournamentDivisionsPricingView })));

const ScreensQrPanel = React.lazy(() => import('./components/ScreensQrPanel').then((m) => ({ default: m.ScreensQrPanel })));

const ScreenLoader = () => (
  <div className="flex items-center justify-center py-16 text-sm text-slate-500">Загрузка…</div>
);

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

  const [activeTab, setActiveTab] = useState<string>('tournaments');
  useGlobalDomTranslator(language, activeTab);
  const [tournaments, setTournaments] = useState<EventItem[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament>(DEMO_EVENTS[0]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem>(DEMO_EVENTS[0]);
  const [tournamentRules, setTournamentRules] = useState<TournamentRules>('wkf');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserProfile | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('club_coach');
  // What the visitor may see: 'guest' until signed in.
  const effectiveRole: AccessRole = currentUser ? currentUserRole : 'guest';

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

  // Unified tournaments registry fetch on mount
  React.useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        // The server list is the truth: after «Подготовка к запуску» it can be empty.
        if (data.events && Array.isArray(data.events)) {
          setTournaments(data.events);
          if (data.events.length > 0) {
            setSelectedEvent((cur) => data.events.find((e: EventItem) => e.id === cur.id) || data.events[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Verify and fetch authenticated session on mount
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.user.role) setCurrentUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

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
    if (currentUserRole !== 'admin') {
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
      availableActions: (newTournament as any).availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring']
    };

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
        `✓ Турнир «${asEvent.title}» опубликован и синхронизирован с витриной!`,
        `✓ «${asEvent.title}» мелдеши жарыяланды жана витрина менен синхрондоштурулду!`,
        `✓ Tournament "${asEvent.title}" published and synced with showcase!`
      )
    );
    setTimeout(() => setGlobalSystemToast(null), 5000);
  };

  const handleUpdateTournament = async (updatedTournament: Tournament) => {
    if (currentUserRole !== 'admin') {
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
    if (currentUserRole !== 'admin') {
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
  const [bouts, setBoutsState, boutSync] = useServerSyncedState<Bout[]>('bouts', [], { ...sharedStateOptions, autoSave: false, pollMs: 1000 });
  // Tatami of the selected tournament (at least the ones bouts are already assigned to)
  const tatamiNumbers = React.useMemo(() => {
    const ev = selectedEvent as EventItem & { tatamiCount?: number };
    const planned = Math.min(12, Math.max(1, Number(ev.tatamiCount || ev.ringsCount) || 4));
    const used = bouts.reduce((m, b) => Math.max(m, b.tatamiNumber || 0), 0);
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
  const [participants, setParticipants] = useServerSyncedState<Participant[]>('participants', [], {
    ...sharedStateOptions,
    pollMs: standaloneScreen ? 60_000 : 3000,
    // Athletes and coaches submit entries through /api/entries; only officials edit the list.
    canWrite: !!currentUser && ['admin', 'chief_referee', 'scorekeeper', 'medical_officer'].includes(currentUser.role)
  });
  const [protocols, setProtocols] = useServerSyncedState<RefereeProtocol[]>('protocols', [], { ...sharedStateOptions, pollMs: standaloneScreen ? 60_000 : 10_000 });
  // Tournament categories created by the organizer (server-stored).
  const [eventCategories, setEventCategories] = useServerSyncedState<EventCategory[]>('categories', [], {
    ...sharedStateOptions,
    pollMs: standaloneScreen ? 60_000 : 5000,
    canWrite: !!currentUser && ['admin', 'chief_referee'].includes(currentUser.role)
  });
  const [activeScoreboardBout, setActiveScoreboardBout] = useState<Bout | null>(null);
  const [editTournamentRequest, setEditTournamentRequest] = useState<string | null>(null);
  const [selectedConsoleBoutId, setSelectedConsoleBoutId] = useState<string>(SAMPLE_BOUTS[0].id);
  const [isGlobalManualModalOpen, setIsGlobalManualModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'confirm_profile'>('login');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [globalSystemToast, setGlobalSystemToast] = useState<string | null>(null);
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
    window.addEventListener('tatami-check-expired-events', handleCustomCheck);
    const intervalId = window.setInterval(evaluateAllEventsExpiration, 30000);
    return () => {
      window.removeEventListener('tatami-check-expired-events', handleCustomCheck);
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
      case 'event_info': return `${selectedEvent.title} — Информация`;
      case 'event_categories_prices': return `${selectedEvent.title} — Категории и цены`;
      case 'event_brackets': return `${selectedEvent.title} — Сетки`;
      case 'event_medals': return `${selectedEvent.title} — Медали`;
      case 'event_live_scoring': return `${selectedEvent.title} — Live Scoring`;
      case 'event_results': return `${selectedEvent.title} — Результаты`;
      case 'studios': return language === 'ru' ? 'Клубы' : 'Clubs';
      case 'virtual_studios': return language === 'ru' ? 'Сейчас на татами' : 'Live now';
      case 'about': return language === 'ru' ? 'О платформе Tatami.kg' : language === 'ky' ? 'Tatami.kg жөнүндө' : 'About Tatami.kg';
      case 'help': return language === 'ru' ? 'Помощь и FAQ' : language === 'ky' ? 'Жардам жана FAQ' : 'Help & FAQ';
      case 'coach': return language === 'ru' ? 'Мои заявки и оплата' : 'My entries & fees';
      case 'rankings': return language === 'ru' ? 'Рейтинги' : 'Rankings';
      case 'acquiring': return language === 'ru' ? 'Взносы' : 'Entry fees';
      case 'scoreboard': return language === 'ru' ? 'Татами' : 'Tatami';
      case 'exports': return language === 'ru' ? 'Документы и печать' : 'Documents & Printing';
      case 'lan': return language === 'ru' ? 'Работа без интернета' : 'Offline mode';
      case 'participants': return language === 'ru' ? 'База участников' : 'Athlete Database';
      case 'admin': return language === 'ru' ? 'Панель администратора' : 'Admin Panel';
      case 'registration': return language === 'ru' ? 'Электронная регистрация' : 'Online Registration';
      default: return 'Tatami.kg';
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
    if (join === 'athlete' || join === 'coach') {
      setInviteRole(join === 'coach' ? 'club_coach' : 'athlete');
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
    } else if (token) {
      fetch(`/api/invites/${encodeURIComponent(token)}`)
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
        .catch(() => {});
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
    const target = hashForTab(activeTab, isEventTab(activeTab) ? selectedEvent.id : undefined);
    if (window.location.hash === target) return;
    const current = tabFromHash(window.location.hash);
    // Opening a link to a tournament page before the tournament list has loaded: keep it
    if (current && current.tab === activeTab && current.eventId && !tournaments.some((t) => t.id === current.eventId)) return;
    if (!window.location.hash && activeTab === 'tournaments') {
      window.history.replaceState(null, '', target);
      return;
    }
    window.history.pushState(null, '', target);
  }, [activeTab, selectedEvent.id]); // eslint-disable-line react-hooks/exhaustive-deps


  // 1-Click Database Reset Handler (Preserving Database Schema)

  // Automatic playoff bracket progression when a bout finishes
  /** Draw for one organizer category: bracket from its active entries on the chosen tatami. */
  const handleDrawCategory = (def: EventCategory, tatamiNumber: number) => {
    const entries = activeEntries(participants, def.id);
    const tatami = SAMPLE_TATAMIS.find((t) => t.number === tatamiNumber) || ({ ...SAMPLE_TATAMIS[0], id: `tatami-${tatamiNumber}`, number: tatamiNumber, name: `Татами ${tatamiNumber}` } as typeof SAMPLE_TATAMIS[0]);
    const generatorCategory = {
      id: def.id,
      tournamentId: def.tournamentId,
      discipline: def.discipline === 'team_kata' ? 'kata' : def.discipline === 'team_kumite' ? 'kumite' : def.discipline,
      gender: def.gender === 'mixed' ? 'male' : def.gender,
      bracketType: 'olympic_with_repechage',
      assignedTatamiId: tatami.id
    } as unknown as TournamentCategory;
    const { bouts: catBouts } = generateProtectedWkfCategoryBouts(generatorCategory, entries, [tatami], {
      durationSeconds: def.durationSeconds,
      categoryTitle: categoryName(def)
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
    setBouts((prev) => applyBoutResult(prev, updatedBout, find));
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
    return <PrintDocuments request={printRequest} tournaments={tournaments} categories={eventCategories} bouts={bouts} participants={participants} />;
  }

  if (screenMode) {
    if (screenMode.kind === 'tatami') return <TatamiDisplay tatamiNumber={screenMode.tatami} bouts={bouts} rules={tournamentRules} />;
    if (screenMode.kind === 'calls') return <CallRoomDisplay bouts={bouts} tatamiNumbers={tatamiNumbers} />;
    return (
      <>
        <TatamiControl tatamiNumber={screenMode.tatami} bouts={bouts} rules={tournamentRules} deviceOk={deviceOk} onChange={handleUpdateBout} />
        {globalSystemToast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] rounded-xl bg-black/85 text-white text-sm px-4 py-2">{globalSystemToast}</div>
        )}
      </>
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
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
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
              title="Tatami.kg — на главную"
            >
              <TatamiMark className="w-7 h-7 shrink-0" />
              <TatamiWordmark className="text-lg sm:text-xl text-slate-800 group-hover:text-sky-600 transition-colors truncate" />
            </button>

          </div>

          {/* Right: Clean Header Bar (Alerts, Training & Unified Profile Menu with Role, Theme & Language) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 font-sans">

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
                className="flex items-center gap-2 bg-white hover:bg-slate-50 px-2.5 py-1.5 sm:py-1 rounded-full border border-slate-200/90 shadow-2xs transition-colors cursor-pointer min-h-[36px] sm:min-h-0"
                title={tr(
                  'Меню профиля: роль доступа (RBAC), тема оформления, язык и аккаунт',
                  'Профиль менюсу: кирүү ролу (RBAC), тема, тил жана аккаунт',
                  'Profile Menu: RBAC role, color theme, language & account'
                )}
              >
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-teal-500" />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                      currentUserRole === 'admin' ? 'bg-rose-600' : 'bg-sky-600'
                    }`}
                  >
                    {currentUser?.fullName
                      ? currentUser.fullName.charAt(0).toUpperCase()
                      : currentUserRole === 'admin'
                      ? 'A'
                      : 'U'}
                  </div>
                )}

                <span className="text-xs font-semibold text-slate-800 max-w-[110px] truncate">
                  {currentUser?.fullName || tr('Войти', 'Кирүү', 'Sign in')}
                </span>

                <span
                  className={`${effectiveRole === 'guest' ? 'hidden' : 'hidden sm:inline-flex'} text-[10px] font-semibold px-1.5 py-0.2 rounded-full border items-center gap-0.5 ${
                    effectiveRole === 'admin'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      : effectiveRole === 'guest'
                        ? 'bg-slate-500/10 text-slate-600 border-slate-500/30'
                        : 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                  }`}
                >
                  {ROLE_LABELS[effectiveRole]}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <>

                  <div className="fixed left-3 right-3 top-14 max-h-[calc(100dvh-8rem)] overflow-y-auto sm:absolute sm:left-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 sm:max-h-none sm:overflow-visible rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-xs space-y-3 animate-fadeIn">
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
          <div className="bg-rose-950/95 border-b border-rose-500 text-white px-4 py-2.5 shadow-2xl backdrop-blur sticky top-16 z-30 flex items-center justify-between text-xs sm:text-sm font-mono animate-fadeIn">
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
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
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
          <div className="bg-emerald-600/90 text-white border-b border-emerald-500 px-4 py-2.5 shadow-lg backdrop-blur sticky top-16 z-20 flex items-center justify-between text-xs sm:text-sm font-medium animate-fadeIn">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              {globalSystemToast}
            </span>
            <button 
              onClick={() => setGlobalSystemToast(null)}
              className="text-emerald-200 hover:text-white text-xs px-2 py-0.5 rounded bg-emerald-800/60"
            >
              ✕ {tr('Закрыть', 'Жабуу', 'Close')}
            </button>
          </div>
        )}

        {/* Global Event Date Expiration Archive Listener Banner (Works in ALL interface sections, Moves to Archive Instead of Auto-Deleting) */}
        {effectiveRole === 'admin' && expiredEventsList.length > 0 && !dismissedExpiredBanner && (
          <div className="px-4 sm:px-6 pt-2">
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 px-3.5 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                  <Archive className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-semibold text-amber-600 dark:text-amber-300 mr-1.5">
                    {tr(
                      `Архив завершённых турниров (${expiredEventsList.length}):`,
                      `Аяктаган мелдештер архиви (${expiredEventsList.length}):`,
                      `Concluded Tournaments Archive (${expiredEventsList.length}):`
                    )}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {tr(
                      `Срок проведения «${expiredEventsList[0].title}» (${expiredEventsList[0].endDate}) истёк. Турнир автоматически перемещён во вкладку «Архив» (вместо удаления).`,
                      `«${expiredEventsList[0].title}» (${expiredEventsList[0].endDate}) мелдешинин мөөнөтү аяктады. Мелдеш автоматтык түрдө «Архив» өтмөгүнө которулду (өчүрүүнүн ордуна).`,
                      `Event "${expiredEventsList[0].title}" (${expiredEventsList[0].endDate}) has concluded and was automatically moved to the "Archive" tab instead of being deleted.`
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigateWithHash('admin');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('tatami-open-archive-tab'));
                    }, 50);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-amber-200 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Archive className="w-3 h-3" />
                  <span>{tr('Открыть вкладку Архива', 'Архив өтмөгүн ачуу', 'Open Archive Tab')}</span>
                </button>
                {currentUserRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setGlobalPendingDeleteTournament(expiredEventsList[0])}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title={tr('Удалить турнир с подтверждением (Да / Нет)', 'Мелдешти тастыктоо менен өчүрүү (Ооба / Жок)', 'Delete tournament with confirmation (Yes / No)')}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>
                      {tr('Удалить турнир', 'Мелдешти өчүрүү', 'Delete Tournament')}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDismissedExpiredBanner(true)}
                  className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={tr('Скрыть напоминание (событие останется в архиве)', 'Эскертмени жашыруу (мелдеш архивде калат)', 'Dismiss reminder (event stays in archive)')}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full-width Stretched Content Area */}
        <main className="flex-1 w-full min-w-0 px-3 sm:px-6 py-2.5 sm:py-3 space-y-4">
          <React.Suspense fallback={<ScreenLoader />}>
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
              onOpenCreateTournament={() => navigateWithHash('admin')}
              onRequestDeleteTournament={(t) => setGlobalPendingDeleteTournament(t)}
              onOpenLiveBroadcast={() => navigateWithHash('virtual_studios')}
            />
          )}

          {/* 1.1 Информация о событии (Matching video at 00:27-00:30) */}
          {activeTab === 'event_info' && (
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
                effectiveRole === 'admin'
                  ? () => {
                      setEditTournamentRequest(selectedEvent.id);
                      navigateWithHash('admin');
                    }
                  : undefined
              }
            />
          )}

          {/* 1.2 Категории и цены (Matching video at 00:32-00:36) */}
          {activeTab === 'event_categories_prices' && eventCategories.some((c) => c.tournamentId === selectedEvent.id) && (
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
          {activeTab === 'event_categories_prices' && !eventCategories.some((c) => c.tournamentId === selectedEvent.id) && (
            <TournamentDivisionsPricingView
              tournament={selectedEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action as EventActionType)}
            />
          )}

          {/* 1.3 Сетки по площадкам и времени (Matching video at 01:40-01:54) */}
          {activeTab === 'event_brackets' && (
            <PublicBracketsView
              event={selectedEvent}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 1.4 Медали (Matching video at 01:27) */}
          {activeTab === 'event_medals' && (
            <PublicResultsView mode="medals"
              event={selectedEvent}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 1.5 Результаты поединков и пьедестал */}
          {activeTab === 'event_results' && (
            <PublicResultsView mode="results"
              event={selectedEvent}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              language={language}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedEvent, action)}
            />
          )}

          {/* 1.6 Live Scoring Настройки & 4-Татами Монитор (Matching video at 00:48 & 01:13) */}
          {activeTab === 'event_live_scoring' && (
            <PublicLiveView
              event={selectedEvent}
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
          {(activeTab === 'coach' || (activeTab === 'acquiring' && effectiveRole !== 'admin')) && currentUser && (
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

          {/* 4. Рейтинги и Аналитика (#rankings) */}
          {activeTab === 'rankings' && <RankingsPanel tournaments={tournaments} bouts={bouts} participants={participants} />}



          {activeTab === 'scoreboard' && (
            <TatamiOverview
              tournaments={tournaments}
              initialTournamentId={selectedEvent.id}
              bouts={bouts}
              tatamiNumbers={tatamiNumbers}
              canScore={['admin', 'chief_referee', 'tatami_referee', 'scorekeeper'].includes(effectiveRole)}
              onOpenConsole={(b) => {
                setSelectedConsoleBoutId(b.id);
                setActiveScoreboardBout(b);
              }}
            />
          )}





          {activeTab === 'acquiring' && effectiveRole === 'admin' && (
            <FeesPanel
              tournaments={tournaments}
              initialTournamentId={selectedTournament?.id}
              categories={eventCategories}
              participants={participants}
              currency="сом"
              onSetFee={handleUpdateParticipantFee}
            />
          )}

          {/* 5.4 Официальный экспорт протоколов и результатов */}
          {activeTab === 'exports' && (
            <DocumentsPanel tournaments={tournaments} initialTournamentId={selectedEvent.id} categories={eventCategories} bouts={bouts} />
          )}

          {activeTab === 'admin' && effectiveRole === 'admin' && <UsersRolesPanel currentUserId={currentUser?.id} />}
          {activeTab === 'admin' && effectiveRole === 'admin' && <InviteLinksPanel />}
          {activeTab === 'admin' && effectiveRole === 'admin' && <LaunchPanel />}
          {activeTab === 'admin' && effectiveRole !== 'admin' && currentUser && (
            <MyAccountPanel
              user={currentUser}
              onNavigate={(tab) => navigateWithHash(tab)}
              onUserUpdated={(u) => setCurrentUser(u)}
            />
          )}

          {activeTab === 'admin' && effectiveRole === 'admin' && (
            <TournamentEventsManager
              tournaments={tournaments}
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
            />
          )}


          {activeTab === 'registration' && currentUser && (
            <EntryForm
              tournaments={tournaments}
              categories={eventCategories}
              participants={participants}
              currentUser={currentUser}
              initialTournamentId={selectedTournament?.id}
            />
          )}

          {activeTab === 'event_setup' && (
            <EventSetupPanel
              tournaments={tournaments}
              initialTournamentId={selectedTournament?.id}
              categories={eventCategories}
              onChangeCategories={setEventCategories}
              participants={participants}
              bouts={bouts}
              tatamiNumbers={tatamiNumbers}
              onDraw={handleDrawCategory}
              onWithdraw={handleWithdrawEntry}
            />
          )}

          {activeTab === 'screens' && <ScreensQrPanel tatamiNumbers={tatamiNumbers} />}

          {activeTab === 'lan' && <OfflinePanel onOpenScreens={() => navigateWithHash('screens')} />}


          {activeTab === 'participants' && (
            <ParticipantsManager
              participants={participants}
              tournaments={tournaments}
              categories={eventCategories}
              defaultTournamentId={selectedTournament?.id}
              onUpdateParticipant={handleUpdateParticipant}
              onNavigateToRegister={() => setActiveTab('admin')}
            />
          )}


          {activeTab === 'virtual_studios' && (
            <LiveNowPanel tournaments={tournaments} bouts={bouts} participants={participants} onOpen={(ev) => handleSelectTournamentAction(ev as EventItem, 'live_scoring')} />
          )}

          {activeTab === 'about' && (
            <AboutUsView language={language} />
          )}

          {activeTab === 'help' && <RoleGuide initial={effectiveRole === 'club_coach' ? 'coach' : effectiveRole === 'admin' ? 'organizer' : ['tatami_referee', 'scorekeeper', 'chief_referee', 'medical_officer'].includes(effectiveRole) ? 'official' : 'athlete'} />}
          {activeTab === 'help' && (
            <HelpFaqView language={language} />
          )}

          </>)}
          </React.Suspense>
        </main>

        {/* ========================================================
            TATAMI.KG OFFICIAL FOOTER WITH PRIVACY POLICY & COMPACT BOT DOCK
           ======================================================== */}
        <footer className="theme-keep mt-auto border-t border-[var(--app-border)] bg-[var(--app-surface)] pt-10 pb-24 lg:pb-10 px-5 sm:px-8 text-[var(--app-text-secondary)]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-3">
              <a href="#home" onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigateWithHash('tournaments'); } }} className="flex items-center gap-2.5">
                <TatamiMark className="w-9 h-9" />
                <span className="text-xl font-extrabold tracking-tight text-[var(--app-text-primary)]">
                  Tatami<span className="text-rose-500">.kg</span>
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
                  <button onClick={() => setIsPrivacyModalOpen(true)} className="text-[var(--app-text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer">
                    {tr('Политика конфиденциальности', 'Купуялуулук саясаты', 'Privacy policy')}
                  </button>
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
            <span>© {new Date().getFullYear()} Tatami.kg</span>
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
        <SenseiAiChatbot
          currentTournament={selectedTournament}
          tournamentRules={tournamentRules}
          participantCount={participants.length}
          tatamiCount={tatamiNumbers.length}
        />
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
        lockedRole={inviteRole}
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
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5"
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
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors cursor-pointer"
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
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
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
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 pb-safe border-t backdrop-blur-md grid grid-cols-5 items-center px-1 select-none ${
          theme === 'dark'
            ? 'bg-[#111722]/95 border-[#253042] text-[#9aa8bc]'
            : 'bg-white/95 border-slate-200/90 text-slate-600'
        }`}
        aria-label={tr('Нижняя панель быстрой навигации', 'Төмөнкү ыкчам навигация панели', 'Mobile Bottom Navigation Bar')}
      >
        <button
          type="button"
          onClick={() => navigateWithHash('tournaments')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'tournaments' || activeTab === 'event_info'
              ? 'text-sky-500 font-semibold'
              : 'hover:text-sky-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px] leading-none truncate max-w-[64px]">
            {tr('События', 'Окуялар', 'Events')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigateWithHash(canAccess('scoreboard', effectiveRole) ? 'scoreboard' : 'event_live_scoring')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'scoreboard' || activeTab === 'event_live_scoring'
              ? 'text-sky-500 font-semibold'
              : 'hover:text-sky-500'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[11px] leading-none truncate max-w-[64px]">
            {tr('Табло', 'Табло', 'Live')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigateWithHash(canAccess('event_setup', effectiveRole) ? 'event_setup' : 'event_brackets')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'event_setup' || activeTab === 'event_brackets'
              ? 'text-sky-500 font-semibold'
              : 'hover:text-sky-500'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[11px] leading-none truncate max-w-[64px]">
            {tr('Сетки', 'Торчолор', 'Brackets')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (effectiveRole === 'guest') {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            } else {
              navigateWithHash('admin');
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'admin'
              ? 'text-sky-500 font-semibold'
              : 'hover:text-sky-500'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-none truncate max-w-[64px]">
            {effectiveRole === 'guest'
              ? tr('Войти', 'Кирүү', 'Sign in')
              : effectiveRole === 'admin'
                ? tr('Админ', 'Админ', 'Admin')
                : tr('Кабинет', 'Кабинет', 'Account')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            isMobileNavOpen
              ? 'text-sky-500 font-semibold'
              : 'hover:text-sky-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] leading-none truncate max-w-[64px]">
            {tr('Меню', 'Меню', 'Menu')}
          </span>
        </button>
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
