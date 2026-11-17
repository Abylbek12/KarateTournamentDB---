import React from 'react';
import { Trophy, Building2, Search } from 'lucide-react';
import type { Bout, Participant, Tournament } from '../types/schema';
import { computeStandings } from '../utils/bracketProgression';
import { displayName, participantFlag, participantNoc } from '../utils/names';
import { useApp } from '../context/AppContext';
import { belongsToEvent } from '../data/sampleTournamentData';
import { streamTatamis } from '../utils/youtube';
import { LiveVideo, type VideoChoice } from './PublicEventViews';

/**
 * Public rankings and club directory, computed from real results on the site
 * (no invented numbers). Medal order: gold, then silver, then bronze.
 */

interface CommunityProps {
  tournaments: Tournament[];
  bouts: Bout[];
  participants: Participant[];
}

type Lang = 'ru' | 'ky' | 'en';
const t = (l: Lang, ru: string, ky: string, en: string) => (l === 'ky' ? ky : l === 'en' ? en : ru);
const norm = (s?: string) => (s || '').toLowerCase().replace(/[«»"'“”]/g, '').replace(/\s+/g, ' ').trim();

interface MedalRow {
  key: string;
  person?: Participant;
  club: string;
  city: string;
  g: number;
  s: number;
  b: number;
  events: Set<string>;
}

/** All medals won on the site, optionally for one season (year). */
function collectMedals(bouts: Bout[], participants: Participant[], tournaments: Tournament[], season: string) {
  const out: { person: Participant; medal: 'g' | 's' | 'b'; tournamentId: string }[] = [];
  const byCategory = new Map<string, Bout[]>();
  for (const b of bouts) {
    const k = `${b.tournamentId}::${b.categoryId}`;
    byCategory.set(k, [...(byCategory.get(k) || []), b]);
  }
  for (const [k, list] of byCategory) {
    const [tournamentId, categoryId] = k.split('::');
    const year = tournaments.find((x) => belongsToEvent(tournamentId, x.id))?.startDate?.slice(0, 4);
    if (season !== 'all' && year && year !== season) continue;
    const st = computeStandings(list, categoryId);
    const find = (id?: string) =>
      participants.find((p) => p.id === id) ||
      (list.find((b) => b.akaParticipantId === id)?.akaParticipant as Participant | undefined) ||
      (list.find((b) => b.aoParticipantId === id)?.aoParticipant as Participant | undefined);
    const push = (id: string | undefined, medal: 'g' | 's' | 'b') => {
      const p = find(id);
      if (p) out.push({ person: p, medal, tournamentId });
    };
    push(st.gold, 'g');
    push(st.silver, 's');
    st.bronze.forEach((id) => push(id, 'b'));
  }
  return out;
}

const sortMedals = (a: MedalRow, b: MedalRow) => b.g - a.g || b.s - a.s || b.b - a.b || a.key.localeCompare(b.key);

const Tabs: React.FC<{ value: string; onChange: (v: string) => void; items: [string, string][] }> = ({ value, onChange, items }) => (
  <div className="flex gap-1.5 flex-wrap">
    {items.map(([id, label]) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`px-3 h-9 rounded-lg text-sm cursor-pointer border ${value === id ? 'bg-[var(--accent)] border-[var(--accent)] text-white font-semibold' : 'border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)]'}`}
      >
        {label}
      </button>
    ))}
  </div>
);

const field = 'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm';

export const RankingsPanel: React.FC<CommunityProps> = ({ tournaments, bouts, participants }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as Lang;
  const [tab, setTab] = React.useState<'athletes' | 'clubs'>('athletes');
  const years = Array.from(new Set(tournaments.map((x) => x.startDate?.slice(0, 4)).filter(Boolean))).sort().reverse() as string[];
  const [season, setSeason] = React.useState<string>('all');
  const [q, setQ] = React.useState('');

  const medals = collectMedals(bouts, participants, tournaments, season);
  const rows = new Map<string, MedalRow>();
  for (const m of medals) {
    const p = m.person;
    const key = tab === 'athletes' ? `${norm(p.lastName)} ${norm(p.firstName)} ${norm(p.clubName)}` : norm(p.clubName) || '—';
    const r = rows.get(key) || { key, person: p, club: p.clubName || '—', city: p.city || '', g: 0, s: 0, b: 0, events: new Set<string>() };
    r[m.medal]++;
    r.events.add(m.tournamentId);
    rows.set(key, r);
  }
  const list = [...rows.values()].sort(sortMedals).filter((r) => !q || `${r.key} ${norm(r.city)}`.includes(norm(q)));

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[var(--accent)]" /> {t(lang, 'Рейтинги', 'Рейтингдер', 'Rankings')}
        </h1>
        <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
          {t(
            lang,
            'Медальный рейтинг по результатам турниров, проведённых на Apsatarov: сначала золото, затем серебро и бронза.',
            'Apsatarov аркылуу өткөн мелдештердин жыйынтыгы боюнча медалдык рейтинг: адегенде алтын, андан кийин күмүш жана коло.',
            'Medal ranking from tournaments run on Apsatarov: gold first, then silver and bronze.'
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onChange={(v) => setTab(v as 'athletes' | 'clubs')} items={[['athletes', t(lang, 'Спортсмены', 'Спортчулар', 'Athletes')], ['clubs', t(lang, 'Клубы', 'Клубдар', 'Clubs')]]} />
        <select value={season} onChange={(e) => setSeason(e.target.value)} className={field}>
          <option value="all">{t(lang, 'Все сезоны', 'Бардык сезондор', 'All seasons')}</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <label className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--app-text-muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, 'Поиск', 'Издөө', 'Search')} className={`${field} w-full pl-8`} />
        </label>
      </div>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-x-auto">
        {list.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--app-text-muted)]">
            {t(lang, 'Рейтинг появится после первых завершённых категорий.', 'Рейтинг биринчи бүткөн категориялардан кийин пайда болот.', 'The ranking appears after the first finished categories.')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--app-text-muted)] border-b border-[var(--app-border)]">
              <tr>
                <th className="px-4 py-2 w-10">#</th>
                <th className="px-2 py-2">{tab === 'athletes' ? t(lang, 'Спортсмен', 'Спортчу', 'Athlete') : t(lang, 'Клуб', 'Клуб', 'Club')}</th>
                {tab === 'athletes' && <th className="px-2 py-2">{t(lang, 'Клуб', 'Клуб', 'Club')}</th>}
                <th className="px-2 py-2 text-center">🥇</th>
                <th className="px-2 py-2 text-center">🥈</th>
                <th className="px-2 py-2 text-center">🥉</th>
                <th className="px-2 py-2 text-center">{t(lang, 'Турниров', 'Мелдештер', 'Events')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.key} className="border-b border-[var(--app-border)] last:border-0 text-[var(--app-text-primary)]">
                  <td className="px-4 py-2 font-semibold">{i + 1}</td>
                  <td className="px-2 py-2">
                    {participantFlag(r.person)} {tab === 'athletes' ? displayName(r.person, lang === 'en' ? 'international' : 'local') : r.club}
                    <span className="text-xs text-[var(--app-text-muted)]"> {participantNoc(r.person)}{r.city ? ` · ${r.city}` : ''}</span>
                  </td>
                  {tab === 'athletes' && <td className="px-2 py-2 text-[var(--app-text-secondary)]">{r.club}</td>}
                  <td className="px-2 py-2 text-center">{r.g}</td>
                  <td className="px-2 py-2 text-center">{r.s}</td>
                  <td className="px-2 py-2 text-center">{r.b}</td>
                  <td className="px-2 py-2 text-center">{r.events.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

/** Clubs that have entered tournaments on the site, with athletes and medals. */
export const ClubsPanel: React.FC<CommunityProps> = ({ tournaments, bouts, participants }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as Lang;
  const [q, setQ] = React.useState('');
  const medals = collectMedals(bouts, participants, tournaments, 'all');

  const clubs = new Map<string, { name: string; city: string; sample: Participant; athletes: Set<string>; g: number; s: number; b: number }>();
  for (const p of participants) {
    if (!p.clubName || p.status === 'withdrawn') continue;
    const k = norm(p.clubName);
    const c = clubs.get(k) || { name: p.clubName, city: p.city || '', sample: p, athletes: new Set<string>(), g: 0, s: 0, b: 0 };
    c.athletes.add(`${norm(p.lastName)} ${norm(p.firstName)}`);
    clubs.set(k, c);
  }
  for (const m of medals) {
    const c = clubs.get(norm(m.person.clubName));
    if (c) c[m.medal]++;
  }
  const list = [...clubs.values()]
    .filter((c) => !q || norm(`${c.name} ${c.city}`).includes(norm(q)))
    .sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.athletes.size - a.athletes.size || a.name.localeCompare(b.name));

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[var(--accent)]" /> {t(lang, 'Клубы', 'Клубдар', 'Clubs')}
        </h1>
        <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
          {t(lang, 'Клубы, которые подавали заявки на турниры Apsatarov.', 'Apsatarov мелдештерине өтүнмө берген клубдар.', 'Clubs that have entered tournaments on Apsatarov.')}
        </p>
      </div>
      <label className="relative block max-w-md">
        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--app-text-muted)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, 'Клуб или город', 'Клуб же шаар', 'Club or city')} className={`${field} w-full pl-8`} />
      </label>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-10 text-center text-sm text-[var(--app-text-muted)]">
          {t(lang, 'Клубы появятся после первых заявок.', 'Клубдар биринчи өтүнмөлөрдөн кийин пайда болот.', 'Clubs appear after the first entries.')}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <div key={c.name} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <div className="font-semibold text-[var(--app-text-primary)]">{participantFlag(c.sample)} {c.name}</div>
              <div className="text-sm text-[var(--app-text-muted)]">{[c.city, participantNoc(c.sample)].filter(Boolean).join(' · ')}</div>
              <div className="mt-3 flex gap-4 text-sm text-[var(--app-text-secondary)]">
                <span>{t(lang, 'Спортсменов', 'Спортчулар', 'Athletes')}: <b className="text-[var(--app-text-primary)]">{c.athletes.size}</b></span>
                <span>🥇 {c.g}</span>
                <span>🥈 {c.s}</span>
                <span>🥉 {c.b}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Tournaments with bouts going on now — links to their Live page. */
/** One tournament in «Live now»: YouTube video (if the organizer added links) and which tatami have bouts. */
const LiveNowCard: React.FC<{ ev: Tournament; live: Bout[]; tatamis: number[]; videoTatamis: number[]; lang: Lang; onOpen: () => void }> = ({ ev, live, tatamis, videoTatamis, lang, onOpen }) => {
  const [selected, setSelected] = React.useState<VideoChoice>('all');
  return (
    <div className={`rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden ${videoTatamis.length > 0 ? 'sm:col-span-2' : ''}`}>
      <div className="p-4">
        <div className="font-semibold text-[var(--app-text-primary)]">{ev.title}</div>
        <div className="text-sm text-[var(--app-text-muted)]">{ev.city} · {ev.startDate}</div>
        <div className="mt-2 text-sm text-[var(--app-text-secondary)]">
          {live.length > 0
            ? `${t(lang, 'Идут бои на татами', 'Татамиде беттештер', 'Bouts on tatami')}: ${tatamis.join(', ')}`
            : videoTatamis.length > 0
              ? `${t(lang, 'Видеотрансляция: татами', 'Видео түз эфир: татами', 'Live video: tatami')} ${videoTatamis.join(', ')}`
              : t(lang, 'Турнир идёт сегодня', 'Мелдеш бүгүн өтүүдө', 'Tournament day')}
        </div>
      </div>
      {videoTatamis.length > 0 && (
        <div className="px-4">
          <LiveVideo streams={ev.liveStreams || {}} tatamis={videoTatamis} selected={selected} onSelect={setSelected} language={lang} anchorId={`live-video-${ev.id}`} />
        </div>
      )}
      <button onClick={onOpen} className="w-full text-left px-4 py-3 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--app-surface-subtle)] cursor-pointer">
        {live.length > 0 || videoTatamis.length === 0
          ? t(lang, 'Открыть Live: счёт и время →', 'Live ачуу: эсеп жана убакыт →', 'Open Live: score & clock →')
          : t(lang, 'Открыть страницу турнира →', 'Мелдештин барагын ачуу →', 'Open tournament page →')}
      </button>
    </div>
  );
};

export const LiveNowPanel: React.FC<CommunityProps & { onOpen: (t: Tournament) => void }> = ({ tournaments, bouts, onOpen }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as Lang;
  const today = new Date().toISOString().slice(0, 10);
  const rows = tournaments
    .map((ev) => {
      const evBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, ev.id));
      const live = evBouts.filter((b) => b.status === 'in_progress');
      const tatamis = Array.from(new Set(live.map((b) => b.tatamiNumber).filter((n): n is number => !!n))).sort((a, b) => a - b);
      const ongoing = ev.startDate <= today && (ev.endDate || ev.startDate) >= today;
      // A YouTube link is enough: the video shows even before categories, entries and the draw
      const videoTatamis = streamTatamis(ev.liveStreams);
      return { ev, live, tatamis, videoTatamis, ongoing, hasBouts: evBouts.length > 0 };
    })
    .filter((r) => r.videoTatamis.length > 0 || r.live.length > 0 || (r.ongoing && r.hasBouts))
    .sort((a, b) => b.videoTatamis.length - a.videoTatamis.length);
  return (
    <div className="theme-keep space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" /> {t(lang, 'Сейчас на татами', 'Азыр татамиде', 'Live now')}
        </h1>
        <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
          {t(lang, 'Видеотрансляции и турниры, где сейчас идут поединки: видео, счёт, время и следующий бой на каждом татами.', 'Видео түз эфирлер жана азыр беттештер өтүп жаткан мелдештер: видео, эсеп, убакыт жана ар бир татамидеги кийинки беттеш.', 'Live videos and tournaments with bouts going on now: video, score, clock and next bout on every tatami.')}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-10 text-center text-sm text-[var(--app-text-muted)]">
          {t(lang, 'Сейчас нет идущих турниров.', 'Азыр өтүп жаткан мелдеш жок.', 'No tournament is running right now.')}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ ev, live, tatamis, videoTatamis }) => (
            <LiveNowCard key={ev.id} ev={ev} live={live} tatamis={tatamis} videoTatamis={videoTatamis} lang={lang} onOpen={() => onOpen(ev)} />
          ))}
        </div>
      )}
    </div>
  );
};
