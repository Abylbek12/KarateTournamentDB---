import React from 'react';
import { X, Play, Pause, RotateCcw, Minus, Plus, Undo2, Volume2, VolumeX, Gavel, Printer, Monitor, Video } from 'lucide-react';
import { SoloScoreboard } from './SoloScoreboard';
import { printUrl } from './PrintDocuments';
import type { Bout, Participant, TournamentRules } from '../types/schema';
import * as E from '../utils/boutEngine';
import { clockNow } from '../utils/serverClock';
import { stageLabel } from '../utils/bracketProgression';
import { refereeAudio } from '../utils/refereeAudio';
import { useApp } from '../context/AppContext';
import { displayName, participantFlag, participantNoc, localizeCategoryName } from '../utils/names';

interface BoutConsoleProps {
  bout: Bout;
  /** Default rule system of the tournament (a bout may override it). */
  rules: TournamentRules;
  /** Called after every action; the parent saves it immediately. */
  onChange: (bout: Bout) => void;
  onClose: () => void;
  /** Bouts of the same tatami (single-screen mode shows the next ones). */
  tatamiBouts?: Bout[];
  /** Opens the next bout of the tatami (single-screen mode: Enter after the bout). */
  onNextBout?: () => void;
}

// Single-screen mode stays on for the next bouts of the session
let soloPreferred = false;

const sideName = (p?: Participant, fallback = '') => (p ? `${p.lastName} ${p.firstName}`.trim() : fallback);

/**
 * The single tatami console (secretary / referee). Every scoreboard in the app uses it.
 * All rules come from utils/boutEngine.ts.
 */
export const BoutConsole: React.FC<BoutConsoleProps> = ({ bout, rules, onChange, onClose, tatamiBouts, onNextBout }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as 'ru' | 'ky' | 'en';
  const tr = (ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);
  const AKA = tr('АКА', 'АКА', 'AKA');
  const AO = tr('АО', 'АО', 'AO');
  const [now, setNow] = React.useState(clockNow());
  const [sound, setSound] = React.useState(true);
  const [confirm, setConfirm] = React.useState<{ label: string; run: () => void } | null>(null);
  const [solo, setSoloState] = React.useState(soloPreferred);
  const setSolo = (v: boolean) => {
    soloPreferred = v;
    setSoloState(v);
    if (v) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };
  // Undo history of this bout (single-screen mode: Z / Backspace)
  const history = React.useRef<{ id: string; list: Bout[] }>({ id: bout.id, list: [] });
  if (history.current.id !== bout.id) history.current = { id: bout.id, list: [] };
  const system = E.ruleSystemOf(bout, rules);
  const running = E.isRunning(bout);
  const remaining = E.remainingSeconds(bout, running ? Math.max(now, clockNow()) : now);
  const finished = bout.status === 'completed';
  const ready = !!bout.akaParticipantId && !!bout.aoParticipantId;

  // Smooth clock: redraw 10 times per second while running
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(clockNow()), 100);
    return () => clearInterval(id);
  }, [running]);

  // Sounds and time-up (each fires once per run)
  const warned = React.useRef(false);
  React.useEffect(() => {
    if (!running) return;
    if (!warned.current && remaining <= E.WARNING_AT_SECONDS && remaining > E.WARNING_AT_SECONDS - 1) {
      warned.current = true;
      if (sound) refereeAudio.playWarning15s();
    }
    if (remaining <= 0) {
      if (sound) refereeAudio.playGong();
      onChange(E.onTimeUp(bout, rules));
    }
  }, [remaining, running]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (remaining > E.WARNING_AT_SECONDS) warned.current = false;
  }, [remaining]);

  const apply = (next: Bout, chime?: number) => {
    if (next === bout) return;
    history.current.list = [...history.current.list.slice(-49), bout];
    if (sound && chime) refereeAudio.playPointChime(chime);
    if (sound && next.status === 'completed' && bout.status !== 'completed') refereeAudio.playGong();
    onChange(next);
  };

  const toggleClock = () => {
    if (finished || !ready) return;
    if (running) apply(E.stopClock(bout));
    else {
      if (sound) refereeAudio.playBuzzer();
      apply(E.startClock(bout));
    }
  };

  // Space = start / stop
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (solo) return; // single-screen mode has its own keys
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        toggleClock();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const ask = (label: string, run: () => void) => setConfirm({ label, run });

  const sideColumn = (side: E.Side) => {
    const p = side === 'aka' ? bout.akaParticipant : bout.aoParticipant;
    const isAka = side === 'aka';
    const score = isAka ? bout.akaScore : bout.aoScore;
    const senshu = isAka ? bout.akaSenshu : bout.aoSenshu;
    const c1 = isAka ? bout.akaPenaltiesC1 : bout.aoPenaltiesC1;
    const c2 = isAka ? bout.akaPenaltiesC2 : bout.aoPenaltiesC2;
    const wazaAri = (isAka ? bout.akaWazaAri : bout.aoWazaAri) ?? 0;
    const ippon = (isAka ? bout.akaIppon : bout.aoIppon) ?? 0;
    const winner = finished && bout.winnerId === (isAka ? bout.akaParticipantId : bout.aoParticipantId);
    const color = isAka ? 'bg-red-600' : 'bg-blue-600';
    const ring = isAka ? 'ring-red-600' : 'ring-blue-600';
    const btn =
      'h-12 rounded-xl font-semibold text-sm text-white disabled:opacity-40 cursor-pointer active:scale-[0.98] transition-transform';
    const ghost =
      'h-10 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] disabled:opacity-40 cursor-pointer';

    const penaltyRow = (cat: 'c1' | 'c2', level: number) => (
      <div className="flex items-center gap-2">
        <span className="w-7 text-xs font-semibold text-[var(--app-text-muted)]">{cat.toUpperCase()}</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((lv) => (
            <button
              key={lv}
              disabled={finished}
              onClick={() => {
                const target = level === lv ? lv - 1 : lv;
                if (target === 4) ask(`${isAka ? AKA : AO}: ${tr('Хансоку', 'Хансоку', 'Hansoku')} (${cat.toUpperCase()}) — ${tr('поражение. Подтвердить?', 'жеңилүү. Ырастайсызбы?', 'loss. Confirm?')}`, () => apply(E.setPenalty(bout, side, cat, 4)));
                else apply(E.setPenalty(bout, side, cat, target));
              }}
              title={E.PENALTY_LEVELS[lv]}
              className={`w-8 h-8 rounded-md border text-[11px] font-bold cursor-pointer disabled:opacity-40 ${
                lv <= level ? `${lv === 4 ? 'bg-black' : 'bg-amber-500'} border-transparent text-white` : 'border-[var(--app-border)] text-[var(--app-text-muted)]'
              }`}
            >
              {['C', 'K', 'HC', 'H'][lv - 1]}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--app-text-muted)] truncate">{E.PENALTY_LEVELS[level]}</span>
      </div>
    );

    return (
      <div className={`flex-1 min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-4 ${winner ? `ring-4 ${ring}` : ''}`}>
        <div className="flex items-start gap-3">
          <span className={`w-3 self-stretch rounded-full ${color}`} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">{isAka ? `${AKA} · ${tr('красный', 'кызыл', 'red')}` : `${AO} · ${tr('синий', 'көк', 'blue')}`}</div>
            <div className="text-xl font-bold text-[var(--app-text-primary)] truncate">{p ? displayName(p, lang === 'en' ? 'international' : 'local') : tr('ожидается', 'күтүлүүдө', 'TBD')}</div>
            {p && lang !== 'en' && <div className="text-xs text-[var(--app-text-muted)] truncate">{displayName(p, 'international')}</div>}
            <div className="text-sm text-[var(--app-text-muted)] truncate flex items-center gap-1.5">
              {p && <span className="text-base leading-none">{participantFlag(p)}</span>}
              {p && participantNoc(p) && <span className="font-semibold">{participantNoc(p)}</span>}
              <span className="truncate">{p?.clubName}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold tabular-nums leading-none text-[var(--app-text-primary)]">
              {system === 'skif' ? (ippon * 2 + wazaAri) / 2 : score}
            </div>
            {senshu && <div className="mt-1 inline-block px-2 py-0.5 rounded bg-amber-400 text-black text-xs font-bold">SENSHU</div>}
          </div>
        </div>

        {system === 'skif' ? (
          <div className="grid grid-cols-2 gap-2">
            <button disabled={finished || !ready} onClick={() => apply(E.addSkif(bout, side, 'waza_ari'), 1)} className={`${btn} ${color}`}>
              Waza-ari ({wazaAri})
            </button>
            <button disabled={finished || !ready} onClick={() => apply(E.addSkif(bout, side, 'ippon'), 3)} className={`${btn} ${color}`}>
              Ippon ({ippon})
            </button>
            <button disabled={finished || wazaAri === 0} onClick={() => apply(E.addSkif(bout, side, 'waza_ari', -1))} className={ghost}>
              <Undo2 className="inline w-4 h-4 mr-1" />Waza-ari
            </button>
            <button disabled={finished || ippon === 0} onClick={() => apply(E.addSkif(bout, side, 'ippon', -1))} className={ghost}>
              <Undo2 className="inline w-4 h-4 mr-1" />Ippon
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {[
                { pts: 1, label: 'Yuko' },
                { pts: 2, label: 'Waza-ari' },
                { pts: 3, label: 'Ippon' }
              ].map(({ pts, label }) => (
                <button key={pts} disabled={finished || !ready} onClick={() => apply(E.addScore(bout, side, pts), pts)} className={`${btn} ${color}`}>
                  <span className="block text-lg leading-none">+{pts}</span>
                  <span className="text-[11px] opacity-90">{label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={finished || score === 0} onClick={() => apply(E.addScore(bout, side, -1))} className={ghost}>
                <Undo2 className="inline w-4 h-4 mr-1" />{tr('−1 исправить', '−1 оңдоо', '−1 correct')}
              </button>
              <button disabled={finished} onClick={() => apply(E.setSenshu(bout, side, !senshu))} className={ghost}>
                {senshu ? tr('Снять Senshu', 'Senshu алуу', 'Remove Senshu') : tr('Дать Senshu', 'Senshu берүү', 'Give Senshu')}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {penaltyRow('c1', c1)}
          {penaltyRow('c2', c2)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={finished || !ready}
            onClick={() => ask(`${isAka ? AKA : AO}: ${tr('Кикен (отказ / травма) — победа сопернику. Подтвердить?', 'Кикен (баш тартуу / жаракат) — атаандашка жеңиш. Ырастайсызбы?', 'Kiken (withdrawal / injury) — the opponent wins. Confirm?')}`, () => apply(E.kiken(bout, side)))}
            className={ghost}
          >
            {tr('Кикен', 'Кикен', 'Kiken')}
          </button>
          <button
            disabled={finished || !ready}
            onClick={() => ask(`${isAka ? AKA : AO}: ${tr('Шиккаку (дисквалификация) — победа сопернику. Подтвердить?', 'Шиккаку (дисквалификация) — атаандашка жеңиш. Ырастайсызбы?', 'Shikkaku (disqualification) — the opponent wins. Confirm?')}`, () => apply(E.shikkaku(bout, side)))}
            className={ghost}
          >
            {tr('Шиккаку', 'Шиккаку', 'Shikkaku')}
          </button>
        </div>
      </div>
    );
  };

  const low = remaining < 10;

  if (solo) {
    return (
      <SoloScoreboard
        bout={bout}
        rules={rules}
        tatamiBouts={tatamiBouts || []}
        apply={apply}
        toggleClock={toggleClock}
        canUndo={history.current.list.length > 0}
        onUndo={() => {
          const prev = history.current.list.pop();
          if (prev) onChange(prev);
        }}
        onExit={() => setSolo(false)}
        onNextBout={onNextBout}
      />
    );
  }

  return (
    <div className="theme-keep fixed inset-0 z-50 bg-black/60 flex items-stretch sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-label={tr('Пульт боя', 'Беттеш пульту', 'Bout console')}>
      <div className="w-full max-w-6xl max-h-full overflow-y-auto bg-[var(--app-bg)] sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 px-4 py-3 bg-[var(--app-surface)] border-b border-[var(--app-border)]">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-[var(--app-text-muted)]">
              {tr('Бой', 'Беттеш', 'Bout')} #{bout.boutNumber} · {tr('Татами', 'Татами', 'Tatami')} {bout.tatamiNumber ?? '–'} · {stageLabel(bout.roundStage, lang)}
            </div>
            <div className="font-semibold text-[var(--app-text-primary)] truncate">{localizeCategoryName(bout.categoryName, lang) || tr('Категория', 'Категория', 'Category')}</div>
          </div>
          <button
            onClick={() => setSolo(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] cursor-pointer"
            title={tr('Один экран: табло для зрителей, управление с клавиатуры', 'Бир экран: көрүүчүлөр үчүн табло, баскычтоп менен башкаруу', 'Single screen: audience scoreboard, keyboard control')}
          >
            <Monitor className="w-4 h-4" /> {tr('Один экран', 'Бир экран', 'Single screen')}
          </button>
          <select
            id="bout-rule-system"
            value={system === 'skif' ? `skif:${bout.skifFormat || 'shobu_ippon'}` : 'wkf'}
            disabled={bout.status !== 'scheduled'}
            onChange={(e) => {
              const v = e.target.value;
              apply(v === 'wkf' ? { ...bout, ruleSystem: 'wkf' } : { ...bout, ruleSystem: 'skif', skifFormat: v.split(':')[1] as Bout['skifFormat'] });
            }}
            className="h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-sm text-[var(--app-text-primary)] px-2"
            title={tr('Правила боя (можно сменить только до начала)', 'Беттештин эрежелери (башталганга чейин гана өзгөртүлөт)', 'Bout rules (can be changed only before the start)')}
          >
            <option value="wkf">WKF</option>
            <option value="skif:shobu_ippon">SKIF · Shobu Ippon</option>
            <option value="skif:shobu_sanbon">SKIF · Shobu Sanbon</option>
          </select>
          <button onClick={() => setSound(!sound)} className="p-2 rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-subtle)] cursor-pointer" title={sound ? tr('Выключить звук', 'Үндү өчүрүү', 'Sound off') : tr('Включить звук', 'Үндү күйгүзүү', 'Sound on')}>
            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-subtle)] cursor-pointer" title={tr('Закрыть (Esc)', 'Жабуу (Esc)', 'Close (Esc)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Clock */}
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 flex flex-col sm:flex-row items-center gap-4">
            <div
              className={`font-bold tabular-nums leading-none text-7xl sm:text-8xl ${
                remaining <= E.WARNING_AT_SECONDS && !finished ? 'text-red-600' : 'text-[var(--app-text-primary)]'
              }`}
              aria-live="off"
            >
              {E.formatClock(remaining)}
            </div>
            <div className="flex-1 flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <button
                onClick={toggleClock}
                disabled={finished || !ready || bout.awaitingDecision || !!bout.vrReviewActive}
                className={`h-14 px-6 rounded-xl text-white font-semibold inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer ${running ? 'bg-amber-600' : 'bg-emerald-600'}`}
              >
                {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {running ? tr('Стоп (Yame)', 'Токтот (Yame)', 'Stop (Yame)') : tr('Старт (Hajime)', 'Баштоо (Hajime)', 'Start (Hajime)')}
              </button>
              <button onClick={() => apply(E.adjustClock(bout, -1))} disabled={finished} className="h-14 w-14 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer disabled:opacity-40" title={tr('−1 секунда', '−1 секунд', '−1 second')}>
                <Minus className="w-5 h-5 mx-auto" />
              </button>
              <button onClick={() => apply(E.adjustClock(bout, 1))} disabled={finished} className="h-14 w-14 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer disabled:opacity-40" title={tr('+1 секунда', '+1 секунд', '+1 second')}>
                <Plus className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => ask(tr('Вернуть время к началу боя?', 'Убакытты беттештин башына кайтарасызбы?', 'Reset the clock to the start of the bout?'), () => apply(E.resetClock(bout)))}
                disabled={finished || running}
                className="h-14 w-14 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer disabled:opacity-40"
                title={tr('Сбросить время', 'Убакытты баштапкы абалга', 'Reset clock')}
              >
                <RotateCcw className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
          {!finished && low && running && <div className="text-center text-sm text-red-600 font-semibold">{tr('Последние секунды', 'Акыркы секунддар', 'Last seconds')}</div>}
          <div className="text-xs text-center text-[var(--app-text-muted)]">{tr(`Пробел — старт/стоп. Сигнал за ${E.WARNING_AT_SECONDS} секунд до конца и гонг в конце боя.`, `Боштук — баштоо/токтотуу. Аягына ${E.WARNING_AT_SECONDS} секунд калганда сигнал.`, `Space — start/stop. Signal ${E.WARNING_AT_SECONDS} seconds before the end, gong at the end.`)}</div>

          {/* Video review (VR): open review — the referees decide */}
          {bout.vrReviewActive && !finished && (
            <div className="rounded-2xl border-2 border-violet-600 bg-[var(--app-surface)] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0 text-[var(--app-text-primary)]">
                  <div className="font-semibold">
                    {tr('Видеоповтор — запрос', 'Видеокайталоо — сурам', 'Video review — requested by')} {bout.vrReviewSide === 'aka' ? AKA : AO}
                  </div>
                  <div className="text-sm text-[var(--app-text-muted)]">
                    {tr(
                      'Время остановлено, на табло — «VIDEO REVIEW». Судьи смотрят запись (телефон на штативе или перемотка эфира YouTube). Если очко дано — добавьте его кнопками +1 / +2 / +3.',
                      'Убакыт токтотулду, таблодо — «VIDEO REVIEW». Калыстар жазууну карашат (штативдеги телефон же YouTube эфирин артка түрүү). Упай берилсе — +1 / +2 / +3 баскычтары менен кошуңуз.',
                      'The clock is stopped and the scoreboard shows «VIDEO REVIEW». The referees watch the recording (a phone on a tripod or rewinding the YouTube stream). If a score is given, add it with +1 / +2 / +3.'
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => apply(E.decideVideoReview(bout, 'awarded'))} className="h-11 px-4 rounded-xl bg-emerald-600 text-white font-semibold cursor-pointer">
                  {tr('Очко дано', 'Упай берилди', 'Score given')}
                </button>
                <button onClick={() => apply(E.decideVideoReview(bout, 'rejected'))} className="h-11 px-4 rounded-xl bg-slate-700 text-white font-semibold cursor-pointer">
                  {tr('Без изменений', 'Өзгөрүүсүз', 'No change')}
                </button>
                <button onClick={() => apply(E.decideVideoReview(bout, 'cancelled'))} className="h-11 px-4 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer">
                  {tr('Отменить запрос', 'Сурамды жокко чыгаруу', 'Withdraw request')}
                </button>
              </div>
            </div>
          )}

          {/* Decision / result banners */}
          {bout.awaitingDecision && !finished && (
            <div className="rounded-2xl border-2 border-amber-500 bg-[var(--app-surface)] p-4 flex flex-wrap items-center gap-3">
              <Gavel className="w-6 h-6 text-amber-600" />
              <div className="flex-1 min-w-[200px] text-[var(--app-text-primary)]">
                <div className="font-semibold">{tr('Ничья без Senshu — решение судей (Хантей)', 'Senshu жок тең — калыстардын чечими (Хантей)', 'Tie without Senshu — judges’ decision (Hantei)')}</div>
                <div className="text-sm text-[var(--app-text-muted)]">{tr('Выберите победителя по решению судейской бригады.', 'Калыстардын чечими боюнча жеңүүчүнү тандаңыз.', 'Select the winner by the judges’ decision.')}</div>
              </div>
              <button onClick={() => apply(E.hantei(bout, 'aka'))} className="h-11 px-5 rounded-xl bg-red-600 text-white font-semibold cursor-pointer">{tr('Победа', 'Жеңиш', 'Winner')} {AKA}</button>
              <button onClick={() => apply(E.hantei(bout, 'ao'))} className="h-11 px-5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer">{tr('Победа', 'Жеңиш', 'Winner')} {AO}</button>
            </div>
          )}
          {finished && (
            <div className="rounded-2xl border-2 border-emerald-600 bg-[var(--app-surface)] p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] text-[var(--app-text-primary)]">
                <div className="font-semibold">
                  {tr('Победа', 'Жеңиш', 'Winner')}: {bout.winnerId === bout.akaParticipantId ? `${AKA} — ${sideName(bout.akaParticipant)}` : `${AO} — ${sideName(bout.aoParticipant)}`}
                </div>
                <div className="text-sm text-[var(--app-text-muted)]">{bout.winReason ? E.winReasonLabel(bout.winReason, lang) : ''}</div>
              </div>
              <button
                onClick={() => ask(tr('Открыть бой заново для исправления? Победитель будет снят.', 'Оңдоо үчүн беттешти кайра ачасызбы? Жеңүүчү алынып салынат.', 'Reopen the bout to correct it? The winner will be removed.'), () => apply(E.reopenBout(bout)))}
                className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)] cursor-pointer"
              >
                {tr('Исправить результат', 'Жыйынтыкты оңдоо', 'Correct result')}
              </button>
              <a
                href={printUrl({ kind: 'bout', eventId: bout.tournamentId, boutId: bout.id, lang })}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] text-sm text-[var(--app-text-primary)]"
              >
                <Printer className="w-4 h-4" /> {tr('Протокол боя', 'Беттештин протоколу', 'Bout protocol')}
              </a>
              <button onClick={onClose} className="h-10 px-4 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold cursor-pointer">{tr('Готово', 'Даяр', 'Done')}</button>
            </div>
          )}

          {/* Athletes */}
          <div className="flex flex-col lg:flex-row gap-4">
            {sideColumn('aka')}
            {sideColumn('ao')}
          </div>

          {/* Video review request: the coach of AKA or AO asks to look at a moment again */}
          {!finished && ready && !bout.vrReviewActive && (
            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--app-text-primary)] mr-1">
                <Video className="w-4 h-4 text-violet-600" /> {tr('Видеоповтор (VR)', 'Видеокайталоо (VR)', 'Video review (VR)')}
              </span>
              {(['aka', 'ao'] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => {
                    if (sound) refereeAudio.playVrChallenge();
                    apply(E.requestVideoReview(bout, side));
                  }}
                  className={`h-9 px-3 rounded-lg text-white font-semibold cursor-pointer ${side === 'aka' ? 'bg-red-600' : 'bg-blue-600'}`}
                >
                  {tr('Запрос', 'Сурам', 'Request')} {side === 'aka' ? AKA : AO}
                  {E.videoReviewCount(bout, side) > 0 && <span className="ml-1.5 text-white/80">({E.videoReviewCount(bout, side)})</span>}
                </button>
              ))}
              {(bout.videoReviews || []).filter((r) => r.result && r.result !== 'cancelled').length > 0 && (
                <span className="text-xs text-[var(--app-text-muted)]">
                  {(bout.videoReviews || [])
                    .filter((r) => r.result && r.result !== 'cancelled')
                    .map((r) => `${r.side === 'aka' ? AKA : AO} ${E.formatClock(r.matchSecond)}: ${r.result === 'awarded' ? tr('очко дано', 'упай берилди', 'score given') : tr('без изменений', 'өзгөрүүсүз', 'no change')}`)
                    .join(' · ')}
                </span>
              )}
            </div>
          )}

          {!finished && ready && !bout.awaitingDecision && (
            <details className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-sm">
              <summary className="cursor-pointer text-[var(--app-text-secondary)]">{tr('Завершить бой вручную (решение судьи)', 'Беттешти кол менен бүтүрүү', 'Finish bout manually (referee decision)')}</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => ask(tr('Объявить победу АКА решением судей?', 'Калыстардын чечими менен АКАнын жеңишин жарыялайсызбы?', 'Declare AKA the winner by decision?'), () => apply(E.hantei(bout, 'aka')))} className="h-10 px-4 rounded-lg bg-red-600 text-white cursor-pointer">{tr('Победа АКА', 'АКА жеңди', 'AKA wins')}</button>
                <button onClick={() => ask(tr('Объявить победу АО решением судей?', 'Калыстардын чечими менен АОнун жеңишин жарыялайсызбы?', 'Declare AO the winner by decision?'), () => apply(E.hantei(bout, 'ao')))} className="h-10 px-4 rounded-lg bg-blue-600 text-white cursor-pointer">{tr('Победа АО', 'АО жеңди', 'AO wins')}</button>
              </div>
            </details>
          )}
          {!ready && (
            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-sm text-[var(--app-text-secondary)]">
              {tr('Пара ещё не определена: бой можно начать, когда известны оба спортсмена.', 'Жуп али белгисиз.', 'The pair is not known yet.')}
            </div>
          )}
        </div>
      </div>

      {/* In-page confirmation */}
      {confirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] p-5 space-y-4">
            <div className="text-[var(--app-text-primary)] font-semibold">{confirm.label}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="h-10 px-4 rounded-lg border border-[var(--app-border)] text-[var(--app-text-primary)] cursor-pointer">{tr('Отмена', 'Жокко чыгаруу', 'Cancel')}</button>
              <button
                onClick={() => {
                  confirm.run();
                  setConfirm(null);
                }}
                className="h-10 px-4 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer"
                autoFocus
              >
                {tr('Подтвердить', 'Ырастоо', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
