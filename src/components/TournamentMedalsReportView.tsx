import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Award, 
  Trophy, 
  ShieldCheck, 
  Building2, 
  Globe, 
  ChevronRight,
  Medal
} from 'lucide-react';
import { UventexEventItem, MedalReportRow } from '../data/uventexEventsData';
import { useApp } from '../context/AppContext';
import { localizeUventexEventItem } from '../utils/globalDomTranslator';

interface TournamentMedalsReportViewProps {
  tournament: UventexEventItem;
  onBack: () => void;
  onNavigateAction: (action: string) => void;
}

export const TournamentMedalsReportView: React.FC<TournamentMedalsReportViewProps> = ({
  tournament: rawTournament,
  onBack,
  onNavigateAction
}) => {
  const { language } = useApp();
  const tournament = localizeUventexEventItem(rawTournament, language);
  const [activeTab, setActiveTab] = useState<'club' | 'federation' | 'country'>('club');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback medals report
  const rawMedals: MedalReportRow[] = tournament.medalsReport && tournament.medalsReport.length > 0
    ? tournament.medalsReport
    : [
        { rank: 1, name: 'Tigers Karate Dojo (Hampton, VA)', type: 'club', gold: 12, silver: 8, bronze: 5, total: 25, points: 57 },
        { rank: 2, name: 'Boston Martial Arts Academy (MA)', type: 'club', gold: 9, silver: 11, bronze: 7, total: 27, points: 56 },
        { rank: 3, name: 'Orlando Champions Club (FL)', type: 'club', gold: 8, silver: 6, bronze: 9, total: 23, points: 45 },
        { rank: 4, name: 'Kyoto Shotokan Association (NY)', type: 'club', gold: 6, silver: 7, bronze: 8, total: 21, points: 40 },
        { rank: 5, name: 'Samurai Budo Center (TX)', type: 'club', gold: 5, silver: 4, bronze: 6, total: 15, points: 29 },
        { rank: 1, name: 'Amateur Athletic Union (AAU Karate)', type: 'federation', gold: 38, silver: 32, bronze: 28, total: 98, points: 206 },
        { rank: 2, name: 'United States Karate Federation', type: 'federation', gold: 24, silver: 22, bronze: 19, total: 65, points: 135 },
        { rank: 3, name: 'World Kobudo Federation', type: 'federation', gold: 16, silver: 14, bronze: 12, total: 42, points: 88 },
        { rank: 1, name: 'United States', type: 'country', gold: 46, silver: 40, bronze: 36, total: 122, points: 254 },
        { rank: 2, name: 'Canada', type: 'country', gold: 18, silver: 14, bronze: 12, total: 44, points: 94 },
        { rank: 3, name: 'Ukraine', type: 'country', gold: 14, silver: 10, bronze: 8, total: 32, points: 70 },
        { rank: 4, name: 'Italy', type: 'country', gold: 8, silver: 9, bronze: 7, total: 24, points: 49 },
        { rank: 5, name: 'Poland', type: 'country', gold: 6, silver: 7, bronze: 8, total: 21, points: 40 }
      ];

  const currentTabMedals = rawMedals
    .filter((row) => row.type === activeTab)
    .filter((row) => {
      if (!searchQuery.trim()) return true;
      return row.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

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
          <span className="text-slate-800 font-semibold">{language !== 'en' ? 'Медали' : 'Medal Report'}</span>
        </div>

        {/* Quick link to other actions */}
        <div className="flex items-center gap-2">
          {tournament.availableActions.includes('brackets') && (
            <button
              onClick={() => onNavigateAction('brackets')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {language !== 'en' ? 'Сетки' : 'Brackets'}
            </button>
          )}
          {tournament.availableActions.includes('live_scoring') && (
            <button
              onClick={() => onNavigateAction('live_scoring')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              Live Scoring
            </button>
          )}
        </div>
      </div>

      {/* Main Medal Header and Tabs (Matching video at 01:27) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{language !== 'en' ? 'Медальный зачёт и командные рейтинги' : 'Official Medals & Standings Report'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tournament.title} · Баллы начисляются: Золото (3 очка), Серебро (2 очка), Бронза (1 очко)
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language !== 'en' ? 'Поиск команды...' : 'Search team...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />
          </div>
        </div>

        {/* 3 Main Tabs: By Club / By Federation / By Country */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('club')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'club'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{language !== 'en' ? 'По клубам (By Club)' : 'By Club'}</span>
          </button>

          <button
            onClick={() => setActiveTab('federation')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'federation'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language !== 'en' ? 'По федерациям (By Federation)' : 'By Federation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('country')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'country'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language !== 'en' ? 'По странам (By Country)' : 'By Country'}</span>
          </button>
        </div>
      </div>

      {/* Medals Standings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16 text-center">{language !== 'en' ? 'Место' : 'Rank'}</th>
                <th className="py-3 px-4">{language !== 'en' ? 'Организация / Команда' : 'Team / Organization'}</th>
                <th className="py-3 px-4 text-center text-amber-600 font-bold">🥇 Золото</th>
                <th className="py-3 px-4 text-center text-slate-500 font-bold">🥈 Серебро</th>
                <th className="py-3 px-4 text-center text-amber-700 font-bold">🥉 Бронза</th>
                <th className="py-3 px-4 text-center font-bold text-slate-800">{language !== 'en' ? 'Всего медалей' : 'Total'}</th>
                <th className="py-3 px-4 text-right font-bold text-blue-700 pr-6">{language !== 'en' ? 'Баллы' : 'Points'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentTabMedals.map((row) => {
                const isPodium = row.rank <= 3;
                let rankBadge = `${row.rank}`;
                if (row.rank === 1) rankBadge = '🥇 1';
                if (row.rank === 2) rankBadge = '🥈 2';
                if (row.rank === 3) rankBadge = '🥉 3';

                return (
                  <tr
                    key={row.name}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      row.rank === 1 ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono text-sm">
                      {rankBadge}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      {activeTab === 'country' && <span>🌐</span>}
                      {activeTab === 'club' && <span>🥋</span>}
                      {activeTab === 'federation' && <span>🏛️</span>}
                      <span>{row.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-600 bg-amber-50/30">
                      {row.gold}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 bg-slate-50/40">
                      {row.silver}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-800 bg-orange-50/20">
                      {row.bronze}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                      {row.total}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-blue-700 text-sm pr-6">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentTabMedals.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            {language !== 'en' ? 'Результаты по вашему запросу не найдены.' : 'No medal data matches query.'}
          </div>
        )}
      </div>
    </div>
  );
};
