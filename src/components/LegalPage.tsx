// Page «Правовая информация»: privacy policy, terms of use, entry fees and refunds (#legal;doc=privacy|terms|payment).
import React from 'react';
import { Scale } from 'lucide-react';
import { LEGAL_TITLES, LEGAL_VERSION, legalSections, type LegalDocId } from '../data/legal';

type Lang = 'ru' | 'ky' | 'en';
const pick = (lang: Lang, t: [string, string, string]) => (lang === 'ky' ? t[1] : lang === 'en' ? t[2] : t[0]);
const DOCS: LegalDocId[] = ['privacy', 'terms', 'payment'];

/** Link to one document (opens the page; fine in a new tab too). */
export const legalHash = (doc: LegalDocId) => `#legal;doc=${doc}`;
const docFromHash = (hash: string): LegalDocId => {
  const d = hash.replace(/^#/, '').split(';').find((x) => x.startsWith('doc='))?.slice(4);
  return (DOCS as string[]).includes(d || '') ? (d as LegalDocId) : 'privacy';
};

export const LegalPage: React.FC<{ language: Lang }> = ({ language }) => {
  const [doc, setDoc] = React.useState<LegalDocId>(() => docFromHash(window.location.hash));
  React.useEffect(() => {
    const sync = () => setDoc(docFromHash(window.location.hash));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const open = (d: LegalDocId) => {
    setDoc(d);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${legalHash(d)}`);
  };
  const t = (ru: string, ky: string, en: string) => pick(language, [ru, ky, en]);
  return (
    <div className="theme-keep max-w-3xl mx-auto w-full space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Scale className="w-7 h-7 text-[var(--accent)]" />
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)]">{t('Правовая информация', 'Укуктук маалымат', 'Legal information')}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {DOCS.map((d) => (
          <a
            key={d}
            href={legalHash(d)}
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                open(d);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border ${
              doc === d ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)]'
            }`}
          >
            {pick(language, LEGAL_TITLES[d])}
          </a>
        ))}
      </div>
      <article className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-7 space-y-5">
        <header>
          <h2 className="text-xl font-bold text-[var(--app-text-primary)]">{pick(language, LEGAL_TITLES[doc])}</h2>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">{t('Редакция от', 'Редакция', 'Version of')} {LEGAL_VERSION}</p>
        </header>
        {legalSections(doc).map((s, i) => (
          <section key={i} className="space-y-2">
            <h3 className="font-semibold text-[var(--app-text-primary)]">{pick(language, s.h)}</h3>
            {s.p.map((para, j) => (
              <p key={j} className="text-sm leading-relaxed text-[var(--app-text-secondary)]">{pick(language, para)}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
};
