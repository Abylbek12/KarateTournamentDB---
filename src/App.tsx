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
import { isTournamentDateExpired } from './components/TournamentEventsManager';
import { Sidebar } from './components/Sidebar';
import { ScoreboardModal } from './components/ScoreboardModal';
import { ManualBoutControlModal } from './components/ManualBoutControlModal';

import { ResetTournamentDataModal, ResetOptions } from './components/ResetTournamentDataModal';
import { TournamentShowcase } from './components/TournamentShowcase';
import { UVENTEX_SCREENSHOT_EVENTS, UventexEventItem, EventActionType } from './data/uventexEventsData';
import { SenseiAiChatbot } from './components/SenseiAiChatbot';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { 
  VirtualStudiosView, 
  AboutUsView, 
  HelpFaqView, 
  StudiosView,
  RankingsView
} from './components/UventexPortalViews';
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
  SAMPLE_TOURNAMENTS
} from './data/sampleTournamentData';
import { POSTGRESQL_DDL_SCRIPT } from './data/dbSchemaDefinition';
import { Bout, Participant, TournamentRules, RefereeProtocol, UserRole, TournamentRegistrationConfig, Tournament, AppNotification, AuthenticatedUserProfile } from './types/schema';

import { AppProvider, useApp } from './context/AppContext';
import { useGlobalDomTranslator, trLang } from './utils/globalDomTranslator';

// Heavy screens are loaded on demand so the first page opens faster.
const SchemaVisualizer = React.lazy(() => import('./components/SchemaVisualizer').then((m) => ({ default: m.SchemaVisualizer })));
const TatamiScheduleView = React.lazy(() => import('./components/TatamiScheduleView').then((m) => ({ default: m.TatamiScheduleView })));
const CategoriesManager = React.lazy(() => import('./components/CategoriesManager').then((m) => ({ default: m.CategoriesManager })));
const ParticipantsManager = React.lazy(() => import('./components/ParticipantsManager').then((m) => ({ default: m.ParticipantsManager })));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then((m) => ({ default: m.AdminPanel })));
const SqlViewer = React.lazy(() => import('./components/SqlViewer').then((m) => ({ default: m.SqlViewer })));
const TournamentBracketScoreboardModule = React.lazy(() => import('./components/TournamentBracketScoreboardModule').then((m) => ({ default: m.TournamentBracketScoreboardModule })));
const TournamentEngineModule = React.lazy(() => import('./components/TournamentEngineModule').then((m) => ({ default: m.TournamentEngineModule })));
const TournamentAnalyticsModule = React.lazy(() => import('./components/TournamentAnalyticsModule').then((m) => ({ default: m.TournamentAnalyticsModule })));
const TournamentClubAccountingModule = React.lazy(() => import('./components/TournamentClubAccountingModule').then((m) => ({ default: m.TournamentClubAccountingModule })));
const CoachPortalModule = React.lazy(() => import('./components/CoachPortalModule').then((m) => ({ default: m.CoachPortalModule })));
const RefereeProtocolModule = React.lazy(() => import('./components/RefereeProtocolModule').then((m) => ({ default: m.RefereeProtocolModule })));
const MultiStepRegistration = React.lazy(() => import('./components/MultiStepRegistration').then((m) => ({ default: m.MultiStepRegistration })));
const LocalLanTournamentHub = React.lazy(() => import('./components/LocalLanTournamentHub').then((m) => ({ default: m.LocalLanTournamentHub })));
const TournamentDetailsView = React.lazy(() => import('./components/TournamentDetailsView').then((m) => ({ default: m.TournamentDetailsView })));
const TournamentInfoDetailView = React.lazy(() => import('./components/TournamentInfoDetailView').then((m) => ({ default: m.TournamentInfoDetailView })));
const TournamentDivisionsPricingView = React.lazy(() => import('./components/TournamentDivisionsPricingView').then((m) => ({ default: m.TournamentDivisionsPricingView })));
const TournamentRingsBracketsView = React.lazy(() => import('./components/TournamentRingsBracketsView').then((m) => ({ default: m.TournamentRingsBracketsView })));
const TournamentMedalsReportView = React.lazy(() => import('./components/TournamentMedalsReportView').then((m) => ({ default: m.TournamentMedalsReportView })));
const UventexLiveScoringView = React.lazy(() => import('./components/UventexLiveScoringView').then((m) => ({ default: m.UventexLiveScoringView })));
const RefereeElectronicVotingAndVrModule = React.lazy(() => import('./components/RefereeElectronicVotingAndVrModule').then((m) => ({ default: m.RefereeElectronicVotingAndVrModule })));
const DoctorTimeMedicalModule = React.lazy(() => import('./components/DoctorTimeMedicalModule').then((m) => ({ default: m.DoctorTimeMedicalModule })));
const VideoAnalyticsModule = React.lazy(() => import('./components/VideoAnalyticsModule').then((m) => ({ default: m.VideoAnalyticsModule })));
const AcquiringPaymentsModule = React.lazy(() => import('./components/AcquiringPaymentsModule').then((m) => ({ default: m.AcquiringPaymentsModule })));
const OfficialProtocolsExportModule = React.lazy(() => import('./components/OfficialProtocolsExportModule').then((m) => ({ default: m.OfficialProtocolsExportModule })));
const TournamentEventResultsView = React.lazy(() => import('./components/TournamentEventResultsView').then((m) => ({ default: m.TournamentEventResultsView })));

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
  const [tournaments, setTournaments] = useState<UventexEventItem[]>(UVENTEX_SCREENSHOT_EVENTS);
  const [selectedTournament, setSelectedTournament] = useState<Tournament>(UVENTEX_SCREENSHOT_EVENTS[3]);
  const [selectedUventexEvent, setSelectedUventexEvent] = useState<UventexEventItem>(UVENTEX_SCREENSHOT_EVENTS[3]);
  const [tournamentRules, setTournamentRules] = useState<TournamentRules>('wkf');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserProfile | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('club_coach');

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

  // Unified tournaments registry fetch on mount
  React.useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setTournaments(data.events);
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
    const asUventex: UventexEventItem = {
      ...newTournament,
      imageUrl: newTournament.imageUrl,
      emblemType: isCustomUpload ? 'custom_upload' : ((newTournament as any).emblemType || 'pcl'),
      locationLabel: (newTournament as any).locationLabel || (newTournament.city ? `${newTournament.country || ''}, ${newTournament.city}` : ''),
      dateLabel: (newTournament as any).dateLabel || `${newTournament.startDate} - ${newTournament.endDate}`,
      availableActions: (newTournament as any).availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring']
    };

    setTournaments((prev) => [asUventex, ...prev]);
    setSelectedTournament(asUventex);
    setSelectedUventexEvent(asUventex);
    if (newTournament.rulesType) setTournamentRules(newTournament.rulesType);

    try {
      const saveResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asUventex)
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
        `✓ Турнир «${asUventex.title}» опубликован и синхронизирован с витриной!`,
        `✓ «${asUventex.title}» мелдеши жарыяланды жана витрина менен синхрондоштурулду!`,
        `✓ Tournament "${asUventex.title}" published and synced with showcase!`
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
    const asUventex: UventexEventItem = {
      ...updatedTournament,
      imageUrl: updatedTournament.imageUrl,
      emblemType: isCustomUpload ? 'custom_upload' : ((updatedTournament as any).emblemType || 'pcl'),
      locationLabel: (updatedTournament as any).locationLabel || (updatedTournament.city ? `${updatedTournament.country || ''}, ${updatedTournament.city}` : ''),
      dateLabel: (updatedTournament as any).dateLabel || `${updatedTournament.startDate} - ${updatedTournament.endDate}`,
      availableActions: (updatedTournament as any).availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring']
    };

    setTournaments((prev) => prev.map((t) => (t.id === asUventex.id ? asUventex : t)));
    if (selectedTournament.id === asUventex.id) setSelectedTournament(asUventex);
    if (selectedUventexEvent.id === asUventex.id) setSelectedUventexEvent(asUventex);
    if (updatedTournament.rulesType) setTournamentRules(updatedTournament.rulesType);

    try {
      const saveResponse = await fetch(`/api/events/${asUventex.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asUventex)
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
        `✓ Изменения турнира «${asUventex.title}» синхронизированы с витриной!`,
        `✓ «${asUventex.title}» мелдешинин өзгөртүүлөрү витрина менен синхрондоштурулду!`,
        `✓ Changes to tournament "${asUventex.title}" synced with showcase!`
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
      if (selectedUventexEvent.id === tournamentId && filtered.length > 0) {
        setSelectedUventexEvent(filtered[0]);
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

  const [bouts, setBouts] = useState<Bout[]>(SAMPLE_BOUTS);
  const [participants, setParticipants] = useState<Participant[]>(SAMPLE_PARTICIPANTS);
  const [protocols, setProtocols] = useState<RefereeProtocol[]>(SAMPLE_REFEREE_PROTOCOLS);
  const [activeScoreboardBout, setActiveScoreboardBout] = useState<Bout | null>(null);
  const [selectedConsoleBoutId, setSelectedConsoleBoutId] = useState<string>(SAMPLE_BOUTS[0].id);
  const [isGlobalManualModalOpen, setIsGlobalManualModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'confirm_profile'>('login');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [globalSystemToast, setGlobalSystemToast] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Live Notifications & Operational Alert Dispatcher State
  const [notifications, setNotifications] = useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
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
    window.addEventListener('uventex-check-expired-events', handleCustomCheck);
    const intervalId = window.setInterval(evaluateAllEventsExpiration, 30000);
    return () => {
      window.removeEventListener('uventex-check-expired-events', handleCustomCheck);
      window.clearInterval(intervalId);
    };
  }, [evaluateAllEventsExpiration]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleDispatchNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isRead: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (newNotif.severity === 'critical' || newNotif.severity === 'urgent') {
      setIncomingLiveToast(newNotif);
      setTimeout(() => setIncomingLiveToast(null), 9000);
    }
  };

  const handleUpdateParticipantFee = (participantId: string, status: 'paid' | 'pending' | 'exempt' | 'refunded') => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, feePaymentStatus: status } : p))
    );
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'tournaments': return language === 'ru' ? 'События' : 'Events';
      case 'event_info': return `${selectedUventexEvent.title} — Информация`;
      case 'event_categories_prices': return `${selectedUventexEvent.title} — Категории и цены`;
      case 'event_brackets': return `${selectedUventexEvent.title} — Сетки`;
      case 'event_medals': return `${selectedUventexEvent.title} — Медали`;
      case 'event_live_scoring': return `${selectedUventexEvent.title} — Live Scoring`;
      case 'event_results': return `${selectedUventexEvent.title} — Результаты`;
      case 'tournament_details': return language === 'ru' ? 'Детали соревнования' : 'Tournament Details';
      case 'studios':
      case 'accounting': return language === 'ru' ? 'Студии и Клубы' : 'Studios & Clubs';
      case 'virtual_studios': return language === 'ru' ? 'Virtual Studios — Прямой эфир' : 'Virtual Studios — Live Stream';
      case 'about': return language === 'ru' ? 'О платформе Uventex' : language === 'ky' ? 'Uventex жөнүндө' : 'About Uventex';
      case 'help': return language === 'ru' ? 'Помощь и FAQ' : language === 'ky' ? 'Жардам жана FAQ' : 'Help & FAQ';
      case 'coach': return language === 'ru' ? 'Личный кабинет тренера' : 'Coach Team Portal';
      case 'rankings':
      case 'analytics': return language === 'ru' ? 'Рейтинги и медальный зачёт' : 'Rankings & Medal Count';
      case 'acquiring': return language === 'ru' ? 'Эквайринг и Оплата взносов' : 'Acquiring & Entry Fees';
      case 'scoreboard': return language === 'ru' ? 'Онлайн-табло татами' : 'Live Tatami Scoreboard';
      case 'referee_vr': return language === 'ru' ? 'Судейство: Электронные флаги и видеоповтор (VR)' : 'Referee Console: Flags & Video Review (VR)';
      case 'doctor': return language === 'ru' ? 'Медицинский контроль (Doctor 80s Time)' : 'Medical Commission (Doctor 80s Time)';
      case 'video_analytics': return language === 'ru' ? 'Модуль видеоаналитики и отчетов Федерации' : 'Video Analytics & Federation Reports';
      case 'protocols': return language === 'ru' ? 'Судейские протоколы ГСК' : 'Certified Scorecards';
      case 'exports': return language === 'ru' ? 'Официальный экспорт протоколов' : 'Official Protocols & Export';
      case 'bracket': return language === 'ru' ? 'Турнирные сетки плей-офф' : 'Playoff Brackets';
      case 'schedule': return language === 'ru' ? 'Расписание татами 1-4' : 'Tatami 1-4 Schedule';
      case 'lan': return language === 'ru' ? 'Локальная сеть (LAN Hub)' : 'Local Venue LAN Hub';
      case 'participants': return language === 'ru' ? 'База участников' : 'Athlete Database';
      case 'admin': return language === 'ru' ? 'Панель администратора' : 'Admin Panel';
      case 'schema': return language === 'ru' ? 'Схема базы данных PostgreSQL' : 'PostgreSQL Database Schema';
      case 'sql': return language === 'ru' ? 'DDL скрипт PostgreSQL' : 'PostgreSQL DDL Script';
      case 'categories': return language === 'ru' ? 'Категории турнира' : 'Tournament Categories';
      case 'engine': return language === 'ru' ? 'Генератор дивизионов' : 'Division Generator';
      case 'registration': return language === 'ru' ? 'Электронная регистрация' : 'Online Registration';
      default: return 'Uventex Karate OS';
    }
  };

  const [isTrainingMenuOpen, setIsTrainingMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navigateWithHash = (tab: string, eventId?: string) => {
    setActiveTab(tab);
    try {
      const hashMap: Record<string, string> = {
        tournaments: '#home',
        studios: '#studios',
        virtual_studios: '#virtual_studios',
        rankings: '#rankings',
        about: '#about',
        help: '#help',
        event_info: `#info;id=${eventId || selectedUventexEvent.id}`,
        event_categories_prices: `#categories;id=${eventId || selectedUventexEvent.id}`,
        event_brackets: `#brackets;id=${eventId || selectedUventexEvent.id}`,
        event_results: `#results;id=${eventId || selectedUventexEvent.id}`,
        event_medals: `#medals;id=${eventId || selectedUventexEvent.id}`,
        event_live_scoring: `#live_scoring;id=${eventId || selectedUventexEvent.id}`,
      };
      const targetHash = hashMap[tab] || `#${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    } catch {
      // Ignore history API restrictions in sandboxed iframes
    }
  };

  const handleSelectTournamentAction = (item: UventexEventItem, action: EventActionType) => {
    setSelectedUventexEvent(item);
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
    shareableToken: 'uventex-cup-2026-open',
    allowPublicSelfRegistration: true,
    venueWifiSsid: 'Karate-Arena-5G',
    venueLocalServerIp: '192.168.1.100',
    offlineModeActive: true
  });

  // Deep-link & Uventex GWTClient hash support (#home, #studios, #info;id=..., ?locale=ru)
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

        const rawHash = window.location.hash.replace(/^#/, '');
        if (rawHash) {
          const [hashRoute, ...hashParams] = rawHash.split(';');
          const idParam = hashParams.find((p) => p.startsWith('id='))?.split('=')[1];
          if (idParam) {
            const matchedEvent = tournaments.find((e) => e.id === idParam);
            if (matchedEvent) {
              setSelectedUventexEvent(matchedEvent);
              setSelectedTournament(matchedEvent);
            }
          }

          if (hashRoute === 'home' || hashRoute === 'events' || hashRoute === 'tournaments') {
            setActiveTab('tournaments');
            return;
          } else if (hashRoute === 'studios') {
            setActiveTab('studios');
            return;
          } else if (hashRoute === 'virtual_studios') {
            setActiveTab('virtual_studios');
            return;
          } else if (hashRoute === 'rankings') {
            setActiveTab('rankings');
            return;
          } else if (hashRoute === 'about') {
            setActiveTab('about');
            return;
          } else if (hashRoute === 'help') {
            setActiveTab('help');
            return;
          } else if (hashRoute === 'info') {
            setActiveTab('event_info');
            return;
          } else if (hashRoute === 'categories') {
            setActiveTab('event_categories_prices');
            return;
          } else if (hashRoute === 'brackets') {
            setActiveTab('event_brackets');
            return;
          } else if (hashRoute === 'results') {
            setActiveTab('event_results');
            return;
          } else if (hashRoute === 'medals') {
            setActiveTab('event_medals');
            return;
          } else if (hashRoute === 'live_scoring') {
            setActiveTab('event_live_scoring');
            return;
          } else if (hashRoute === 'login') {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
            return;
          }
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
    return () => window.removeEventListener('hashchange', syncFromLocation);
  }, [tournaments]);

  // Synchronized protocol updating and persisting
  const handleUpdateProtocol = (updatedProtocol: RefereeProtocol) => {
    setProtocols((prev) => 
      prev.some((p) => p.id === updatedProtocol.id)
        ? prev.map((p) => (p.id === updatedProtocol.id ? updatedProtocol : p))
        : [updatedProtocol, ...prev]
    );
  };

  // 1-Click Database Reset Handler (Preserving Database Schema)
  const handleResetTournamentData = (options: ResetOptions) => {
    if (options.restoreDefaultDemo) {
      setBouts(JSON.parse(JSON.stringify(SAMPLE_BOUTS)));
      setProtocols(JSON.parse(JSON.stringify(SAMPLE_REFEREE_PROTOCOLS)));
      setParticipants(JSON.parse(JSON.stringify(SAMPLE_PARTICIPANTS)));
      setSelectedConsoleBoutId(SAMPLE_BOUTS[0].id);
      setGlobalSystemToast('Успешно: Эталонные демонстрационные данные турнира полностью восстановлены!');
      setTimeout(() => setGlobalSystemToast(null), 5000);
      return;
    }

    if (options.clearRefereeProtocols) {
      setProtocols([]);
    }

    if (options.clearPlayoffBrackets) {
      setBouts([]);
    } else if (options.resetBoutScores) {
      setBouts((prev) =>
        prev.map((b) => ({
          ...b,
          akaScore: 0,
          aoScore: 0,
          akaSenshu: false,
          aoSenshu: false,
          akaPenaltiesC1: 0,
          aoPenaltiesC1: 0,
          akaPenaltiesC2: 0,
          aoPenaltiesC2: 0,
          akaWazaAri: 0,
          aoWazaAri: 0,
          akaIppon: 0,
          aoIppon: 0,
          akaSkifPenalties: 0,
          aoSkifPenalties: 0,
          akaJogai: 0,
          aoJogai: 0,
          winnerId: undefined,
          winReason: undefined,
          status: 'scheduled',
          refereeProtocolId: undefined,
          timerSecondsRemaining: 120,
          events: []
        }))
      );
    }

    if (options.resetWeighInStatus) {
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isWeighedIn: false,
          actualWeightKg: null,
          status: 'registered'
        }))
      );
    }

    setGlobalSystemToast('Успешно: База данных очищена в 1 клик. Структура таблиц и список участников сохранены.');
    setTimeout(() => setGlobalSystemToast(null), 5000);
  };

  // Automatic playoff bracket progression when a bout finishes
  const handleUpdateBout = (updatedBout: Bout) => {
    setBouts((prev) => {
      let nextBouts = prev.map((b) => (b.id === updatedBout.id ? updatedBout : b));

      // If bout is completed with a winner, advance winner to the next round in elimination bracket
      if (updatedBout.status === 'completed' && updatedBout.winnerId) {
        const winnerParticipant = participants.find((p) => p.id === updatedBout.winnerId);
        const loserId = updatedBout.winnerId === updatedBout.akaParticipantId
          ? updatedBout.aoParticipantId
          : updatedBout.akaParticipantId;
        const loserParticipant = participants.find((p) => p.id === loserId);

        // Progression from 1/8 Final to 1/4 Final
        if (updatedBout.roundStage === 'round_1_8') {
          const pos = updatedBout.bracketPosition;
          const targetQfPos = Math.ceil(pos / 2);
          const isAka = pos % 2 === 1;

          nextBouts = nextBouts.map((b) => {
            if (
              b.categoryId === updatedBout.categoryId &&
              b.roundStage === 'quarter_final' &&
              b.bracketPosition === targetQfPos
            ) {
              return isAka
                ? { ...b, akaParticipantId: updatedBout.winnerId, akaParticipant: winnerParticipant || b.akaParticipant }
                : { ...b, aoParticipantId: updatedBout.winnerId, aoParticipant: winnerParticipant || b.aoParticipant };
            }
            return b;
          });
        }

        // Progression from 1/4 Final to Semi-Final
        if (updatedBout.roundStage === 'quarter_final') {
          const qfPos = updatedBout.bracketPosition; // 1, 2, 3, 4
          const targetSfPos = Math.ceil(qfPos / 2); // QF 1 & 2 -> SF 1; QF 3 & 4 -> SF 2
          const isAkaSlot = qfPos % 2 === 1; // odd -> AKA, even -> AO

          nextBouts = nextBouts.map((b) => {
            if (
              b.categoryId === updatedBout.categoryId &&
              b.roundStage === 'semi_final' &&
              b.bracketPosition === targetSfPos
            ) {
              return isAkaSlot
                ? {
                    ...b,
                    akaParticipantId: updatedBout.winnerId,
                    akaParticipant: winnerParticipant || b.akaParticipant
                  }
                : {
                    ...b,
                    aoParticipantId: updatedBout.winnerId,
                    aoParticipant: winnerParticipant || b.aoParticipant
                  };
            }
            return b;
          });
        }

        // Progression from Semi-Final to Final and Bronze match
        if (updatedBout.roundStage === 'semi_final') {
          const sfPos = updatedBout.bracketPosition; // 1 or 2
          const isAkaSlot = sfPos === 1;

          nextBouts = nextBouts.map((b) => {
            // Winners advance to Gold Final
            if (b.categoryId === updatedBout.categoryId && b.roundStage === 'final') {
              return isAkaSlot
                ? {
                    ...b,
                    akaParticipantId: updatedBout.winnerId,
                    akaParticipant: winnerParticipant || b.akaParticipant
                  }
                : {
                    ...b,
                    aoParticipantId: updatedBout.winnerId,
                    aoParticipant: winnerParticipant || b.aoParticipant
                  };
            }

            // Losers advance to Bronze match
            if (b.categoryId === updatedBout.categoryId && b.roundStage === 'bronze_match' && loserId) {
              return isAkaSlot
                ? {
                    ...b,
                    akaParticipantId: loserId,
                    akaParticipant: loserParticipant || b.akaParticipant
                  }
                : {
                    ...b,
                    aoParticipantId: loserId,
                    aoParticipant: loserParticipant || b.aoParticipant
                  };
            }

            return b;
          });
        }

        // Automatic update of participant placements / standings upon Final & Bronze completion
        if (updatedBout.roundStage === 'final') {
          const goldId = updatedBout.winnerId;
          const silverId =
            updatedBout.winnerId === updatedBout.akaParticipantId
              ? updatedBout.aoParticipantId
              : updatedBout.akaParticipantId;

          setParticipants((prevP) =>
            prevP.map((p) => {
              if (p.id === goldId) return { ...p, placement: '1st_gold' };
              if (p.id === silverId) return { ...p, placement: '2nd_silver' };
              return p;
            })
          );
        }

        if (updatedBout.roundStage === 'bronze_match') {
          const bronzeId = updatedBout.winnerId;
          setParticipants((prevP) =>
            prevP.map((p) => {
              if (p.id === bronzeId) return { ...p, placement: '3rd_bronze_1' };
              return p;
            })
          );
        }
      }

      return nextBouts;
    });
  };

  const handleUpdateParticipant = (updatedParticipant: Participant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
  };

  const handleBatchUpdateParticipants = (updatedList: Participant[]) => {
    setParticipants(updatedList);
  };

  const handleBatchRegisterAthletes = (newAthletes: Participant[]) => {
    setParticipants((prev) => [...newAthletes, ...prev]);
    setGlobalSystemToast(`✓ В базу данных добавлено ${newAthletes.length} спортсменов команды «${newAthletes[0]?.clubName || ''}»!`);
    setTimeout(() => setGlobalSystemToast(null), 6000);
  };

  const handleAddParticipant = (newParticipant: Participant) => {
    setParticipants((prev) => [newParticipant, ...prev]);
  };

  const handleGenerateBracket = (newBouts: Bout[], categoryId: string) => {
    setBouts((prev) => {
      const remainingBouts = prev.filter((b) => b.categoryId !== categoryId);
      return [...newBouts, ...remainingBouts];
    });
  };

  const handleGenerateBracketsForCategories = (newBouts: Bout[]) => {
    setBouts((prev) => {
      const newCatIds = new Set(newBouts.map((b) => b.categoryId));
      const remaining = prev.filter((b) => !newCatIds.has(b.categoryId));
      return [...newBouts, ...remaining];
    });
  };

  const handleExportSql = () => {
    const blob = new Blob([POSTGRESQL_DDL_SCRIPT], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karate_tournament_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Smart WKF Draw Execution across categories with club/city/country separation
  const handleExecuteSmartWkfDraw = () => {
    const allGeneratedBouts: Bout[] = [];
    SAMPLE_TOURNAMENT_CATEGORIES.forEach((cat) => {
      const catAthletes = participants.filter((p) => p.categoryId === cat.id || (!p.categoryId && cat.id === 'tc1'));
      if (catAthletes.length >= 2) {
        const { bouts: catBouts } = generateProtectedWkfCategoryBouts(cat, catAthletes, SAMPLE_TATAMIS);
        allGeneratedBouts.push(...catBouts);
      }
    });

    if (allGeneratedBouts.length > 0) {
      setBouts(allGeneratedBouts);
      setSelectedConsoleBoutId(allGeneratedBouts[0].id);
      // Automatically close online registration and switch to offline LAN mode
      setRegistrationConfig((prev) => ({
        ...prev,
        isRegistrationOpen: false,
        offlineModeActive: true
      }));
      setGlobalSystemToast('✓ Умная жеребьевка успешно выполнена! Онлайн-регистрация закрыта. Бои распределены по Татами 1–4, клубы и города разведены.');
      setTimeout(() => setGlobalSystemToast(null), 6000);
      setActiveTab('bracket');
    } else {
      setGlobalSystemToast('Внимание: недостаточно участников для жеребьевки (нужно минимум 2 спортсмена в категории).');
      setTimeout(() => setGlobalSystemToast(null), 4000);
    }
  };

  // Export full local tournament bundle to JSON file for flash drive transfer
  const handleExportLocalBundle = () => {
    const bundle = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      registrationConfig,
      tournamentRules,
      participants,
      bouts,
      protocols,
      clubs: SAMPLE_CLUBS,
      tatamis: SAMPLE_TATAMIS,
      categories: SAMPLE_TOURNAMENT_CATEGORIES
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karate_tournament_local_bundle_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setGlobalSystemToast('Успешно: Полный локальный пакет турнира (JSON) сохранен на диск для переноса на флешке.');
    setTimeout(() => setGlobalSystemToast(null), 5000);
  };

  // Import local tournament bundle from JSON
  const handleImportLocalBundle = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const bundle = JSON.parse(content);
        if (bundle.participants && Array.isArray(bundle.participants)) {
          setParticipants(bundle.participants);
        }
        if (bundle.bouts && Array.isArray(bundle.bouts)) {
          setBouts(bundle.bouts);
          if (bundle.bouts.length > 0) setSelectedConsoleBoutId(bundle.bouts[0].id);
        }
        if (bundle.protocols && Array.isArray(bundle.protocols)) {
          setProtocols(bundle.protocols);
        }
        if (bundle.registrationConfig) {
          setRegistrationConfig(bundle.registrationConfig);
        }
        if (bundle.tournamentRules) {
          setTournamentRules(bundle.tournamentRules);
        }
        setGlobalSystemToast('Успешно: Локальный пакет турнира импортирован. Данные соревнований синхронизированы!');
        setTimeout(() => setGlobalSystemToast(null), 5000);
      } catch (err) {
        setGlobalSystemToast('Ошибка: Не удалось прочитать локальный файл пакета турнира.');
        setTimeout(() => setGlobalSystemToast(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Standalone Fullscreen Online Registration Page (Zero distraction, Uventex Style)
  if (activeTab === 'registration') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Minimalist Dedicated Top Bar */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Top-left clean back to main button */}
            <button
              onClick={() => setActiveTab('tournament_details')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-blue-500/60 text-xs font-semibold transition-all cursor-pointer group shadow-sm"
              title="Вернуться к турниру"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Назад к турниру</span>
            </button>

            {/* Central Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-900/40">
                UX
              </div>
              <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase hidden sm:inline">
                UVENTEX SPORT EVENT SYSTEM
              </span>
            </div>

            {/* Top-right Security badge */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL 256-bit</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Toast if active */}
        {globalSystemToast && (
          <div className="bg-emerald-600/90 text-white border-y border-emerald-500 px-4 py-2.5 shadow-lg backdrop-blur sticky top-[65px] z-40 flex items-center justify-between text-xs sm:text-sm font-medium animate-fadeIn">
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                {globalSystemToast}
              </span>
              <button 
                onClick={() => setGlobalSystemToast(null)}
                className="text-emerald-200 hover:text-white text-xs px-2 py-0.5 rounded bg-emerald-800/60"
              >
                ✕ Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Clean Registration Page Container */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
          <React.Suspense fallback={<ScreenLoader />}>
          <MultiStepRegistration
            tournament={selectedTournament}
            clubs={SAMPLE_CLUBS}
            tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
            tatamis={SAMPLE_TATAMIS}
            isRegistrationOpen={registrationConfig.isRegistrationOpen}
            registrationDeadline={registrationConfig.registrationDeadline}
            onBackToHome={() => setActiveTab('tournament_details')}
            onRegisterAthlete={(newAthlete) => {
              handleAddParticipant(newAthlete);
              setGlobalSystemToast(`✓ Спортсмен ${newAthlete.firstName} ${newAthlete.lastName} успешно зарегистрирован на «${selectedTournament.title}» и занесен в базу данных!`);
              setTimeout(() => setGlobalSystemToast(null), 6000);
            }}
            onNavigateToBracket={() => setActiveTab('bracket')}
            onNavigateToParticipants={() => setActiveTab('participants')}
            onNavigateToScoreboard={() => setActiveTab('scoreboard')}
          />
          </React.Suspense>
        </main>

        {/* Supreme AI Assistant: Sensei AI powered by Gemini 3.8 Flash */}
        <SenseiAiChatbot
          currentTournament={selectedTournament}
          tournamentRules={tournamentRules}
          participantCount={participants.length}
          tatamiCount={SAMPLE_TATAMIS.length}
        />

        {/* Minimalist Clean Footer */}
        <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-600 font-mono">
          © 2026 Uventex Sport Event System · Международные протоколы соревнований · Реляционная БД PostgreSQL
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f0f2f5] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Fixed Left Sidebar (like Uventex) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => navigateWithHash(tab)}
        tournamentRules={tournamentRules}
        onRulesChange={setTournamentRules}
        currentUserRole={currentUserRole}
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
        {/* Top Context Bar: Uventex Top Navigation Header (Responsive for Mobile, Tablet & Desktop) */}
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

            {/* Uventex Brand Logo on Top Bar */}
            <button
              onClick={() => setActiveTab('tournaments')}
              className="flex items-center gap-1.5 sm:gap-2 text-left group cursor-pointer focus:outline-none min-w-0"
              title="Uventex - Главная"
            >
              {/* Colorful stylized swirl logo */}
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 100 100" fill="none">
                <path d="M48 8 C28 16 12 34 12 56 C12 78 30 96 54 96 C76 96 94 78 94 56 C94 40 86 26 76 16 C76 26 68 36 58 40 C66 44 70 52 70 60 C70 70 62 78 52 78 C40 78 32 68 32 56 C32 42 40 32 50 24 C48 19 47 14 48 8 Z" fill="#0284c7" />
                <path d="M50 24 C60 32 66 42 64 54 C62 62 56 68 48 68 C40 68 36 62 36 54 C36 42 44 32 50 24 Z" fill="#ef4444" />
                <path d="M48 68 C52 68 56 64 56 58 C56 52 52 48 48 48 C44 48 40 52 40 58 C40 64 44 68 48 68 Z" fill="#f59e0b" />
              </svg>

              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 group-hover:text-sky-600 transition-colors font-sans truncate">
                Uventex
              </span>
            </button>

            {/* Social Media Icons (Hidden on mobile phones to preserve touch space, visible on tablet/desktop) */}
            <div className="hidden md:flex items-center gap-1.5 ml-1 shrink-0">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 rounded-md bg-[#00a8e8] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="h-6 px-1.5 rounded-md bg-[#00a8e8] text-white flex items-center justify-center font-bold text-[10px] hover:opacity-90 transition-opacity tracking-tight"
                title="YouTube"
              >
                You Tube
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 rounded-md bg-[#0077b6] text-white flex items-center justify-center font-bold text-xs hover:opacity-90 transition-opacity"
                title="Facebook"
              >
                f
              </a>
            </div>
          </div>

          {/* Right: Clean Header Bar (Alerts, Training & Unified Profile Menu with Role, Theme & Language) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 font-sans">
            {/* Global Notification Center Bell Button (Active Across All Sections) */}
            <button
              type="button"
              onClick={() => {
                setIsProfileMenuOpen(false);
                setIsTrainingMenuOpen(false);
                setIsNotificationCenterOpen(true);
              }}
              className="relative flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-sans cursor-pointer transition-colors py-1.5 sm:py-1 px-2.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-slate-200/60 min-h-[36px] sm:min-h-0"
              title={tr(
                'Центр уведомлений и напоминаний по срокам событий',
                'Билдирүүлөр жана мелдеш мөөнөттөрү боюнча эскертмелер борбору',
                'Notification Center & Event Date Reminders'
              )}
            >
              <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline font-medium">
                {tr('Уведомления', 'Билдирүүлөр', 'Alerts')}
              </span>
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono leading-tight">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>

            {/* Education Dropdown: Обучение ▾ */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsTrainingMenuOpen(!isTrainingMenuOpen);
                  setIsProfileMenuOpen(false);
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-sans cursor-pointer transition-colors py-1.5 px-2.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-slate-200/60"
                title={tr('Инструкции и обучение Uventex', 'Uventex нускамалары жана окутуу', 'Uventex Training Guides')}
              >
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <span className="font-medium">{tr('Обучение', 'Окутуу', 'Training')}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isTrainingMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {tr('Учебные материалы Uventex', 'Uventex окуу материалдары', 'Uventex Training Guides')}
                  </div>
                  <button
                    onClick={() => {
                      navigateWithHash('help');
                      setIsTrainingMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>📘 {tr('База знаний и FAQ', 'Билим базасы жана FAQ', 'Knowledge Base & FAQ')}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigateWithHash('coach');
                      setIsTrainingMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>🥋 {tr('Кабинет тренера и заявка команды', 'Машыктыруучу кабинети жана команда табыштамасы', 'Coach Portal & Team Entry')}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigateWithHash('referee_vr');
                      setIsTrainingMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>🚩 {tr('Судейский пульт и VR-повторы', 'Калыс пульту жана VR-кайталоо', 'Referee Console & VR')}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigateWithHash('scoreboard');
                      setIsTrainingMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>📺 {tr('Электронное табло татами', 'Татаминин электрондук таблосу', 'Live Tatami Scoreboard')}</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setIsGlobalManualModalOpen(true);
                      setIsTrainingMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left font-semibold text-sky-600 hover:bg-sky-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>⚡ {tr('Тренажер управления поединком', 'Беттешти башкаруу тренажеру', 'Manual Bout Simulator')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* ========================================================
                UNIFIED PROFILE & SETTINGS MENU (Role RBAC, Theme, Language & Account)
               ======================================================== */}
            <div className="relative">
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
                  {currentUser?.fullName || tr('Профиль', 'Профиль', 'Profile')}
                </span>

                <span
                  className={`hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.2 rounded-full border items-center gap-0.5 ${
                    currentUserRole === 'admin'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      : 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                  }`}
                >
                  {currentUserRole === 'admin'
                    ? tr('Админ', 'Админ', 'Admin')
                    : tr('Участник', 'Катышуучу', 'Member')}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <>
                  {/* Click-outside backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-xs space-y-3 animate-fadeIn">
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
        {expiredEventsList.length > 0 && !dismissedExpiredBanner && (
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
                      window.dispatchEvent(new CustomEvent('uventex-open-archive-tab'));
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
                  onClick={() => setIsNotificationCenterOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:opacity-90 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {tr('Журнал уведомлений', 'Билдирүүлөр журналы', 'Notifications Log')}
                </button>
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
          {/* 1. События (Tournaments showcase with Category-Dependent Hover Options + RBAC) */}
          {activeTab === 'tournaments' && (
            <TournamentShowcase
              tournaments={tournaments}
              currentUserRole={currentUserRole}
              onRoleChange={requestRoleChange}
              onSelectTournament={(t) => {
                setSelectedTournament(t);
                const matched = UVENTEX_SCREENSHOT_EVENTS.find((e) => e.id === t.id);
                if (matched) setSelectedUventexEvent(matched);
                else setSelectedUventexEvent(t as UventexEventItem);
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
              tournament={selectedUventexEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedUventexEvent, action as EventActionType)}
              onStartRegistration={() => {
                setSelectedTournament(selectedUventexEvent);
                setActiveTab('registration');
              }}
            />
          )}

          {/* 1.2 Категории и цены (Matching video at 00:32-00:36) */}
          {activeTab === 'event_categories_prices' && (
            <TournamentDivisionsPricingView
              tournament={selectedUventexEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedUventexEvent, action as EventActionType)}
            />
          )}

          {/* 1.3 Сетки по площадкам и времени (Matching video at 01:40-01:54) */}
          {activeTab === 'event_brackets' && (
            <TournamentRingsBracketsView
              tournament={selectedUventexEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedUventexEvent, action as EventActionType)}
              onOpenLiveScoreboard={() => setActiveTab('event_live_scoring')}
            />
          )}

          {/* 1.4 Медали (Matching video at 01:27) */}
          {activeTab === 'event_medals' && (
            <TournamentMedalsReportView
              tournament={selectedUventexEvent}
              onBack={() => setActiveTab('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedUventexEvent, action as EventActionType)}
            />
          )}

          {/* 1.5 Результаты поединков и пьедестал */}
          {activeTab === 'event_results' && (
            <TournamentEventResultsView
              tournament={selectedUventexEvent}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedUventexEvent, action as EventActionType)}
            />
          )}

          {/* 1.6 Live Scoring Настройки & 4-Татами Монитор (Matching video at 00:48 & 01:13) */}
          {activeTab === 'event_live_scoring' && (
            <UventexLiveScoringView
              tournament={selectedUventexEvent}
              onBack={() => navigateWithHash('tournaments')}
              onNavigateAction={(action) => handleSelectTournamentAction(selectedUventexEvent, action as EventActionType)}
            />
          )}

          {/* 2. Детали конкретного турнира */}
          {activeTab === 'tournament_details' && (
            <TournamentDetailsView
              tournament={selectedTournament}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              tatamis={SAMPLE_TATAMIS}
              onBackToTournaments={() => navigateWithHash('tournaments')}
              onStartRegistration={(t) => {
                setSelectedTournament(t);
                if (t.rulesType) setTournamentRules(t.rulesType);
                navigateWithHash('registration');
              }}
              onNavigateToScoreboard={() => navigateWithHash('scoreboard')}
              onNavigateToBracket={() => navigateWithHash('bracket')}
            />
          )}

          {/* 3. Студии и Клубы (#studios) */}
          {activeTab === 'studios' && (
            <StudiosView
              language={language}
              currentUserRole={currentUserRole}
              onNavigateTab={(tab) => navigateWithHash(tab)}
              clubs={SAMPLE_CLUBS}
              participants={participants}
              bouts={bouts}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              tournamentRules={tournamentRules}
              onSelectConsoleBout={(bId) => setSelectedConsoleBoutId(bId)}
            />
          )}

          {activeTab === 'accounting' && (
            <TournamentClubAccountingModule
              clubs={SAMPLE_CLUBS}
              participants={participants}
              bouts={bouts}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              tournamentRules={tournamentRules}
              onNavigateToScoreboard={(bId) => {
                setSelectedConsoleBoutId(bId);
                navigateWithHash('scoreboard');
              }}
              onNavigateToBracket={() => navigateWithHash('bracket')}
            />
          )}

          {/* 3.1 Личный кабинет тренера (Командная заявка) */}
          {activeTab === 'coach' && (
            <CoachPortalModule
              clubs={SAMPLE_CLUBS}
              tournaments={tournaments}
              selectedTournament={selectedTournament}
              onSelectTournament={(t) => {
                setSelectedTournament(t);
                if (t.rulesType) setTournamentRules(t.rulesType);
              }}
              tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
              ageCategories={SAMPLE_AGE_CATEGORIES}
              weightCategories={SAMPLE_WEIGHT_CATEGORIES}
              existingParticipants={participants}
              onBatchRegisterAthletes={handleBatchRegisterAthletes}
              onNavigateToBracket={() => navigateWithHash('bracket')}
              onNavigateToScoreboard={() => navigateWithHash('scoreboard')}
            />
          )}

          {/* 4. Рейтинги и Аналитика (#rankings) */}
          {activeTab === 'rankings' && (
            <div className="space-y-8">
              <RankingsView language={language} />
              <TournamentAnalyticsModule
                clubs={SAMPLE_CLUBS}
                participants={participants}
                bouts={bouts}
                tatamis={SAMPLE_TATAMIS}
                tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
                onNavigateToTatami={() => navigateWithHash('schedule')}
                onNavigateToScoreboard={(boutId) => {
                  setSelectedConsoleBoutId(boutId);
                  navigateWithHash('scoreboard');
                }}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <TournamentAnalyticsModule
              clubs={SAMPLE_CLUBS}
              participants={participants}
              bouts={bouts}
              tatamis={SAMPLE_TATAMIS}
              tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
              onNavigateToTatami={() => navigateWithHash('schedule')}
              onNavigateToScoreboard={(boutId) => {
                setSelectedConsoleBoutId(boutId);
                navigateWithHash('scoreboard');
              }}
            />
          )}

          {activeTab === 'engine' && (
            <TournamentEngineModule
              clubs={SAMPLE_CLUBS}
              ageCategories={SAMPLE_AGE_CATEGORIES}
              weightCategories={SAMPLE_WEIGHT_CATEGORIES}
              tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
              tatamis={SAMPLE_TATAMIS}
              participants={participants}
              bouts={bouts}
              onUpdateParticipant={handleUpdateParticipant}
              onBatchUpdateParticipants={handleBatchUpdateParticipants}
              onGenerateBracketsForCategories={handleGenerateBracketsForCategories}
              onNavigateToScoreboard={(bId) => {
                setSelectedConsoleBoutId(bId);
                setActiveTab('scoreboard');
              }}
              onNavigateToBracketView={() => setActiveTab('bracket')}
            />
          )}

          {activeTab === 'scoreboard' && (
            <TournamentBracketScoreboardModule
              tatamis={SAMPLE_TATAMIS}
              bouts={bouts}
              participants={participants}
              tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
              clubs={SAMPLE_CLUBS}
              initialBoutId={selectedConsoleBoutId}
              initialSubTab="multi_tatami"
              tournamentRules={tournamentRules}
              currentUserRole={currentUserRole}
              protocols={protocols}
              onRulesChange={setTournamentRules}
              onUpdateBout={handleUpdateBout}
              onBatchUpdateBouts={(newBouts) => setBouts(newBouts)}
              onSaveProtocol={handleUpdateProtocol}
              onNavigateToProtocols={(boutId) => {
                if (boutId) setSelectedConsoleBoutId(boutId);
                setActiveTab('protocols');
              }}
            />
          )}

          {activeTab === 'referee_vr' && (
            <RefereeElectronicVotingAndVrModule
              bouts={bouts}
              activeBoutId={selectedConsoleBoutId}
              participants={participants}
              currentUserRole={currentUserRole}
              tournamentRules={tournamentRules}
              onUpdateBout={handleUpdateBout}
              onSaveProtocol={handleUpdateProtocol}
              onNavigateToScoreboard={(bId) => {
                setSelectedConsoleBoutId(bId);
                setActiveTab('scoreboard');
              }}
            />
          )}

          {/* 5.1 Медицинский контроль и Doctor 80s Time */}
          {activeTab === 'doctor' && (
            <DoctorTimeMedicalModule
              tatamis={SAMPLE_TATAMIS}
              bouts={bouts}
              participants={participants}
              currentUserRole={currentUserRole}
              language={language}
              onUpdateBout={handleUpdateBout}
              onUpdateParticipant={handleUpdateParticipant}
              onNavigateToScoreboard={(bId) => {
                setSelectedConsoleBoutId(bId);
                setActiveTab('scoreboard');
              }}
            />
          )}

          {/* 5.2 Модуль видеоаналитики и отчетов Федерации */}
          {activeTab === 'video_analytics' && (
            <VideoAnalyticsModule
              bouts={bouts}
              participants={participants}
              selectedTournament={selectedTournament}
              onNavigateToScoreboard={() => setActiveTab('scoreboard')}
              onNavigateToProtocols={() => setActiveTab('protocols')}
            />
          )}

          {activeTab === 'protocols' && (
            <RefereeProtocolModule
              protocols={protocols}
              bouts={bouts}
              participants={participants}
              tatamis={SAMPLE_TATAMIS}
              tournamentRules={tournamentRules}
              onUpdateProtocol={handleUpdateProtocol}
              onUpdateBout={handleUpdateBout}
              onNavigateToScoreboard={(bId) => {
                setSelectedConsoleBoutId(bId);
                setActiveTab('scoreboard');
              }}
            />
          )}

          {/* 5.3 Эквайринг и Оплата взносов */}
          {activeTab === 'acquiring' && (
            <AcquiringPaymentsModule
              tournament={selectedTournament}
              participants={participants}
              clubs={SAMPLE_CLUBS}
              currentUserRole={currentUserRole}
              onUpdateParticipantFee={handleUpdateParticipantFee}
              onNotifySystem={(title, message, cat) => {
                handleDispatchNotification({
                  title,
                  message,
                  category: cat,
                  severity: 'info'
                });
              }}
            />
          )}

          {/* 5.4 Официальный экспорт протоколов и результатов */}
          {activeTab === 'exports' && (
            <OfficialProtocolsExportModule
              tournament={selectedTournament}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              participants={participants}
              bouts={bouts}
              clubs={SAMPLE_CLUBS}
              protocols={protocols}
              currentUserRole={currentUserRole}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel
              clubs={SAMPLE_CLUBS}
              ageCategories={SAMPLE_AGE_CATEGORIES}
              weightCategories={SAMPLE_WEIGHT_CATEGORIES}
              tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
              tatamis={SAMPLE_TATAMIS}
              participants={participants}
              bouts={bouts}
              currentUserRole={currentUserRole}
              onRoleChange={requestRoleChange}
              tournaments={tournaments}
              selectedTournament={selectedTournament}
              onSelectTournament={(t) => {
                setSelectedTournament(t);
                if (t.rulesType) setTournamentRules(t.rulesType);
              }}
              onAddTournament={handleAddTournament}
              onUpdateTournament={handleUpdateTournament}
              onDeleteTournament={handleDeleteTournament}
              onOpenResetDialog={() => setIsResetModalOpen(true)}
              onAddParticipant={handleAddParticipant}
              onGenerateBracket={handleGenerateBracket}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'schedule' && (
            <TatamiScheduleView
              tatamis={SAMPLE_TATAMIS}
              bouts={bouts}
              onOpenScoreboard={(b) => {
                setSelectedConsoleBoutId(b.id);
                setActiveTab('scoreboard');
              }}
            />
          )}

          {activeTab === 'lan' && (
            <LocalLanTournamentHub
              registrationConfig={registrationConfig}
              onUpdateRegistrationConfig={setRegistrationConfig}
              tatamis={SAMPLE_TATAMIS}
              bouts={bouts}
              participants={participants}
              categories={SAMPLE_TOURNAMENT_CATEGORIES}
              onOpenScoreboardForTatami={(tatamiId) => {
                const tatamiBout = bouts.find((b) => b.tatamiId === tatamiId);
                if (tatamiBout) setSelectedConsoleBoutId(tatamiBout.id);
                setActiveTab('scoreboard');
              }}
              onExecuteSmartWkfDraw={handleExecuteSmartWkfDraw}
              onExportLocalBundle={handleExportLocalBundle}
              onImportLocalBundle={handleImportLocalBundle}
              onExportSql={handleExportSql}
            />
          )}

          {activeTab === 'bracket' && (
            <TournamentBracketScoreboardModule
              tatamis={SAMPLE_TATAMIS}
              bouts={bouts}
              participants={participants}
              tournamentCategories={SAMPLE_TOURNAMENT_CATEGORIES}
              clubs={SAMPLE_CLUBS}
              initialBoutId={selectedConsoleBoutId}
              initialSubTab="bracket"
              tournamentRules={tournamentRules}
              currentUserRole={currentUserRole}
              protocols={protocols}
              onRulesChange={setTournamentRules}
              onUpdateBout={handleUpdateBout}
              onBatchUpdateBouts={(newBouts) => setBouts(newBouts)}
              onSaveProtocol={handleUpdateProtocol}
              onNavigateToProtocols={(boutId) => {
                if (boutId) setSelectedConsoleBoutId(boutId);
                setActiveTab('protocols');
              }}
            />
          )}

          {activeTab === 'participants' && (
            <ParticipantsManager
              participants={participants}
              onUpdateParticipant={handleUpdateParticipant}
              onNavigateToRegister={() => setActiveTab('admin')}
            />
          )}

          {/* Uventex Portal Views */}
          {activeTab === 'virtual_studios' && (
            <VirtualStudiosView language={language} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'about' && (
            <AboutUsView language={language} />
          )}

          {activeTab === 'help' && (
            <HelpFaqView language={language} />
          )}

          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'schema' && <SchemaVisualizer />}
          {activeTab === 'sql' && <SqlViewer />}
          </React.Suspense>
        </main>

        {/* ========================================================
            UVENTEX OFFICIAL FOOTER WITH PRIVACY POLICY & COMPACT BOT DOCK
           ======================================================== */}
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 pt-8 pb-24 lg:pb-8 px-4 sm:px-6 text-xs text-slate-400 font-sans">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Col 1: Brand & Mission */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                  UX
                </div>
                <span className="text-sm font-black tracking-wider text-white font-mono uppercase">
                  UVENTEX SPORT
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono leading-relaxed">
                {tr(
                  'Профессиональная экосистема спортивных единоборств и боевых искусств.',
                  'Спорттук жекпе-жек жана согуш өнөрлөрүнүн кесиптик экосистемасы.',
                  'Professional tournament management platform for Martial Arts & Combat Sports.'
                )}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  SSL 256-bit Secure
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-blue-400">
                  {tr('Стандарт 2026', 'Стандарт 2026', 'Standard 2026')}
                </span>
              </div>
            </div>

            {/* Col 2: Navigation */}
            <div className="space-y-2.5 font-mono">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                {tr('Разделы платформы', 'Платформанын бөлүмдөрү', 'Platform Navigation')}
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <button onClick={() => setActiveTab('tournaments')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    {tr('• События и турниры', '• Окуялар жана мелдештер', '• Events & Tournaments')}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('studios')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    {tr('• Клубы (Studios)', '• Клубдар (Studios)', '• Clubs & Studios')}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('virtual_studios')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    {tr('• Virtual Studios (LIVE)', '• Virtual Studios (Түз эфир)', '• Virtual Studios (LIVE)')}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('rankings')} className="hover:text-blue-400 transition-colors cursor-pointer">
                    {tr('• Рейтинги атлетов', '• Спортчулардын рейтинги', '• Athlete Rankings')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Compliance */}
            <div className="space-y-2.5 font-mono">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                {tr('Документы и регламент', 'Документтер жана регламент', 'Legal & Compliance')}
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <button 
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{tr('Политика конфиденциальности', 'Купуялуулук саясаты', 'Privacy Policy')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setGlobalSystemToast(
                        tr(
                          'Пользовательское соглашение: регламент участия в официальных спортивных соревнованиях',
                          'Колдонуучу келишими: расмий спорттук мелдештерге катышуу регламенти',
                          'Terms of Service: official sports competition participation regulations'
                        )
                      );
                      setTimeout(() => setGlobalSystemToast(null), 4000);
                    }} 
                    className="hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {tr('• Пользовательское соглашение', '• Колдонуучу келишими', '• Terms of Service')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {tr('• Международный регламент соревнований', '• Мелдештин эл аралык регламенти', '• Competition Rulebook')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleExportSql}
                    className="hover:text-rose-400 text-slate-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>• DDL PostgreSQL:</span>
                    <span className="text-rose-400 font-bold">schema.sql</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Support & Sensei AI Assistant */}
            <div className="space-y-3 font-mono">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                {tr('Поддержка и Помощник', 'Колдоо жана Жардамчы', 'Support & AI Assistant')}
              </div>
              <p className="text-xs text-slate-400">
                {tr(
                  'Круглосуточный судейский консультант по регламентам соревнований, жеребьевке и протоколам.',
                  'Мелдеш регламенттери, чүчүкулак жана протоколдор боюнча күнү-түнү калыстык консультант.',
                  '24/7 rulebook assistant for competition scoring and tournament bracket guidelines.'
                )}
              </p>
              
              {/* Footer Compact Sensei AI Summon Button */}
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('open-sensei-ai'));
                }}
                className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 hover:from-blue-900/90 hover:to-indigo-900/90 border border-blue-500/40 text-blue-200 text-xs transition-all cursor-pointer shadow-md group"
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400 group-hover:rotate-6 transition-transform" />
                  <span className="font-bold text-white">{tr('Чат-бот Sensei AI', 'Sensei AI чат-боту', 'Sensei AI Assistant')}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                  Gemini 3.8
                </span>
              </button>

              <div className="text-[11px] text-slate-500">
                Email: <a href="mailto:support@uventex-karate.ru" className="text-slate-400 hover:text-white underline">support@uventex-karate.ru</a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright bar */}
          <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 font-mono text-[11px]">
            <span>
              {tr(
                '© 2026 Uventex Sports Event System. Все права защищены. Международные стандарты протоколов.',
                '© 2026 Uventex Sports Event System. Бардык укуктар корголгон. Протоколдордун эл аралык стандарттары.',
                '© 2026 Uventex Sports Event System. All rights reserved. International protocol standards.'
              )}
            </span>
            <div className="flex items-center gap-4">
              <span>152-ФЗ / GDPR Compliant</span>
              <span>•</span>
              <span>{tr('Татами 1–4 LAN Hub', 'Татами 1–4 LAN Hub', 'Tatami 1–4 LAN Hub')}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Chief Referee Manual Override Global Modal */}
      {isGlobalManualModalOpen && (
        <ManualBoutControlModal
          bout={bouts.find((b) => b.id === selectedConsoleBoutId) || bouts[0]}
          isOpen={isGlobalManualModalOpen}
          tournamentRules={tournamentRules}
          participants={participants}
          onClose={() => setIsGlobalManualModalOpen(false)}
          onSaveBout={(updated) => {
            handleUpdateBout(updated);
            setIsGlobalManualModalOpen(false);
          }}
        />
      )}

      {/* Electronic Scoreboard Interactive Modal */}
      <ScoreboardModal
        bout={activeScoreboardBout}
        isOpen={!!activeScoreboardBout}
        onClose={() => setActiveScoreboardBout(null)}
        onSaveBout={handleUpdateBout}
      />

      {/* 1-Click Database Reset & Cleanup Modal */}
      <ResetTournamentDataModal
        isOpen={isResetModalOpen}
        currentUserRole={currentUserRole}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleResetTournamentData}
      />

      {/* Supreme AI Assistant: Sensei AI powered by Gemini 3.8 Flash */}
      <SenseiAiChatbot
        currentTournament={selectedTournament}
        tournamentRules={tournamentRules}
        participantCount={participants.length}
        tatamiCount={SAMPLE_TATAMIS.length}
      />

      {/* Live Operational Notification Center Modal & Dispatcher */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAllNotifications}
        onDispatchNotification={handleDispatchNotification}
        onNavigateTab={(tab, extraId) => {
          if (extraId) setSelectedConsoleBoutId(extraId);
          setActiveTab(tab);
        }}
        currentUserRole={currentUserRole}
        isSoundEnabled={isSoundAlertsEnabled}
        onToggleSound={() => setIsSoundAlertsEnabled(!isSoundAlertsEnabled)}
      />

      {/* Uventex Athlete & Officials Auth Modal */}
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

      {/* Floating Zendesk-style Chat Widget on Bottom Right (Positioned above mobile bottom nav on smartphones/tablets) */}
      <button
        type="button"
        onClick={() => setActiveTab('help')}
        className="fixed bottom-20 right-4 lg:bottom-5 lg:right-5 z-40 w-12 h-12 rounded-2xl bg-[#0f3844] hover:bg-[#0c2f3a] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title={tr('Служба поддержки и чат-виджет Uventex', 'Uventex колдоо кызматы жана чат-виджети', 'Uventex Support & Help Center')}
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>

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
          onClick={() => navigateWithHash('scoreboard')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'scoreboard' || activeTab === 'tatami'
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
          onClick={() => navigateWithHash('bracket')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'bracket'
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
          onClick={() => navigateWithHash('admin')}
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors cursor-pointer ${
            activeTab === 'admin'
              ? 'text-sky-500 font-semibold'
              : 'hover:text-sky-500'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-none truncate max-w-[64px]">
            {tr('Админ', 'Админ', 'Admin')}
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
