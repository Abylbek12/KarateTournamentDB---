// Turns the organizer's free-text tournament description into readable blocks:
// paragraphs (split on line breaks, long ones split by sentences) and bullet lists.

export type DescriptionBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] };

const BULLET = /^\s*(?:[-–—•*·▪●]|\d{1,2}[.)])\s+/;
// Sentence end followed by a capital letter, digit or opening quote (Cyrillic incl. Kyrgyz letters).
const SENTENCE_BREAK = /(?<=[.!?…])\s+(?=[A-ZА-ЯЁӨҮҢ0-9«"„(])/u;

/** Longest paragraph we keep whole; longer ones are split into sentence groups. */
export const MAX_PARAGRAPH = 360;

function splitLongParagraph(text: string): string[] {
  if (text.length <= MAX_PARAGRAPH) return [text];
  const sentences = text.split(SENTENCE_BREAK).filter(Boolean);
  if (sentences.length < 2) return [text];
  const out: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current && current.length + 1 + s.length > MAX_PARAGRAPH * 0.75) {
      out.push(current);
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current) out.push(current);
  return out;
}

export function splitDescription(raw: string | undefined | null): DescriptionBlock[] {
  const text = String(raw || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];
  const blocks: DescriptionBlock[] = [];
  for (const line of text.split('\n')) {
    const clean = line.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    if (BULLET.test(line)) {
      const item = clean.replace(BULLET, '').trim();
      if (!item) continue;
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'list') last.items.push(item);
      else blocks.push({ type: 'list', items: [item] });
      continue;
    }
    for (const part of splitLongParagraph(clean)) blocks.push({ type: 'p', text: part });
  }
  return blocks;
}

/** First paragraph only, for short previews (the hero card). */
export function descriptionLead(raw: string | undefined | null): string {
  const first = splitDescription(raw).find((b) => b.type === 'p');
  return first && first.type === 'p' ? first.text : '';
}
