import React from 'react';
import { ArrowLeft, Trophy, Radio, Medal } from 'lucide-react';
import type { Bout, Participant, TournamentCategory } from '../types/schema';
import type { UventexEventItem, EventActionType } from '../data/uventexEventsData';
import { belongsToEvent } from '../data/sampleTournamentData';
import { ELIMINATION_ORDER, computeStandings, repechageHalf, repechageStep, stageLabel } from '../utils/bracketProgression';

type Lang = 'ru' | 'ky' | 'en';

interface BaseProps {
  event: UventexEventItem;
  bouts: Bout[];
  participants: Participant[];
  categories: TournamentCategory[];
  language: Lang;
  onBack: () => void;
  onNavigateAction: (action: EventActionType) => void;
}

const t = (lang: Lang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

const fullName = (p?: Participant) => (p ? `${p.lastName} ${p.firstName}`.trim() : '');

/** Categories of this event that have at least one bout, with a readable name. */
function useEventCategories(event: UventexEventItem, bouts: Bout[], categories: TournamentCategory[]) {
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
  event: UventexEventItem;
  language: Lang;
  active: EventActionType;
  onBack: () => void;
  onNavigateAction: (a: EventActionType) => void;
}> = ({ event, language, active, onBack, onNavigateAction }) => {
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
      <h1 className="text-2xl font-bold text-[var(--app-text-primary)] leading-snug">{event.title}</h1>
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
          {p?.clubName && <span className="block truncate text-xs text-[var(--app-text-muted)]">{p.clubName}</span>}
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

/** Public bracket of each category, built from the real bouts. */
export const PublicBracketsView: React.FC<BaseProps> = (props) => {
  const { event, bouts, categories, language } = props;
  const { eventBouts, cats } = useEventCategories(event, bouts, categories);
  const [catId, setCatId] = React.useState<string | null>(null);
  const active = catId && cats.some((c) => c.id === catId) ? catId : cats[0]?.id;
  const catBouts = eventBouts.filter((b) => b.categoryId === active);
  const rounds = ELIMINATION_ORDER.filter((s) => catBouts.some((b) => b.roundStage === s));
  const repechage = catBouts
    .filter((b) => b.roundStage === 'repechage' || b.roundStage === 'bronze_match')
    .sort((a, b) => repechageHalf(a) - repechageHalf(b) || repechageStep(a) - repechageStep(b));

  return (
    <div className="theme-keep space-y-5 pb-8">
      <EventHeader {...props} active="brackets" />
      {cats.length === 0 ? (
        <EmptyState language={language} text={['Сетки ещё не опубликованы', 'Торчолор али жарыялана элек', 'Brackets are not published yet']} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${
                  c.id === active
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-[var(--accent)]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
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
              <h3 className="font-semibold text-[var(--app-text-primary)]">{name}</h3>
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
                        {p && <span className="block truncate text-xs text-[var(--app-text-muted)]">{[p.clubName, p.city, p.country].filter(Boolean).join(' · ')}</span>}
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
          <MedalTable title={t(language, 'Медальный зачёт по странам', 'Өлкөлөр боюнча медалдык эсеп', 'Medal table by country')} rows={table((p) => p.country || '')} />
          <p className="text-xs text-[var(--app-text-muted)] inline-flex items-center gap-1">
            <Medal className="w-3.5 h-3.5" />
            {t(language, 'Считается автоматически по итогам боёв. Две бронзы в каждой категории (утешительные бои WKF).', 'Беттештердин жыйынтыгы боюнча автоматтык түрдө эсептелет.', 'Calculated automatically from bout results. Two bronze medals per category (WKF repechage).')}
          </p>
        </div>
      )}
    </div>
  );
};
