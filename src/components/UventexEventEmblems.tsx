import React from 'react';

interface EventEmblemProps {
  type: string;
  imageUrl?: string;
  className?: string;
}

export const UventexEventEmblem: React.FC<EventEmblemProps> = ({ type, imageUrl, className = 'w-16 h-16' }) => {
  const isCustomUploadedImage =
    Boolean(imageUrl) &&
    (type === 'custom_upload' ||
      !imageUrl!.startsWith('/src/assets/images/'));

  if (isCustomUploadedImage && imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden`}>
        <img src={imageUrl} alt="Event emblem" className="w-full h-full object-cover" />
      </div>
    );
  }

  switch (type) {
    case 'pcl':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden`}>
          <svg viewBox="0 0 120 70" className="w-full h-full">
            {/* Green and dark diamond chevron */}
            <polygon points="5,35 25,10 40,25 25,50" fill="#0ca654" />
            <polygon points="25,50 40,25 55,40 40,65" fill="#087037" />
            <polygon points="22,35 32,22 42,35 32,48" fill="#ffffff" />
            {/* Text PREMIER CHAMPIONS LEAGUE */}
            <text x="48" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#111827" letterSpacing="0.5">PREMIER</text>
            <text x="48" y="38" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="9" fill="#0ca654" letterSpacing="1">CHAMPIONS</text>
            <text x="48" y="50" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7" fill="#4b5563" letterSpacing="2">LEAGUE</text>
          </svg>
        </div>
      );

    case 'ukraine_trident':
      return (
        <div className={`${className} flex items-center justify-center p-1.5 bg-[#0057b7] rounded-xl shadow-xs border border-blue-400 overflow-hidden`}>
          <svg viewBox="0 0 80 100" className="w-full h-full">
            {/* Ukrainian Trident (Tryzub) */}
            <path
              d="M40 8 L40 60 M25 20 C25 50 35 60 40 75 C45 60 55 50 55 20 M25 20 L25 35 C25 45 32 52 40 52 C48 52 55 45 55 35 L55 20 M40 8 L32 28 L40 38 L48 28 Z M40 75 L40 92 M30 92 L50 92"
              fill="none"
              stroke="#ffd700"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'lviv_lion':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-[#ffcc00] rounded-full shadow-xs border-2 border-amber-500 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#ffcc00" stroke="#000" strokeWidth="2" />
            {/* Crowned roaring lion profile */}
            <path
              d="M32 45 C32 30 45 28 55 32 C62 35 65 42 63 50 C61 58 55 64 50 72 C45 65 38 60 35 55 Z M50 24 L54 30 L58 24 L62 30 L66 24 L64 34 L48 34 Z"
              fill="#111827"
            />
            {/* Circular text */}
            <text x="50" y="16" fontFamily="sans-serif" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#000">LVIV KARATE OPEN</text>
            <text x="50" y="88" fontFamily="sans-serif" fontSize="7" fontWeight="900" textAnchor="middle" fill="#000">UKF Series A</text>
          </svg>
        </div>
      );

    case 'aau_karate':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-white rounded-full shadow-xs border-2 border-red-600 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="47" fill="#ffffff" stroke="#002868" strokeWidth="3" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#bf0a30" strokeWidth="2" strokeDasharray="3,2" />
            {/* AAU Letters */}
            <text x="50" y="44" fontFamily="Impact, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#002868" letterSpacing="1">AAU</text>
            <text x="50" y="58" fontFamily="sans-serif" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#bf0a30">USA</text>
            <text x="50" y="24" fontFamily="sans-serif" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="#002868">AMATEUR ATHLETIC UNION</text>
            <text x="50" y="78" fontFamily="sans-serif" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="#002868">NATIONAL KARATE PROGRAM</text>
          </svg>
        </div>
      );

    case 'studios_unis':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-[#facc15] rounded-full shadow-xs border-2 border-red-600 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#facc15" stroke="#dc2626" strokeWidth="4" />
            <path
              d="M30 52 C35 38 52 35 65 42 C72 48 70 62 60 70 C50 78 38 72 32 62 Z"
              fill="#dc2626"
            />
            {/* Martial artist karate kick silhouette */}
            <polygon points="50,38 58,45 48,55 62,52 68,40 72,42 66,60 52,65 44,52" fill="#facc15" />
            <text x="50" y="22" fontFamily="sans-serif" fontSize="5.5" fontWeight="bold" textAnchor="middle" fill="#000">STUDIOS UNIS</text>
            <text x="50" y="86" fontFamily="sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#000">D'AUTO-DEFENSE</text>
          </svg>
        </div>
      );

    case 'cma_black':
      return (
        <div className={`${className} flex items-center justify-center p-2 bg-slate-950 rounded-xl shadow-xs border border-slate-800 overflow-hidden`}>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[7px] tracking-widest text-red-500 font-extrabold uppercase leading-none">
              CHAMPIONSHIP
            </span>
            <span className="text-[6px] tracking-wider text-white font-bold uppercase mt-1 leading-none">
              MARTIAL ARTS
            </span>
            <div className="w-10 h-0.5 bg-red-600 mt-1 rounded-full" />
          </div>
        </div>
      );

    case 'triple_crown':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-amber-950/20 rounded-full shadow-xs border-2 border-amber-600 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#1e1810" stroke="#d97706" strokeWidth="3" />
            {/* Triple crowns */}
            <path d="M30 46 L35 38 L40 43 L45 34 L50 43 L55 38 L60 46 Z" fill="#d97706" />
            <text x="50" y="60" fontFamily="sans-serif" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#ffffff">TRIPLE CROWN</text>
            <text x="50" y="70" fontFamily="sans-serif" fontSize="5.5" fontWeight="semibold" textAnchor="middle" fill="#f59e0b">LOUISVILLE, KY</text>
          </svg>
        </div>
      );

    case 'bloodline':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-gradient-to-b from-slate-950 to-red-950 rounded-xl shadow-xs border border-red-900/60 overflow-hidden relative`}>
          <div className="text-center">
            <div className="text-[14px]">🥋👥</div>
            <div className="text-[8px] font-black text-red-500 tracking-wider uppercase font-mono mt-0.5">
              Bloodline
            </div>
            <div className="text-[6px] text-white/80 font-bold uppercase">Seminar</div>
          </div>
        </div>
      );

    case 'skw_west':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden`}>
          <svg viewBox="0 0 100 90" className="w-full h-full">
            <polygon points="50,5 92,75 8,75" fill="#ffffff" stroke="#1e3a8a" strokeWidth="5" />
            <polygon points="50,15 84,70 16,70" fill="#0f172a" />
            <text x="50" y="48" fontFamily="Impact, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#ef4444" letterSpacing="1">SKW</text>
            <text x="50" y="60" fontFamily="sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#ffffff">SPORT KARATE WEST</text>
          </svg>
        </div>
      );

    case 'tct_tour':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-slate-950 rounded-full shadow-xs border-2 border-slate-400 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4,2" />
            <text x="50" y="46" fontFamily="Impact, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#38bdf8">TCT</text>
            <text x="50" y="24" fontFamily="sans-serif" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="#ffffff">THE COMPETITOR'S TOUR</text>
            <text x="50" y="78" fontFamily="sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#ffffff">SPORTS MARTIAL ARTS</text>
          </svg>
        </div>
      );

    case 'kobudo_seal':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-[#3b124d] rounded-full shadow-xs border-2 border-amber-400 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#3b124d" stroke="#f59e0b" strokeWidth="3" />
            {/* Crossed sai/bo weapons & gold crest */}
            <line x1="25" y1="25" x2="75" y2="75" stroke="#f59e0b" strokeWidth="3" />
            <line x1="75" y1="25" x2="25" y2="75" stroke="#f59e0b" strokeWidth="3" />
            <circle cx="50" cy="50" r="18" fill="#1e0b27" stroke="#f59e0b" strokeWidth="2" />
            <text x="50" y="54" fontFamily="serif" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#f59e0b">古武道</text>
            <text x="50" y="88" fontFamily="sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#fef08a">WORLD KOBUDO</text>
          </svg>
        </div>
      );

    case 'best_of_best':
      return (
        <div className={`${className} flex items-center justify-center p-1.5 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden text-center`}>
          <div className="leading-tight">
            <span className="text-[6.5px] font-bold text-slate-500 uppercase tracking-wider block">BEST OF THE BEST</span>
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-tighter block font-mono">SPARRING</span>
            <span className="text-[6.5px] font-extrabold text-blue-600 uppercase tracking-widest block">CHAMPIONSHIP</span>
          </div>
        </div>
      );

    case 'dka_samurai':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-gradient-to-b from-stone-900 to-red-950 rounded-xl shadow-xs border border-red-700/60 overflow-hidden`}>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[6px] tracking-widest text-slate-300 uppercase font-mono">COMBAT SPORTS</span>
            <div className="text-[16px] my-0.5">👹</div>
            <span className="text-[9px] font-black text-red-400 font-mono tracking-wider">DKA</span>
          </div>
        </div>
      );

    case 'chernivtsi_seal':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-white rounded-full shadow-xs border-2 border-slate-900 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
            <text x="50" y="24" fontFamily="sans-serif" fontSize="5.5" fontWeight="bold" textAnchor="middle" fill="#0f172a">CHERNIVTSI OPEN</text>
            <text x="50" y="54" fontFamily="Impact, sans-serif" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#0f172a">ЧОРНІ ВІВЦІ</text>
            <text x="50" y="82" fontFamily="sans-serif" fontSize="5.5" fontWeight="bold" textAnchor="middle" fill="#0f172a">UKF PREMIER</text>
          </svg>
        </div>
      );

    case 'ktoc_nyc':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-white rounded-full shadow-xs border-2 border-slate-900 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#111827" strokeWidth="3" />
            <text x="50" y="25" fontFamily="Impact, sans-serif" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#111827">KTOC NATIONALS</text>
            <polygon points="50,34 58,48 44,55 64,52 68,40 50,68 38,52" fill="#111827" />
            <text x="50" y="84" fontFamily="sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#111827">NEW YORK CITY</text>
          </svg>
        </div>
      );

    case 'wukf_poland':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-amber-500 rounded-full shadow-xs border-2 border-red-700 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#f59e0b" stroke="#b91c1c" strokeWidth="4" />
            <circle cx="50" cy="50" r="34" fill="#1e1b4b" />
            <text x="50" y="55" fontFamily="Impact, sans-serif" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#fbbf24">WUKF</text>
            <text x="50" y="22" fontFamily="sans-serif" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="#ffffff">WORLD UNION OF KARATE</text>
            <text x="50" y="86" fontFamily="sans-serif" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="#ffffff">IKA POLAND</text>
          </svg>
        </div>
      );

    case 'uzb_karate':
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-white rounded-full shadow-xs border-2 border-blue-600 overflow-hidden`}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#1d4ed8" strokeWidth="3" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#22c55e" strokeWidth="2" />
            {/* Karate kick silhouette */}
            <path d="M42 42 L55 35 L62 44 L50 58 L58 72" stroke="#1d4ed8" strokeWidth="4" fill="none" strokeLinecap="round" />
            <text x="50" y="24" fontFamily="sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="#1d4ed8">UZBEKISTAN</text>
            <text x="50" y="86" fontFamily="sans-serif" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#1d4ed8">KARATE WKF ASSOCIATION</text>
          </svg>
        </div>
      );

    case 'modiin_open':
    default:
      return (
        <div className={`${className} flex items-center justify-center p-1 bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-400 rounded-xl shadow-xs overflow-hidden text-center`}>
          <div className="leading-tight text-white">
            <span className="text-[7px] font-extrabold uppercase tracking-widest block">SAVE</span>
            <span className="text-[9px] font-black uppercase tracking-tight block">MODIIN OPEN</span>
            <span className="text-[6px] font-medium block">ISRAEL</span>
          </div>
        </div>
      );
  }
};
