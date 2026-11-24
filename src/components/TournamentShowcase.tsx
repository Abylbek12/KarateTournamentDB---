import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Plus, CalendarDays, MapPin, Users, ChevronDown, ArrowRight, Trophy, Trash2, Clock } from 'lucide-react';
import { Tournament, UserRole } from '../types/schema';
import { useApp } from '../context/AppContext';
import { EventItem, EventActionType } from '../data/eventsData';
import { EventEmblem } from './EventEmblems';
import { hashForTab, isPlainClick } from '../utils/routes';
import { trLang, localizeEventItem } from '../utils/globalDomTranslator';
import { isTournamentArchived } from './TournamentEventsManager';

interface TournamentShowcaseProps {
  tournaments: Tournament[];
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onSelectTournament: (tournament: Tournament) => void;
  onSelectAction: (tournament: EventItem, action: EventActionType) => void;
  onStartRegistration?: (tournament: Tournament) => void;
  onOpenScoreboard: () => void;
  onOpenBracket: () => void;
  onOpenCreateTournament?: () => void;
  onRequestDeleteTournament?: (tournament: Tournament) => void;
  onOpenLiveBroadcast?: () => void;
}

const REGIONS: { value: string; ru: string; ky: string; en: string }[] = [
  { value: 'all', ru: 'Все', ky: 'Баары', en: 'All' },
  { value: 'Бишкек', ru: 'Бишкек', ky: 'Бишкек', en: 'Bishkek' },
  { value: 'Ош', ru: 'Ош', ky: 'Ош', en: 'Osh' },
  { value: 'Чуй', ru: 'Чуй', ky: 'Чүй', en: 'Chuy' },
  { value: 'Иссык-Куль', ru: 'Иссык-Куль', ky: 'Ысык-Көл', en: 'Issyk-Kul' },
  { value: 'Нарын', ru: 'Нарын', ky: 'Нарын', en: 'Naryn' },
  { value: 'Талас', ru: 'Талас', ky: 'Талас', en: 'Talas' },
  { value: 'Джалал-Абад', ru: 'Джалал-Абад', ky: 'Жалал-Абад', en: 'Jalal-Abad' },
  { value: 'Баткен', ru: 'Баткен', ky: 'Баткен', en: 'Batken' },
  { value: 'abroad', ru: 'За рубежом', ky: 'Чет өлкө', en: 'Abroad' }
];

const MONTHS: Record<string, string[]> = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  ky: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

const parseISO = (iso?: string) => {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};

/** "28–29 ноя 2026", "30 ноя – 2 дек 2026" or "5 дек 2026". */
const formatRange = (start: string, end: string, lang: string) => {
  const a = parseISO(start);
  const b = parseISO(end) || a;
  if (!a || !b) return `${start} – ${end}`;
  const mn = MONTHS[lang] || MONTHS.ru;
  if (a.y === b.y && a.m === b.m && a.d === b.d) return `${a.d} ${mn[a.m]} ${a.y}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${mn[a.m]} ${a.y}`;
  if (a.y === b.y) return `${a.d} ${mn[a.m]} – ${b.d} ${mn[b.m]} ${a.y}`;
  return `${a.d} ${mn[a.m]} ${a.y} – ${b.d} ${mn[b.m]} ${b.y}`;
};

const daysUntil = (iso: string) => {
  const p = parseISO(iso);
  if (!p) return null;
  const today = new Date();
  const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(p.y, p.m, p.d) - t0) / 86400000);
};

export const TournamentShowcase: React.FC<TournamentShowcaseProps> = ({
  tournaments,
  currentUserRole = 'club_coach',
  onSelectAction,
  onStartRegistration,
  onOpenCreateTournament,
  onRequestDeleteTournament
}) => {
  const { language } = useApp();
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const isAdmin = currentUserRole === 'admin';
  // Organizers create tournaments too (theirs); deleting stays with the admin here
  const canCreate = isAdmin || currentUserRole === 'organizer';

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [showPast, setShowPast] = useState(false);
  const pastRef = useRef<HTMLDivElement>(null);

  // The admin's "open archive" banner button expands past tournaments.
  useEffect(() => {
    const open = () => {
      setShowPast(true);
      setTimeout(() => pastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };
    window.addEventListener('apsatarov-open-archive-tab', open);
    return () => window.removeEventListener('apsatarov-open-archive-tab', open);
  }, []);

  const events: EventItem[] = useMemo(
    () =>
      tournaments.map((t) => {
        const ev = t as EventItem;
        const base: EventItem = {
          ...t,
          imageUrl: ev.imageUrl || t.imageUrl,
          emblemType: ev.emblemType || (t.imageUrl && !t.imageUrl.startsWith('/src/assets/images/') ? 'custom_upload' : 'kg'),
          locationLabel: ev.locationLabel || [t.country, t.city].filter(Boolean).join(', '),
          dateLabel: ev.dateLabel || `${t.startDate} - ${t.endDate}`,
          availableActions: ev.availableActions || ['info', 'categories_prices', 'brackets', 'results', 'medals', 'live_scoring']
        };
        return localizeEventItem(base, language);
      }),
    [tournaments, language]
  );

  const matches = (item: EventItem) => {
    const q = query.toLowerCase().trim();
    if (q && !`${item.title} ${item.locationLabel} ${item.city} ${item.organization || ''}`.toLowerCase().includes(q)) return false;
    if (region !== 'all') {
      const isKG = /кыргыз|kyrgyz/i.test(item.country || '');
      if (region === 'abroad') return !isKG;
      return isKG && `${item.locationLabel} ${item.city}`.toLowerCase().includes(region.toLowerCase());
    }
    return true;
  };

  const upcoming = events
    .filter((e) => !isTournamentArchived(e) && matches(e))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = events
    .filter((e) => isTournamentArchived(e) && matches(e))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const featured = !query && region === 'all' ? upcoming[0] : undefined;
  const rest = featured ? upcoming.slice(1) : upcoming;

  const statusOf = (item: EventItem) => {
    const d = daysUntil(item.startDate);
    const dEnd = daysUntil(item.endDate);
    if (d !== null && d <= 0 && dEnd !== null && dEnd >= 0) return { label: tr('Идёт сейчас', 'Азыр жүрүп жатат', 'Live now'), tone: 'live' as const };
    if (item.isRegistrationOpen !== false) return { label: tr('Приём заявок', 'Табыштама кабыл алынат', 'Entries open'), tone: 'open' as const };
    return { label: tr('Заявки закрыты', 'Табыштама жабык', 'Entries closed'), tone: 'closed' as const };
  };

  const toneCls = {
    live: 'bg-red-600 text-white',
    open: 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/25',
    closed: 'bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)] border border-[var(--app-border)]'
  };

  const countdown = (item: EventItem) => {
    const d = daysUntil(item.startDate);
    if (d === null || d < 0) return null;
    if (d === 0) return tr('Сегодня', 'Бүгүн', 'Today');
    if (d === 1) return tr('Завтра', 'Эртең', 'Tomorrow');
    return tr(`Через ${d} дн.`, `${d} күндөн кийин`, `In ${d} days`);
  };

  // Tournament titles are real links: Ctrl/Cmd-click or long-press opens them in a new tab
  const openInfo = (e: React.MouseEvent, item: EventItem) => {
    e.stopPropagation();
    if (!isPlainClick(e)) return;
    e.preventDefault();
    onSelectAction(item, 'info');
  };
  const enter = (item: EventItem) => (onStartRegistration ? onStartRegistration(item) : onSelectAction(item, 'categories_prices'));

  const renderMeta = (item: EventItem, big = false) => (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[var(--app-text-secondary)] ${big ? 'text-[15px]' : 'text-sm'}`}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-[var(--app-text-muted)]" />
        {formatRange(item.startDate, item.endDate, language)}
      </span>
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <MapPin className="w-4 h-4 text-[var(--app-text-muted)] shrink-0" />
        <span className="truncate">{item.city}</span>
      </span>
      {!!item.athleteCount && (
        <span className="inline-flex items-center gap-1.5" title={tr('Участников', 'Катышуучулар', 'Athletes')}>
          <Users className="w-4 h-4 text-[var(--app-text-muted)]" />
          {item.athleteCount}
        </span>
      )}
    </div>
  );

  const renderDelete = (item: EventItem) =>
    isAdmin && onRequestDeleteTournament ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRequestDeleteTournament(item);
        }}
        className="p-2 rounded-lg text-[var(--app-text-muted)] hover:text-red-600 hover:bg-[var(--app-surface-subtle)] cursor-pointer"
        title={tr('Удалить турнир', 'Мелдешти өчүрүү', 'Delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    ) : null;

  return (
    <div className="theme-keep space-y-4 sm:space-y-6 pb-8">
      {/* Heading + search */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 sm:gap-4 justify-between pt-1 sm:pt-2">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[22px] sm:text-3xl font-bold tracking-tight text-[var(--app-text-primary)]">
              {tr('Турниры по каратэ', 'Каратэ мелдештери', 'Karate tournaments')}
            </h1>
            {/* Organizer only: create a tournament in one tap */}
            {canCreate && onOpenCreateTournament && (
              <button
                onClick={onOpenCreateTournament}
                className="group shrink-0 inline-flex items-center gap-2 h-10 sm:h-11 pl-1.5 pr-4 sm:pr-5 rounded-full bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-500 text-white text-sm sm:text-[15px] font-bold shadow-md shadow-rose-600/25 hover:shadow-lg hover:shadow-rose-600/35 active:scale-[0.98] transition-all cursor-pointer lg:hidden"
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
                  <Plus className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={3} />
                </span>
                {tr('Создать турнир', 'Мелдеш түзүү', 'New tournament')}
              </button>
            )}
          </div>
          <p className="mt-0.5 sm:mt-1 text-sm sm:text-[15px] text-[var(--app-text-secondary)]">
            {tr(
              'Календарь соревнований Кыргызстана: заявки онлайн, сетки, live-результаты.',
              'Кыргызстандагы мелдештер: онлайн табыштама, торчолор, live-жыйынтыктар.',
              'Kyrgyzstan competition calendar: online entries, brackets and live results.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] focus-within:border-[var(--accent)] w-full lg:w-80">
            <Search className="w-4 h-4 text-[var(--app-text-muted)] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Найти турнир или город', 'Мелдеш же шаар издөө', 'Search tournament or city')}
              className="flex-1 bg-transparent outline-none text-[15px] text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer" aria-label="Очистить">
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
          {canCreate && onOpenCreateTournament && (
            <button
              onClick={onOpenCreateTournament}
              className="group hidden lg:inline-flex shrink-0 items-center gap-2 h-11 pl-1.5 pr-5 rounded-full bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-500 text-white text-[15px] font-bold shadow-md shadow-rose-600/25 hover:shadow-lg hover:shadow-rose-600/35 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
                <Plus className="w-[18px] h-[18px]" strokeWidth={3} />
              </span>
              {tr('Создать турнир', 'Мелдеш түзүү', 'New tournament')}
            </button>
          )}
        </div>
      </div>

      {/* Region chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            onClick={() => setRegion(r.value)}
            className={`px-3 h-8 sm:px-3.5 sm:h-9 rounded-full text-[13px] sm:text-sm whitespace-nowrap border shrink-0 transition-colors cursor-pointer ${
              region === r.value
                ? 'bg-[var(--app-text-primary)] border-[var(--app-text-primary)] text-[var(--app-surface)] font-semibold'
                : 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-[var(--app-text-muted)]'
            }`}
          >
            {language === 'ky' ? r.ky : language === 'en' ? r.en : r.ru}
          </button>
        ))}
      </div>

      {/* Featured: the nearest tournament */}
      {featured && (
        <article
          onClick={() => onSelectAction(featured, 'info')}
          className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm cursor-pointer group"
        >
          <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: featured.accentColor || 'var(--accent)' }} />
          <div className="p-4 sm:p-7 flex flex-col md:flex-row gap-3 sm:gap-5 md:items-center">
            <EventEmblem
              type={featured.emblemType}
              imageUrl={featured.imageUrl}
              title={featured.title}
              color={featured.accentColor}
              className="w-14 h-14 sm:w-24 sm:h-24 text-[13px] sm:text-[19px] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
                {tr('Ближайший турнир', 'Жакынкы мелдеш', 'Next tournament')}
                {countdown(featured) && (
                  <span className="normal-case tracking-normal inline-flex items-center gap-1 text-[var(--accent)]">
                    <Clock className="w-3.5 h-3.5" /> {countdown(featured)}
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 text-lg sm:text-2xl font-bold leading-snug text-[var(--app-text-primary)] group-hover:text-[var(--accent)] transition-colors">
                <a href={hashForTab('event_info', featured.id)} onClick={(e) => openInfo(e, featured)} translate="no">{featured.title}</a>
              </h2>
              <div className="mt-2.5">{renderMeta(featured, true)}</div>
            </div>
            <div className="flex md:flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {featured.isRegistrationOpen !== false && (
                <button
                  onClick={() => enter(featured)}
                  className="h-10 sm:h-11 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
                >
                  {tr('Подать заявку', 'Табыштама берүү', 'Enter')}
                </button>
              )}
              <a
                href={hashForTab('event_info', featured.id)}
                onClick={(e) => openInfo(e, featured)}
                className="h-10 sm:h-11 px-5 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {tr('Подробнее', 'Толугураак', 'Details')} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </article>
      )}

      {/* Upcoming list */}
      {rest.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">
            {featured ? tr('Скоро', 'Жакында', 'Coming up') : tr('Найдено', 'Табылды', 'Results')} · {rest.length}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((item) => {
              const st = statusOf(item);
              return (
                <article
                  key={item.id}
                  onClick={() => onSelectAction(item, 'info')}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--accent)] hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  <div className="p-3 sm:p-5 flex gap-3 sm:gap-4 flex-1">
                    <EventEmblem
                      type={item.emblemType}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      color={item.accentColor}
                      className="w-11 h-11 sm:w-14 sm:h-14 text-[11px] sm:text-[12px] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${toneCls[st.tone]}`}>{st.label}</span>
                      <h4 className="mt-1 sm:mt-1.5 text-[15px] sm:text-[17px] font-semibold leading-snug text-[var(--app-text-primary)] line-clamp-2">
                        <a href={hashForTab('event_info', item.id)} onClick={(e) => openInfo(e, item)} translate="no">{item.title}</a>
                      </h4>
                      <div className="mt-1.5 sm:mt-2">{renderMeta(item)}</div>
                    </div>
                  </div>
                  <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-[var(--app-border)] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {item.isRegistrationOpen !== false && (
                      <button
                        onClick={() => enter(item)}
                        className="h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-[13px] sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                      >
                        {tr('Подать заявку', 'Табыштама', 'Enter')}
                      </button>
                    )}
                    <button
                      onClick={() => onSelectAction(item, 'categories_prices')}
                      className="h-9 px-3 rounded-lg text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] whitespace-nowrap cursor-pointer"
                    >
                      {tr('Категории', 'Категориялар', 'Categories')}
                    </button>
                    <span className="flex-1" />
                    {countdown(item) && <span className="text-xs text-[var(--app-text-muted)] whitespace-nowrap hidden 2xl:inline">{countdown(item)}</span>}
                    {renderDelete(item)}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-10 text-center">
          <div className="text-[var(--app-text-primary)] font-semibold">
            {query || region !== 'all' ? tr('Турниров не найдено', 'Мелдеш табылган жок', 'No tournaments found') : tr('Скоро здесь появятся турниры', 'Жакында бул жерде мелдештер пайда болот', 'Tournaments will appear here soon')}
          </div>
          <div className="text-sm text-[var(--app-text-muted)] mt-1">
            {query || region !== 'all'
              ? tr('Попробуйте другой регион или запрос.', 'Башка аймакты же сөздү тандаңыз.', 'Try another region or search.')
              : tr('Организаторы публикуют турниры через раздел «Турниры и пользователи».', 'Уюштуруучулар мелдештерди «Мелдештер жана колдонуучулар» бөлүмү аркылуу жарыялашат.', 'Organizers publish tournaments from “Events & users”.')}
          </div>
          {(query || region !== 'all') && (
            <button
              onClick={() => {
                setQuery('');
                setRegion('all');
              }}
              className="mt-4 h-9 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
            >
              {tr('Показать все', 'Баарын көрсөтүү', 'Show all')}
            </button>
          )}
        </div>
      )}

      {/* Past tournaments: collapsed, for results and medals */}
      {past.length > 0 && (
        <section ref={pastRef} className="pt-2">
          <button
            onClick={() => setShowPast(!showPast)}
            className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[var(--app-surface-subtle)] hover:bg-[var(--app-surface-muted)] text-left cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--app-text-primary)]">
              <Trophy className="w-4 h-4 text-amber-500" />
              {tr('Прошедшие турниры — результаты и медали', 'Өткөн мелдештер — жыйынтыктар жана медалдар', 'Past tournaments — results & medals')}
              <span className="text-[var(--app-text-muted)] font-normal">({past.length})</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-[var(--app-text-muted)] transition-transform ${showPast ? 'rotate-180' : ''}`} />
          </button>
          {showPast && (
            <ul className="mt-2 divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
              {past.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <EventEmblem
                    type={item.emblemType}
                    imageUrl={item.imageUrl}
                    title={item.title}
                    color={item.accentColor}
                    className="w-10 h-10 text-[10px] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-medium text-[var(--app-text-primary)] truncate">{item.title}</div>
                    <div className="text-sm text-[var(--app-text-muted)]">
                      {formatRange(item.startDate, item.endDate, language)} · {item.city}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectAction(item, 'results')}
                    className="h-9 px-3 rounded-lg text-sm text-[var(--accent)] hover:bg-[var(--accent-soft)] cursor-pointer shrink-0"
                  >
                    {tr('Результаты', 'Жыйынтыктар', 'Results')}
                  </button>
                  {renderDelete(item)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
