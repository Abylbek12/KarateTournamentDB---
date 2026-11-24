// Elimination bracket drawn like Uventex: rounds left to right, lines from every bout to the bout it feeds,
// «Победитель #111» in the slots still waiting for an athlete, full names, and the medal places on the right.
// One component for the printed sheet (variant 'print', fixed colours) and the website (variant 'screen', theme colours).
import React from 'react';
import type { Bout, Participant, ThirdPlaceMode } from '../types/schema';
import { bracketLayout, feedsInto, type SideSource } from '../utils/bracketLayout';
import { computeStandings, repechageHalf, repechageStep, stageLabel } from '../utils/bracketProgression';

type Lang = 'ru' | 'ky' | 'en';
const tr = (lang: Lang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

export interface BracketTreeProps {
  bouts: Bout[];
  categoryId: string;
  lang: Lang;
  variant: 'print' | 'screen';
  thirdPlace?: ThirdPlaceMode;
  /** Athlete name and club as they should be shown (name style of the event) */
  nameOf: (p: Participant) => string;
  clubOf: (p: Participant) => string;
  find: (id?: string) => Participant | undefined;
}

const HEAD = 17;
const ROW = 33;
const CARD_H = HEAD + ROW * 2;
const GAP_Y = 14;
const UNIT = CARD_H + GAP_Y;
const GAP_X = 44;
const TITLE_H = 20;

/** Card width from the longest name / club in the category: everything fits, nothing is cut. */
export function bracketCardWidth(texts: { name: string; club: string }[]): number {
  const need = Math.max(0, ...texts.map((t) => Math.max(t.name.length * 7.5, t.club.length * 6.1)));
  return Math.round(Math.min(400, Math.max(215, need + 36)));
}

/** Full size of the drawing in px (for print scaling). */
export function bracketSize(columns: number, firstCount: number, cardW: number, resultsW = 210) {
  return { width: columns * (cardW + GAP_X) + resultsW, height: TITLE_H + Math.max(firstCount * UNIT, 4 * UNIT) };
}

export const BracketTree: React.FC<BracketTreeProps> = ({ bouts, categoryId, lang, variant, thirdPlace, nameOf, clubOf, find }) => {
  const cat = bouts.filter((b) => b.categoryId === categoryId);
  const layout = bracketLayout(cat);
  const bronzeBout = cat.find((b) => b.roundStage === 'bronze_match');
  const repechage = cat.filter((b) => b.roundStage === 'repechage').sort((a, b) => repechageHalf(a) - repechageHalf(b) || repechageStep(a) - repechageStep(b));
  const print = variant === 'print';
  const c = print
    ? { text: '#111', muted: '#666', border: '#555', head: '#eef1f4', bg: '#fff', line: '#333', aka: '#c0392b', ao: '#1f5fa8', gray: '#8a939c' }
    : { text: 'var(--app-text-primary)', muted: 'var(--app-text-muted)', border: 'var(--app-border)', head: 'var(--app-surface-subtle)', bg: 'var(--app-surface)', line: 'var(--app-text-muted)', aka: '#dc2626', ao: '#2563eb', gray: '#94a3b8' };

  const people = cat.flatMap((b) => [b.akaParticipantId, b.aoParticipantId]).map(find).filter((p): p is Participant => !!p);
  const cardW = bracketCardWidth(people.map((p) => ({ name: nameOf(p), club: clubOf(p) })));
  const nCols = layout.columns.length;
  const resultsW = 210;
  const { width, height } = bracketSize(nCols, layout.firstCount, cardW, resultsW);
  const center = (r: number, pos: number) => TITLE_H + ((pos - 0.5) * layout.firstCount * UNIT) / layout.columns[r].length;
  const x = (r: number) => r * (cardW + GAP_X);
  const winnerLabel = (n: number) => `${tr(lang, 'Победитель', 'Жеңүүчү', 'Winner')} #${n}`;

  const sideRow = (b: Bout | undefined, src: SideSource, s: 'aka' | 'ao') => {
    const p = src.kind === 'athlete' ? find(src.id) : undefined;
    const won = !!b?.winnerId && src.kind === 'athlete' && b.winnerId === src.id;
    const score = b && b.status !== 'scheduled' ? (s === 'aka' ? b.akaScore : b.aoScore) : '';
    return (
      <div
        key={s}
        style={{
          height: ROW, display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px 0 0', boxSizing: 'border-box',
          // Line under each name like Uventex: red under AKA, white outlined in gray under the second athlete
          borderBottom: s === 'aka' ? `2px solid ${c.aka}` : '3px solid #fff',
          boxShadow: s === 'aka' ? undefined : `0 1px 0 0 ${c.gray}, inset 0 -1px 0 0 ${c.gray}`
        }}
      >
        <span style={{ width: 5, alignSelf: 'stretch', background: s === 'aka' ? c.aka : c.ao }} />
        <span style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}>
          {p ? (
            <>
              <span style={{ display: 'block', fontSize: 12, fontWeight: won ? 700 : 500, color: c.text, whiteSpace: 'nowrap' }}>{nameOf(p)}</span>
              <span style={{ display: 'block', fontSize: 10, color: c.muted, whiteSpace: 'nowrap' }}>{clubOf(p)}</span>
            </>
          ) : (
            <span style={{ fontSize: 10, fontStyle: 'italic', color: c.muted, whiteSpace: 'nowrap' }}>{src.kind === 'winner' ? winnerLabel(src.boutNumber) : ''}</span>
          )}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{score}</span>
      </div>
    );
  };

  const card = (b: Bout | undefined, aka: SideSource, ao: SideSource, style: React.CSSProperties, key: string) => (
    <div key={key} style={{ position: 'absolute', width: cardW, height: CARD_H, border: `1px solid ${b?.status === 'in_progress' ? c.aka : c.border}`, background: c.bg, boxSizing: 'border-box', ...style }}>
      <div style={{ height: HEAD, background: c.head, fontSize: 10, color: c.muted, padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>#{b?.boutNumber}{b?.scheduledTime ? ` · ${b.scheduledTime}` : ''}</span>
        {b?.status === 'in_progress' && <span style={{ color: c.aka, fontWeight: 700 }}>LIVE</span>}
      </div>
      {sideRow(b, aka, 'aka')}
      {sideRow(b, ao, 'ao')}
    </div>
  );

  // Lines from each bout to the slot it feeds (elbow: right, down/up, right)
  const lines: string[] = [];
  layout.columns.forEach((col, r) => {
    if (r === nCols - 1) return;
    for (const slot of col) {
      if (!slot.bout) continue;
      const to = feedsInto(slot.pos);
      const y1 = center(r, slot.pos);
      const top2 = center(r + 1, to.pos) - CARD_H / 2;
      const y2 = top2 + HEAD + (to.side === 'aka' ? ROW / 2 : ROW * 1.5);
      const x1 = x(r) + cardW;
      const x2 = x(r + 1);
      const mid = x1 + GAP_X / 2;
      lines.push(`M${x1} ${y1} H${mid} V${y2} H${x2}`);
    }
  });

  const st = computeStandings(bouts, categoryId);
  const final = layout.columns[nCols - 1]?.[0];
  const finalBottom = final ? center(nCols - 1, 1) + CARD_H / 2 : 0;
  // No semi-final: nobody is third. One semi (3 athletes) or a bout for 3rd place: one. Otherwise two.
  const semiCount = cat.filter((b) => b.roundStage === 'semi_final').length;
  const thirdCount = semiCount === 0 ? 0 : thirdPlace === 'bronze_match' || bronzeBout || semiCount === 1 ? 1 : 2;
  const places: { place: string; id?: string }[] = [
    { place: '1', id: st.gold },
    { place: '2', id: st.silver },
    ...Array.from({ length: thirdCount }, (_, i) => ({ place: '3', id: st.bronze[i] }))
  ];
  const resultsTop = Math.max(TITLE_H, (final ? center(nCols - 1, 1) : TITLE_H) - 70);

  const perRow = Math.max(1, Math.floor(width / (cardW + 12)));
  const repH = repechage.length ? 26 + Math.ceil(repechage.length / perRow) * (CARD_H + 12) : 0;
  if (nCols === 0) return null;
  return (
    <div className="bracket-tree" style={{ position: 'relative', width, height: Math.max(height, resultsTop + 190, bronzeBout ? finalBottom + 40 + CARD_H : 0) + repH, color: c.text }}>
      {layout.stages.map((s, r) => (
        <div key={s} style={{ position: 'absolute', left: x(r), top: 0, width: cardW, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c.muted }}>{stageLabel(s, lang)}</div>
      ))}
      <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden>
        {lines.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={c.line} strokeWidth={1.2} />
        ))}
      </svg>
      {layout.columns.flatMap((col, r) =>
        col.filter((slot) => slot.bout).map((slot) => card(slot.bout, slot.aka, slot.ao, { left: x(r), top: center(r, slot.pos) - CARD_H / 2 }, `${r}-${slot.pos}`))
      )}
      {bronzeBout && (
        <>
          <div style={{ position: 'absolute', left: x(nCols - 1), top: finalBottom + 22, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c.muted }}>{stageLabel('bronze_match', lang)}</div>
          {card(bronzeBout, bronzeBout.akaParticipantId ? { kind: 'athlete', id: bronzeBout.akaParticipantId } : { kind: 'empty' }, bronzeBout.aoParticipantId ? { kind: 'athlete', id: bronzeBout.aoParticipantId } : { kind: 'empty' }, { left: x(nCols - 1), top: finalBottom + 38 }, 'bronze')}
        </>
      )}
      {/* Medal places of the category */}
      <div style={{ position: 'absolute', left: x(nCols) , top: resultsTop, width: resultsW - 10, border: `1px solid ${c.border}`, background: c.bg, fontSize: 11 }}>
        <div style={{ background: c.head, padding: '3px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c.muted }}>{tr(lang, 'Итоги категории', 'Категориянын жыйынтыгы', 'Category results')}</div>
        {places.map((pl, i) => {
          const p = find(pl.id);
          return (
            <div key={i} style={{ display: 'flex', gap: 6, padding: '5px 6px', borderTop: i ? `1px solid ${c.border}` : undefined, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, width: 54, whiteSpace: 'nowrap' }}>{pl.place} {tr(lang, 'место', 'орун', 'place')}</span>
              <span style={{ flex: 1, borderBottom: p ? undefined : `1px solid ${c.line}`, minHeight: 14, lineHeight: 1.2 }}>
                {p && (
                  <>
                    <span style={{ display: 'block', fontWeight: 600 }}>{nameOf(p)}</span>
                    <span style={{ display: 'block', fontSize: 9, color: c.muted }}>{clubOf(p)}</span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {repechage.length > 0 && (
        <div style={{ position: 'absolute', left: 0, top: height + 10, width }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: c.muted, marginBottom: 4 }}>{tr(lang, 'Утешительные бои за 3-е место', '3-орун үчүн утешителдик беттештер', 'Repechage for bronze')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {repechage.map((b) =>
              card(b, b.akaParticipantId ? { kind: 'athlete', id: b.akaParticipantId } : { kind: 'empty' }, b.aoParticipantId ? { kind: 'athlete', id: b.aoParticipantId } : { kind: 'empty' }, { position: 'relative' }, b.id)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
