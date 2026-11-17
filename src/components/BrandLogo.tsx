import React from 'react';

/**
 * Apsatarov brand mark: a competition tatami seen from above —
 * blue fighting area inside a red safety zone, with the two start lines.
 */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="60" height="60" rx="14" fill="#d93d3d" />
    <rect x="10" y="10" width="44" height="44" rx="6" fill="#1f5fa8" />
    <rect x="23" y="27" width="3.5" height="10" rx="1.5" fill="#ffffff" />
    <rect x="37.5" y="27" width="3.5" height="10" rx="1.5" fill="#ffffff" />
  </svg>
);

/** Wordmark "Apsatarov"; the ".kg" part uses the red accent. */
export const BrandWordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-bold tracking-tight ${className}`}>
    Apsatarov
  </span>
);

/** Large stacked logo for the sign-in screen. */
export const BrandFullLogo: React.FC = () => (
  <div className="flex flex-col items-center justify-center select-none text-center">
    <BrandMark className="w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36 drop-shadow-sm" />
    <BrandWordmark className="text-3xl sm:text-4xl md:text-5xl mt-2 sm:mt-4 text-[#2b3442]" />
    <span className="mt-1 text-sm text-slate-500">Турниры по каратэ онлайн</span>
  </div>
);
