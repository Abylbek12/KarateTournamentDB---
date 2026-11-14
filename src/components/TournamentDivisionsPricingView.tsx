import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  DollarSign, 
  Clock, 
  Filter, 
  Tag, 
  ShieldCheck, 
  ChevronRight,
  Layers,
  Award
} from 'lucide-react';
import { UventexEventItem, DivisionItem } from '../data/uventexEventsData';
import { useApp } from '../context/AppContext';
import { localizeUventexEventItem } from '../utils/globalDomTranslator';

interface TournamentDivisionsPricingViewProps {
  tournament: UventexEventItem;
  onBack: () => void;
  onNavigateAction: (action: string) => void;
}

export const TournamentDivisionsPricingView: React.FC<TournamentDivisionsPricingViewProps> = ({
  tournament: rawTournament,
  onBack,
  onNavigateAction
}) => {
  const { language } = useApp();
  const tournament = localizeUventexEventItem(rawTournament, language);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback division list
  const divisions: DivisionItem[] = tournament.divisions && tournament.divisions.length > 0
    ? tournament.divisions
    : [
        { id: 'd1', code: 'KO-10', name: 'Kobudo 6-7 yrs | Beginner | Female', categoryType: 'weapons', ageGroup: '6-7 yrs', beltRank: 'Beginner', gender: 'Female', price: 85, participantsCount: 2, scheduledTime: '09:30 am', ring: 'Saturday #1' },
        { id: 'd2', code: 'KA-16', name: 'Kata 6-7 yrs | Beginner | Female', categoryType: 'forms', ageGroup: '6-7 yrs', beltRank: 'Beginner', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '09:50 am', ring: 'Saturday #1' },
        { id: 'd3', code: 'SK-13', name: 'Sanbon Kumite 6-7 yrs | Beginner | Female', categoryType: 'sparring', ageGroup: '6-7 yrs', beltRank: 'Beginner', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '10:06 am', ring: 'Saturday #1' },
        { id: 'd4', code: 'KO-20', name: 'Kobudo 6-7 yrs | Novice | Female', categoryType: 'weapons', ageGroup: '6-7 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 2, scheduledTime: '10:24 am', ring: 'Saturday #1' },
        { id: 'd5', code: 'KA-26', name: 'Kata 6-7 yrs | Novice | Female', categoryType: 'forms', ageGroup: '6-7 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '10:32 am', ring: 'Saturday #1' },
        { id: 'd6', code: 'SK-23', name: 'Sanbon Kumite 6-7 yrs | Novice | Female', categoryType: 'sparring', ageGroup: '6-7 yrs', beltRank: 'Novice', gender: 'Female', price: 85, participantsCount: 4, scheduledTime: '10:48 am', ring: 'Saturday #1' },
        { id: 'd7', code: 'KO-51', name: 'Kobudo 14 yrs | Advance | Male', categoryType: 'weapons', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 6, scheduledTime: '09:50 am', ring: 'Saturday #2' },
        { id: 'd8', code: 'KA-51', name: 'Kata 14 yrs | Advance | Male', categoryType: 'forms', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 9, scheduledTime: '10:00 am', ring: 'Saturday #2' },
        { id: 'd9', code: 'SK-51', name: 'Sanbon Kumite 14 yrs | Advance | Male - Lightweight', categoryType: 'sparring', ageGroup: '14 yrs', beltRank: 'Advance', gender: 'Male', price: 95, participantsCount: 5, scheduledTime: '10:36 am', ring: 'Saturday #2' },
        { id: 'd10', code: 'EF-25', name: 'Экстремальные формы | 18+ | Черный пояс', categoryType: 'extreme', ageGroup: '18+ yrs', beltRank: 'Black Belt', gender: 'Male', price: 110, participantsCount: 8, scheduledTime: '01:30 pm', ring: 'Saturday #3' }
      ];

  // Price tiers matching the video
  const tiers = tournament.priceTiers && tournament.priceTiers.length > 0
    ? tournament.priceTiers
    : [
        { label: 'Стандартный период', dateRange: '01/01/2024 - 06/30/2024', fee: 85, isCurrent: false },
        { label: 'Текущий регистрационный период', dateRange: '07/01/2024 - 12/31/2026', fee: 95, isCurrent: true }
      ];

  // Filtered divisions
  const filteredDivisions = divisions.filter((div) => {
    if (selectedCategoryType !== 'all' && div.categoryType !== selectedCategoryType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        div.code.toLowerCase().includes(q) ||
        div.name.toLowerCase().includes(q) ||
        div.ageGroup.toLowerCase().includes(q) ||
        div.beltRank.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
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
          <span className="text-slate-800 font-semibold">{language !== 'en' ? 'Категории и цены' : 'Categories & Pricing'}</span>
        </div>

        {/* Quick link to Brackets / Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateAction('info')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {language !== 'en' ? 'Информация' : 'Info'}
          </button>
          {tournament.availableActions.includes('brackets') && (
            <button
              onClick={() => onNavigateAction('brackets')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {language !== 'en' ? 'Сетки' : 'Brackets'}
            </button>
          )}
        </div>
      </div>

      {/* Date Tier Selection Pills (Shown at 00:32-00:36 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {language !== 'en' ? 'Категории и стоимость регистрации' : 'Divisions & Entry Pricing'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tournament.title} · {tournament.organization || 'AAU Karate'}
            </p>
          </div>

          {/* Pricing Tier Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {tiers.map((tier, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTierIndex(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  selectedTierIndex === idx
                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{tier.dateRange}</span>
                {tier.isCurrent && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-teal-800 text-[10px] text-teal-100">
                    {language !== 'en' ? 'Текущий' : 'Active'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Discipline Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedCategoryType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategoryType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language !== 'en' ? 'Все категории' : 'All Divisions'}
            </button>
            <button
              onClick={() => setSelectedCategoryType('forms')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategoryType === 'forms'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kata / Forms
            </button>
            <button
              onClick={() => setSelectedCategoryType('sparring')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategoryType === 'sparring'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kumite / Sparring
            </button>
            <button
              onClick={() => setSelectedCategoryType('weapons')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategoryType === 'weapons'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kobudo / Weapons
            </button>
            <button
              onClick={() => setSelectedCategoryType('extreme')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategoryType === 'extreme'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Extreme
            </button>
          </div>

          {/* Search by code/name */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language !== 'en' ? 'Поиск по коду или названию...' : 'Search code or name...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200"
            />
          </div>
        </div>
      </div>

      {/* Categories Table (As seen in Uventex) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">{language !== 'en' ? 'Код' : 'Code'}</th>
                <th className="py-3 px-4">{language !== 'en' ? 'Категория / Название' : 'Division Name'}</th>
                <th className="py-3 px-4">{language !== 'en' ? 'Возраст' : 'Age'}</th>
                <th className="py-3 px-4">{language !== 'en' ? 'Уровень' : 'Rank'}</th>
                <th className="py-3 px-4">{language !== 'en' ? 'Пол' : 'Gender'}</th>
                <th className="py-3 px-4">{language !== 'en' ? 'Площадка' : 'Ring'}</th>
                <th className="py-3 px-4 text-center">{language !== 'en' ? 'Атлеты' : 'Athletes'}</th>
                <th className="py-3 px-4 text-right">{language !== 'en' ? 'Стоимость' : 'Fee'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDivisions.map((div) => {
                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (div.categoryType === 'weapons') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                if (div.categoryType === 'forms') badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
                if (div.categoryType === 'sparring') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                if (div.categoryType === 'extreme') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <tr key={div.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {div.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{div.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded border text-[10px] ${badgeColor}`}>
                          {div.categoryType.toUpperCase()}
                        </span>
                        {div.scheduledTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {div.scheduledTime}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {div.ageGroup}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700">
                        {div.beltRank}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {div.gender === 'Female' ? 'Женский' : div.gender === 'Male' ? 'Мужской' : 'Смешанный'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {div.ring || 'Ring #1'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {div.participantsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-700 text-sm">
                      ${div.price}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDivisions.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            {language !== 'en' ? 'Категории по вашему фильтру не найдены.' : 'No divisions match your search query.'}
          </div>
        )}
      </div>
    </div>
  );
};
