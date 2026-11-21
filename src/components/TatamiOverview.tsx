import React from 'react';
import { MonitorPlay, Tv, ListOrdered, Gamepad2, Youtube } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { trLang } from '../utils/globalDomTranslator';
import { streamTatamis } from '../utils/youtube';
import type { Bout, Participant, Tournament } from '../types/schema';
import * as E from '../utils/boutEngine';
import { clockNow } from '../utils/serverClock';
import { stageLabel } from '../utils/bracketProgression';
import { belongsToEvent } from '../data/sampleTournamentData';
import { currentBoutOf, upcomingOf } from './TatamiScreens';
import { displayName, participantFlag, localizeCategoryName } from '../utils/names';

interface TatamiOverviewProps {
  tournaments: Tournament[];
  initialTournamentId?: string;
  /** The tournament is chosen in the common «Турнир» bar at the top; hide this screen's own picker. */
  hidePicker?: boolean;
  bouts: Bout[];
  tatamiNumbers: number[];
  /** Officials who may score open the console; others (e.g. the doctor) only watch. */
  canScore: boolean;
  onOpenConsole: (bout: Bout) => void;
  /** Opens «Live now», where viewers watch the YouTube video. */
  onOpenLiveNow?: () => void;
}

const card = 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]';
const btn = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer';
const name = (p?: Participant) => (p ? `${participantFlag(p)} ${displayName(p, 'local')}` : '—');

/** Officials: what is on every tatami now, who is next, and quick links to consoles and screens. */
export const TatamiOverview: React.FC<TatamiOverviewProps> = ({ tournaments, initialTournamentId, bouts, tatamiNumbers, canScore, onOpenConsole, onOpenLiveNow, hidePicker }) => {
  const { language } = useApp();
  const tl = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const [tid, setTid] = React.useState(initialTournamentId || tournaments[0]?.id || '');
  const [now, setNow] = React.useState(clockNow());
  React.useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), 500);
    return () => clearInterval(id);
  }, []);
  const eventBouts = bouts.filter((b) => belongsToEvent(b.tournamentId, tid));
  const finished = eventBouts.filter((b) => b.status === 'completed').length;

  return (
    <div className="theme-keep space-y-5 pb-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-[var(--app-text-primary)] flex items-center gap-2">
            <MonitorPlay className="w-6 h-6 text-[var(--accent)]" /> {tl('Татами', 'Татами', 'Tatami')}
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            {tl('Что идёт на каждом татами и кто следующий. Пульт можно открыть здесь или на отдельном устройстве по QR-коду («Экраны, QR-коды и видео»).', 'Ар бир татамиде эмне жүрүп жатат жана ким кийинки. Пультту ушул жерден же QR-код аркылуу башка түзмөктөн ачса болот («Экрандар, QR жана видео»).', 'What is on each tatami and who is next. Open the console here or on another device with a QR code («Screens, QR codes & video»).')}
          </p>
        </div>
        {!hidePicker && (
          <select value={tid} onChange={(e) => setTid(e.target.value)} className="h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm w-full sm:w-auto sm:min-w-[240px] max-w-full">
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </div>

      <div className="text-sm text-[var(--app-text-muted)]">
        {tl('Поединков', 'Беттештер', 'Bouts')}: {eventBouts.length} · {tl('завершено', 'аяктады', 'finished')}: {finished}
      </div>

      {streamTatamis(tournaments.find((x) => x.id === tid)?.liveStreams).length > 0 && (
        <div className={`${card} p-3 flex flex-wrap items-center gap-3`}>
          <Youtube className="w-5 h-5 text-red-600 shrink-0" />
          <span className="flex-1 min-w-[200px] text-sm text-[var(--app-text-secondary)]">
            {trLang(
              language,
              `Видео с YouTube уже показывается зрителям (татами ${streamTatamis(tournaments.find((x) => x.id === tid)?.liveStreams).join(', ')}) — даже без поединков.`,
              `YouTube видео көрүүчүлөргө көрсөтүлүүдө (татами ${streamTatamis(tournaments.find((x) => x.id === tid)?.liveStreams).join(', ')}) — беттештер жок болсо да.`,
              `The YouTube video is already shown to viewers (tatami ${streamTatamis(tournaments.find((x) => x.id === tid)?.liveStreams).join(', ')}) — even without bouts.`
            )}
          </span>
          {onOpenLiveNow && (
            <button onClick={onOpenLiveNow} className={btn}>
              {trLang(language, 'Открыть «Идут бои»', '«Беттештер жүрүүдө» ачуу', 'Open “Live now”')}
            </button>
          )}
        </div>
      )}

      {eventBouts.length === 0 ? (
        <div className={`${card} border-dashed p-10 text-center text-sm text-[var(--app-text-muted)]`}>
          {tl('Поединков пока нет. Проведите жеребьёвку в разделе «Категории и жеребьёвка».', 'Азырынча беттештер жок. «Категориялар жана чүчүкулак» бөлүмүндө чүчүкулак өткөрүңүз.', 'No bouts yet. Run the draw in «Categories & draw».')}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tatamiNumbers.map((t) => {
            const cur = currentBoutOf(eventBouts, t);
            const live = cur && cur.status !== 'completed' ? cur : undefined;
            const queue = upcomingOf(eventBouts, t, live?.id, 4);
            const left = live ? E.remainingSeconds(live, now) : 0;
            return (
              <section key={t} className={`${card} p-4 space-y-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[var(--app-text-primary)] flex-1">{tl('Татами', 'Татами', 'Tatami')} {t}</h2>
                  <a className={btn} href={`/?screen=tatami&t=${t}`} target="_blank" rel="noreferrer" title={tl('Открыть табло для зрителей (телевизор, проектор)', 'Көрүүчүлөр үчүн табло (телевизор, проектор)', 'Open the spectator scoreboard (TV, projector)')}>
                    <Tv className="w-4 h-4" /> {tl('Табло на экран', 'Табло экранга', 'Scoreboard on screen')}
                  </a>
                </div>

                {live ? (
                  <div className="rounded-xl border border-[var(--app-border)] p-3">
                    <div className="text-xs text-[var(--app-text-muted)]">
                      #{live.boutNumber} · {localizeCategoryName(live.categoryName, language as 'ru' | 'ky' | 'en')} · {stageLabel(live.roundStage, language)} · {live.status === 'in_progress' ? (E.isRunning(live) ? tl('идёт бой', 'беттеш жүрүүдө', 'in progress') : tl('пауза', 'тыныгуу', 'paused')) : tl('ожидает', 'күтүүдө', 'waiting')}
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-red-600 font-medium">{name(live.akaParticipant as Participant)}</div>
                        <div className="truncate text-blue-600 font-medium">{name(live.aoParticipant as Participant)}</div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-xl font-bold text-[var(--app-text-primary)]">{live.akaScore} : {live.aoScore}</div>
                        <div className="text-sm text-[var(--app-text-muted)]">{E.formatClock(left)}</div>
                      </div>
                    </div>
                    {canScore && (
                      <button onClick={() => onOpenConsole(live)} className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer">
                        <Gamepad2 className="w-4 h-4" /> {tl('Открыть пульт', 'Пультту ачуу', 'Open console')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--app-text-muted)]">{tl('Сейчас на этом татами поединков нет.', 'Азыр бул татамиде беттеш жок.', 'No bout on this tatami right now.')}</div>
                )}

                {queue.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--app-text-muted)] mb-1 flex items-center gap-1">
                      <ListOrdered className="w-3.5 h-3.5" /> {tl('Далее', 'Кийинки', 'Next')}
                    </div>
                    <ul className="space-y-1">
                      {queue.map((b) => (
                        <li key={b.id} className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--app-text-muted)] w-24 shrink-0">#{b.boutNumber} · {b.scheduledTime}</span>
                          <span className="flex-1 min-w-0 truncate text-[var(--app-text-primary)]">
                            {b.akaParticipantId && b.aoParticipantId ? (
                              <>
                                <span className="text-red-600">{name(b.akaParticipant as Participant)}</span> — <span className="text-blue-600">{name(b.aoParticipant as Participant)}</span>
                              </>
                            ) : (
                              <span className="text-[var(--app-text-muted)]">{stageLabel(b.roundStage, language)} · {tl('ждёт победителей', 'жеңүүчүлөрдү күтөт', 'waiting for winners')}</span>
                            )}
                          </span>
                          {canScore && b.akaParticipantId && b.aoParticipantId && (
                            <button onClick={() => onOpenConsole(b)} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">{tl('пульт', 'пульт', 'console')}</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <a className={btn} href="/?screen=calls" target="_blank" rel="noreferrer">
        <ListOrdered className="w-4 h-4" /> {tl('Экран вызова спортсменов (зона разминки)', 'Спортчуларды чакыруу экраны (жылытуу аймагы)', 'Athlete call screen (warm-up area)')}
      </a>
    </div>
  );
};
