import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ArrowRight, 
  X, 
  Ticket, 
  MoreHorizontal,
  Info,
  DollarSign,
  Layers,
  Trophy,
  Award,
  Radio,
  ChevronRight,
  Plus,
  Archive,
  Trash2,
  ShieldCheck,
  Users,
  Lock,
  Video
} from 'lucide-react';
import { Tournament, UserRole } from '../types/schema';
import { useApp } from '../context/AppContext';
import { UventexEventItem, EventActionType } from '../data/uventexEventsData';
import { UventexEventEmblem } from './UventexEventEmblems';
import { trLang, localizeUventexEventItem } from '../utils/globalDomTranslator';
import { isTournamentArchived } from './TournamentEventsManager';

interface TournamentShowcaseProps {
  tournaments: Tournament[];
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onSelectTournament: (tournament: Tournament) => void;
  onSelectAction: (tournament: UventexEventItem, action: EventActionType) => void;
  onStartRegistration?: (tournament: Tournament) => void;
  onOpenScoreboard: () => void;
  onOpenBracket: () => void;
  onOpenCreateTournament?: () => void;
  onRequestDeleteTournament?: (tournament: Tournament) => void;
  onOpenLiveBroadcast?: () => void;
}

export const TournamentShowcase: React.FC<TournamentShowcaseProps> = ({
  tournaments,
  currentUserRole = 'admin',
  onRoleChange,
  onSelectAction,
  onStartRegistration,
  onOpenScoreboard,
  onOpenCreateTournament,
  onRequestDeleteTournament,
  onOpenLiveBroadcast
}) => {
  const { language } = useApp();
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const isAdmin = currentUserRole === 'admin';

  const [showcaseTab, setShowcaseTab] = useState<'active' | 'archive' | 'all'>('active');

  useEffect(() => {
    const handleOpenArchive = () => setShowcaseTab('archive');
    window.addEventListener('uventex-open-archive-tab', handleOpenArchive);
    return () => window.removeEventListener('uventex-open-archive-tab', handleOpenArchive);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('all');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Active hover/open dropdown menu id
  const [activeMenuEventId, setActiveMenuEventId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.uventex-card-actions-wrapper')) {
        setActiveMenuEventId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnterCard = (eventId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveMenuEventId(eventId);
  };

  const handleMouseLeaveCard = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenuEventId(null);
    }, 250);
  };

  // Unified database registry: allEvents comes directly from synchronized tournaments prop and is localized into RU / KY / EN
  const allEvents: UventexEventItem[] = tournaments.map((t) => {
    const asUventex = t as UventexEventItem;
    const baseItem: UventexEventItem = {
      ...t,
      imageUrl: asUventex.imageUrl || t.imageUrl,
      emblemType: asUventex.emblemType || (t.imageUrl && !t.imageUrl.startsWith('/src/assets/images/') ? 'custom_upload' : 'pcl'),
      locationLabel: asUventex.locationLabel || (t.city ? `${t.country || ''}, ${t.city}` : ''),
      dateLabel: asUventex.dateLabel || `${t.startDate} - ${t.endDate}`,
      availableActions: asUventex.availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring']
    };
    return localizeUventexEventItem(baseItem, language);
  });

  const activeCount = allEvents.filter((item) => !isTournamentArchived(item)).length;
  const archiveCount = allEvents.filter((item) => isTournamentArchived(item)).length;

  // Filtering logic
  const filteredEvents = allEvents.filter((item) => {
    const isArchivedItem = isTournamentArchived(item);
    if (showcaseTab === 'active' && isArchivedItem) return false;
    if (showcaseTab === 'archive' && !isArchivedItem) return false;

    // 1. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.locationLabel.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        (item.league && item.league.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    // 2. Country
    if (selectedCountryFilter !== 'all') {
      if (
        !item.locationLabel.toLowerCase().includes(selectedCountryFilter.toLowerCase()) &&
        !item.country.toLowerCase().includes(selectedCountryFilter.toLowerCase())
      ) {
        return false;
      }
    }

    // 3. Sport
    if (selectedSportFilter !== 'all') {
      if (
        selectedSportFilter === 'karate' &&
        !item.sportType?.toLowerCase().includes('каратэ') &&
        !item.title.toLowerCase().includes('karate') &&
        !item.title.toLowerCase().includes('карате') &&
        !item.title.toLowerCase().includes('каратэ')
      ) {
        return false;
      }
      if (selectedSportFilter === 'kobudo' && !item.title.toLowerCase().includes('kobudo') && !item.title.toLowerCase().includes('кобудо')) {
        return false;
      }
    }

    // 4. League
    if (selectedLeagueFilter !== 'all') {
      if (!item.league?.toLowerCase().includes(selectedLeagueFilter.toLowerCase())) {
        return false;
      }
    }

    // 5. Dates
    if (startDateFilter && item.startDate < startDateFilter) {
      return false;
    }
    if (endDateFilter && item.endDate > endDateFilter) {
      return false;
    }

    return true;
  });

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCountryFilter('all');
    setSelectedSportFilter('all');
    setSelectedLeagueFilter('all');
    setSelectedTypeFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    selectedCountryFilter !== 'all' ||
    selectedSportFilter !== 'all' ||
    selectedLeagueFilter !== 'all' ||
    selectedTypeFilter !== 'all' ||
    startDateFilter !== '' ||
    endDateFilter !== '';

  const getActionLabelAndIcon = (action: EventActionType) => {
    switch (action) {
      case 'info':
        return {
          label: tr('Информация', 'Маалымат', 'Info'),
          icon: <Info className="w-3.5 h-3.5 text-sky-500" />
        };
      case 'categories_prices':
        return {
          label: tr('Категории и цены', 'Категориялар жана баалар', 'Categories & Prices'),
          icon: <DollarSign className="w-3.5 h-3.5 text-teal-500" />
        };
      case 'brackets':
        return {
          label: tr('Сетки', 'Торчолор', 'Brackets'),
          icon: <Layers className="w-3.5 h-3.5 text-blue-500" />
        };
      case 'results':
        return {
          label: tr('Результаты', 'Жыйынтыктар', 'Results'),
          icon: <Trophy className="w-3.5 h-3.5 text-amber-500" />
        };
      case 'medals':
        return {
          label: tr('Медали', 'Медалдар', 'Medals'),
          icon: <Award className="w-3.5 h-3.5 text-orange-500" />
        };
      case 'live_scoring':
        return {
          label: tr('Live-табло', 'Live-табло', 'Live Scoring'),
          icon: <Radio className="w-3.5 h-3.5 text-rose-500" />
        };
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans pb-12">

      {/* ========================================================
          UVENTEX PILL FILTER TOOLBAR + CREATE TOURNAMENT BUTTON
         ======================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto">
          {/* 1. Search Pill Input */}
          <div className="relative w-full sm:col-span-2 md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr('Введите имя события', 'Мелдештин атын жазыңыз', 'Enter event name')}
              className="w-full md:w-64 pl-9 pr-8 py-2 sm:py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-sm sm:text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-icon-btn absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Country Dropdown Pill */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="w-full md:w-auto appearance-none bg-white border border-slate-200/90 shadow-2xs rounded-full pl-3.5 pr-8 py-2 sm:py-1.5 text-sm sm:text-xs text-slate-600 hover:text-slate-900 focus:outline-none focus:border-sky-400 cursor-pointer font-sans"
            >
              <option value="all">{tr('Все страны', 'Бардык өлкөлөр', 'All countries')}</option>
              <option value="Kyrgyzstan">{tr('Кыргызстан', 'Кыргызстан', 'Kyrgyzstan')}</option>
              <option value="Ukraine">{tr('Украина', 'Украина', 'Ukraine')}</option>
              <option value="United States">{tr('США (USA)', 'АКШ (USA)', 'United States (USA)')}</option>
              <option value="Canada">{tr('Канада', 'Канада', 'Canada')}</option>
              <option value="Italy">{tr('Италия', 'Италия', 'Italy')}</option>
              <option value="Poland">{tr('Польша', 'Польша', 'Poland')}</option>
              <option value="Uzbekistan">{tr('Узбекистан', 'Өзбекстан', 'Uzbekistan')}</option>
              <option value="Israel">{tr('Израиль', 'Израиль', 'Israel')}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 3. Sport Dropdown Pill */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="w-full md:w-auto appearance-none bg-white border border-slate-200/90 shadow-2xs rounded-full pl-3.5 pr-8 py-2 sm:py-1.5 text-sm sm:text-xs text-slate-600 hover:text-slate-900 focus:outline-none focus:border-sky-400 cursor-pointer font-sans"
            >
              <option value="all">{tr('Все виды спорта', 'Спорттун бардык түрлөрү', 'All sports')}</option>
              <option value="karate">{tr('Каратэ (Karate)', 'Каратэ (Karate)', 'Karate')}</option>
              <option value="kobudo">{tr('Кобудо (Kobudo)', 'Кобудо (Kobudo)', 'Kobudo')}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 4. League Dropdown Pill */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedLeagueFilter}
              onChange={(e) => setSelectedLeagueFilter(e.target.value)}
              className="w-full md:w-auto appearance-none bg-white border border-slate-200/90 shadow-2xs rounded-full pl-3.5 pr-8 py-2 sm:py-1.5 text-sm sm:text-xs text-slate-600 hover:text-slate-900 focus:outline-none focus:border-sky-400 cursor-pointer font-sans"
            >
              <option value="all">{tr('Все лиги', 'Бардык лигалар', 'All leagues')}</option>
              <option value="PCL">Premier Champions League</option>
              <option value="UKF">UKF Premier League & Series A</option>
              <option value="AAU">AAU Karate</option>
              <option value="WUKF">WUKF Poland</option>
              <option value="SKW">SKW Tour</option>
              <option value="TCT">The Competitor's Tour</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 5. Date Range Pill with Arrow */}
          <div className="flex items-center justify-between gap-1.5 bg-white border border-slate-200/90 shadow-2xs rounded-full px-3.5 py-1.5 sm:py-1 text-xs text-slate-600 font-sans w-full sm:col-span-2 md:w-auto">
            <input
              type="text"
              placeholder={tr('Дата начала', 'Башталуу датасы', 'Start date')}
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full md:w-24 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={tr('Дата окончания', 'Аяктоо датасы', 'End date')}
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full md:w-24 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* 6. Types Dropdown Pill */}
          <div className="relative w-full md:w-auto">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full md:w-auto appearance-none bg-white border border-slate-200/90 shadow-2xs rounded-full pl-3.5 pr-8 py-2 sm:py-1.5 text-sm sm:text-xs text-slate-600 hover:text-slate-900 focus:outline-none focus:border-sky-400 cursor-pointer font-sans"
            >
              <option value="all">{tr('Все типы', 'Бардык түрлөрү', 'All types')}</option>
              <option value="tournament">{tr('Турниры', 'Мелдештер', 'Tournaments')}</option>
              <option value="seminar">{tr('Семинары', 'Семинарлар', 'Seminars')}</option>
              <option value="sanctioning">{tr('Санкционирование', 'Санкциялоо', 'Sanctioning')}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 7. Reset Clear Button */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={tr('Сбросить все фильтры', 'Чыпкаларды тазалоо', 'Reset all filters')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Direct Quick Action Button to Open Tournament Creation & Image Upload Form */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full xl:w-auto shrink-0">
          {/* Active vs Archive Tab Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs flex-1 sm:flex-initial justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setShowcaseTab('active')}
              className={`px-3 py-1.5 sm:py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-initial ${
                showcaseTab === 'active'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tr('Актуальные', 'Актуалдуу', 'Active')}</span>
              <span className="text-[10px] opacity-85">({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowcaseTab('archive')}
              className={`px-3 py-1.5 sm:py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-initial ${
                showcaseTab === 'archive'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>{tr('Архив', 'Архив', 'Archive')}</span>
              <span className="text-[10px] opacity-85">({archiveCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowcaseTab('all')}
              className={`px-2.5 py-1.5 sm:py-1 rounded-full font-semibold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                showcaseTab === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tr('Все', 'Баары', 'All')}</span>
            </button>
          </div>

          {isAdmin && onOpenCreateTournament ? (
            <button
              type="button"
              onClick={onOpenCreateTournament}
              className="w-full sm:w-auto justify-center px-4 py-2 sm:py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span>{tr('Создать турнир', 'Мелдеш түзүү', 'Create Tournament')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onStartRegistration && filteredEvents[0] && (
                <button
                  type="button"
                  onClick={() => onStartRegistration(filteredEvents[0])}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{tr('Подать заявку', 'Табыштама берүү', 'Register Athlete')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => (onOpenLiveBroadcast ? onOpenLiveBroadcast() : onOpenScoreboard())}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{tr('Трансляции LIVE', 'Түз эфир LIVE', 'Watch Broadcasts')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          RESPONSIVE EVENT CARDS GRID (1 col phone, 2 col tablet, 3 col desktop)
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredEvents.map((item) => {
          const isMenuOpen = activeMenuEventId === item.id;
          const isArchivedItem = isTournamentArchived(item);

          return (
            <div
              key={item.id}
              onMouseEnter={() => handleMouseEnterCard(item.id)}
              onMouseLeave={handleMouseLeaveCard}
              onClick={() => onSelectAction(item, 'info')}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-3.5 sm:p-3 flex items-center justify-between gap-3 group cursor-pointer hover:border-slate-300 relative min-h-[104px] sm:min-h-[96px]"
            >
              {/* Left: Square Emblem or Uploaded Event Image */}
              <div className="shrink-0 flex items-center justify-center">
                <UventexEventEmblem type={item.emblemType} imageUrl={item.imageUrl} className="w-[68px] h-[68px] sm:w-[66px] sm:h-[66px]" />
              </div>

              {/* Middle: Content (Location, Title, Dates) */}
              <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
                {/* Location Line */}
                {item.locationLabel ? (
                  <div className="text-xs sm:text-[11px] text-slate-500 font-sans truncate leading-tight">
                    {item.locationLabel}
                  </div>
                ) : (
                  <div className="h-3.5" />
                )}

                {/* Tournament Title */}
                <h4 className="text-sm sm:text-[13px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mt-0.5">
                  {item.title}
                </h4>

                {/* Date Line & Archived Badge */}
                <div className="text-xs sm:text-[11px] text-slate-500 font-sans mt-1 leading-tight flex items-center gap-1.5 flex-wrap">
                  <span>{item.dateLabel}</span>
                  {isArchivedItem && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-medium">
                      {tr('Архив', 'Архив', 'Archive')}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Ticket Icon & Options Dots with Hover/Tap Popover (Finger-friendly 40x40px targets) */}
              <div className="shrink-0 self-stretch flex flex-col justify-between items-end pl-1 uventex-card-actions-wrapper relative">
                {/* Ticket Icon in soft blue */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStartRegistration) {
                      onStartRegistration(item);
                    } else {
                      onSelectAction(item, 'info');
                    }
                  }}
                  className="inline-icon-btn min-w-[38px] min-h-[38px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl text-sky-500 hover:text-sky-600 hover:bg-sky-50/60 p-1.5 transition-colors"
                  title={tr('Билеты и регистрация', 'Билеттер жана каттоо', 'Tickets & Registration')}
                >
                  <Ticket className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>

                {/* Three dots menu trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuEventId(isMenuOpen ? null : item.id);
                  }}
                  className={`inline-icon-btn min-w-[38px] min-h-[38px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl text-sky-500 hover:text-sky-700 font-bold text-base leading-none p-1.5 transition-colors ${
                    isMenuOpen ? 'text-sky-700 bg-sky-50' : ''
                  }`}
                  title={tr('Опции события', 'Мелдеш опциялары', 'Event Options')}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* ========================================================
                    DYNAMIC CATEGORY-SPECIFIC HOVER MENU
                   ======================================================== */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn font-sans text-xs divide-y divide-slate-100"
                  >
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {tr('Опции события', 'Мелдеш опциялары', 'Event Options')}
                    </div>

                    <div className="py-1">
                      {item.availableActions.map((actionKey) => {
                        const { label, icon } = getActionLabelAndIcon(actionKey);
                        return (
                          <button
                            key={actionKey}
                            type="button"
                            onClick={() => {
                              setActiveMenuEventId(null);
                              onSelectAction(item, actionKey);
                            }}
                            className="w-full px-3 py-1.5 flex items-center justify-between text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors text-left cursor-pointer group/item"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              {icon}
                              <span>{label}</span>
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover/item:text-blue-500 transition-colors" />
                          </button>
                        );
                      })}
                      {isAdmin && onRequestDeleteTournament ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuEventId(null);
                            onRequestDeleteTournament(item);
                          }}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer mt-0.5 border-t border-slate-100 pt-1.5"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>{tr('Удалить турнир', 'Мелдешти өчүрүү', 'Delete Tournament')}</span>
                          </span>
                        </button>
                      ) : (
                        <div className="px-3 py-1.5 mt-0.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {tr(
                              'Удаление доступно только Админу',
                              'Өчүрүү Админге гана жеткиликтүү',
                              'Deletion restricted to Admin'
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h4 className="text-sm font-bold text-slate-800">
            {tr('События не найдены', 'Мелдештер табылган жок', 'No events found')}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {tr(
              'Попробуйте изменить поисковый запрос или сбросить фильтры стран и лиг.',
              'Издөө суроосун өзгөртүп көрүңүз же өлкөлөр менен лигалардын чыпкаларын тазалаңыз.',
              'Try adjusting your search criteria or resetting the country and league filters.'
            )}
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {tr('Сбросить все фильтры', 'Чыпкаларды тазалоо', 'Reset all filters')}
          </button>
        </div>
      )}
    </div>
  );
};
