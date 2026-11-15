import React from 'react';

interface EventEmblemProps {
  type: string;
  imageUrl?: string;
  className?: string;
  /** Event title — its initials are drawn when there is no uploaded logo. */
  title?: string;
  /** Event accent colour for the generated emblem. */
  color?: string;
}

const initialsOf = (title?: string) => {
  if (!title) return 'KG';
  const words = title
    .replace(/[«»"()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^\d+$/.test(w) && !/^(по|среди|для|the|of|and)$/i.test(w));
  const letters = words.slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return letters || 'KG';
};

const yearOf = (title?: string) => title?.match(/20\d{2}/)?.[0];

/**
 * Event emblem: the organizer's uploaded logo if there is one,
 * otherwise a neutral generated badge (initials + year) in the event colour.
 */
export const UventexEventEmblem: React.FC<EventEmblemProps> = ({ type, imageUrl, className = 'w-16 h-16', title, color }) => {
  const isUploadedLogo = Boolean(imageUrl) && (type === 'custom_upload' || !imageUrl!.startsWith('/src/assets/images/'));

  if (isUploadedLogo && imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden`}>
        <img src={imageUrl} alt="Логотип турнира" className="w-full h-full object-cover" />
      </div>
    );
  }

  const bg = color || '#1f5fa8';
  const year = yearOf(title);
  return (
    <div
      className={`${className} theme-keep rounded-xl overflow-hidden flex flex-col items-center justify-center text-white shadow-xs select-none`}
      style={{ background: `linear-gradient(145deg, ${bg}, color-mix(in oklab, ${bg} 70%, black))` }}
      aria-hidden="true"
    >
      <span className="font-extrabold leading-none tracking-tight" style={{ fontSize: '1.9em' }}>
        {initialsOf(title)}
      </span>
      {year && (
        <span className="mt-1 text-[0.7em] font-semibold opacity-85 leading-none">{year}</span>
      )}
    </div>
  );
};
