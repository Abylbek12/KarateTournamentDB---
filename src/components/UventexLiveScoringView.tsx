import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Play, 
  Settings2, 
  RotateCcw, 
  Tv, 
  Radio, 
  ShieldCheck, 
  Clock, 
  Maximize2,
  Minimize2,
  CheckSquare,
  Square
} from 'lucide-react';
import { UventexEventItem } from '../data/uventexEventsData';
import { useApp } from '../context/AppContext';

interface UventexLiveScoringViewProps {
  tournament: UventexEventItem;
  onBack: () => void;
  onNavigateAction?: (action: string) => void;
}

export const UventexLiveScoringView: React.FC<UventexLiveScoringViewProps> = ({
  tournament,
  onBack
}) => {
  const { language } = useApp();

  // Mode: 'setup' (screen at 00:48) or 'monitor' (screen at 01:13)
  const [viewMode, setViewMode] = useState<'setup' | 'monitor'>('setup');
  const [selectedDay, setSelectedDay] = useState<string>("Fri (pre's)");
  const [refreshDelaySeconds, setRefreshDelaySeconds] = useState<number>(5);
  const [selectedRings, setSelectedRings] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live timer for the 4-tatami monitor (ticking down from 06:30 matching video)
  const [monitorTimerSeconds, setMonitorTimerSeconds] = useState(390); // 06:30

  useEffect(() => {
    if (viewMode !== 'monitor') return;
    const interval = setInterval(() => {
      setMonitorTimerSeconds((prev) => (prev > 0 ? prev - 1 : 390));
    }, 1000);
    return () => clearInterval(interval);
  }, [viewMode]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleRing = (ringNum: number) => {
    setSelectedRings((prev) =>
      prev.includes(ringNum) ? prev.filter((r) => r !== ringNum) : [...prev, ringNum]
    );
  };

  const toggleSelectAllRings = () => {
    if (selectedRings.length === 6) {
      setSelectedRings([]);
    } else {
      setSelectedRings([1, 2, 3, 4, 5, 6]);
    }
  };

  const handleStartInNewTab = () => {
    // Open monitor mode in current window or new popup
    setViewMode('monitor');
  };

  // ========================================================
  // 1. ARENA 4-TATAMI LIVE MONITOR (SCREEN FROM 01:13)
  // ========================================================
  if (viewMode === 'monitor') {
    return (
      <div className={`fixed inset-0 z-50 bg-[#070b14] text-white flex flex-col font-sans select-none overflow-hidden ${isFullscreen ? 'p-2' : 'p-4'}`}>
        {/* Top Monitor Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('setup')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language !== 'en' ? 'Настройки табло' : 'Setup Panel'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-sm tracking-wide text-slate-100 font-mono uppercase">
                {tournament.title} · Live Arena Multi-Tatami
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              Автообновление: {refreshDelaySeconds}с
            </span>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title="Полноэкранный режим"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 4-Tatami Grid (Exact replica of video at 01:13) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 overflow-hidden">
          {/* Mat 1: ПТ / 1 */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 flex flex-col justify-between p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between">
              <div className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
                ПТ / 1
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                KO-10 Kobudo 6-7 yrs · Female
              </div>
            </div>

            <div className="text-center py-6 space-y-3">
              <div className="text-slate-400 text-sm font-medium tracking-wide">
                Конкуренция скоро начнётся.
              </div>
              <div className="text-5xl sm:text-6xl font-black font-mono text-yellow-400 tracking-wider drop-shadow-md">
                {formatTimer(monitorTimerSeconds)}
              </div>
            </div>

            {/* Competitors Strip */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase">AKA (Красный)</span>
                  <div className="text-xs font-bold text-white truncate">S. Robinson</div>
                </div>
                <div className="text-xl font-black font-mono text-rose-400">0</div>
              </div>
              <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase">AO (Синий)</span>
                  <div className="text-xs font-bold text-white truncate">C. Martinez</div>
                </div>
                <div className="text-xl font-black font-mono text-sky-400">0</div>
              </div>
            </div>
          </div>

          {/* Mat 2: ПТ / 2 */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 flex flex-col justify-between p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between">
              <div className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
                ПТ / 2
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                KO-51 Kobudo 14 yrs · Male
              </div>
            </div>

            <div className="text-center py-6 space-y-3">
              <div className="text-slate-400 text-sm font-medium tracking-wide">
                Конкуренция скоро начнётся.
              </div>
              <div className="text-5xl sm:text-6xl font-black font-mono text-yellow-400 tracking-wider drop-shadow-md">
                {formatTimer(monitorTimerSeconds)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase">AKA (Красный)</span>
                  <div className="text-xs font-bold text-white truncate">D. Walker</div>
                </div>
                <div className="text-xl font-black font-mono text-rose-400">0</div>
              </div>
              <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase">AO (Синий)</span>
                  <div className="text-xs font-bold text-white truncate">J. Bennett</div>
                </div>
                <div className="text-xl font-black font-mono text-sky-400">0</div>
              </div>
            </div>
          </div>

          {/* Mat 3: ПТ / 3 */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 flex flex-col justify-between p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between">
              <div className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
                ПТ / 3
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                EF-25 Extreme Forms 18+ · Black Belt
              </div>
            </div>

            <div className="text-center py-6 space-y-3">
              <div className="text-slate-400 text-sm font-medium tracking-wide">
                Конкуренция скоро начнётся.
              </div>
              <div className="text-5xl sm:text-6xl font-black font-mono text-yellow-400 tracking-wider drop-shadow-md">
                {formatTimer(monitorTimerSeconds)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase">AKA (Красный)</span>
                  <div className="text-xs font-bold text-white truncate">Т. Бакиров</div>
                </div>
                <div className="text-xl font-black font-mono text-rose-400">0</div>
              </div>
              <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase">AO (Синий)</span>
                  <div className="text-xs font-bold text-white truncate">R. Cooper</div>
                </div>
                <div className="text-xl font-black font-mono text-sky-400">0</div>
              </div>
            </div>
          </div>

          {/* Mat 4: ПТ / 4 */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 flex flex-col justify-between p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between">
              <div className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold text-xs border border-amber-500/30">
                ПТ / 4
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                HC-1 Para Divisions · Mixed
              </div>
            </div>

            <div className="text-center py-6 space-y-3">
              <div className="text-slate-400 text-sm font-medium tracking-wide">
                Конкуренция скоро начнётся.
              </div>
              <div className="text-5xl sm:text-6xl font-black font-mono text-yellow-400 tracking-wider drop-shadow-md">
                {formatTimer(monitorTimerSeconds)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase">AKA (Красный)</span>
                  <div className="text-xs font-bold text-white truncate">L. Young</div>
                </div>
                <div className="text-xl font-black font-mono text-rose-400">0</div>
              </div>
              <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase">AO (Синий)</span>
                  <div className="text-xs font-bold text-white truncate">E. Hughes</div>
                </div>
                <div className="text-xl font-black font-mono text-sky-400">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. LIVE SCORING SETUP PANEL (SCREEN FROM 00:48)
  // ========================================================
  return (
    <div className="space-y-4 animate-fadeIn font-sans pb-16 max-w-7xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language !== 'en' ? 'Главная' : 'Home'}</span>
          </button>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-md">{tournament.title}</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Live Scoring Setup</span>
        </div>

        <button
          onClick={() => setViewMode('monitor')}
          className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{language !== 'en' ? 'Открыть монитор' : 'Open Monitor'}</span>
        </button>
      </div>

      {/* Main Configuration Card (Matching screen at 00:48) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-600" />
            <span>Параметры трансляции Live Scoring</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Настройте отображение площадок и периодичность синхронизации для судейского табло
          </p>
        </div>

        {/* Days Selection Tabs matching video */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Выберите день соревнований
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {["Fri (pre's)", 'Fri premiere', 'Saturday'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedDay === day
                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh delay and rings count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Количество площадок (Rings count)
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={6}
              disabled
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Интервал автообновления (секунд)
            </label>
            <select
              value={refreshDelaySeconds}
              onChange={(e) => setRefreshDelaySeconds(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value={3}>3 секунды</option>
              <option value={5}>5 секунд (Рекомендуется)</option>
              <option value={10}>10 секунд</option>
              <option value={15}>15 секунд</option>
            </select>
          </div>
        </div>

        {/* Ring Checkboxes */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Выберите площадки для отображения
            </label>
            <button
              onClick={toggleSelectAllRings}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
            >
              {selectedRings.length === 6 ? 'Снять все' : 'Выбрать все'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const isChecked = selectedRings.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleRing(num)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-teal-50/70 border-teal-300 text-teal-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-mono">Ring {num}</span>
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Action Button "Start in new tab" matching video */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartInNewTab}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Start in new tab</span>
          </button>

          <button
            onClick={() => setViewMode('monitor')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Tv className="w-4 h-4" />
            <span>Открыть в этом окне</span>
          </button>
        </div>
      </div>
    </div>
  );
};
