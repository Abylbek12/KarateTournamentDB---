// Layout of an elimination bracket (Uventex style): every round has all its slots, a slot whose first-round
// bout does not exist is a bye, and an empty side of a later bout shows where its athlete comes from
// («Победитель #111»). Pure functions, checked by scripts/test-bracket-layout.ts.
import type { Bout, RoundStage } from '../types/schema';
import { ELIMINATION_ORDER } from './bracketProgression';

export type SideSource = { kind: 'athlete'; id: string } | { kind: 'winner'; boutNumber: number } | { kind: 'empty' };

export interface LayoutSlot {
  /** 0 = first round shown */
  round: number;
  /** 1-based position inside the round (the same number as Bout.bracketPosition) */
  pos: number;
  bout?: Bout;
  aka: SideSource;
  ao: SideSource;
}

export interface BracketLayout {
  stages: RoundStage[];
  /** columns[r] has 2^(stages.length - 1 - r) slots */
  columns: LayoutSlot[][];
  /** number of slots in the first column */
  firstCount: number;
}

/** Builds all slots of the bracket of one category (only elimination rounds; repechage and bronze bouts are separate). */
export function bracketLayout(categoryBouts: Bout[]): BracketLayout {
  const present = ELIMINATION_ORDER.filter((s) => categoryBouts.some((b) => b.roundStage === s));
  if (present.length === 0) return { stages: [], columns: [], firstCount: 0 };
  // From the first round that has bouts up to the final, without gaps
  const first = ELIMINATION_ORDER.indexOf(present[0]);
  const stages = ELIMINATION_ORDER.slice(first);
  const n = stages.length;
  const at = (r: number, pos: number) => categoryBouts.find((b) => b.roundStage === stages[r] && b.bracketPosition === pos);
  const columns: LayoutSlot[][] = [];
  for (let r = 0; r < n; r++) {
    const count = 2 ** (n - 1 - r);
    const col: LayoutSlot[] = [];
    for (let pos = 1; pos <= count; pos++) {
      const bout = at(r, pos);
      const side = (s: 'aka' | 'ao'): SideSource => {
        const id = s === 'aka' ? bout?.akaParticipantId : bout?.aoParticipantId;
        if (id) return { kind: 'athlete', id };
        if (r === 0) return { kind: 'empty' };
        const feeder = at(r - 1, s === 'aka' ? pos * 2 - 1 : pos * 2);
        return feeder ? { kind: 'winner', boutNumber: feeder.boutNumber } : { kind: 'empty' };
      };
      col.push({ round: r, pos, bout, aka: side('aka'), ao: side('ao') });
    }
    columns.push(col);
  }
  return { stages, columns, firstCount: columns[0].length };
}

/** The slot of the next round a bout feeds, and on which side (odd position → upper / AKA). */
export const feedsInto = (pos: number): { pos: number; side: 'aka' | 'ao' } => ({ pos: Math.ceil(pos / 2), side: pos % 2 === 1 ? 'aka' : 'ao' });
