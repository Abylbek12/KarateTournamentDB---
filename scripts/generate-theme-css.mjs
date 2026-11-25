// Generates src/theme.generated.css — one consistent light/dark theme layer.
//
// Many screens were written for a dark background (bg-slate-900, text-white,
// pastel text-emerald-300 ...) and others for a light one (bg-white, text-slate-800).
// Instead of hand-editing ~1300 colour classes, this script scans every class
// actually used in src/ and emits rules that:
//   * Light theme: turn neutral dark surfaces into light ones, make white/pale
//     text dark, and deepen pastel coloured text so it is readable on white.
//   * Dark theme: the mirror image (light surfaces -> dark, dark text -> light,
//     deep coloured text -> lighter shade, light tinted cards -> dark tints).
// Text inside a strong coloured background (e.g. a red button, a yellow badge)
// is left alone. Add class "theme-keep" to opt a subtree out entirely.
//
// Run: npm run theme:css   (also runs automatically before dev/build)
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(SRC, 'theme.generated.css');

const NEUTRAL = ['slate', 'gray', 'zinc', 'neutral', 'stone'];
const COLORED = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

// ---------- collect class tokens ----------
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) files.push(p);
  }
})(SRC);

const tokens = new Set();
const tokenRe = /(?:hover:)?(?:bg|text|border|divide|from|via|to)-(?:\[#[0-9a-fA-F]{3,8}\]|[a-z]+(?:-\d{2,3})?)(?:\/\d{1,3})?/g;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(tokenRe)) {
    // token must be a whole class (preceded by start/space/quote/backtick)
    const before = text[m.index - 1];
    if (before && !/[\s"'`{]/.test(before)) continue;
    tokens.add(m[0]);
  }
}

// ---------- helpers ----------
const esc = (cls) => cls.replace(/([:/\[\]#.%])/g, '\\$1');

function parseToken(tok) {
  const hover = tok.startsWith('hover:');
  const body = hover ? tok.slice(6) : tok;
  const m = body.match(/^(bg|text|border|divide|from|via|to)-(.+?)(?:\/(\d{1,3}))?$/);
  if (!m) return null;
  const [, kind, value, opacity] = m;
  const op = opacity ? Number(opacity) : 100;
  if (value === 'white') return { tok, hover, kind, family: 'white', shade: 0, op };
  if (value === 'black') return { tok, hover, kind, family: 'black', shade: 1000, op };
  const hex = value.match(/^\[#([0-9a-fA-F]{3,8})\]$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    return { tok, hover, kind, family: 'hex', lum, sat, op };
  }
  const fm = value.match(/^([a-z]+)-(\d{2,3})$/);
  if (!fm) return null;
  const [, family, shade] = fm;
  if (!NEUTRAL.includes(family) && !COLORED.includes(family)) return null;
  return { tok, hover, kind, family, shade: Number(shade), op };
}

const parsed = [...tokens].map(parseToken).filter(Boolean);
const isNeutral = (t) => NEUTRAL.includes(t.family) || t.family === 'white' || t.family === 'black';
const isColored = (t) => COLORED.includes(t.family) || (t.family === 'hex' && t.sat > 0.25);

// Strong backgrounds whose text colour must NOT be touched.
// Light theme: saturated mid/dark colours (buttons, badges) + video/overlay blacks.
const strongDarkBg = parsed.filter((t) => !t.hover && (t.kind === 'bg' || t.kind === 'from') && t.op >= 60 && (
  (COLORED.includes(t.family) && t.shade >= 500 && t.shade <= 800) ||
  (t.family === 'hex' && t.sat > 0.25 && t.lum < 0.45)
));
// Dark theme: bright coloured fills (yellow/amber badges etc.) keep their dark text.
const strongLightBg = parsed.filter((t) => !t.hover && (t.kind === 'bg' || t.kind === 'from') && t.op >= 60 && (
  (COLORED.includes(t.family) && t.shade >= 300 && t.shade <= 500) ||
  (t.family === 'hex' && t.sat > 0.25 && t.lum >= 0.45)
));

const selList = (arr) => arr.map((t) => '.' + esc(t.tok)).join(', ');
const KEEP = '.theme-keep';
// Overlays on video / modal backdrops are positioned; leave them dark (and their text light).
const OVERLAY = '.fixed, .absolute';
const overlayBlacks = parsed
  .filter((t) => t.kind === 'bg' && !t.hover && t.op < 100 && (t.family === 'black' || (NEUTRAL.includes(t.family) && t.shade >= 900)))
  .map((t) => `:is(.absolute, .fixed).${esc(t.tok)}`);

// Brand-blue fills (buttons, active tabs) always keep their white text.
const ACCENT_FILLS = ['.bg-\\[var\\(--accent\\)\\]', '.bg-\\[var\\(--accent-strong\\)\\]'];
const LIGHT_TEXT_LIMIT = [KEEP, selList(strongDarkBg), ...ACCENT_FILLS, ...overlayBlacks].filter(Boolean).join(', ');
const DARK_TEXT_LIMIT = [KEEP, selList(strongLightBg)].filter(Boolean).join(', ');

// Each group is emitted inside @scope(root) to (limit): rules apply under the theme root
// but stop at the limit elements (opt-out subtrees and strong coloured backgrounds).
const groups = { lightSurface: [], lightText: [], darkSurface: [], darkText: [] };
const add = (group, t, decl, extra = '') => {
  groups[group].push(`.${esc(t.tok)}${t.hover ? ':hover' : ''}${extra} { ${decl} }`);
};
const notKeep = '';
const L = 'lightSurface';
const D = 'darkSurface';
const lightCtxExclusion = '';
const darkCtxExclusion = '';
const rules = { push: (r) => { throw new Error('use groups'); } };

for (const t of parsed) {
  const prop = { bg: 'background-color', text: 'color', border: 'border-color' }[t.kind];

  // ================= LIGHT THEME =================
  if (t.kind === 'bg' && isNeutral(t) && t.family !== 'white' && (t.shade >= 600)) {
    const isOverlay = t.op < 100 && (t.family === 'black' || t.shade >= 900);
    const v = t.shade >= 900 ? 'var(--app-surface)' : t.shade >= 800 ? 'var(--app-surface-subtle)' : 'var(--app-surface-muted)';
    add(L, t, `background-color: ${v};`, notKeep + (isOverlay ? `:not(${OVERLAY})` : ''));
  }
  if (t.kind === 'bg' && t.family === 'hex' && t.lum < 0.06 && t.sat <= 0.25) {
    add(L, t, 'background-color: var(--app-surface);', notKeep + `:not(${OVERLAY})`);
  }
  if (t.kind === 'bg' && COLORED.includes(t.family) && t.shade >= 900) {
    add(L, t, `background-color: color-mix(in oklab, var(--color-${t.family}-500) 10%, var(--app-surface));`, notKeep);
  }
  if ((t.kind === 'from' || t.kind === 'via' || t.kind === 'to') && isNeutral(t) && t.family !== 'white' && t.shade >= 700) {
    add(L, t, `--tw-gradient-${t.kind}: var(${t.shade >= 900 ? '--app-surface' : '--app-surface-subtle'});`, notKeep);
  }
  if ((t.kind === 'from' || t.kind === 'via' || t.kind === 'to') && COLORED.includes(t.family) && t.shade >= 900) {
    add(L, t, `--tw-gradient-${t.kind}: color-mix(in oklab, var(--color-${t.family}-500) 10%, var(--app-surface));`, notKeep);
  }
  // Mid grey (500) also becomes the theme's «muted» text: plain slate-500 is below WCAG AA on tinted cards
  if (t.kind === 'text' && (t.family === 'white' || (NEUTRAL.includes(t.family) && t.shade <= 500))) {
    const v = t.family === 'white' || t.shade <= 100 ? 'var(--app-text-primary)' : t.shade <= 300 ? 'var(--app-text-secondary)' : 'var(--app-text-muted)';
    add('lightText', t, `color: ${v};`);
  }
  if (t.kind === 'text' && t.family === 'hex' && t.lum > 0.6) {
    add('lightText', t, 'color: var(--app-text-primary);');
  }
  // Yellow-ish hues are too light on white even at 500/600.
  if (t.kind === 'text' && ['amber', 'yellow', 'lime'].includes(t.family) && (t.shade === 500 || t.shade === 600)) {
    add('lightText', t, `color: var(--color-${t.family}-700);`);
  }
  if (t.kind === 'text' && COLORED.includes(t.family) && t.shade <= 400) {
    add('lightText', t, `color: var(--color-${t.family}-700);`);
  }
  if ((t.kind === 'border' || t.kind === 'divide') && isNeutral(t) && t.family !== 'white' && t.shade >= 600) {
    const sel = t.kind === 'divide' ? ' > :not(:last-child)' : '';
    groups.lightSurface.push(`.${esc(t.tok)}${sel} { border-color: ${t.shade >= 700 ? 'var(--app-border)' : 'var(--app-border-strong)'}; }`);
  }
  if (t.kind === 'border' && COLORED.includes(t.family) && t.shade >= 800) {
    add(L, t, `border-color: var(--color-${t.family}-200);`, notKeep);
  }

  // ================= DARK THEME =================
  if (t.kind === 'bg' && (t.family === 'white' || (NEUTRAL.includes(t.family) && t.shade <= 300))) {
    const v = t.family === 'white' || t.shade <= 50 ? 'var(--app-surface)' : t.shade <= 100 ? 'var(--app-surface-subtle)' : 'var(--app-surface-muted)';
    add(D, t, `background-color: ${v};`, notKeep);
  }
  if (t.kind === 'bg' && t.family === 'hex' && t.lum > 0.7 && t.sat <= 0.25) {
    const isCanvas = /f0f2f5|f0f5f9|f2f5f9/i.test(t.tok);
    add(D, t, `background-color: var(${isCanvas ? '--app-bg' : '--app-surface'});`, notKeep);
  }
  if (t.kind === 'bg' && COLORED.includes(t.family) && t.shade <= 200) {
    const pct = t.shade <= 50 ? 10 : t.shade <= 100 ? 14 : 20;
    add(D, t, `background-color: color-mix(in oklab, var(--color-${t.family}-500) ${pct}%, var(--app-surface));`, notKeep);
  }
  if ((t.kind === 'from' || t.kind === 'via' || t.kind === 'to') && (t.family === 'white' || (NEUTRAL.includes(t.family) && t.shade <= 200))) {
    add(D, t, `--tw-gradient-${t.kind}: var(${t.family === 'white' || t.shade <= 50 ? '--app-surface' : '--app-surface-subtle'});`, notKeep);
  }
  if ((t.kind === 'from' || t.kind === 'via' || t.kind === 'to') && COLORED.includes(t.family) && t.shade <= 100) {
    add(D, t, `--tw-gradient-${t.kind}: color-mix(in oklab, var(--color-${t.family}-500) 12%, var(--app-surface));`, notKeep);
  }
  if (t.kind === 'text' && (t.family === 'black' || (NEUTRAL.includes(t.family) && t.shade >= 500))) {
    const v = t.family === 'black' || t.shade >= 800 ? 'var(--app-text-primary)' : t.shade >= 600 ? 'var(--app-text-secondary)' : 'var(--app-text-muted)';
    add('darkText', t, `color: ${v};`);
  }
  if (t.kind === 'text' && t.family === 'hex' && t.lum < 0.2) {
    add('darkText', t, 'color: var(--app-text-primary);');
  }
  if (t.kind === 'text' && COLORED.includes(t.family) && t.shade >= 600) {
    add('darkText', t, `color: var(--color-${t.family}-${t.shade >= 700 ? 300 : 400});`);
  }
  if ((t.kind === 'border' || t.kind === 'divide') && (t.family === 'white' || (NEUTRAL.includes(t.family) && t.shade <= 300))) {
    const sel = t.kind === 'divide' ? ' > :not(:last-child)' : '';
    groups.darkSurface.push(`.${esc(t.tok)}${sel} { border-color: var(--app-border); }`);
  }
  if (t.kind === 'border' && t.family === 'hex' && t.lum > 0.5 && t.sat <= 0.3) {
    add(D, t, 'border-color: var(--app-border);', notKeep);
  }
  if (t.kind === 'border' && COLORED.includes(t.family) && t.shade <= 200) {
    add(D, t, `border-color: color-mix(in oklab, var(--color-${t.family}-500) 35%, var(--app-surface));`, notKeep);
  }
}

// Hover rules must come after base rules so they win at equal specificity.
const hoverLast = (arr) => [...new Set(arr)].sort((a, b) => Number(a.includes(':hover')) - Number(b.includes(':hover')));
const block = (root, limit, arr) => `@scope (${root}) to (${limit}) {\n  ${hoverLast(arr).join('\n  ')}\n}\n`;
const total = Object.values(groups).reduce((n, g) => n + g.length, 0);
const css =
  block('html:not(.dark)', KEEP, groups.lightSurface) +
  block('html:not(.dark)', LIGHT_TEXT_LIMIT, groups.lightText) +
  block('html.dark', KEEP, groups.darkSurface) +
  block('html.dark', DARK_TEXT_LIMIT, groups.darkText);

const header = `/* AUTO-GENERATED by scripts/generate-theme-css.mjs — do not edit by hand.
   Regenerate with: npm run theme:css
   ${parsed.length} colour classes scanned, ${total} rules. */\n`;
fs.writeFileSync(OUT, header + css);
console.log(`[theme] src/theme.generated.css: ${total} rules from ${parsed.length} classes`);
