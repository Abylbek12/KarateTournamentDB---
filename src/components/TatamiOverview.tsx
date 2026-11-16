import React from 'react';
import { MonitorPlay, Tv, ListOrdered, Gamepad2 } from 'lucide-react';
import type { Bout, Participant, Tournament } from '../types/schema';
import * as E from '../utils/boutEngine';
import { clockNow } from '../utils/serverClock';
import { stageLabel } from '../utils/bracketProgression';
import { belongsToEvent } from '../data/sampleTournamentData';
import { currentBoutOf, upcomingOf } from './TatamiScreens';
import { displayName, participantFlag } from '../utils/names';

interface TatamiOverviewProps {
  tournaments: Tournament[];
  initialTournamentId?: string;
  bouts: Bout[];
  tatamiNumbers: number[];
  /** Officials who may score open the console; others (e.g. the doctor) only watch. */
  canScore: boolean;
  onOpenConsole: (bout: Bout) => void;
}

const card = 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]';
const btn = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer';
const name = (p?: Participant) => (p ? `${participantFlag(p)} ${displayName(p, 'local')}` : '—');

/** Officials: what is on every tatami now, who is next, and quick links to consoles and screens. */
export const TatamiOverview: React.FC<TatamiOverviewProps> = ({ tournaments, initialTournamentId, bouts, tatamiNumbers, canScore, onOpenConsole }) => {
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
            <MonitorPlay className="w-6 h-6 text-[var(--accent)]" /> Татами
          </h1>
          <p className="text-[15px] text-[var(--app-text-secondary)] mt-1">
            Что идёт на каждом татами и кто следующий. Пульт можно открыть здесь или на отдельном устройстве по QR-коду («Экраны и QR-коды»).
          </p>
        </div>
        <select value={tid} onChange={(e) => setTid(e.target.value)} className="h-10 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] px-2.5 text-sm min-w-[240px]">
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-[var(--app-text-muted)]">
        Поединков: {eventBouts.length} · завершено: {finished}
      </div>

      {eventBouts.length === 0 ? (
        <div className={`${card} border-dashed p-10 text-center text-sm text-[var(--app-text-muted)]`}>
          Поединков пока нет. Проведите жеребьёвку в разделе «Категории и жеребьёвка».
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
                  <h2 className="text-lg font-bold text-[var(--app-text-primary)] flex-1">Татами {t}</h2>
                  <a className={btn} href={`/?screen=tatami&t=${t}`} target="_blank" rel="noreferrer" title="Открыть табло для зрителей (телевизор, проектор)">
                    <Tv className="w-4 h-4" /> Табло на экран
                  </a>
                </div>

                {live ? (
                  <div className="rounded-xl border border-[var(--app-border)] p-3">
                    <div className="text-xs text-[var(--app-text-muted)]">
                      #{live.boutNumber} · {live.categoryName} · {stageLabel(live.roundStage)} · {live.status === 'in_progress' ? (E.isRunning(live) ? 'идёт бой' : 'пауза') : 'ожидает'}
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
                        <Gamepad2 className="w-4 h-4" /> Открыть пульт
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--app-text-muted)]">Сейчас на этом татами поединков нет.</div>
                )}

                {queue.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--app-text-muted)] mb-1 flex items-center gap-1">
                      <ListOrdered className="w-3.5 h-3.5" /> Далее
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
                              <span className="text-[var(--app-text-muted)]">{stageLabel(b.roundStage)} · ждёт победителей</span>
                            )}
                          </span>
                          {canScore && b.akaParticipantId && b.aoParticipantId && (
                            <button onClick={() => onOpenConsole(b)} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">пульт</button>
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
        <ListOrdered className="w-4 h-4" /> Экран вызова спортсменов (зона разминки)
      </a>
    </div>
  );
};
