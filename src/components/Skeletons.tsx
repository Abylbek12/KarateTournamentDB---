import React from 'react';
import { currentUiLang } from './ErrorBoundary';

// Grey «shapes» of the page shown while its data loads (instead of the text «Загрузка…»).
// The shimmer and colours are in index.css (.skeleton); with reduced motion it stays still.

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <span aria-hidden className={`skeleton block ${className}`} style={style} />
);

/** Wrapper: tells screen readers that the part is loading. */
const Busy: React.FC<{ label?: [string, string, string]; className?: string; children: React.ReactNode }> = ({ label, className = '', children }) => {
  const lang = currentUiLang();
  const [ru, ky, en] = label || ['Загрузка…', 'Жүктөлүүдө…', 'Loading…'];
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={`theme-keep animate-fadeIn ${className}`}>
      <span className="sr-only">{lang === 'ky' ? ky : lang === 'en' ? en : ru}</span>
      {children}
    </div>
  );
};

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] ${className}`}>{children}</div>
);

/** Tournament calendar: the nearest tournament + a grid of cards. */
export const TournamentListSkeleton: React.FC = () => (
  <Busy label={['Загружаем турниры…', 'Мелдештер жүктөлүүдө…', 'Loading tournaments…']} className="space-y-4 sm:space-y-6">
    <Card className="p-4 sm:p-7 flex flex-col md:flex-row gap-4 md:items-center">
      <Skeleton className="w-14 h-14 sm:w-24 sm:h-24 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-4/5 max-w-md" />
        <Skeleton className="h-4 w-3/5 max-w-sm" />
      </div>
      <div className="flex md:flex-col gap-2">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </Card>
    <div>
      <Skeleton className="h-3 w-24 mb-3" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  </Busy>
);

/** Header of a tournament page: emblem, title, tabs. */
export const EventHeaderSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 sm:gap-4">
      <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4 max-w-lg" />
        <Skeleton className="h-3.5 w-1/2 max-w-xs" />
      </div>
    </div>
    <div className="flex gap-3 border-b border-[var(--app-border)] pb-2 overflow-hidden">
      {[72, 88, 64, 96, 80, 60].map((w, i) => (
        <Skeleton key={i} className="h-5 shrink-0" style={{ width: w }} />
      ))}
    </div>
  </div>
);

/** A whole tournament page (the list of tournaments has not arrived yet). */
export const EventPageSkeleton: React.FC = () => (
  <Busy label={['Загружаем турнир…', 'Мелдеш жүктөлүүдө…', 'Loading the tournament…']} className="space-y-5 pb-8">
    <EventHeaderSkeleton />
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 space-y-3 lg:col-span-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-2/3" />
      </Card>
      <Card className="p-5 space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex justify-between gap-3">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3.5 w-1/4" />
          </div>
        ))}
      </Card>
    </div>
  </Busy>
);

/** Brackets: category chips and columns of bout frames. */
export const BracketSkeleton: React.FC = () => (
  <Busy label={['Загружаем сетки…', 'Торчолор жүктөлүүдө…', 'Loading brackets…']} className="space-y-4">
    <div className="flex gap-2 overflow-hidden">
      {[120, 150, 110, 140, 130].map((w, i) => (
        <Skeleton key={i} className="h-9 rounded-full shrink-0" style={{ width: w }} />
      ))}
    </div>
    <Card className="p-4 sm:p-6 overflow-hidden">
      <Skeleton className="h-5 w-56 mb-5" />
      <div className="flex gap-6 sm:gap-10">
        {[8, 4, 2, 1].map((n, col) => (
          <div key={col} className={`flex flex-col justify-around gap-3 shrink-0 w-32 sm:w-44 ${col > 1 ? 'hidden sm:flex' : ''}`} style={{ minHeight: 300 }}>
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  </Busy>
);

/** Table-like list: results, medals, participants, categories. */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number; label?: [string, string, string] }> = ({ rows = 6, cols = 4, label }) => (
  <Busy label={label} className="space-y-3">
    <Card className="overflow-hidden">
      <div className="flex gap-4 px-4 py-3 border-b border-[var(--app-border)] bg-[var(--app-surface-subtle)]">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className={`h-3 ${c === 0 ? 'w-1/3' : 'flex-1'}`} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5 border-b last:border-b-0 border-[var(--app-border)]">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? 'w-1/3' : 'flex-1'}`} style={{ opacity: 1 - r * 0.08 }} />
          ))}
        </div>
      ))}
    </Card>
  </Busy>
);

/** Cards of bouts / tatami («Идут бои», Live). */
export const CardsSkeleton: React.FC<{ count?: number; label?: [string, string, string] }> = ({ count = 4, label }) => (
  <Busy label={label} className="grid gap-3 sm:grid-cols-2">
    {Array.from({ length: count }, (_, i) => (
      <Card key={i} className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-3 w-1/3" />
      </Card>
    ))}
  </Busy>
);

/** Any screen that is still being downloaded (lazy loaded parts of the site). */
export const ScreenSkeleton: React.FC = () => (
  <Busy className="space-y-4 py-2">
    <Skeleton className="h-7 w-2/3 max-w-md" />
    <Skeleton className="h-4 w-1/2 max-w-sm" />
    <Card className="p-5 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </Card>
  </Busy>
);
