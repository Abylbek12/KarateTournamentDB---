// Elimination bracket drawn like Uventex: protocol header, rounds left to right, lines from every bout to the bout
// it feeds, «Победитель #111» in the slots still waiting for an athlete, full names, places 1–4 filled from the results.
// The bracket size follows the entries: 2 → final only, 3–4 → semis, 5–8 → 1/4, 9–16 → 1/8, 17–32 → two subgroups
// (A and B, 16 each) whose winners meet in the final. One component for print ('print') and the website ('screen').
import React from 'react';
import type { Bout, Participant, ThirdPlaceMode } from '../types/schema';
import { bracketLayout, feedsInto, type LayoutSlot, type SideSource } from '../utils/bracketLayout';
import { computeStandings, repechageHalf, repechageStep, stageLabel } from '../utils/bracketProgression';

type Lang = 'ru' | 'ky' | 'en';
const tr = (lang: Lang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

/** Header of the protocol: what is printed above the bracket. */
export interface BracketInfo {
  discipline: string;
  category: string;
  code: string;
  /** Protocol number: place of the category in the tournament list */
  protocol?: number;
  tatami?: number;
  date?: string;
}

export interface BracketTreeProps {
  bouts: Bout[];
  categoryId: string;
  lang: Lang;
  variant: 'print' | 'screen';
  thirdPlace?: ThirdPlaceMode;
  info?: BracketInfo;
  /** Athlete name and club as they should be shown (name style of the event) */
  nameOf: (p: Participant) => string;
  clubOf: (p: Participant) => string;
  find: (id?: string) => Participant | undefined;
}

// Sizes: a little bigger on paper, compact on the screen
const dims = (variant: 'print' | 'screen') =>
  variant === 'print'
    ? { head: 17, row: 32, gapY: 12, gapX: 40, name: 12, club: 10, title: 20 }
    : { head: 15, row: 28, gapY: 8, gapX: 30, name: 11.5, club: 9.5, title: 18 };

/** Card width from the longest name / club in the category: everything fits, nothing is cut. */
export function bracketCardWidth(texts: { name: string; club: string }[], variant: 'print' | 'screen' = 'print'): number {
  const k = variant === 'print' ? 1 : 0.94;
  const need = Math.max(0, ...texts.map((t) => Math.max(t.name.length * 7.4, t.club.length * 6)));
  return Math.round(Math.min(380, Math.max(200, (need + 34) * k)));
}

const RESULTS_W = 230;
/** 17–32 entries (a 1/16 round): the bracket is shown as subgroups A and B plus the final */
const isSplit = (firstCount: number) => firstCount >= 16;

/** Size of the biggest panel in px (print scales it to the sheet). */
export function bracketPanelSize(categoryBouts: Bout[], cardW: number, variant: 'print' | 'screen' = 'print') {
  const d = dims(variant);
  const L = bracketLayout(categoryBouts);
  const unit = d.head + d.row * 2 + d.gapY;
  const split = isSplit(L.firstCount);
  // Split: a page holds one subgroup (B with the final and the places on its right), so half the slots
  const cols = L.columns.length;
  const slots = split ? L.firstCount / 2 : L.firstCount;
  return { width: cols * (cardW + d.gapX) + RESULTS_W + (split ? d.gapX : 0), height: d.title + 26 + Math.max(slots, 4) * unit, splitPages: split };
}

export const BracketTree: React.FC<BracketTreeProps> = ({ bouts, categoryId, lang, variant, thirdPlace, info, nameOf, clubOf, find }) => {
  const d = dims(variant);
  const CARD_H = d.head + d.row * 2;
  const UNIT = CARD_H + d.gapY;
  const cat = bouts.filter((b) => b.categoryId === categoryId);
  const layout = bracketLayout(cat);
  const bronzeBout = cat.find((b) => b.roundStage === 'bronze_match');
  const repechage = cat.filter((b) => b.roundStage === 'repechage').sort((a, b) => repechageHalf(a) - repechageHalf(b) || repechageStep(a) - repechageStep(b));
  const print = variant === 'print';
  const c = print
    ? { text: '#111', muted: '#555', border: '#555', head: '#eef1f4', bg: '#fff', line: '#333', aka: '#c0392b', ao: '#1f5fa8', gray: '#8a939c', band: '#f4f6f8' }
    : { text: 'var(--app-text-primary)', muted: 'var(--app-text-muted)', border: 'var(--app-border)', head: 'var(--app-surface-subtle)', bg: 'var(--app-surface)', line: 'var(--app-text-muted)', aka: '#dc2626', ao: '#2563eb', gray: '#94a3b8', band: 'var(--app-surface-subtle)' };

  const people = cat.flatMap((b) => [b.akaParticipantId, b.aoParticipantId]).map(find).filter((p): p is Participant => !!p);
  const cardW = bracketCardWidth(people.map((p) => ({ name: nameOf(p), club: clubOf(p) })), variant);
  const winnerLabel = (n: number) => `${tr(lang, 'Победитель', 'Жеңүүчү', 'Winner')} #${n}`;
  const athlete = (id?: string): SideSource => (id ? { kind: 'athlete', id } : { kind: 'empty' });

  // ---------- one bout card ----------
  const sideRow = (b: Bout | undefined, src: SideSource, s: 'aka' | 'ao') => {
    const p = src.kind === 'athlete' ? find(src.id) : undefined;
    const won = !!b?.winnerId && src.kind === 'athlete' && b.winnerId === src.id;
    const score = b && b.status !== 'scheduled' ? (s === 'aka' ? b.akaScore : b.aoScore) : '';
    return (
      <div
        key={s}
        style={{
          height: d.row, display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px 0 0', boxSizing: 'border-box',
          // Line under each name like Uventex: red under AKA, white outlined in gray under the second athlete
          borderBottom: s === 'aka' ? `2px solid ${c.aka}` : '3px solid #fff',
          boxShadow: s === 'aka' ? undefined : `0 1px 0 0 ${c.gray}, inset 0 -1px 0 0 ${c.gray}`
        }}
      >
        <span style={{ width: 5, alignSelf: 'stretch', background: s === 'aka' ? c.aka : c.ao }} />
        <span style={{ flex: 1, minWidth: 0, lineHeight: 1.12 }}>
          {p ? (
            <>
              <span style={{ display: 'block', fontSize: d.name, fontWeight: won ? 700 : 500, color: c.text, whiteSpace: 'nowrap' }}>{nameOf(p)}</span>
              <span style={{ display: 'block', fontSize: d.club, color: c.muted, whiteSpace: 'nowrap' }}>{clubOf(p)}</span>
            </>
          ) : (
            <span style={{ fontSize: d.club + 0.5, fontStyle: 'italic', color: c.muted, whiteSpace: 'nowrap' }}>{src.kind === 'winner' ? winnerLabel(src.boutNumber) : ''}</span>
          )}
        </span>
        <span style={{ fontSize: d.name, fontWeight: 700, color: c.text }}>{score}</span>
      </div>
    );
  };
  const card = (b: Bout | undefined, aka: SideSource, ao: SideSource, style: React.CSSProperties, key: string) => (
    <div key={key} style={{ position: 'absolute', width: cardW, height: CARD_H, border: `1px solid ${b?.status === 'in_progress' ? c.aka : c.border}`, background: c.bg, boxSizing: 'border-box', ...style }}>
      <div style={{ height: d.head, background: c.head, fontSize: d.club, color: c.muted, padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>#{b?.boutNumber}{b?.scheduledTime ? ` · ${b.scheduledTime}` : ''}</span>
        {b?.status === 'in_progress' && <span style={{ color: c.aka, fontWeight: 700 }}>LIVE</span>}
      </div>
      {sideRow(b, aka, 'aka')}
      {sideRow(b, ao, 'ao')}
    </div>
  );

  // ---------- places 1–4 ----------
  const st = computeStandings(bouts, categoryId);
  const semiCount = cat.filter((b) => b.roundStage === 'semi_final').length;
  const oneBronze = thirdPlace === 'bronze_match' || !!bronzeBout;
  // Karate gives two 3rd places (SKIF / WKF); with a bout for 3rd place its loser is 4th
  const places: { place: string; id?: string }[] = [
    { place: '1', id: st.gold },
    { place: '2', id: st.silver },
    ...(semiCount === 0 ? [] : oneBronze ? [{ place: '3', id: st.bronze[0] }, ...(semiCount === 2 ? [{ place: '4', id: st.fourth }] : [])] : semiCount === 1 ? [{ place: '3', id: st.bronze[0] }] : [{ place: '3', id: st.bronze[0] }, { place: '3', id: st.bronze[1] }])
  ];
  const resultsBox = (style: React.CSSProperties) => (
    <div style={{ position: 'absolute', width: RESULTS_W - 14, border: `1px solid ${c.border}`, background: c.bg, fontSize: d.name - 0.5, ...style }}>
      <div style={{ background: c.head, padding: '3px 6px', fontSize: d.club, fontWeight: 700, textTransform: 'uppercase', color: c.muted }}>{tr(lang, 'Итоговые места', 'Жыйынтык орундар', 'Final places')}</div>
      {places.map((pl, i) => {
        const p = find(pl.id);
        return (
          <div key={i} style={{ display: 'flex', gap: 6, padding: '5px 6px', borderTop: i ? `1px solid ${c.border}` : undefined, alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, width: 56, whiteSpace: 'nowrap', color: c.text }}>{pl.place} {tr(lang, 'место', 'орун', 'place')}</span>
            <span style={{ flex: 1, borderBottom: p ? undefined : `1px solid ${c.line}`, minHeight: 14, lineHeight: 1.2, color: c.text }}>
              {p && (
                <>
                  <span style={{ display: 'block', fontWeight: 600 }}>{nameOf(p)}</span>
                  <span style={{ display: 'block', fontSize: d.club, color: c.muted }}>{clubOf(p)}</span>
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ---------- one tree panel ----------
  type Col = { stage: string; slots: (LayoutSlot & { local: number })[] };
  const panel = (cols: Col[], opts: { title?: string; key: string; withFinalExtras: boolean; breakBefore?: boolean }) => {
    const first = Math.max(cols[0].slots.length, opts.withFinalExtras && cols.length === 1 ? 2 : 1);
    const height = d.title + Math.max(first, opts.withFinalExtras ? 4 : 1) * UNIT;
    const x = (r: number) => r * (cardW + d.gapX);
    const center = (r: number, local: number) => d.title + ((local - 0.5) * first * UNIT) / Math.max(cols[r].slots.length, 1);
    const lines: string[] = [];
    cols.forEach((col, r) => {
      if (r === cols.length - 1) return;
      for (const slot of col.slots) {
        if (!slot.bout) continue;
        const to = feedsInto(slot.local);
        const y1 = center(r, slot.local);
        const y2 = center(r + 1, to.pos) - CARD_H / 2 + d.head + (to.side === 'aka' ? d.row / 2 : d.row * 1.5);
        const x1 = x(r) + cardW;
        lines.push(`M${x1} ${y1} H${x1 + d.gapX / 2} V${y2} H${x(r + 1)}`);
      }
    });
    const lastC = cols.length - 1;
    const finalCenter = center(lastC, 1);
    const extrasTop = finalCenter + CARD_H / 2 + 22;
    const width = cols.length * (cardW + d.gapX) + (opts.withFinalExtras ? RESULTS_W : 0);
    const resultsTop = Math.max(d.title, finalCenter - 60);
    const fullH = Math.max(height, opts.withFinalExtras ? resultsTop + 40 + places.length * 36 : 0, bronzeBout && opts.withFinalExtras ? extrasTop + 16 + CARD_H + 6 : 0);
    return (
      <div key={opts.key} className={opts.breakBefore ? 'bracket-panel bracket-panel-break' : 'bracket-panel'} style={{ marginTop: opts.title ? 6 : 0 }}>
        {opts.title && <div style={{ fontSize: d.name + 2, fontWeight: 800, margin: '2px 0 6px', color: c.text }}>{opts.title}</div>}
        <div style={{ position: 'relative', width, height: fullH }}>
          {cols.map((col, r) => (
            <div key={col.stage} style={{ position: 'absolute', left: x(r), top: 0, width: cardW, fontSize: d.club, fontWeight: 700, textTransform: 'uppercase', color: c.muted }}>{col.stage}</div>
          ))}
          <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden>
            {lines.map((p, i) => (
              <path key={i} d={p} fill="none" stroke={c.line} strokeWidth={1.2} />
            ))}
          </svg>
          {cols.flatMap((col, r) =>
            col.slots.filter((slot) => slot.bout).map((slot) => card(slot.bout, slot.aka, slot.ao, { left: x(r), top: center(r, slot.local) - CARD_H / 2 }, `${opts.key}-${r}-${slot.pos}`))
          )}
          {opts.withFinalExtras && bronzeBout && (
            <>
              <div style={{ position: 'absolute', left: x(lastC), top: extrasTop, fontSize: d.club, fontWeight: 700, textTransform: 'uppercase', color: c.muted }}>{stageLabel('bronze_match', lang)}</div>
              {card(bronzeBout, athlete(bronzeBout.akaParticipantId), athlete(bronzeBout.aoParticipantId), { left: x(lastC), top: extrasTop + 16 }, 'bronze')}
            </>
          )}
          {opts.withFinalExtras && resultsBox({ left: x(cols.length), top: resultsTop })}
        </div>
      </div>
    );
  };

  if (layout.columns.length === 0) return null;
  const stageCol = (r: number, filter: (s: LayoutSlot) => boolean, offset: number): Col => ({
    stage: stageLabel(layout.stages[r], lang),
    slots: layout.columns[r].filter(filter).map((s) => ({ ...s, local: s.pos - offset }))
  });
  const n = layout.columns.length;
  let panels: React.ReactNode[];
  if (isSplit(layout.firstCount)) {
    // 17–32 entries: subgroup A (upper half) and B (lower half) up to the semi-finals, then the final
    const half = (r: number, which: 0 | 1) => {
      const count = layout.columns[r].length / 2;
      return stageCol(r, (s) => (which === 0 ? s.pos <= count : s.pos > count), which === 0 ? 0 : count);
    };
    const upTo = Array.from({ length: n - 1 }, (_, r) => r);
    panels = [
      panel(upTo.map((r) => half(r, 0)), { key: 'A', title: tr(lang, 'Подгруппа A', 'A топчосу', 'Subgroup A'), withFinalExtras: false }),
      // Subgroup B and, on its right, the final of the two subgroup winners with the places
      <div key="BF" className="bracket-panel-break" style={{ display: 'flex', alignItems: 'center', gap: d.gapX }}>
        {panel(upTo.map((r) => half(r, 1)), { key: 'B', title: tr(lang, 'Подгруппа B', 'B топчосу', 'Subgroup B'), withFinalExtras: false })}
        {panel([stageCol(n - 1, () => true, 0)], { key: 'F', title: tr(lang, 'Финал A / B', 'Финал A / B', 'Final A / B'), withFinalExtras: true })}
      </div>
    ];
  } else {
    panels = [panel(layout.columns.map((_, r) => stageCol(r, () => true, 0)), { key: 'all', withFinalExtras: true })];
  }

  return (
    <div className="bracket-tree" style={{ color: c.text }}>
      {info && (
        // Protocol header like Uventex: discipline, category, code, protocol / tatami, date
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', alignItems: 'baseline', background: c.band, border: `1px solid ${c.border}`, padding: '6px 10px', marginBottom: 10, fontSize: d.club + 1, color: c.muted }}>
          <span style={{ fontSize: d.name + 4, fontWeight: 800, color: c.text }}>{info.discipline}</span>
          <span style={{ fontSize: d.name + 2, fontWeight: 700, color: c.text }}>{info.category}</span>
          <span>{tr(lang, 'Код', 'Код', 'Code')}: <b style={{ color: c.text }}>{info.code}</b></span>
          {info.protocol != null && <span>{tr(lang, 'Протокол', 'Протокол', 'Protocol')} № <b style={{ color: c.text }}>{info.protocol}</b></span>}
          {info.tatami != null && <span>{tr(lang, 'Татами', 'Татами', 'Tatami')} <b style={{ color: c.text }}>{info.tatami}</b></span>}
          {info.date && <span>{info.date}</span>}
          <span>{tr(lang, 'Участников', 'Катышуучулар', 'Athletes')}: <b style={{ color: c.text }}>{new Set(people.map((p) => p.id)).size}</b></span>
        </div>
      )}
      {panels}
      {repechage.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: d.club, fontWeight: 700, textTransform: 'uppercase', color: c.muted, marginBottom: 4 }}>{tr(lang, 'Утешительные бои за 3-е место', '3-орун үчүн утешителдик беттештер', 'Repechage for bronze')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {repechage.map((b) => card(b, athlete(b.akaParticipantId), athlete(b.aoParticipantId), { position: 'relative' }, b.id))}
          </div>
        </div>
      )}
    </div>
  );
};
