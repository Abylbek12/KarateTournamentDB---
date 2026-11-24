// Elimination bracket in the Uventex style: header table (category, tatami, code, №, date, time), a row of five
// referee signatures, every athlete in an open frame (top, left and bottom lines; AKA red, AO white with gray edges),
// thin connector lines, a black slot for the winner after the final, numbered places in the top right corner.
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
  eventTitle?: string;
  city?: string;
  discipline: string;
  category: string;
  code: string;
  /** Protocol number: place of the category in the tournament list */
  protocol?: number;
  tatami?: number;
  date?: string;
  /** Start time of the category (its first bout) */
  time?: string;
  chiefReferee?: string;
  chiefSecretary?: string;
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
// Big brackets (8+ bouts in a column) are tighter so a 16-athlete bracket still reads well on one sheet
const dims = (variant: 'print' | 'screen', dense = false) =>
  variant === 'print'
    ? { head: 13, row: 27, pair: dense ? 4 : 6, gapY: dense ? 6 : 12, gapX: 34, name: 11.5, club: 9, title: 18 }
    : { head: 12, row: 25, pair: dense ? 4 : 5, gapY: dense ? 6 : 10, gapX: 28, name: 11, club: 8.5, title: 16 };
const denseFor = (firstCount: number) => (isSplit(firstCount) ? firstCount / 2 : firstCount) >= 8;

/** Slot width from the longest name / club in the category: everything fits, nothing is cut. */
export function bracketCardWidth(texts: { name: string; club: string }[], variant: 'print' | 'screen' = 'print'): number {
  const k = variant === 'print' ? 1 : 0.94;
  const need = Math.max(0, ...texts.map((t) => Math.max(t.name.length * 7.4, t.club.length * 6)));
  return Math.round(Math.min(380, Math.max(190, (need + 30) * k)));
}

const RESULTS_W = 230;
/** 17–32 entries (a 1/16 round): the bracket is shown as subgroups A and B plus the final */
const isSplit = (firstCount: number) => firstCount >= 16;

/** Size of the biggest panel in px (print scales it to the sheet). */
export function bracketPanelSize(categoryBouts: Bout[], cardW: number, variant: 'print' | 'screen' = 'print') {
  const L = bracketLayout(categoryBouts);
  const d = dims(variant, denseFor(L.firstCount));
  const unit = d.head + d.row * 2 + d.pair + d.gapY;
  const split = isSplit(L.firstCount);
  const cols = L.columns.length;
  const slots = split ? L.firstCount / 2 : L.firstCount;
  // + the winner slot after the final, + the places box
  return { width: (cols + 1) * (cardW + d.gapX) + RESULTS_W + (split ? d.gapX : 0), height: d.title + 26 + Math.max(slots, 4) * unit, splitPages: split };
}

export const BracketTree: React.FC<BracketTreeProps> = ({ bouts, categoryId, lang, variant, thirdPlace, info, nameOf, clubOf, find }) => {
  const d = dims(variant, denseFor(bracketLayout(bouts.filter((b) => b.categoryId === categoryId)).firstCount));
  // A bout: its number, then two separate slots (AKA, AO) with a gap between them
  const CARD_H = d.head + d.row * 2 + d.pair;
  const UNIT = CARD_H + d.gapY;
  const cat = bouts.filter((b) => b.categoryId === categoryId);
  const layout = bracketLayout(cat);
  const bronzeBout = cat.find((b) => b.roundStage === 'bronze_match');
  const repechage = cat.filter((b) => b.roundStage === 'repechage').sort((a, b) => repechageHalf(a) - repechageHalf(b) || repechageStep(a) - repechageStep(b));
  const print = variant === 'print';
  const c = print
    ? { text: '#111', muted: '#555', border: '#444', bg: '#fff', line: '#555', aka: '#e0453a', ao: '#d1d5db', aoBg: '#fff', winner: '#111', band: '#fff', cardText: '#111', cardMuted: '#555' }
    : // Athlete blocks are always white (#fff) with dark text, also in the dark theme
      { text: 'var(--app-text-primary)', muted: 'var(--app-text-muted)', border: 'var(--app-border)', bg: '#fff', line: 'var(--app-text-muted)', aka: '#e0453a', ao: '#d1d5db', aoBg: '#fff', winner: 'var(--app-text-primary)', band: 'var(--app-surface)', cardText: '#111', cardMuted: '#5b6470' };

  const people = cat.flatMap((b) => [b.akaParticipantId, b.aoParticipantId]).map(find).filter((p): p is Participant => !!p);
  const cardW = bracketCardWidth(people.map((p) => ({ name: nameOf(p), club: clubOf(p) })), variant);
  const winnerLabel = (n: number) => `${tr(lang, 'Победитель', 'Жеңүүчү', 'Winner')} #${n}`;
  const athlete = (id?: string): SideSource => (id ? { kind: 'athlete', id } : { kind: 'empty' });

  // ---------- one athlete slot: an open frame (top, left, bottom) like Uventex ----------
  // Each athlete is a separate block: AKA in a thin red frame with a red left accent, AO white with a gray frame
  const slot = (content: { p?: Participant; label?: string; won?: boolean; score?: number | string }, edge: string, key: string, style?: React.CSSProperties, fill?: string, accent?: string) => (
    <div
      key={key}
      style={{
        height: d.row, display: 'flex', alignItems: 'center', gap: 6, padding: '0 5px 0 7px', boxSizing: 'border-box',
        border: `1px solid ${edge}`, borderLeft: accent ? `3px solid ${accent}` : `1px solid ${edge}`, borderRadius: 2, background: fill || c.bg,
        ...style
      }}
    >
      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.12 }}>
        {content.p ? (
          <>
            <span style={{ display: 'block', fontSize: d.name, fontWeight: content.won ? 700 : 500, color: c.cardText, whiteSpace: 'nowrap' }}>{nameOf(content.p)}</span>
            <span style={{ display: 'block', fontSize: d.club, color: c.cardMuted, whiteSpace: 'nowrap' }}>{clubOf(content.p)}</span>
          </>
        ) : (
          <span style={{ fontSize: d.club + 0.5, fontStyle: 'italic', color: c.cardMuted, whiteSpace: 'nowrap' }}>{content.label || ''}</span>
        )}
      </span>
      {content.score !== '' && content.score != null && <span style={{ fontSize: d.name, fontWeight: 700, color: c.cardText }}>{content.score}</span>}
    </div>
  );
  const sideSlot = (b: Bout | undefined, src: SideSource, s: 'aka' | 'ao') => {
    const p = src.kind === 'athlete' ? find(src.id) : undefined;
    const won = !!b?.winnerId && src.kind === 'athlete' && b.winnerId === src.id;
    const score = b && b.status !== 'scheduled' ? (s === 'aka' ? b.akaScore : b.aoScore) : '';
    // AKA: red frame; AO: white inside, gray edges
    return slot({ p, won, score, label: src.kind === 'winner' ? winnerLabel(src.boutNumber) : '' }, s === 'aka' ? c.aka : c.ao, s, s === 'ao' ? { marginTop: d.pair } : undefined, s === 'aka' ? c.bg : c.aoBg, s === 'aka' ? c.aka : undefined);
  };
  const card = (b: Bout | undefined, aka: SideSource, ao: SideSource, style: React.CSSProperties, key: string) => (
    <div key={key} style={{ position: 'absolute', width: cardW, height: CARD_H, boxSizing: 'border-box', outline: b?.status === 'in_progress' ? `2px solid ${c.aka}` : undefined, outlineOffset: 2, ...style }}>
      <div style={{ height: d.head, fontSize: d.club - 0.5, color: c.muted, padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', lineHeight: 1 }}>
        <span>#{b?.boutNumber}{b?.scheduledTime ? ` · ${b.scheduledTime}` : ''}</span>
        {b?.status === 'in_progress' && <span style={{ color: c.aka, fontWeight: 700 }}>LIVE</span>}
      </div>
      {sideSlot(b, aka, 'aka')}
      {sideSlot(b, ao, 'ao')}
    </div>
  );

  // ---------- places ----------
  const st = computeStandings(bouts, categoryId);
  const semiCount = cat.filter((b) => b.roundStage === 'semi_final').length;
  const oneBronze = thirdPlace === 'bronze_match' || !!bronzeBout;
  // Karate gives two 3rd places (SKIF / WKF); with a bout for 3rd place its loser is 4th
  const places: { place: string; id?: string }[] = [
    { place: '1', id: st.gold },
    { place: '2', id: st.silver },
    ...(semiCount === 0 ? [] : oneBronze ? [{ place: '3', id: st.bronze[0] }, ...(semiCount === 2 ? [{ place: '4', id: st.fourth }] : [])] : semiCount === 1 ? [{ place: '3', id: st.bronze[0] }] : [{ place: '3', id: st.bronze[0] }, { place: '3', id: st.bronze[1] }])
  ];
  // Numbered list in a frame, like Uventex
  const resultsBox = (style: React.CSSProperties) => (
    <div style={{ position: 'absolute', width: RESULTS_W - 14, border: `1.5px solid ${c.border}`, background: c.bg, fontSize: d.name - 0.5, ...style }}>
      {places.map((pl, i) => {
        const p = find(pl.id);
        return (
          <div key={i} style={{ display: 'flex', gap: 6, padding: '4px 6px', minHeight: 26, boxSizing: 'border-box', borderTop: i ? `1.5px solid ${c.border}` : undefined, alignItems: 'center' }}>
            <span style={{ fontSize: d.club, color: c.cardText, width: 14 }}>{pl.place}.</span>
            <span style={{ flex: 1, lineHeight: 1.15, color: c.cardText }}>
              {p && (
                <>
                  <span style={{ display: 'block', fontWeight: 600 }}>{nameOf(p)}</span>
                  <span style={{ display: 'block', fontSize: d.club, color: c.cardMuted }}>{clubOf(p)}</span>
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
  const panel = (cols: Col[], opts: { title?: string; key: string; withFinalExtras: boolean }) => {
    const first = Math.max(cols[0].slots.length, opts.withFinalExtras && cols.length === 1 ? 2 : 1);
    const height = d.title + Math.max(first, opts.withFinalExtras ? 4 : 1) * UNIT;
    const x = (r: number) => r * (cardW + d.gapX);
    const top = (r: number, local: number) => d.title + ((local - 0.5) * first * UNIT) / Math.max(cols[r].slots.length, 1) - CARD_H / 2;
    const akaMid = (r: number, local: number) => top(r, local) + d.head + d.row / 2;
    const aoMid = (r: number, local: number) => top(r, local) + d.head + d.row * 1.5 + d.pair;
    const lines: string[] = [];
    // Uventex connector: a short bar joining the pair on its right, then a line to the slot it feeds
    const join = (x1: number, ya: number, yb: number, y2: number, x2: number) => {
      const xm = x1 + 8;
      lines.push(`M${x1} ${ya} H${xm} M${x1} ${yb} H${xm} M${xm} ${ya} V${yb}`);
      const ym = (ya + yb) / 2;
      const xe = x1 + d.gapX / 2;
      lines.push(`M${xm} ${ym} H${xe} V${y2} H${x2}`);
    };
    cols.forEach((col, r) => {
      if (r === cols.length - 1) return;
      for (const s of col.slots) {
        if (!s.bout) continue;
        const to = feedsInto(s.local);
        join(x(r) + cardW, akaMid(r, s.local), aoMid(r, s.local), to.side === 'aka' ? akaMid(r + 1, to.pos) : aoMid(r + 1, to.pos), x(r + 1));
      }
    });
    const lastC = cols.length - 1;
    const finalSlot = cols[lastC].slots[0];
    // The winner of the final: a black slot to the right of the final
    const champX = x(lastC + 1);
    const champY = (akaMid(lastC, 1) + aoMid(lastC, 1)) / 2 - d.row / 2;
    if (opts.withFinalExtras && finalSlot?.bout) join(x(lastC) + cardW, akaMid(lastC, 1), aoMid(lastC, 1), champY + d.row / 2, champX);
    const finalBottom = top(lastC, 1) + CARD_H;
    const extrasTop = finalBottom + 22;
    const width = cols.length * (cardW + d.gapX) + (opts.withFinalExtras ? cardW + d.gapX + RESULTS_W : 0);
    const resultsTop = d.title;
    const fullH = Math.max(height, opts.withFinalExtras ? resultsTop + places.length * 30 + 10 : 0, bronzeBout && opts.withFinalExtras ? extrasTop + 16 + CARD_H + 6 : 0);
    const champ = find(st.gold);
    return (
      <div key={opts.key} className="bracket-panel" style={{ marginTop: opts.title ? 6 : 0 }}>
        {opts.title && <div style={{ fontSize: d.name + 2, fontWeight: 800, margin: '2px 0 6px', color: c.text }}>{opts.title}</div>}
        <div style={{ position: 'relative', width, height: fullH }}>
          {cols.map((col, r) => (
            <div key={col.stage} style={{ position: 'absolute', left: x(r), top: 0, width: cardW, fontSize: d.club + 1, fontWeight: 700, color: c.text }}>{col.stage}</div>
          ))}
          <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden>
            {lines.map((p, i) => (
              <path key={i} d={p} fill="none" stroke={c.line} strokeWidth={1} />
            ))}
          </svg>
          {cols.flatMap((col, r) =>
            col.slots.filter((s) => s.bout).map((s) => card(s.bout, s.aka, s.ao, { left: x(r), top: top(r, s.local) }, `${opts.key}-${r}-${s.pos}`))
          )}
          {opts.withFinalExtras && finalSlot?.bout && (
            <div style={{ position: 'absolute', left: champX, top: champY, width: cardW }}>
              {slot({ p: champ, won: true, label: '' }, c.winner, 'champ', { borderWidth: 2, borderLeftWidth: 2 })}
            </div>
          )}
          {opts.withFinalExtras && bronzeBout && (
            <>
              <div style={{ position: 'absolute', left: x(lastC), top: extrasTop, fontSize: d.club + 1, fontWeight: 700, color: c.text }}>{stageLabel('bronze_match', lang)}</div>
              {card(bronzeBout, athlete(bronzeBout.akaParticipantId), athlete(bronzeBout.aoParticipantId), { left: x(lastC), top: extrasTop + 16 }, 'bronze')}
            </>
          )}
          {opts.withFinalExtras && resultsBox({ left: champX + cardW + d.gapX, top: resultsTop })}
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

  const cell: React.CSSProperties = { padding: '4px 6px', fontSize: d.name, color: c.text, whiteSpace: 'nowrap' };
  const bold = (t: string) => <b style={{ fontWeight: 700 }}>{t}: </b>;
  const referees = [tr(lang, 'Судья #1', 'Калыс #1', 'Judge #1'), tr(lang, 'Судья #2', 'Калыс #2', 'Judge #2'), tr(lang, 'Главный судья', 'Башкы калыс', 'Referee'), tr(lang, 'Судья #4', 'Калыс #4', 'Judge #4'), tr(lang, 'Судья #5', 'Калыс #5', 'Judge #5')];

  return (
    // inline-block: the header takes the width of the drawing (a split bracket stays a block so its pages can break)
    <div className="bracket-tree" style={{ color: c.text, ...(isSplit(layout.firstCount) ? {} : { display: 'inline-block', minWidth: '100%', verticalAlign: 'top' }) }}>
      {info && (
        <div style={{ marginBottom: 12 }}>
          {print && (info.eventTitle || info.city) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{info.eventTitle}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{info.city}</div>
            </div>
          )}
          {/* Header table like Uventex: category | tatami / code | № | date | time */}
          <div style={{ border: `1.5px solid ${c.border}`, background: c.band }}>
            <div style={{ display: 'flex', borderBottom: `1.5px solid ${c.border}` }}>
              <div style={{ ...cell, flex: 1, whiteSpace: 'normal' }}>{bold(tr(lang, 'Категория', 'Категория', 'Category'))}{info.discipline} · {info.category}</div>
              <div style={{ ...cell, width: 170, borderLeft: `1.5px solid ${c.border}` }}>{bold(tr(lang, 'Татами', 'Татами', 'Tatami'))}{info.tatami != null ? `${tr(lang, 'Татами', 'Татами', 'Tatami')} #${info.tatami}` : '—'}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div style={{ ...cell, width: 190 }}>{bold(tr(lang, 'Код', 'Код', 'Code'))}{info.code}</div>
              <div style={{ ...cell, flex: 1 }}>{bold('№')}{info.protocol ?? '—'}</div>
              <div style={{ ...cell, width: 170 }}>{bold(tr(lang, 'Дата', 'Күнү', 'Date'))}{info.date || '—'}</div>
              <div style={{ ...cell, width: 170, borderLeft: `1.5px solid ${c.border}` }}>{bold(tr(lang, 'Время', 'Убакыт', 'Time'))}{info.time || '—'}</div>
            </div>
          </div>
          {/* Five referee signatures (print) */}
          {print && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', columnGap: 22, margin: '6px 0 14px' }}>
              {referees.map((r) => (
                <div key={r} style={{ minWidth: 0 }}>
                  {/* Space for a handwritten signature, then the line across the column */}
                  <div style={{ height: 40, borderBottom: '1.5px solid #6b7280' }} />
                  <div style={{ paddingTop: 4, fontSize: 11, color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {panels}
      {repechage.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: d.club + 1, fontWeight: 700, color: c.text, marginBottom: 4 }}>{tr(lang, 'Утешительные бои за 3-е место', '3-орун үчүн утешителдик беттештер', 'Repechage for bronze')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {repechage.map((rb) => card(rb, athlete(rb.akaParticipantId), athlete(rb.aoParticipantId), { position: 'relative' }, rb.id))}
          </div>
        </div>
      )}
      {/* Chief referee and chief secretary, like the bottom right corner of Uventex */}
      {print && info && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginTop: 16, fontSize: 13 }}>
          {[
            [tr(lang, 'Главный судья', 'Башкы калыс', 'Chief referee'), info.chiefReferee],
            [tr(lang, 'Главный секретарь', 'Башкы катчы', 'Chief secretary'), info.chiefSecretary]
          ].map(([label, who]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 8, width: 520 }}>
              <b style={{ whiteSpace: 'nowrap' }}>{label}:</b>
              <span style={{ flex: 1, borderBottom: '1.5px solid #9aa3ad', fontSize: 12, paddingBottom: 1 }}>{who || ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
