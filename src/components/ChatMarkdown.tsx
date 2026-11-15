import React from 'react';

/**
 * Small, safe Markdown renderer for chat answers (no HTML injection):
 * headings (#..####), **bold**, *italic*, `code`, bullet/numbered lists,
 * tables (| a | b |), horizontal rules and paragraphs.
 */

const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyPrefix}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k} className="font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`'))
      out.push(
        <code key={k} className="px-1 py-0.5 rounded bg-[var(--app-surface-muted)] text-[0.85em] font-mono">
          {tok.slice(1, -1)}
        </code>
      );
    else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

export const ChatMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Heading
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls = level <= 2 ? 'text-base font-semibold' : 'text-[15px] font-semibold';
      blocks.push(
        <div key={key++} className={`${cls} mt-1 mb-1.5 text-[var(--app-text-primary)]`}>
          {renderInline(h[2], `h${key}`)}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(<hr key={key++} className="my-2 border-[var(--app-border)]" />);
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={key++} className="my-2 overflow-x-auto rounded-lg border border-[var(--app-border)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--app-surface-muted)]">
              <tr>
                {header.map((c, j) => (
                  <th key={j} className="px-2.5 py-1.5 text-left font-semibold">
                    {renderInline(c, `th${key}-${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t border-[var(--app-border)]">
                  {r.map((c, j) => (
                    <td key={j} className="px-2.5 py-1.5 align-top">
                      {renderInline(c, `td${key}-${ri}-${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Lists (bullets or numbers, with simple nesting by indentation)
    if (/^\s*([*\-•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: { indent: number; content: string }[] = [];
      while (i < lines.length && /^\s*([*\-•]|\d+[.)])\s+/.test(lines[i])) {
        const indent = lines[i].match(/^\s*/)![0].length;
        items.push({ indent, content: lines[i].replace(/^\s*([*\-•]|\d+[.)])\s+/, '') });
        i++;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={key++} className={`my-1.5 space-y-1 ${ordered ? 'list-decimal' : 'list-disc'} pl-5 marker:text-[var(--app-text-muted)]`}>
          {items.map((it, j) => (
            <li key={j} style={{ marginLeft: it.indent > 1 ? 14 : 0 }} className="leading-relaxed">
              {renderInline(it.content, `li${key}-${j}`)}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Paragraph: merge consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^\s*([*\-•]|\d+[.)])\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('|')
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={key++} className="my-1.5 leading-relaxed">
        {para.map((l, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(l, `p${key}-${j}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{blocks}</div>;
};
