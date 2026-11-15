import React from 'react';
import { Maximize, Tv, Gavel, ListOrdered } from 'lucide-react';
import type { Bout, Participant, TournamentRules } from '../types/schema';
import * as E from '../utils/boutEngine';
import { stageLabel } from '../utils/bracketProgression';
import { BoutConsole } from './BoutConsole';
import { TatamiMark } from './BrandLogo';

const name = (p?: Participant) => (p ? `${p.lastName} ${p.firstName}`.trim() : '—');

/** Bout to show on a tatami: the one in progress, else the next one, else the last finished. */
export function currentBoutOf(bouts: Bout[], tatamiNumber: number): Bout | undefined {
  const onTatami = bouts.filter((b) => b.tatamiNumber === tatamiNumber);
  const byTime = (a: Bout, b: Bout) => (a.scheduledTime || '').localeCompare(b.scheduledTime || '') || a.boutNumber - b.boutNumber;
  return (
    onTatami.find((b) => b.status === 'in_progress' || b.awaitingDecision) ||
    onTatami.filter((b) => b.status !== 'completed' && b.akaParticipantId && b.aoParticipantId).sort(byTime)[0] ||
    onTatami.filter((b) => b.status === 'completed').sort(byTime).reverse()[0]
  );
}

export function upcomingOf(bouts: Bout[], tatamiNumber: number, skipId?: string, count = 3): Bout[] {
  return bouts
    .filter((b) => b.tatamiNumber === tatamiNumber && b.status !== 'completed' && b.id !== skipId)
    .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || '') || a.boutNumber - b.boutNumber)
    .slice(0, count);
}

function useTicker(active: boolean) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Keeps a TV / tablet screen awake while the page is open (when the browser allows it). */
function useWakeLock() {
  React.useEffect(() => {
    let lock: any = null;
    const request = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request('screen');
      } catch {
        /* not allowed: ignore */
      }
    };
    request();
    const onVisible = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release?.();
    };
  }, []);
}

const fullscreen = () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.().catch(() => {});
};

const Penalties: React.FC<{ c1: number; c2: number; align: 'left' | 'right' }> = ({ c1, c2, align }) => (
  <div className={`flex flex-col gap-1.5 ${align === 'right' ? 'items-end' : 'items-start'}`}>
    {(
      [
        ['C1', c1],
        ['C2', c2]
      ] as const
    ).map(([label, level]) => (
      <div key={label} className="flex items-center gap-1.5">
        <span className="text-[1.6vh] font-semibold opacity-70 w-[3vh]">{label}</span>
        {[1, 2, 3, 4].map((lv) => (
          <span key={lv} className={`w-[2.6vh] h-[2.6vh] rounded-sm ${lv <= level ? (lv === 4 ? 'bg-white' : 'bg-amber-400') : 'bg-white/15'}`} />
        ))}
      </div>
    ))}
  </div>
);

/** Full-screen spectator scoreboard for one tatami (TV / projector). No sign-in. */
export const TatamiDisplay: React.FC<{ tatamiNumber: number; bouts: Bout[]; rules: TournamentRules }> = ({ tatamiNumber, bouts, rules }) => {
  useWakeLock();
  const bout = currentBoutOf(bouts, tatamiNumber);
  const now = useTicker(!!bout && E.isRunning(bout));
  const next = upcomingOf(bouts, tatamiNumber, bout?.id, 2);

  React.useEffect(() => {
    document.title = `Татами ${tatamiNumber} · Tatami.kg`;
  }, [tatamiNumber]);

  if (!bout) {
    return (
      <div className="theme-keep fixed inset-0 bg-[#0b1220] text-white flex flex-col items-center justify-center gap-6">
        <TatamiMark className="w-24 h-24" />
        <div className="text-[5vh] font-bold">Татами {tatamiNumber}</div>
        <div className="text-[2.5vh] opacity-70">Поединков пока нет</div>
      </div>
    );
  }

  const system = E.ruleSystemOf(bout, rules);
  const left = E.remainingSeconds(bout, now);
  const finished = bout.status === 'completed';
  const winner = finished ? (bout.winnerId === bout.akaParticipantId ? 'aka' : 'ao') : null;
  const scoreOf = (s: E.Side) =>
    system === 'skif'
      ? ((s === 'aka' ? bout.akaIppon ?? 0 : bout.aoIppon ?? 0) * 2 + (s === 'aka' ? bout.akaWazaAri ?? 0 : bout.aoWazaAri ?? 0)) / 2
      : s === 'aka'
        ? bout.akaScore
        : bout.aoScore;

  const half = (s: E.Side) => {
    const p = s === 'aka' ? bout.akaParticipant : bout.aoParticipant;
    const senshu = s === 'aka' ? bout.akaSenshu : bout.aoSenshu;
    const dim = winner && winner !== s;
    return (
      <div className={`flex-1 flex flex-col justify-between p-[3vh] ${s === 'aka' ? 'bg-[#b3121f]' : 'bg-[#123fa8]'} ${dim ? 'opacity-40' : ''} transition-opacity`}>
        <div className={s === 'ao' ? 'text-right' : ''}>
          <div className="text-[2vh] font-semibold uppercase tracking-[0.2em] opacity-80">{s === 'aka' ? 'АКА' : 'АО'}</div>
          <div className="text-[5.5vh] font-bold leading-tight truncate">{name(p)}</div>
          <div className="text-[2.6vh] opacity-80 truncate">{[p?.clubName, p?.country].filter(Boolean).join(' · ')}</div>
        </div>
        <div className={`flex items-end gap-[3vh] ${s === 'ao' ? 'flex-row-reverse' : ''}`}>
          <div className="text-[26vh] font-black leading-[0.85] tabular-nums">{scoreOf(s)}</div>
          <div className={`flex flex-col gap-[1.5vh] ${s === 'ao' ? 'items-end' : 'items-start'}`}>
            {senshu && <span className="px-[1.5vh] py-[0.5vh] rounded bg-amber-400 text-black text-[2.4vh] font-black">SENSHU</span>}
            <Penalties c1={s === 'aka' ? bout.akaPenaltiesC1 : bout.aoPenaltiesC1} c2={s === 'aka' ? bout.akaPenaltiesC2 : bout.aoPenaltiesC2} align={s === 'ao' ? 'right' : 'left'} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="theme-keep fixed inset-0 bg-[#0b1220] text-white flex flex-col select-none">
      <div className="flex items-center gap-[2vh] px-[3vh] py-[1.5vh] bg-black/40">
        <TatamiMark className="w-[4vh] h-[4vh]" />
        <div className="text-[2.6vh] font-bold">Татами {tatamiNumber}</div>
        <div className="text-[2.2vh] opacity-80 truncate flex-1">
          {bout.categoryName} · {stageLabel(bout.roundStage)} · бой #{bout.boutNumber}
        </div>
        <button onClick={fullscreen} className="p-[1vh] rounded hover:bg-white/10 cursor-pointer" title="Во весь экран">
          <Maximize className="w-[3vh] h-[3vh]" />
        </button>
      </div>

      <div className="flex-1 flex relative">
        {half('aka')}
        {half('ao')}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-[2vh] px-[4vh] py-[1.5vh] text-center min-w-[30vh]">
          <div className={`text-[13vh] font-black tabular-nums leading-none ${left <= E.WARNING_AT_SECONDS && !finished && left > 0 ? 'text-amber-300' : ''}`}>
            {E.formatClock(left)}
          </div>
          {bout.awaitingDecision && !finished && (
            <div className="mt-[1vh] text-[2.4vh] font-bold text-amber-300 inline-flex items-center gap-2">
              <Gavel className="w-[2.6vh] h-[2.6vh]" /> Хантей — решение судей
            </div>
          )}
          {finished && (
            <div className="mt-[1vh] text-[2.6vh] font-bold">
              Победа {winner === 'aka' ? 'АКА' : 'АО'} · {bout.winReason ? E.WIN_REASON_LABELS[bout.winReason] : ''}
            </div>
          )}
        </div>
      </div>

      {next.length > 0 && (
        <div className="flex gap-[3vh] px-[3vh] py-[1.5vh] bg-black/50 text-[2.2vh]">
          <span className="opacity-60 uppercase tracking-wider">Далее</span>
          {next.map((b) => (
            <span key={b.id} className="truncate">
              #{b.boutNumber} <span className="text-red-300">{name(b.akaParticipant)}</span> — <span className="text-blue-300">{name(b.aoParticipant)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/** Warm-up / call area: what is on every tatami now and who must get ready. */
export const CallRoomDisplay: React.FC<{ bouts: Bout[]; tatamiNumbers: number[] }> = ({ bouts, tatamiNumbers }) => {
  useWakeLock();
  React.useEffect(() => {
    document.title = 'Зона разминки · Tatami.kg';
  }, []);
  return (
    <div className="theme-keep fixed inset-0 bg-[#0b1220] text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 bg-black/40">
        <ListOrdered className="w-7 h-7" />
        <div className="text-2xl font-bold flex-1">Вызов спортсменов · зона разминки</div>
        <button onClick={fullscreen} className="p-2 rounded hover:bg-white/10 cursor-pointer" title="Во весь экран">
          <Maximize className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 grid gap-4 p-6" style={{ gridTemplateColumns: `repeat(${Math.min(tatamiNumbers.length, 4)}, minmax(0, 1fr))` }}>
        {tatamiNumbers.map((t) => {
          const cur = currentBoutOf(bouts, t);
          const queue = upcomingOf(bouts, t, cur?.status === 'completed' ? undefined : cur?.id, 3);
          return (
            <section key={t} className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-4 min-w-0">
              <div className="text-3xl font-black">Татами {t}</div>
              {[cur && cur.status !== 'completed' ? cur : undefined, ...queue].filter(Boolean).slice(0, 4).map((b, i) => (
                <div key={b!.id} className={`rounded-xl p-3 ${i === 0 ? 'bg-emerald-600/30 border border-emerald-400/50' : i === 1 ? 'bg-amber-500/20 border border-amber-400/40' : 'bg-white/5'}`}>
                  <div className="text-sm uppercase tracking-wider opacity-80">
                    {i === 0 ? 'На татами' : i === 1 ? 'Приготовиться' : 'Далее'} · #{b!.boutNumber} · {b!.scheduledTime}
                  </div>
                  <div className="text-xl font-bold truncate text-red-300">{name(b!.akaParticipant)}</div>
                  <div className="text-xl font-bold truncate text-blue-300">{name(b!.aoParticipant)}</div>
                  <div className="text-sm opacity-70 truncate">{b!.categoryName}</div>
                </div>
              ))}
              {!cur && queue.length === 0 && <div className="opacity-60">Поединков нет</div>}
            </section>
          );
        })}
      </div>
    </div>
  );
};

/** Secretary console for one tatami, opened from a QR code with a device key. */
export const TatamiControl: React.FC<{
  tatamiNumber: number;
  bouts: Bout[];
  rules: TournamentRules;
  deviceOk: boolean | null;
  onChange: (b: Bout) => void;
}> = ({ tatamiNumber, bouts, rules, deviceOk, onChange }) => {
  useWakeLock();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [showList, setShowList] = React.useState(false);
  const current = currentBoutOf(bouts, tatamiNumber);
  const bout = bouts.find((b) => b.id === selected) || current;
  const list = bouts
    .filter((b) => b.tatamiNumber === tatamiNumber)
    .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || '') || a.boutNumber - b.boutNumber);

  if (deviceOk === false) {
    return (
      <div className="theme-keep fixed inset-0 bg-[var(--app-bg)] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <Tv className="w-10 h-10 mx-auto text-[var(--app-text-muted)]" />
          <h1 className="text-xl font-semibold text-[var(--app-text-primary)]">Ссылка пульта недействительна</h1>
          <p className="text-[var(--app-text-secondary)]">Срок действия QR-кода истёк или организатор создал новый. Попросите новый QR-код на странице «Экраны и QR».</p>
        </div>
      </div>
    );
  }

  if (!bout || showList) {
    return (
      <div className="theme-keep min-h-screen bg-[var(--app-bg)] p-4 space-y-3">
        <h1 className="text-xl font-semibold text-[var(--app-text-primary)]">Татами {tatamiNumber} · выберите бой</h1>
        {list.length === 0 && <p className="text-[var(--app-text-muted)]">На этом татами пока нет поединков.</p>}
        {list.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setSelected(b.id);
              setShowList(false);
            }}
            className="w-full text-left rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 cursor-pointer hover:border-[var(--accent)]"
          >
            <div className="text-xs text-[var(--app-text-muted)]">
              #{b.boutNumber} · {b.scheduledTime} · {stageLabel(b.roundStage)} · {b.status === 'completed' ? 'завершён' : b.status === 'in_progress' ? 'идёт' : 'ожидает'}
            </div>
            <div className="text-[var(--app-text-primary)]">
              <span className="text-red-600">{name(b.akaParticipant)}</span> — <span className="text-blue-600">{name(b.aoParticipant)}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return <BoutConsole bout={bout} rules={rules} onChange={onChange} onClose={() => setShowList(true)} />;
};
