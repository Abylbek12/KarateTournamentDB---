import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Clock, 
  Layers, 
  Award, 
  ChevronRight, 
  Users, 
  Trophy, 
  Maximize2, 
  X,
  Play
} from 'lucide-react';
import { UventexEventItem, DivisionItem, RingScheduleGroup } from '../data/uventexEventsData';
import { useApp } from '../context/AppContext';
import { localizeUventexEventItem } from '../utils/globalDomTranslator';

interface TournamentRingsBracketsViewProps {
  tournament: UventexEventItem;
  onBack: () => void;
  onNavigateAction: (action: string) => void;
  onOpenLiveScoreboard?: () => void;
}

export const TournamentRingsBracketsView: React.FC<TournamentRingsBracketsViewProps> = ({
  tournament: rawTournament,
  onBack,
  onNavigateAction,
  onOpenLiveScoreboard
}) => {
  const { language } = useApp();
  const tournament = localizeUventexEventItem(rawTournament, language);
  const [selectedDay, setSelectedDay] = useState<string>('Saturday');
  const [selectedRingFilter, setSelectedRingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDivisionBracket, setActiveDivisionBracket] = useState<DivisionItem | null>(null);

  // Fallback ring schedule matching the video
  const ringsSchedule: RingScheduleGroup[] = tournament.ringsSchedule && tournament.ringsSchedule.length > 0
    ? tournament.ringsSchedule
    : [
        {
          ringId: 'ring1',
          ringName: 'Saturday #1',
          day: 'Saturday',
          divisions: [
            { id: 'd1', code: 'KO-10', name: 'Kobudo 6-7 yrs | Beginner | Female', categoryType: 'weapons', ageGroup: '6-7 yrs', beltRank: 'Beginner', gender: 'Female', price: 85, participantsCount: 2, scheduledTime: '09:30 am', ring: 'Saturday #1' },
            { id: 'd2', code: 'KA-16', name: 'Kata 6-7 yrs | Beginner | Female', categoryType: 'forms', ageGroup: '6-7 yrs', beltRank: 'Beginner', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '09:50 am', ring: 'Saturday #1' },
            { id: 'd3', code: 'SK-13', name: 'Sanbon Kumite 6-7 yrs | Beginner | Female', categoryType: 'sparring', ageGroup: '6-7 yrs', beltRank: 'Beginner', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '10:06 am', ring: 'Saturday #1' },
            { id: 'd4', code: 'KO-20', name: 'Kobudo 6-7 yrs | Novice | Female', categoryType: 'weapons', ageGroup: '6-7 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 2, scheduledTime: '10:24 am', ring: 'Saturday #1' },
            { id: 'd5', code: 'KA-26', name: 'Kata 6-7 yrs | Novice | Female', categoryType: 'forms', ageGroup: '6-7 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '10:32 am', ring: 'Saturday #1' },
            { id: 'd6', code: 'SK-23', name: 'Sanbon Kumite 6-7 yrs | Novice | Female', categoryType: 'sparring', ageGroup: '6-7 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '10:48 am', ring: 'Saturday #1' },
            { id: 'd7', code: 'KO-11', name: 'Kobudo 8-9 yrs | Novice | Female', categoryType: 'weapons', ageGroup: '8-9 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 1, scheduledTime: '11:06 am', ring: 'Saturday #1' },
            { id: 'd8', code: 'KA-11', name: 'Kata 8-9 yrs | Novice | Female', categoryType: 'forms', ageGroup: '8-9 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 6, scheduledTime: '11:17 am', ring: 'Saturday #1' },
            { id: 'd9', code: 'KO-28', name: 'Kobudo 10-11 yrs | Novice | Female', categoryType: 'weapons', ageGroup: '10-11 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 3, scheduledTime: '11:37 am', ring: 'Saturday #1' }
          ]
        },
        {
          ringId: 'ring2',
          ringName: 'Saturday #2',
          day: 'Saturday',
          divisions: [
            { id: 'd10', code: 'KO-51', name: 'Kobudo 14 yrs | Advance | Male', categoryType: 'weapons', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 6, scheduledTime: '09:50 am', ring: 'Saturday #2' },
            { id: 'd11', code: 'KA-51', name: 'Kata 14 yrs | Advance | Male', categoryType: 'forms', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 9, scheduledTime: '10:00 am', ring: 'Saturday #2' },
            { id: 'd12', code: 'SK-51', name: 'Sanbon Kumite 14 yrs | Advance | Male - Lightweight', categoryType: 'sparring', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 5, scheduledTime: '10:36 am', ring: 'Saturday #2' },
            { id: 'd13', code: 'SK-52', name: 'Sanbon Kumite 14 yrs | Advance | Male - Heavyweight', categoryType: 'sparring', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 5, scheduledTime: '11:01 am', ring: 'Saturday #2' }
          ]
        },
        {
          ringId: 'ring3',
          ringName: 'Saturday #3',
          day: 'Saturday',
          divisions: [
            { id: 'd14', code: 'EF-25', name: 'Экстремальные формы | 18+ | Черный пояс | Мужчина', categoryType: 'extreme', ageGroup: '18+ yrs', beltRank: 'Black Belt', gender: 'Male', price: 110, participantsCount: 8, scheduledTime: '01:30 pm', ring: 'Saturday #3' }
          ]
        },
        {
          ringId: 'ring4',
          ringName: 'Saturday #4',
          day: 'Saturday',
          divisions: [
            { id: 'd15', code: 'HC-1', name: 'Инвалидность (Пара) | Все возрасты | Все звания', categoryType: 'para', ageGroup: 'All Ages', beltRank: 'All Ranks', gender: 'Mixed', price: 50, participantsCount: 5, scheduledTime: '02:00 pm', ring: 'Saturday #4' }
          ]
        }
      ];

  const ringNames = ringsSchedule.map((r) => r.ringName);

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
          <span className="text-slate-800 font-semibold">{language !== 'en' ? 'Сетки' : 'Brackets'}</span>
        </div>

        {/* Quick link to Live Scoring */}
        <div className="flex items-center gap-2">
          {tournament.availableActions.includes('live_scoring') && (
            <button
              onClick={() => onNavigateAction('live_scoring')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Scoring</span>
            </button>
          )}
          <button
            onClick={() => onNavigateAction('categories_prices')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {language !== 'en' ? 'Категории и цены' : 'Categories'}
          </button>
        </div>
      </div>

      {/* Filter and Ring Selection Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <span>{language !== 'en' ? 'Расписание площадок и турнирные сетки' : 'Rings Schedule & Brackets'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tournament.title} · Нажмите на любую категорию, чтобы открыть визуальное дерево плей-офф
            </p>
          </div>

          {/* Ring Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRingFilter}
              onChange={(e) => setSelectedRingFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-sky-400"
            >
              <option value="all">{language !== 'en' ? 'Все площадки (Rings)' : 'All Rings'}</option>
              {ringNames.map((rn) => (
                <option key={rn} value={rn}>{rn}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language !== 'en' ? 'Поиск сетки...' : 'Search bracket...'}
                className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 w-36 sm:w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule by Rings Groups (Matching screen at 01:40 in video) */}
      <div className="space-y-4">
        {ringsSchedule
          .filter((group) => selectedRingFilter === 'all' || group.ringName === selectedRingFilter)
          .map((group) => {
            const groupDivisions = group.divisions.filter((div) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase().trim();
              return (
                div.code.toLowerCase().includes(q) ||
                div.name.toLowerCase().includes(q) ||
                div.beltRank.toLowerCase().includes(q)
              );
            });

            if (groupDivisions.length === 0) return null;

            return (
              <div key={group.ringId} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Ring Header Bar */}
                <div className="bg-slate-100/80 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800 tracking-wide font-sans">
                      {group.ringName}
                    </h3>
                    <span className="text-xs text-slate-500">
                      ({groupDivisions.length} {language !== 'en' ? 'дивизионов' : 'divisions'})
                    </span>
                  </div>

                  <span className="text-xs font-mono font-medium text-slate-500">
                    {group.day}
                  </span>
                </div>

                {/* Division Rows List */}
                <div className="divide-y divide-slate-100">
                  {groupDivisions.map((div) => (
                    <div
                      key={div.id}
                      onClick={() => setActiveDivisionBracket(div)}
                      className="px-5 py-3.5 hover:bg-sky-50/40 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Division Code Badge */}
                        <div className="shrink-0 w-14 font-mono font-bold text-xs text-sky-700 bg-sky-50 border border-sky-100 py-1 rounded text-center">
                          {div.code}
                        </div>

                        {/* Title and Participants */}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {div.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                            <span>Уровень: <strong className="text-slate-600">{div.beltRank}</strong></span>
                            <span>•</span>
                            <span>Участников: <strong className="text-slate-700 font-mono">({div.participantsCount})</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Scheduled Time & Arrow */}
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{div.scheduledTime}</span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Interactive Playoff Bracket Tree Modal */}
      {activeDivisionBracket && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                    {activeDivisionBracket.code}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {activeDivisionBracket.name}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Площадка: {activeDivisionBracket.ring}</span>
                  <span>•</span>
                  <span>Время старта: {activeDivisionBracket.scheduledTime}</span>
                  <span>•</span>
                  <span>Участников: {activeDivisionBracket.participantsCount}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveDivisionBracket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bracket Visual Tree */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Олимпийская система плей-офф (Single Elimination)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Round 1: Quarterfinals */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-600 text-center uppercase tracking-wide">
                    1/4 Финала
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 border-b border-slate-100 pb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>A. Johnson (USA)</span>
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">3</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-600" />
                        <span>M. Smith (USA)</span>
                      </span>
                      <span className="font-mono font-bold">1</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 border-b border-slate-100 pb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>E. Davis (CAN)</span>
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">4</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-600" />
                        <span>L. Miller (USA)</span>
                      </span>
                      <span className="font-mono font-bold">0</span>
                    </div>
                  </div>
                </div>

                {/* Round 2: Semifinal */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-600 text-center uppercase tracking-wide">
                    Полуфинал
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border-2 border-sky-400 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>A. Johnson (USA)</span>
                      </span>
                      <span className="font-mono text-emerald-600 font-bold">2</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-600" />
                        <span>E. Davis (CAN)</span>
                      </span>
                      <span className="font-mono font-bold">1</span>
                    </div>
                  </div>
                </div>

                {/* Round 3: Final / Gold Medal */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-amber-600 text-center uppercase tracking-wide flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Золотой финал</span>
                  </div>

                  <div className="bg-gradient-to-b from-amber-50 to-white p-4 rounded-xl border-2 border-amber-400 shadow-md space-y-3">
                    <div className="flex items-center justify-between text-xs font-black text-slate-900 border-b border-amber-100 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span>🥇</span>
                        <span>A. Johnson (USA)</span>
                      </span>
                      <span className="font-mono text-amber-700 text-sm font-black">5</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span>🥈</span>
                        <span>K. Taylor (USA)</span>
                      </span>
                      <span className="font-mono font-bold">2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Статус дивизиона: <span className="font-bold text-emerald-600">Завершено</span>
              </span>
              <button
                onClick={() => setActiveDivisionBracket(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
