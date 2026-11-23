import React from 'react';
import { ArrowLeft, Trophy, Radio, Medal, Printer, Youtube, ExternalLink, Volume2, VolumeX, Maximize2, Maximize, Minimize, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { printUrl } from './PrintDocuments';
import type { Bout, Participant, TournamentCategory, EventCategory } from '../types/schema';
import { categoryName, activeEntries, DISCIPLINE_LABELS } from '../utils/eventCategories';
import type { EventItem, EventActionType } from '../data/eventsData';
import { belongsToEvent } from '../data/sampleTournamentData';
import { ELIMINATION_ORDER, computeStandings, repechageHalf, repechageStep, stageLabel } from '../utils/bracketProgression';
import * as E from '../utils/boutEngine';
import { clockNow } from '../utils/serverClock';
import { displayName, displayClub, localizeCategoryName, nameModeFor, participantFlag, participantNoc, participantCountry, type NameMode } from '../utils/names';
import { countryName, flagEmoji } from '../utils/countries';
import { currentBoutOf, upcomingOf } from './TatamiScreens';
import { sanitizePricing, currentPeriod, periodStartsOn, bishkekDate, categoryPrice, additionalPrice, isTeamDiscipline } from '../utils/pricing';
import { streamTatamis, youtubeVideoId, youtubeEmbedUrl, youtubeCommand, fitVideoGrid } from '../utils/youtube';
import { eventTitle } from '../utils/eventI18n';

type Lang = 'ru' | 'ky' | 'en';

interface BaseProps {
  event: EventItem;
  bouts: Bout[];
  participants: Participant[];
  categories: TournamentCategory[];
  language: Lang;
  onBack: () => void;
  onNavigateAction: (action: EventActionType) => void;
}

const t = (lang: Lang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

/** Local (Cyrillic) or international (SURNAME Name, Latin) names for the current page. */
let currentMode: NameMode = 'local';
const fullName = (p?: Participant) => (p ? displayName(p, currentMode) : '');
const useEventNameMode = (bouts: Bout[], lang: Lang) => {
  const mode = nameModeFor(bouts.flatMap((b) => [b.akaParticipant, b.aoParticipant]) as Participant[], lang);
  currentMode = mode;
  return mode;
};
const Flag: React.FC<{ p?: Participant }> = ({ p }) =>
  p && participantNoc(p) ? (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--app-text-muted)] whitespace-nowrap">
      <span className="text-sm leading-none">{participantFlag(p)}</span>
      {participantNoc(p)}
    </span>
  ) : null;

/** Categories of this event that have at least one bout, with a readable name. */
function useEventCategories(event: EventItem, bouts: Bout[], categories: TournamentCategory[]) {
  return React.useMemo(() => {
    const eventBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, event.id));
    const ids = Array.from(new Set(eventBouts.map((b) => b.categoryId)));
    return {
      eventBouts,
      cats: ids.map((id) => {
        const c = categories.find((x) => x.id === id);
        const fromBout = eventBouts.find((b) => b.categoryId === id)?.categoryName;
        const name = c
          ? `${c.ageCategoryName || ''} · ${c.gender === 'male' ? 'Мужчины' : 'Женщины'} · ${c.discipline === 'kata' ? 'Ката' : c.weightCategoryName || 'Кумитэ'}`
          : fromBout || id;
        return { id, name };
      })
    };
  }, [event.id, bouts, categories]);
}

const EventHeader: React.FC<{
  event: EventItem;
  language: Lang;
  active: EventActionType;
  onBack: () => void;
  onNavigateAction: (a: EventActionType) => void;
  printCategoryId?: string;
  /** Brackets: number of categories, for the «all brackets» PDF button. */
  printAllCount?: number;
}> = ({ event, language, active, onBack, onNavigateAction, printCategoryId, printAllCount }) => {
  const printKind = active === 'brackets' ? 'bracket' : active === 'results' ? 'results' : active === 'medals' ? 'medals' : null;
  const tabs: { id: EventActionType; label: string }[] = [
    { id: 'info', label: t(language, 'Информация', 'Маалымат', 'Info') },
    { id: 'categories_prices', label: t(language, 'Категории', 'Категориялар', 'Categories') },
    { id: 'brackets', label: t(language, 'Сетки', 'Торчолор', 'Brackets') },
    { id: 'results', label: t(language, 'Результаты', 'Жыйынтыктар', 'Results') },
    { id: 'medals', label: t(language, 'Медали', 'Медалдар', 'Medals') },
    { id: 'live_scoring', label: 'Live' }
  ];
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> {t(language, 'Все турниры', 'Бардык мелдештер', 'All tournaments')}
      </button>
      <div className="flex flex-wrap items-start gap-3">
        <h1 translate="no" className="flex-1 min-w-[220px] text-2xl font-bold text-[var(--app-text-primary)] leading-snug">{eventTitle(event, language)}</h1>
        {printKind && (
          <div className="flex flex-wrap gap-2">
            <a
              href={printUrl({ kind: printKind, eventId: event.id, categoryId: printKind === 'bracket' ? printCategoryId : undefined, lang: language })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]"
            >
              <Printer className="w-4 h-4" />{' '}
              {printKind === 'bracket' && printCategoryId
                ? t(language, 'Эта сетка / PDF', 'Бул торчо / PDF', 'This bracket / PDF')
                : t(language, 'Печать / PDF', 'Басып чыгаруу / PDF', 'Print / PDF')}
            </a>
            {/* All brackets of the tournament in one PDF (one category per page) */}
            {printKind === 'bracket' && printCategoryId && (printAllCount ?? 0) > 1 && (
              <a
                href={printUrl({ kind: 'bracket', eventId: event.id, lang: language })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--accent)] text-sm font-semibold text-[var(--accent)] hover:bg-[var(--app-surface-subtle)]"
              >
                <Printer className="w-4 h-4" /> {t(language, `Все сетки (${printAllCount}) / PDF`, `Бардык торчолор (${printAllCount}) / PDF`, `All brackets (${printAllCount}) / PDF`)}
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar border-b border-[var(--app-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigateAction(tab.id)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
              active === tab.id
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ language: Lang; text: [string, string, string] }> = ({ language, text }) => (
  <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-10 text-center">
    <Trophy className="w-8 h-8 mx-auto text-[var(--app-text-muted)]" />
    <div className="mt-3 font-semibold text-[var(--app-text-primary)]">{t(language, ...text)}</div>
    <div className="text-sm text-[var(--app-text-muted)] mt-1">
      {t(language, 'Они появятся здесь, когда организатор проведёт жеребьёвку.', 'Уюштуруучу чүчүкулак өткөргөндөн кийин бул жерде пайда болот.', 'They will appear here after the draw.')}
    </div>
  </div>
);

const BoutCard: React.FC<{ bout: Bout; language: Lang }> = ({ bout, language }) => {
  const live = bout.status === 'in_progress';
  const row = (side: 'aka' | 'ao') => {
    const p = side === 'aka' ? bout.akaParticipant : bout.aoParticipant;
    const id = side === 'aka' ? bout.akaParticipantId : bout.aoParticipantId;
    const score = side === 'aka' ? bout.akaScore : bout.aoScore;
    const won = !!bout.winnerId && bout.winnerId === id;
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${won ? 'font-semibold' : ''}`}>
        <span className={`w-1.5 self-stretch rounded-full ${side === 'aka' ? 'bg-red-600' : 'bg-blue-600'}`} />
        <span className="flex-1 min-w-0">
          <span className={`block truncate text-sm ${p ? 'text-[var(--app-text-primary)]' : 'text-[var(--app-text-muted)] italic'}`}>
            {p ? fullName(p) : t(language, 'ожидается', 'күтүлүүдө', 'TBD')}
          </span>
          {p && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] min-w-0">
              <Flag p={p as Participant} />
              <span className="truncate">{displayClub(p as Participant, currentMode)}</span>
            </span>
          )}
        </span>
        {(bout.status !== 'scheduled' || score > 0) && (
          <span className="text-sm tabular-nums text-[var(--app-text-primary)]">{score}</span>
        )}
      </div>
    );
  };
  return (
    <div className={`rounded-xl border bg-[var(--app-surface)] overflow-hidden ${live ? 'border-red-500' : 'border-[var(--app-border)]'}`}>
      <div className="flex items-center justify-between px-3 py-1 text-[11px] text-[var(--app-text-muted)] bg-[var(--app-surface-subtle)]">
        <span>#{bout.boutNumber} · {t(language, 'Татами', 'Татами', 'Tatami')} {bout.tatamiNumber ?? '–'}</span>
        {live ? (
          <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><Radio className="w-3 h-3" /> LIVE</span>
        ) : (
          <span>{bout.scheduledTime}</span>
        )}
      </div>
      {row('aka')}
      <div className="border-t border-[var(--app-border)]" />
      {row('ao')}
    </div>
  );
};

type PickerKind = 'all' | 'kata' | 'kumite' | 'team';
const kindOf = (name: string): Exclude<PickerKind, 'all'> => (/team|команд/i.test(name) ? 'team' : /kata|ката/i.test(name) ? 'kata' : 'kumite');
const norm = (x: string) => x.toLowerCase().replace(/ё/g, 'е');

/**
 * Category choice for big tournaments (Uventex-size: 100+ categories): arrows to go one by one,
 * and a list with search by category, athlete or club plus a kata / kumite / teams filter.
 * Small tournaments (up to 8 categories) keep the simple row of buttons.
 */
const CategoryPicker: React.FC<{
  cats: { id: string; name: string }[];
  bouts: Bout[];
  active?: string;
  onPick: (id: string) => void;
  language: Lang;
}> = ({ cats, bouts, active, onPick, language }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [kind, setKind] = React.useState<PickerKind>('all');
  const boxRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const info = React.useMemo(
    () =>
      cats.map((c) => {
        const cb = bouts.filter((b) => b.categoryId === c.id);
        const people = new Map<string, Participant>();
        for (const b of cb) for (const p of [b.akaParticipant, b.aoParticipant] as (Participant | undefined)[]) if (p) people.set(p.id, p);
        const label = localizeCategoryName(c.name, language);
        return { ...c, label, kind: kindOf(c.name), tatami: cb[0]?.tatamiNumber, people: [...people.values()] };
      }),
    [cats, bouts, language]
  );

  React.useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
    const onDown = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-sm border cursor-pointer ${on ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-[var(--accent)]'}`;

  if (cats.length <= 8)
    return (
      <div className="flex flex-wrap gap-2">
        {info.map((c) => (
          <button key={c.id} onClick={() => onPick(c.id)} className={chip(c.id === active)}>
            {c.label}
          </button>
        ))}
      </div>
    );

  const idx = Math.max(0, info.findIndex((c) => c.id === active));
  const current = info[idx];
  const q = norm(query.trim());
  const matches = info
    .filter((c) => kind === 'all' || c.kind === kind)
    .map((c) => {
      if (!q) return { c, who: '' };
      if (norm(c.label).includes(q) || norm(c.name).includes(q)) return { c, who: '' };
      const p = c.people.find((x) => norm(`${fullName(x)} ${x.clubName || ''} ${x.teamName || ''}`).includes(q));
      return p ? { c, who: `${fullName(p)}${p.clubName ? ` · ${p.clubName}` : ''}` } : null;
    })
    .filter(Boolean) as { c: (typeof info)[number]; who: string }[];
  const kinds: [PickerKind, string][] = [
    ['all', t(language, 'Все', 'Баары', 'All')],
    ['kata', t(language, 'Ката', 'Ката', 'Kata')],
    ['kumite', t(language, 'Кумитэ', 'Кумитэ', 'Kumite')],
    ['team', t(language, 'Команды', 'Командалар', 'Teams')]
  ];
  const arrow = 'h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] hover:border-[var(--accent)] disabled:opacity-40 cursor-pointer disabled:cursor-default';

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2">
        <button className={arrow} disabled={idx === 0} onClick={() => onPick(info[idx - 1].id)} aria-label={t(language, 'Предыдущая категория', 'Мурунку категория', 'Previous category')}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 min-h-10 py-1.5 px-3 rounded-xl border border-[var(--accent)] bg-[var(--app-surface)] text-left flex items-center gap-2 cursor-pointer"
        >
          <span className="flex-1 min-w-0 line-clamp-2 sm:truncate text-sm sm:text-base leading-snug font-semibold text-[var(--app-text-primary)]" translate="no">{current?.label}</span>
          <span className="shrink-0 text-xs text-[var(--app-text-muted)]">
            {idx + 1} / {info.length}
          </span>
          <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--app-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button className={arrow} disabled={idx === info.length - 1} onClick={() => onPick(info[idx + 1].id)} aria-label={t(language, 'Следующая категория', 'Кийинки категория', 'Next category')}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl p-3 space-y-3">
          <label className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--app-border)] focus-within:border-[var(--accent)]">
            <Search className="w-4 h-4 text-[var(--app-text-muted)] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) {
                  onPick(matches[0].c.id);
                  setOpen(false);
                }
              }}
              placeholder={t(language, 'Категория, спортсмен или клуб…', 'Категория, спортчу же клуб…', 'Category, athlete or club…')}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[var(--app-text-primary)]"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {kinds.map(([k, label]) => (
              <button key={k} onClick={() => setKind(k)} className={chip(kind === k)}>
                {label}
              </button>
            ))}
          </div>
          <ul className="max-h-[55vh] overflow-y-auto divide-y divide-[var(--app-border)] -mx-1">
            {matches.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-[var(--app-text-muted)]">{t(language, 'Ничего не найдено', 'Эч нерсе табылган жок', 'Nothing found')}</li>
            )}
            {matches.map(({ c, who }) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    onPick(c.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2 py-2 rounded-lg flex items-start gap-2 cursor-pointer hover:bg-[var(--app-surface-subtle)] ${c.id === active ? 'bg-[var(--app-surface-subtle)]' : ''}`}
                >
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm ${c.id === active ? 'font-semibold text-[var(--accent)]' : 'text-[var(--app-text-primary)]'}`} translate="no">{c.label}</span>
                    {who && <span className="block text-xs text-[var(--app-text-muted)]" translate="no">{who}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--app-text-muted)] whitespace-nowrap">
                    {c.tatami ? `${t(language, 'Тат.', 'Тат.', 'Tat.')} ${c.tatami} · ` : ''}
                    {c.people.length} {t(language, 'уч.', 'катыш.', 'ent.')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/** Public bracket of each category, built from the real bouts. */
export const PublicBracketsView: React.FC<BaseProps> = (props) => {
  const { event, bouts, categories, language } = props;
  const { eventBouts, cats } = useEventCategories(event, bouts, categories);
  useEventNameMode(eventBouts, language);
  const [catId, setCatId] = React.useState<string | null>(null);
  const active = catId && cats.some((c) => c.id === catId) ? catId : cats[0]?.id;
  const catBouts = eventBouts.filter((b) => b.categoryId === active);
  const rounds = ELIMINATION_ORDER.filter((s) => catBouts.some((b) => b.roundStage === s));
  const repechage = catBouts
    .filter((b) => b.roundStage === 'repechage' || b.roundStage === 'bronze_match')
    .sort((a, b) => repechageHalf(a) - repechageHalf(b) || repechageStep(a) - repechageStep(b));

  return (
    <div className="theme-keep space-y-5 pb-8">
      <EventHeader {...props} active="brackets" printCategoryId={active} printAllCount={cats.length} />
      {cats.length === 0 ? (
        <EmptyState language={language} text={['Сетки ещё не опубликованы', 'Торчолор али жарыялана элек', 'Brackets are not published yet']} />
      ) : (
        <>
          <CategoryPicker cats={cats} bouts={eventBouts} active={active} onPick={setCatId} language={language} />
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-2">
              {rounds.map((stage) => (
                <div key={stage} className="w-64 flex flex-col">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-2">{stageLabel(stage, language)}</div>
                  <div className="flex flex-col justify-around flex-1 gap-3">
                    {catBouts
                      .filter((b) => b.roundStage === stage)
                      .sort((a, b) => a.bracketPosition - b.bracketPosition)
                      .map((b) => (
                        <BoutCard key={b.id} bout={b} language={language} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {repechage.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-2">
                {t(language, 'Утешительные бои за бронзу', 'Коло үчүн утешителдик беттештер', 'Repechage (bronze)')}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {repechage.map((b) => (
                  <BoutCard key={b.id} bout={b} language={language} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

/** Podium of each category ('results') or medal table by club and country ('medals'). */
export const PublicResultsView: React.FC<BaseProps & { mode: 'results' | 'medals' }> = (props) => {
  const { event, bouts, participants, categories, language, mode } = props;
  const { eventBouts, cats } = useEventCategories(event, bouts, categories);
  useEventNameMode(eventBouts, language);

  const find = (id?: string): Participant | undefined =>
    participants.find((p) => p.id === id) ||
    (eventBouts.find((b) => b.akaParticipantId === id)?.akaParticipant as Participant | undefined) ||
    (eventBouts.find((b) => b.aoParticipantId === id)?.aoParticipant as Participant | undefined);

  const standings = cats.map((c) => ({ ...c, s: computeStandings(eventBouts, c.id) }));
  const anyMedal = standings.some((x) => x.s.gold || x.s.bronze.length);

  // Medal table: gold > silver > bronze, by club and by country
  const table = (key: (p: Participant) => string) => {
    const rows = new Map<string, { name: string; g: number; s: number; b: number }>();
    const add = (id: string | undefined, medal: 'g' | 's' | 'b') => {
      const p = find(id);
      if (!p) return;
      const k = key(p) || '—';
      const r = rows.get(k) || { name: k, g: 0, s: 0, b: 0 };
      r[medal]++;
      rows.set(k, r);
    };
    standings.forEach(({ s }) => {
      add(s.gold, 'g');
      add(s.silver, 's');
      s.bronze.forEach((id) => add(id, 'b'));
    });
    return [...rows.values()].sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || a.name.localeCompare(b.name));
  };

  const medalCell = (n: number) => <td className="px-3 py-2 text-center tabular-nums">{n || '–'}</td>;
  const MedalTable: React.FC<{ title: string; rows: ReturnType<typeof table> }> = ({ title, rows }) => (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
      <h3 className="px-4 py-3 font-semibold text-[var(--app-text-primary)] border-b border-[var(--app-border)]">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-[var(--app-text-primary)]">
          <thead className="text-xs text-[var(--app-text-muted)] bg-[var(--app-surface-subtle)]">
            <tr>
              <th className="px-3 py-2 text-left w-10">#</th>
              <th className="px-3 py-2 text-left">{t(language, 'Название', 'Аталышы', 'Name')}</th>
              <th className="px-3 py-2">🥇</th>
              <th className="px-3 py-2">🥈</th>
              <th className="px-3 py-2">🥉</th>
              <th className="px-3 py-2">{t(language, 'Всего', 'Баары', 'Total')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} className="border-t border-[var(--app-border)]">
                <td className="px-3 py-2 tabular-nums text-[var(--app-text-muted)]">{i + 1}</td>
                <td className="px-3 py-2">{r.name}</td>
                {medalCell(r.g)}
                {medalCell(r.s)}
                {medalCell(r.b)}
                <td className="px-3 py-2 text-center tabular-nums font-semibold">{r.g + r.s + r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="theme-keep space-y-5 pb-8">
      <EventHeader {...props} active={mode} />
      {!anyMedal ? (
        <EmptyState
          language={language}
          text={
            mode === 'results'
              ? ['Результатов пока нет', 'Жыйынтыктар азырынча жок', 'No results yet']
              : ['Медалей пока нет', 'Медалдар азырынча жок', 'No medals yet']
          }
        />
      ) : mode === 'results' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {standings.map(({ id, name, s }) => (
            <section key={id} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <h3 className="font-semibold text-[var(--app-text-primary)]">{localizeCategoryName(name, language)}</h3>
              <ol className="mt-3 space-y-2">
                {[
                  { place: '1', medal: '🥇', id: s.gold },
                  { place: '2', medal: '🥈', id: s.silver },
                  ...s.bronze.map((b) => ({ place: '3', medal: '🥉', id: b }))
                ].map((row, i) => {
                  const p = find(row.id);
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-6 text-center">{row.medal}</span>
                      <span className="flex-1 min-w-0">
                        <span className={`block truncate ${p ? 'text-[var(--app-text-primary)]' : 'text-[var(--app-text-muted)] italic'}`}>
                          {p ? fullName(p) : t(language, 'определяется', 'аныкталууда', 'pending')}
                        </span>
                        {p && (
                          <span className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)] min-w-0">
                            <Flag p={p} />
                            <span className="truncate">{[p.clubName, p.city].filter(Boolean).join(' · ')}</span>
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {!s.complete && (
                <div className="mt-3 text-xs text-[var(--app-text-muted)]">{t(language, 'Категория ещё не завершена', 'Категория бүтө элек', 'Category in progress')}</div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <MedalTable title={t(language, 'Медальный зачёт по клубам', 'Клубдар боюнча медалдык эсеп', 'Medal table by club')} rows={table((p) => p.clubName || '')} />
          <MedalTable
            title={t(language, 'Медальный зачёт по странам', 'Өлкөлөр боюнча медалдык эсеп', 'Medal table by country')}
            rows={table((p) => {
              const c = participantCountry(p);
              return c ? `${flagEmoji(c.iso2)} ${countryName(c, language)} · ${c.noc}` : p.country || '';
            })}
          />
          <p className="text-xs text-[var(--app-text-muted)] inline-flex items-center gap-1">
            <Medal className="w-3.5 h-3.5" />
            {t(language, 'Считается автоматически по итогам боёв. Две бронзы в каждой категории (утешительные бои WKF).', 'Беттештердин жыйынтыгы боюнча автоматтык түрдө эсептелет.', 'Calculated automatically from bout results. Two bronze medals per category (WKF repechage).')}
          </p>
        </div>
      )}
    </div>
  );
};

/** Public live page: every tatami of the event with the bout on it, updated instantly. */
export type VideoChoice = number | 'all';

/** Grid columns for N videos on screen at once. */
const gridCols = (n: number) => (n <= 1 ? '' : n <= 4 ? 'sm:grid-cols-2' : n <= 9 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4');

/**
 * YouTube video of the tatami (links are set by the organizer in «Screens, QR codes & video»).
 * «All tatami» shows every video at once, muted; the viewer turns the sound on for one tatami.
 */
export const LiveVideo: React.FC<{
  streams: Record<string, string>;
  tatamis: number[];
  selected: VideoChoice;
  onSelect: (v: VideoChoice) => void;
  language: Lang;
  anchorId?: string;
}> = ({ streams, tatamis, selected, onSelect, language, anchorId = 'live-video' }) => {
  const frames = React.useRef<Record<number, HTMLIFrameElement | null>>({});
  // Tatami whose sound is on — the viewer decides, any number at once
  const [soundOn, setSoundOn] = React.useState<number[]>([]);
  const shown = selected === 'all' ? tatamis : tatamis.includes(selected) ? [selected] : tatamis.slice(0, 1);
  const many = shown.length > 1;

  // «Full screen»: the video block covers the whole screen and the tiles are sized so all tatami fit without scrolling
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [full, setFull] = React.useState(false);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    if (!full) return;
    const measure = () => {
      const el = gridRef.current;
      if (el) setBox({ w: el.clientWidth - 16, h: el.clientHeight - 16 });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && gridRef.current) ro.observe(gridRef.current);
    window.addEventListener('resize', measure);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onKey);
    // Leaving the browser's full screen (Esc, gesture) also leaves our mode
    const onFs = () => {
      if (!document.fullscreenElement) setFull(false);
    };
    document.addEventListener('fullscreenchange', onFs);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
      document.body.style.overflow = prevOverflow;
    };
  }, [full]);
  const enterFull = () => {
    setFull(true);
    // Real full screen where the browser allows it (computers, Android); iPhone keeps the page-wide view
    sectionRef.current?.requestFullscreen?.().catch(() => {});
  };
  const exitFull = () => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  const fit = full ? fitVideoGrid(shown.length, box.w, box.h, 8, 40) : null;

  if (shown.length === 0) return null;

  // Each tatami's sound is switched on/off on its own; the others are not touched
  const toggleSound = (n: number) => {
    const frame = frames.current[n];
    if (soundOn.includes(n)) {
      youtubeCommand(frame, 'mute');
      setSoundOn(soundOn.filter((x) => x !== n));
    } else {
      youtubeCommand(frame, 'unMute');
      youtubeCommand(frame, 'setVolume', [100]);
      youtubeCommand(frame, 'playVideo');
      setSoundOn([...soundOn, n]);
    }
  };
  // Switching view reloads the players muted
  const pick = (v: VideoChoice) => {
    setSoundOn([]);
    onSelect(v);
  };
  const pill = (active: boolean) =>
    `h-8 px-3 rounded-full text-sm font-semibold border cursor-pointer ${
      active ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-[var(--accent)]'
    }`;
  const label = (n: number) => `${t(language, 'Татами', 'Татами', 'Tatami')} ${n}`;

  return (
    <section
      id={anchorId}
      ref={sectionRef}
      className={
        full
          ? 'fixed inset-0 z-[200] flex flex-col bg-[var(--app-bg,#0b0f17)] overflow-hidden'
          : 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden scroll-mt-20'
      }
    >
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[var(--app-border)] bg-[var(--app-surface)]">
        <span className="inline-flex items-center gap-1.5 font-bold text-[var(--app-text-primary)]">
          <Youtube className="w-5 h-5 text-red-600" /> {t(language, 'Видео', 'Видео', 'Video')}
        </span>
        <span className="flex-1" />
        {tatamis.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="tablist">
            <button role="tab" aria-selected={selected === 'all'} onClick={() => pick('all')} className={pill(selected === 'all')}>
              {t(language, 'Все татами', 'Бардык татами', 'All tatami')}
            </button>
            {tatamis.map((n) => (
              <button key={n} role="tab" aria-selected={selected === n} onClick={() => pick(n)} className={pill(selected === n)}>
                {label(n)}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--app-text-secondary)]">{label(tatamis[0])}</span>
        )}
        <button
          onClick={full ? exitFull : enterFull}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-semibold border border-[var(--app-border)] text-[var(--app-text-primary)] hover:border-[var(--accent)] cursor-pointer"
        >
          {full ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          {full ? t(language, 'Выйти', 'Чыгуу', 'Exit') : t(language, 'На весь экран', 'Толук экран', 'Full screen')}
        </button>
      </div>
      {many && !full && (
        <p className="px-4 pt-2 text-xs text-[var(--app-text-muted)]">
          {t(language, 'Видео начинаются без звука. Нажмите «Звук» на тех татами, которые хотите слушать — можно на одном, на нескольких или на всех. Повторное нажатие выключает звук.', 'Видеолор үнсүз башталат. Уккуңуз келген татамилерде «Үн» баскычын басыңыз — бирөөндө, бир нечесинде же баарында. Кайра басуу үндү өчүрөт.', 'Videos start muted. Tap “Sound” on the tatami you want to hear — one, several or all. Tap again to mute.')}
        </p>
      )}
      <div
        ref={gridRef}
        className={full ? 'flex-1 min-h-0 grid gap-2 p-2 content-center justify-center' : `grid gap-2 ${many ? 'p-2' : ''} ${gridCols(shown.length)}`}
        style={fit && fit.tileWidth > 0 ? { gridTemplateColumns: `repeat(${fit.cols}, ${fit.tileWidth}px)` } : undefined}
      >
        {shown.map((n) => {
          const id = youtubeVideoId(streams[String(n)]);
          if (!id) return null;
          return (
            <div key={n} className={many ? 'rounded-xl overflow-hidden border border-[var(--app-border)]' : ''}>
              {/* Title bar with the «Sound» button — also for a single tatami (phones hide YouTube's own sound button) */}
              {(
                <div className="flex items-center gap-2 px-2.5 h-10 bg-[var(--app-surface-subtle)]">
                  <span className="flex-1 min-w-0 truncate whitespace-nowrap text-sm font-semibold text-[var(--app-text-primary)]">{label(n)}</span>
                  <button
                    onClick={() => toggleSound(n)}
                    aria-pressed={soundOn.includes(n)}
                    className={`shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold border cursor-pointer whitespace-nowrap ${
                      soundOn.includes(n) ? 'bg-red-600 border-red-600 text-white' : 'border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-red-500'
                    }`}
                  >
                    {soundOn.includes(n) ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    {soundOn.includes(n) ? t(language, 'Звук включён', 'Үн күйүк', 'Sound on') : t(language, 'Звук', 'Үн', 'Sound')}
                  </button>
                  {many && (
                    <button onClick={() => pick(n)} className="text-xs text-[var(--accent)] hover:underline cursor-pointer" title={t(language, 'Смотреть крупно', 'Чоң көрүү', 'Watch large')}>
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  key={id}
                  ref={(el) => {
                    frames.current[n] = el;
                  }}
                  src={youtubeEmbedUrl(id)}
                  title={`${label(n)} — YouTube`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          );
        })}
      </div>
      {!many && !full && (
        <a
          href={streams[String(shown[0])]}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[var(--accent)] hover:bg-[var(--app-surface-subtle)]"
        >
          <ExternalLink className="w-4 h-4" /> {t(language, 'Открыть на YouTube', 'YouTube\'да ачуу', 'Open on YouTube')}
        </a>
      )}
    </section>
  );
};

export const PublicLiveView: React.FC<BaseProps> = (props) => {
  const { event, bouts, language } = props;
  const eventBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, event.id));
  useEventNameMode(eventBouts, language);
  const tatamis = Array.from(new Set(eventBouts.map((b) => b.tatamiNumber).filter((n): n is number => !!n))).sort((a, b) => a - b);
  const streams = event.liveStreams || {};
  const videoTatamis = streamTatamis(streams);
  // Several tatami with video: show them all at once by default
  const [videoTatami, setVideoTatami] = React.useState<VideoChoice>('all');
  const watchTatami = (n: number) => {
    setVideoTatami(n);
    document.getElementById('live-video')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const anyRunning = eventBouts.some((b) => E.isRunning(b));
  const [now, setNow] = React.useState(clockNow());
  React.useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNow(clockNow()), 100);
    return () => clearInterval(id);
  }, [anyRunning]);

  return (
    <div className="theme-keep space-y-5 pb-8">
      <EventHeader {...props} active="live_scoring" />
      {videoTatamis.length > 0 && <LiveVideo streams={streams} tatamis={videoTatamis} selected={videoTatami} onSelect={setVideoTatami} language={language} />}
      {tatamis.length === 0 ? (
        videoTatamis.length > 0 ? null : <EmptyState language={language} text={['Трансляция ещё не началась', 'Түз эфир али башталган жок', 'Live scoring has not started yet']} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tatamis.map((tn) => {
            const b = currentBoutOf(eventBouts, tn);
            const next = upcomingOf(eventBouts, tn, b?.id, 2);
            const live = !!b && (b.status === 'in_progress' || !!b.awaitingDecision);
            const side = (s: 'aka' | 'ao') => {
              const p = s === 'aka' ? b?.akaParticipant : b?.aoParticipant;
              const won = b?.status === 'completed' && b.winnerId === (s === 'aka' ? b.akaParticipantId : b.aoParticipantId);
              return (
                <div className={`flex items-center gap-3 px-4 py-3 ${s === 'aka' ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-[15px] ${won ? 'font-bold' : 'font-semibold'}`}>{p ? fullName(p) : '—'}</div>
                    <div className="truncate text-xs opacity-90">
                      {p && `${participantFlag(p as Participant)} ${participantNoc(p as Participant)} · `}
                      {p?.clubName}
                    </div>
                  </div>
                  {(s === 'aka' ? b?.akaSenshu : b?.aoSenshu) && <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[10px] font-black">SENSHU</span>}
                  <div className="text-3xl font-black tabular-nums w-10 text-right">{s === 'aka' ? b?.akaScore : b?.aoScore}</div>
                </div>
              );
            };
            return (
              <section key={tn} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--app-border)]">
                  <span className="font-bold text-[var(--app-text-primary)]">{t(language, 'Татами', 'Татами', 'Tatami')} {tn}</span>
                  {live && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      <Radio className="w-3.5 h-3.5" /> LIVE
                    </span>
                  )}
                  {b?.vrReviewActive && b.status !== 'completed' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-violet-600 text-white">
                      VIDEO REVIEW
                    </span>
                  )}
                  {videoTatamis.includes(tn) && (
                    <button
                      onClick={() => watchTatami(tn)}
                      className="inline-flex items-center gap-1 h-7 px-2 rounded-full border border-[var(--app-border)] text-xs font-semibold text-[var(--app-text-secondary)] hover:border-red-500 hover:text-red-600 cursor-pointer"
                    >
                      <Youtube className="w-3.5 h-3.5 text-red-600" /> {t(language, 'Видео', 'Видео', 'Video')}
                    </button>
                  )}
                  <span className="flex-1" />
                  {b && <span className="text-2xl font-black tabular-nums text-[var(--app-text-primary)]">{E.formatClock(E.remainingSeconds(b, now))}</span>}
                </div>
                {b ? (
                  <>
                    <div className="px-4 py-1.5 text-xs text-[var(--app-text-muted)] truncate">
                      {localizeCategoryName(b.categoryName, language)} · {stageLabel(b.roundStage, language)} · #{b.boutNumber}
                    </div>
                    {side('aka')}
                    {side('ao')}
                    {b.status === 'completed' && b.winReason && (
                      <div className="px-4 py-2 text-sm text-[var(--app-text-secondary)]">
                        {t(language, 'Победа', 'Жеңиш', 'Winner')}: {b.winnerId === b.akaParticipantId ? t(language, 'АКА', 'АКА', 'AKA') : t(language, 'АО', 'АО', 'AO')} · {E.winReasonLabel(b.winReason, language)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-sm text-[var(--app-text-muted)]">
                    {next.length > 0
                      ? t(language, 'Ожидается пара для следующего боя', 'Кийинки беттештин жубу күтүлүүдө', 'Waiting for the next pair')
                      : t(language, 'Поединков нет', 'Беттеш жок', 'No bouts')}
                  </div>
                )}
                {next.length > 0 && (
                  <div className="px-4 py-2 border-t border-[var(--app-border)] text-xs text-[var(--app-text-muted)] space-y-0.5">
                    {next.map((n) => (
                      <div key={n.id} className="truncate">
                        {t(language, 'Далее', 'Кийинки', 'Next')} #{n.boutNumber}: {fullName(n.akaParticipant as Participant) || '—'} — {fullName(n.aoParticipant as Participant) || '—'}
                      </div>
                    ))}
                  </div>
                )}
                <a
                  href={`/?screen=tatami&t=${tn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-2.5 border-t border-[var(--app-border)] text-sm text-[var(--accent)] hover:bg-[var(--app-surface-subtle)]"
                >
                  {t(language, 'Открыть табло на весь экран', 'Табло толук экранда', 'Open full-screen scoreboard')} →
                </a>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Public list of the tournament's categories with fee and number of entries. */
export const PublicCategoriesView: React.FC<
  BaseProps & { eventCategories: EventCategory[]; onEnter: () => void; currency?: string }
> = (props) => {
  const { event, participants, language, eventCategories, onEnter, currency = 'сом' } = props;
  const cats = eventCategories.filter((c) => c.tournamentId === event.id);
  const pricing = sanitizePricing(event.pricing);
  const nowPeriod = currentPeriod(pricing, bishkekDate(new Date(clockNow())));
  const [periodId, setPeriodId] = React.useState<string | null>(null);
  const period = pricing?.periods.find((p) => p.id === periodId) || nowPeriod;
  const showNext = (pricing?.additionalDiscount || 0) > 0;
  const fmt = (iso: string) => iso.split('-').reverse().join('.');
  const money = (n: number) => (n ? `${n} ${currency}` : '—');
  const groups = (['kata', 'kumite', 'team_kata', 'team_kumite', 'other'] as const)
    .map((d) => ({ d, list: cats.filter((c) => c.discipline === d) }))
    .filter((g) => g.list.length > 0);
  return (
    <div className="theme-keep space-y-5 pb-8">
      <EventHeader {...props} active="categories_prices" />
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm text-[var(--app-text-secondary)]">
          {t(language, 'Возраст считается на первый день турнира. Вес — по взвешиванию.', 'Жаш мелдештин биринчи күнүнө эсептелет.', 'Age is counted on the first day of the tournament.')}
        </p>
        <button onClick={onEnter} className="h-10 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
          {t(language, 'Подать заявку', 'Табыштама берүү', 'Enter')}
        </button>
      </div>
      {pricing && (pricing.periods.length > 0 || showNext) && (
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
          {pricing.periods.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-[var(--app-text-primary)] mb-2">{t(language, 'Ценовые периоды', 'Баа мезгилдери', 'Price periods')}</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t(language, 'Ценовые периоды', 'Баа мезгилдери', 'Price periods')}>
                {pricing.periods.map((p) => {
                  const start = periodStartsOn(pricing, p.id);
                  const active = period?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPeriodId(p.id)}
                      aria-pressed={active}
                      className={`text-left rounded-xl border px-3 py-2 text-sm cursor-pointer ${active ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]'}`}
                    >
                      <span className="block font-semibold">
                        {p.name || t(language, 'Период', 'Мезгил', 'Period')}
                        {nowPeriod?.id === p.id && <span className={`ml-2 text-xs font-normal ${active ? 'text-white/85' : 'text-emerald-700'}`}>{t(language, 'сейчас', 'азыр', 'now')}</span>}
                      </span>
                      <span className={`block text-xs ${active ? 'text-white/85' : 'text-[var(--app-text-muted)]'}`}>
                        {start ? `${fmt(start)} – ${fmt(p.endsOn)}` : `${t(language, 'до', 'чейин', 'until')} ${fmt(p.endsOn)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {showNext && (
            <p className="text-sm text-[var(--app-text-secondary)]">
              {t(
                language,
                `Несколько категорий: самая дорогая — полная цена, каждая следующая — на ${pricing.additionalDiscount} ${currency} дешевле. Командные — без скидки.`,
                `Бир нече категория: эң кымбаты — толук баада, ар бир кийинкиси — ${pricing.additionalDiscount} ${currency} арзан. Командалыктарга арзандатуу жок.`,
                `Several categories: the most expensive is full price, each next one is ${pricing.additionalDiscount} ${currency} less. No discount for teams.`
              )}
            </p>
          )}
        </section>
      )}
      {groups.map(({ d, list }) => (
        <section key={d} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
          <h2 className="px-4 py-3 font-semibold text-[var(--app-text-primary)] border-b border-[var(--app-border)]">{DISCIPLINE_LABELS[d]}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[var(--app-text-primary)]">
              <thead className="text-xs text-[var(--app-text-muted)] bg-[var(--app-surface-subtle)]">
                <tr>
                  <th className="px-4 py-2 text-left">{t(language, 'Категория', 'Категория', 'Category')}</th>
                  <th className="px-4 py-2 text-right">{t(language, 'Заявок', 'Табыштама', 'Entries')}</th>
                  <th className="px-4 py-2 text-right">{showNext ? t(language, '1-я категория', '1-категория', '1st category') : t(language, 'Взнос', 'Төлөм', 'Fee')}</th>
                  {showNext && <th className="px-4 py-2 text-right">{t(language, 'Следующая', 'Кийинки', 'Next')}</th>}
                  <th className="px-4 py-2 text-right">{t(language, 'Статус', 'Абалы', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--app-border)]">
                    <td className="px-4 py-2">{categoryName(c)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{activeEntries(participants, c.id).length}</td>
                    <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">{money(categoryPrice(c, period))}</td>
                    {showNext && (
                      <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">
                        {isTeamDiscipline(c.discipline) ? '—' : money(additionalPrice(c, period, pricing))}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right text-xs">
                      <span className={c.isClosed ? 'text-[var(--app-text-muted)]' : 'text-emerald-700'}>
                        {c.isClosed ? t(language, 'приём закрыт', 'жабык', 'closed') : t(language, 'приём заявок', 'ачык', 'open')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};
