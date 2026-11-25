import React from 'react';
import type { Bout, TournamentRules } from '../types/schema';
import * as E from '../utils/boutEngine';
import { TatamiDisplay } from './TatamiScreens';
import { useApp } from '../context/AppContext';

/**
 * Single-screen mode: one computer, one screen per tatami.
 * The audience sees the big scoreboard; the secretary scores with the keyboard.
 * Keys work with any keyboard layout (Russian / Kyrgyz / English): they use key positions.
 */

interface SoloScoreboardProps {
  bout: Bout;
  rules: TournamentRules;
  tatamiBouts: Bout[];
  apply: (next: Bout, chime?: number) => void;
  toggleClock: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onExit: () => void;
  onNextBout?: () => void;
}

type Lang = 'ru' | 'ky' | 'en';
const t = (l: Lang, ru: string, ky: string, en: string) => (l === 'ky' ? ky : l === 'en' ? en : ru);

/** Keys of each side for points: AKA on the left of the keyboard, AO on the right. */
const POINT_KEYS: Record<string, { side: E.Side; slot: 0 | 1 | 2 }> = {
  KeyQ: { side: 'aka', slot: 0 },
  KeyW: { side: 'aka', slot: 1 },
  KeyE: { side: 'aka', slot: 2 },
  KeyI: { side: 'ao', slot: 0 },
  KeyO: { side: 'ao', slot: 1 },
  KeyP: { side: 'ao', slot: 2 }
};
const PENALTY_KEYS: Record<string, { side: E.Side; cat: 'c1' | 'c2' }> = {
  Digit1: { side: 'aka', cat: 'c1' },
  Digit2: { side: 'aka', cat: 'c2' },
  Digit9: { side: 'ao', cat: 'c1' },
  Digit0: { side: 'ao', cat: 'c2' }
};

export const SoloScoreboard: React.FC<SoloScoreboardProps> = ({ bout, rules, tatamiBouts, apply, toggleClock, onUndo, canUndo, onExit, onNextBout }) => {
  const { language } = useApp();
  const lang = (language || 'ru') as Lang;
  const [help, setHelp] = React.useState(true);
  const [notice, setNotice] = React.useState<string | null>(null);
  const pendingHansoku = React.useRef<{ code: string; until: number } | null>(null);
  const system = E.ruleSystemOf(bout, rules);
  const finished = bout.status === 'completed';
  const ready = !!bout.akaParticipantId && !!bout.aoParticipantId;
  const AKA = t(lang, 'АКА', 'АКА', 'AKA');
  const AO = t(lang, 'АО', 'АО', 'AO');

  const flash = (text: string) => {
    setNotice(text);
    window.clearTimeout((flash as any).timer);
    (flash as any).timer = window.setTimeout(() => setNotice(null), 2200);
  };

  // Latest values for the key handler (it is attached once)
  const ref = React.useRef({ bout, finished, ready, system, apply, toggleClock, onUndo, canUndo, onExit, onNextBout });
  ref.current = { bout, finished, ready, system, apply, toggleClock, onUndo, canUndo, onExit, onNextBout };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const { bout: b, finished: fin, ready: rd, system: sys, apply: ap } = ref.current;
      const code = e.code;
      const handled = () => e.preventDefault();

      if (code === 'Escape') return handled(), ref.current.onExit();
      if (code === 'KeyH' || code === 'F1') return handled(), setHelp((v) => !v);
      if (code === 'Space') return handled(), ref.current.toggleClock();
      if (code === 'Backspace' || code === 'KeyZ') {
        handled();
        if (ref.current.canUndo) {
          ref.current.onUndo();
          flash(t(lang, 'Последнее действие отменено', 'Акыркы аракет жокко чыгарылды', 'Last action undone'));
        }
        return;
      }
      if (code === 'Enter') {
        handled();
        if (fin && ref.current.onNextBout) ref.current.onNextBout();
        return;
      }
      if (code === 'ArrowUp' || code === 'ArrowDown') {
        handled();
        if (!fin) ap(E.adjustClock(b, code === 'ArrowUp' ? 1 : -1));
        return;
      }
      // Judges' decision after a tie without Senshu
      if (b.awaitingDecision && !fin && (code === 'KeyF' || code === 'KeyJ')) {
        handled();
        ap(E.hantei(b, code === 'KeyF' ? 'aka' : 'ao'));
        return;
      }
      if (fin || !rd) return;

      const pk = POINT_KEYS[code];
      if (pk) {
        handled();
        const sign = e.shiftKey ? -1 : 1;
        if (sys === 'skif') {
          if (pk.slot === 2) return;
          ap(E.addSkif(b, pk.side, pk.slot === 0 ? 'waza_ari' : 'ippon', sign), sign > 0 ? (pk.slot === 0 ? 1 : 3) : undefined);
        } else {
          const pts = pk.slot + 1;
          ap(E.addScore(b, pk.side, sign * pts), sign > 0 ? pts : undefined);
        }
        return;
      }
      if (code === 'KeyA' || code === 'KeyL') {
        handled();
        if (sys !== 'wkf') return;
        const side: E.Side = code === 'KeyA' ? 'aka' : 'ao';
        const has = side === 'aka' ? b.akaSenshu : b.aoSenshu;
        ap(E.setSenshu(b, side, !has));
        return;
      }
      const pen = PENALTY_KEYS[code];
      if (pen) {
        handled();
        const key = `${pen.side}Penalties${pen.cat === 'c1' ? 'C1' : 'C2'}` as 'akaPenaltiesC1';
        const level = (b[key] ?? 0) + (e.shiftKey ? -1 : 1);
        if (level < 0 || level > 4) return;
        if (level === 4) {
          // Hansoku ends the bout: press the same key twice to confirm
          const p = pendingHansoku.current;
          if (!p || p.code !== code || Date.now() > p.until) {
            pendingHansoku.current = { code, until: Date.now() + 2500 };
            flash(`${pen.side === 'aka' ? AKA : AO} ${pen.cat.toUpperCase()}: Hansoku — ${t(lang, 'нажмите ещё раз для подтверждения', 'ырастоо үчүн дагы басыңыз', 'press again to confirm')}`);
            return;
          }
          pendingHansoku.current = null;
        }
        ap(E.setPenalty(b, pen.side, pen.cat, level));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const k = (s: string) => <kbd className="inline-block min-w-[1.6em] text-center px-1.5 py-0.5 rounded bg-white/15 border border-white/25 font-mono text-[0.95em]">{s}</kbd>;
  const row = (label: string, aka: React.ReactNode, ao: React.ReactNode) => (
    <tr>
      <td className="pr-4 py-1 opacity-80">{label}</td>
      <td className="pr-4 py-1">{aka}</td>
      <td className="py-1">{ao}</td>
    </tr>
  );

  return (
    <div className="theme-keep motion-fast fixed inset-0 z-[60]">
      <TatamiDisplay tatamiNumber={bout.tatamiNumber ?? 1} bouts={tatamiBouts.length ? tatamiBouts : [bout]} rules={rules} boutOverride={bout} />

      {/* Discreet hint for the secretary */}
      {!help && (
        <div className="fixed bottom-2 right-3 z-[61] text-[11px] text-white/40 select-none">
          H — {t(lang, 'клавиши', 'баскычтар', 'keys')} · Esc — {t(lang, 'пульт', 'пульт', 'console')}
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[62] rounded-xl bg-black/85 text-white text-base px-5 py-2.5">{notice}</div>
      )}

      {finished && onNextBout && !help && (
        <div className="fixed top-[9vh] left-1/2 -translate-x-1/2 z-[61] rounded-lg bg-black/70 text-white/80 text-sm px-4 py-1.5">
          Enter — {t(lang, 'следующий бой', 'кийинки беттеш', 'next bout')}
        </div>
      )}

      {help && (
        <div className="fixed inset-0 z-[63] bg-black/75 flex items-center justify-center p-4" onClick={() => setHelp(false)}>
          <div className="max-w-2xl w-full rounded-2xl bg-[#0f172a] border border-white/15 text-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white">{t(lang, 'Режим одного экрана — клавиши', 'Бир экран режими — баскычтар', 'Single-screen mode — keys')}</h2>
            <p className="text-sm text-white/70 mt-1">
              {t(
                lang,
                'Зрители видят только табло. Секретарь ведёт бой с клавиатуры. Раскладка (русская или английская) не важна.',
                'Көрүүчүлөр таблону гана көрүшөт. Катчы беттешти баскычтоп менен жүргүзөт. Тил тандоосу маанилүү эмес.',
                'The audience sees only the scoreboard. The secretary scores from the keyboard; any keyboard layout works.'
              )}
            </p>
            <table className="mt-4 text-sm w-full">
              <thead>
                <tr className="text-left text-white/60">
                  <th className="pr-4 pb-1 font-normal" />
                  <th className="pr-4 pb-1 font-semibold text-red-300">{AKA}</th>
                  <th className="pb-1 font-semibold text-blue-300">{AO}</th>
                </tr>
              </thead>
              <tbody>
                {system === 'skif' ? (
                  <>
                    {row('Waza-ari', k('Q'), k('I'))}
                    {row('Ippon', k('W'), k('O'))}
                  </>
                ) : (
                  <>
                    {row('Yuko +1', k('Q'), k('I'))}
                    {row('Waza-ari +2', k('W'), k('O'))}
                    {row('Ippon +3', k('E'), k('P'))}
                    {row('Senshu', k('A'), k('L'))}
                  </>
                )}
                {row(t(lang, 'Предупреждение C1', 'Эскертүү C1', 'Warning C1'), k('1'), k('9'))}
                {row(t(lang, 'Предупреждение C2', 'Эскертүү C2', 'Warning C2'), k('2'), k('0'))}
                {row(t(lang, 'Хантей (решение судей)', 'Хантей (калыстардын чечими)', 'Hantei (decision)'), k('F'), k('J'))}
              </tbody>
            </table>
            <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div>{k('Пробел')} {t(lang, 'старт / стоп часов', 'саатты баштоо / токтотуу', 'start / stop clock')}</div>
              <div>{k('Shift')} + {t(lang, 'клавиша — исправить (минус)', 'баскыч — оңдоо (кемитүү)', 'key — correct (minus)')}</div>
              <div>{k('↑')} {k('↓')} {t(lang, '± 1 секунда', '± 1 секунд', '± 1 second')}</div>
              <div>{k('Z')} / {k('⌫')} {t(lang, 'отменить последнее', 'акыркысын жокко чыгаруу', 'undo last')}</div>
              <div>{k('Enter')} {t(lang, 'следующий бой (после окончания)', 'кийинки беттеш (бүткөндөн кийин)', 'next bout (when finished)')}</div>
              <div>{k('Esc')} {t(lang, 'вернуться к пульту с кнопками', 'баскычтуу пультка кайтуу', 'back to the button console')}</div>
              <div>{k('H')} {t(lang, 'показать / скрыть подсказку', 'кеңешти көрсөтүү / жашыруу', 'show / hide this help')}</div>
            </div>
            <p className="mt-4 text-xs text-white/60">
              {t(
                lang,
                'Хансоку (4-й уровень предупреждения) — нажмите клавишу дважды. Кикен, Шиккаку и исправление результата — в пульте с кнопками (Esc).',
                'Хансоку (4-деңгээл) — баскычты эки жолу басыңыз. Кикен, Шиккаку жана жыйынтыкты оңдоо — баскычтуу пультта (Esc).',
                'Hansoku (warning level 4): press the key twice. Kiken, Shikkaku and result corrections are in the button console (Esc).'
              )}
            </p>
            <button onClick={() => setHelp(false)} className="mt-5 h-10 px-5 rounded-lg bg-white text-black font-semibold cursor-pointer">
              {t(lang, 'Понятно — показать табло', 'Түшүнүктүү — таблону көрсөтүү', 'Got it — show scoreboard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
