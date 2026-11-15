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
  Medal, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Filter, 
  User, 
  Clock,
  Sparkles
} from 'lucide-react';
import { UventexEventItem, EventActionType } from '../data/uventexEventsData';
import { useApp } from '../context/AppContext';
import { localizeUventexEventItem } from '../utils/globalDomTranslator';

interface TournamentEventResultsViewProps {
  tournament: UventexEventItem;
  onBack: () => void;
  onNavigateAction: (action: EventActionType) => void;
}

interface MatchResult {
  id: string;
  category: string;
  round: string;
  akaName: string;
  akaClub: string;
  akaCountry: string;
  akaScore: number;
  akaSenshu: boolean;
  aoName: string;
  aoClub: string;
  aoCountry: string;
  aoScore: number;
  aoSenshu: boolean;
  winner: 'aka' | 'ao';
  winReason: string;
  duration: string;
}

interface PodiumWinner {
  place: '1st' | '2nd' | '3rd_1' | '3rd_2';
  name: string;
  club: string;
  country: string;
  flag: string;
  belt: string;
  points: number;
}

export const TournamentEventResultsView: React.FC<TournamentEventResultsViewProps> = ({
  tournament: rawTournament,
  onBack,
  onNavigateAction
}) => {
  const { language } = useApp();
  const tournament = localizeUventexEventItem(rawTournament, language);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'podiums'>('podiums');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: language !== 'en' ? 'Все категории' : 'All Categories' },
    { id: 'kumite_m_75', label: 'Мужчины 18+ Кумитэ -75 кг' },
    { id: 'kumite_f_61', label: 'Женщины 18+ Кумитэ -61 кг' },
    { id: 'kata_male', label: 'Мужчины Ката Индивидуальное' },
    { id: 'kata_female', label: 'Женщины Ката Индивидуальное' },
    { id: 'cadet_m_63', label: 'Кадеты 14-15 лет Кумитэ -63 кг' },
    { id: 'junior_m_68', label: 'Юниоры 16-17 лет Кумитэ -68 кг' }
  ];

  const podiumsData: Record<string, PodiumWinner[]> = {
    kumite_m_75: [
      { place: '1st', name: 'Абдыкадыров Адилет', club: 'СК "Тигр"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Черный пояс, 2 Дан', points: 30 },
      { place: '2nd', name: 'Орозбеков Бакыт', club: 'Клуб "Ала-Тоо"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Черный пояс, 1 Дан', points: 20 },
      { place: '3rd_1', name: 'Токтосунов Эмир', club: 'СК "Тигр"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Brown Belt 1 Kyu', points: 10 },
      { place: '3rd_2', name: 'Исаков Бектур', club: 'СК "Манас"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Black Belt 1 Dan', points: 10 }
    ],
    kumite_f_61: [
      { place: '1st', name: 'Жумабекова Айгерим', club: 'СК "Манас"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Черный пояс, 1 Дан', points: 30 },
      { place: '2nd', name: 'Мамытова Айзада', club: 'Клуб "Ала-Тоо"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Black Belt 2 Dan', points: 20 },
      { place: '3rd_1', name: 'Мамытова Анна', club: 'СК "Тянь-Шань"', country: 'Кыргызстан', flag: '🇰🇬', belt: '1 Кю', points: 10 },
      { place: '3rd_2', name: 'Касымова Айпери', club: 'Клуб "Барс"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Black Belt 1 Dan', points: 10 }
    ],
    kata_male: [
      { place: '1st', name: 'Сулайманов Нурсултан', club: 'СК "Тянь-Шань"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Черный пояс, 3 Дан', points: 30 },
      { place: '2nd', name: 'Раимов Тимур', club: 'Клуб "Баткен"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Black Belt 3 Dan', points: 20 },
      { place: '3rd_1', name: 'Иманалиев Дастан', club: 'Клуб "Барс"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Black Belt 1 Dan', points: 10 },
      { place: '3rd_2', name: 'Асанов Эмир', club: 'Клуб "Барс"', country: 'Кыргызстан', flag: '🇰🇬', belt: 'Черный пояс, 1 Дан', points: 10 }
    ]
  };

  const sampleMatches: MatchResult[] = [
    {
      id: 'm1',
      category: 'kumite_m_75',
      round: 'Финал за Золото',
      akaName: 'Абдыкадыров Адилет',
      akaClub: 'СК "Тигр"',
      akaCountry: 'Кыргызстан',
      akaScore: 4,
      akaSenshu: true,
      aoName: 'Орозбеков Бакыт',
      aoClub: 'Клуб "Ала-Тоо"',
      aoCountry: 'Кыргызстан',
      aoScore: 2,
      aoSenshu: false,
      winner: 'aka',
      winReason: 'По очкам (Сеншу)',
      duration: '03:00'
    },
    {
      id: 'm2',
      category: 'kumite_m_75',
      round: 'Бронзовый финал №1',
      akaName: 'Токтосунов Эмир',
      akaClub: 'СК "Тигр"',
      akaCountry: 'USA',
      akaScore: 8,
      akaSenshu: false,
      aoName: 'Жапаров Мирлан',
      aoClub: 'СК "Талас"',
      aoCountry: 'Hungary',
      aoScore: 0,
      aoSenshu: false,
      winner: 'aka',
      winReason: 'Отрыв 8 очков (Kiken/Mercy)',
      duration: '01:42'
    },
    {
      id: 'm3',
      category: 'kumite_m_75',
      round: 'Бронзовый финал №2',
      akaName: 'Исаков Бектур',
      akaClub: 'СК "Манас"',
      akaCountry: 'Italy',
      akaScore: 3,
      akaSenshu: true,
      aoName: 'Исаков Павел',
      aoClub: 'Клуб "Барс"',
      aoCountry: 'Кыргызстан',
      aoScore: 3,
      aoSenshu: false,
      winner: 'aka',
      winReason: 'Равный счет (Преимущество Сеншу)',
      duration: '03:00'
    },
    {
      id: 'm4',
      category: 'kumite_f_61',
      round: 'Финал за Золото',
      akaName: 'Жумабекова Айгерим',
      akaClub: 'СК "Манас"',
      akaCountry: 'Кыргызстан',
      akaScore: 5,
      akaSenshu: true,
      aoName: 'Мамытова Айзада',
      aoClub: 'Клуб "Ала-Тоо"',
      aoCountry: 'USA',
      aoScore: 1,
      aoSenshu: false,
      winner: 'aka',
      winReason: 'По очкам (5:1)',
      duration: '03:00'
    },
    {
      id: 'm5',
      category: 'kata_male',
      round: 'Медальный раунд Ката',
      akaName: 'Сулайманов Нурсултан',
      akaClub: 'СК "Тянь-Шань"',
      akaCountry: 'Кыргызстан',
      akaScore: 26.8,
      akaSenshu: false,
      aoName: 'Раимов Тимур',
      aoClub: 'Клуб "Баткен"',
      aoCountry: 'Japan',
      aoScore: 25.9,
      aoSenshu: false,
      winner: 'aka',
      winReason: 'Баллы Ката (26.8 vs 25.9)',
      duration: '02:15'
    }
  ];

  const filteredMatches = sampleMatches.filter((m) => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        m.akaName.toLowerCase().includes(q) ||
        m.aoName.toLowerCase().includes(q) ||
        m.akaClub.toLowerCase().includes(q) ||
        m.aoClub.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentPodiums = selectedCategory === 'all'
    ? Object.entries(podiumsData)
    : podiumsData[selectedCategory] ? [[selectedCategory, podiumsData[selectedCategory]]] : [];

  const handleExportResultsPdf = () => {
    setDownloadSuccessToast(language !== 'en' 
      ? `Официальный бюллетень результатов «${tournament.title}» успешно сгенерирован и загружен!` 
      : `Official Results Bulletin for "${tournament.title}" exported!`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

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
          <span className="text-slate-800 font-semibold">{language !== 'en' ? 'Результаты' : 'Results'}</span>
        </div>

        {/* Quick links to other action tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tournament.availableActions.includes('info') && (
            <button
              onClick={() => onNavigateAction('info')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {language !== 'en' ? 'Инфо' : 'Info'}
            </button>
          )}
          {tournament.availableActions.includes('brackets') && (
            <button
              onClick={() => onNavigateAction('brackets')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {language !== 'en' ? 'Сетки' : 'Brackets'}
            </button>
          )}
          {tournament.availableActions.includes('medals') && (
            <button
              onClick={() => onNavigateAction('medals')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {language !== 'en' ? 'Медали' : 'Medals'}
            </button>
          )}
          {tournament.availableActions.includes('live_scoring') && (
            <button
              onClick={() => onNavigateAction('live_scoring')}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer font-bold flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              <span>LIVE</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language !== 'en' ? 'Официальные результаты утверждены ГСК' : 'Certified Official Results'}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {tournament.dateLabel}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {tournament.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tournament.locationLabel || 'Международная арена боевых искусств'} · {tournament.organization || 'Федерация каратэ'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportResultsPdf}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{language !== 'en' ? 'Скачать протокол (PDF)' : 'Export Bulletin PDF'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Печать результатов"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Toast Notification */}
      {downloadSuccessToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Filter and Tab Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Subtabs: Пьедестал (Podiums) vs Поединки (Match Results) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('podiums')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'podiums'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{language !== 'en' ? 'Пьедестал и Медалисты' : 'Podiums & Finishers'}</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matches'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{language !== 'en' ? 'Счет поединков' : 'Bout Scores'}</span>
            </button>
          </div>

          {/* Search Athlete or Club */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language !== 'en' ? 'Поиск спортсмена или клуба...' : 'Search athlete or club...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Категория:</span>
          </span>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Podiums & Medallists */}
      {activeTab === 'podiums' && (
        <div className="space-y-6">
          {(currentPodiums as [string, PodiumWinner[]][]).map(([catKey, winners]) => {
            const catDef = categories.find((c) => c.id === catKey);
            return (
              <div key={catKey} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm tracking-wide">
                      {catDef?.label || catKey}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-mono">
                    Official Award Protocol
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {winners.map((w, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        w.place === '1st'
                          ? 'bg-amber-50/60 border-amber-300/80 shadow-xs ring-1 ring-amber-300/60'
                          : w.place === '2nd'
                          ? 'bg-slate-50 border-slate-300'
                          : 'bg-orange-50/40 border-amber-200/60'
                      }`}
                    >
                      <div>
                        {/* Place Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${
                              w.place === '1st'
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : w.place === '2nd'
                                ? 'bg-slate-300 text-slate-800'
                                : 'bg-orange-200 text-orange-950'
                            }`}
                          >
                            <span>{w.place === '1st' ? '🥇 1 МЕСТО' : w.place === '2nd' ? '🥈 2 МЕСТО' : '🥉 3 МЕСТО'}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-600">+{w.points} pts</span>
                        </div>

                        {/* Athlete Info */}
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {w.flag}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{w.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate">{w.belt}</p>
                          </div>
                        </div>
                      </div>

                      {/* Club affiliation */}
                      <div className="pt-2 border-t border-slate-200/80 mt-2 text-[11px] text-slate-600 flex items-center justify-between">
                        <span className="truncate font-semibold">{w.club}</span>
                        <span className="text-slate-400">{w.country}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Bout Match Scores */}
      {activeTab === 'matches' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{language !== 'en' ? 'Результаты проведённых поединков' : 'Completed Match Records'}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Поединков: <strong>{filteredMatches.length}</strong>
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredMatches.map((m) => (
              <div key={m.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Stage & Category */}
                <div className="w-48 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                    {m.round}
                  </span>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    {categories.find((c) => c.id === m.category)?.label || m.category}
                  </div>
                </div>

                {/* Match Bout: AKA vs AO */}
                <div className="flex-1 flex items-center justify-center gap-3 sm:gap-6 min-w-0">
                  {/* AKA (Red) */}
                  <div className={`flex-1 text-right min-w-0 ${m.winner === 'aka' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                    <div className="text-xs sm:text-sm truncate flex items-center justify-end gap-1.5">
                      {m.winner === 'aka' && <span className="text-amber-500 text-xs">👑</span>}
                      <span>{m.akaName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-bold">АКА</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{m.akaClub} ({m.akaCountry})</div>
                  </div>

                  {/* Score Block */}
                  <div className="px-4 py-2 rounded-xl bg-slate-900 text-white font-mono flex items-center gap-2 shadow-inner shrink-0">
                    <span className={`text-lg font-bold ${m.winner === 'aka' ? 'text-amber-400' : 'text-slate-300'}`}>
                      {m.akaScore}
                    </span>
                    <span className="text-slate-500 text-sm">:</span>
                    <span className={`text-lg font-bold ${m.winner === 'ao' ? 'text-amber-400' : 'text-slate-300'}`}>
                      {m.aoScore}
                    </span>
                  </div>

                  {/* AO (Blue) */}
                  <div className={`flex-1 text-left min-w-0 ${m.winner === 'ao' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                    <div className="text-xs sm:text-sm truncate flex items-center justify-start gap-1.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">АО</span>
                      <span>{m.aoName}</span>
                      {m.winner === 'ao' && <span className="text-amber-500 text-xs">👑</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{m.aoClub} ({m.aoCountry})</div>
                  </div>
                </div>

                {/* Outcome & Reason */}
                <div className="w-44 text-right shrink-0">
                  <div className="text-xs font-semibold text-emerald-600">
                    {m.winReason}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Время: {m.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
