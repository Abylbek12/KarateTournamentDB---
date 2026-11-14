import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Users, 
  Building2, 
  Scale, 
  Award, 
  FileText, 
  CheckCircle2, 
  UserPlus, 
  ChevronRight, 
  Tv, 
  Trophy, 
  Info,
  Layers,
  Sparkles,
  MapPinned
} from 'lucide-react';
import { Tournament, TournamentCategory, Tatami } from '../types/schema';
import { useApp } from '../context/AppContext';

interface TournamentDetailsViewProps {
  tournament: Tournament;
  categories: TournamentCategory[];
  tatamis: Tatami[];
  onBackToTournaments: () => void;
  onStartRegistration: (tournament: Tournament) => void;
  onNavigateToScoreboard: () => void;
  onNavigateToBracket: () => void;
}

export const TournamentDetailsView: React.FC<TournamentDetailsViewProps> = ({
  tournament,
  categories,
  tatamis,
  onBackToTournaments,
  onStartRegistration,
  onNavigateToScoreboard,
  onNavigateToBracket
}) => {
  const { t, language, localizeTournament } = useApp();
  const [activeTab, setActiveTab] = useState<'schedule' | 'disciplines' | 'rules' | 'tatamis'>('schedule');

  // Reactively localize tournament content based on active language
  const localized = localizeTournament(tournament);

  const isWkf = localized.rulesType === 'wkf';
  const isSkif = localized.rulesType === 'skif';

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full min-w-0">
      
      {/* ========================================================
          TOP NAVIGATION BAR: BACK TO SHOWCASE
         ======================================================== */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToTournaments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-semibold transition-all cursor-pointer group shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('details.back')}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>ID:</span>
          <span className="font-bold text-slate-200 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {localized.id}
          </span>
        </div>
      </div>

      {/* ========================================================
          TOURNAMENT HERO HEADER WITH DEDICATED REGISTRATION CALL-TO-ACTION
         ======================================================== */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="p-6 sm:p-10 space-y-6 relative z-10">
          
          {/* Top Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('showcase.status.open')}
              </span>

              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${
                isWkf 
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80' 
                  : isSkif 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {language !== 'en' ? 'Регламент: ' : 'Rules: '}{localized.rulesType.toUpperCase()}
              </span>

              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                {localized.organization}
              </span>
            </div>

            {localized.registrationDeadline && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800/70">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('details.deadline')} <strong>{localized.registrationDeadline}</strong></span>
              </div>
            )}
          </div>

          {/* Tournament Title */}
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {localized.title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-4xl leading-relaxed">
              {localized.description}
            </p>
          </div>

          {/* Meta Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  {language !== 'en' ? 'Даты проведения' : 'Dates'}
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {new Date(localized.startDate).toLocaleDateString(language !== 'en' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' })} — {new Date(localized.endDate).toLocaleDateString(language !== 'en' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  {language !== 'en' ? 'Локация и арена' : 'Venue & Location'}
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block truncate">
                  {localized.city}, {localized.country}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {localized.venueName}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  {language !== 'en' ? 'Участники и клубы' : 'Athletes & Clubs'}
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {localized.athleteCount || 180} {t('showcase.athletes')} · {localized.clubCount || 16} {t('showcase.clubs')}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
              <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  {language !== 'en' ? 'Площадки' : 'Mats'}
                </span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {localized.tatamiCount || 4} {language !== 'en' ? 'боевых татами' : 'combat tatamis'}
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================
              CRITICAL: REGISTRATION BUTTON INSIDE SPECIFIC TOURNAMENT
             ======================================================== */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {language !== 'en' 
                    ? `Электронная регистрация спортсменов на «${localized.title}»` 
                    : `Online competitor registration for "${localized.title}"`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {language !== 'en' 
                    ? 'Многошаговая подача заявки: условия, конфиденциальность, cookies и личные данные' 
                    : 'Multi-step onboarding: waivers, privacy consent, cookies policy and personal profile'}
                </span>
              </div>
            </div>

            {/* THE PROMINENT REGISTRATION BUTTON INSIDE THIS TOURNAMENT */}
            <button
              onClick={() => onStartRegistration(localized)}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-black font-mono uppercase tracking-wider shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-400/60 active:scale-98 hover:scale-[1.02] transition-all cursor-pointer shrink-0 ring-4 ring-emerald-400/30"
            >
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
              <span>{t('details.register.btn')}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-200 border border-emerald-400/40 font-bold lowercase">
                {language !== 'en' ? '2 шага' : '2 steps'}
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
            </button>

          </div>

        </div>
      </div>

      {/* ========================================================
          INTERNAL TOURNAMENT TABS: SCHEDULE, DISCIPLINES, RULES, TATAMIS
         ======================================================== */}
      <div className="space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('details.tab.schedule')}</span>
          </button>

          <button
            onClick={() => setActiveTab('disciplines')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'disciplines'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{t('details.tab.disciplines')} ({localized.disciplines?.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('details.tab.rules')} ({localized.rulesType.toUpperCase()})</span>
          </button>

          <button
            onClick={() => setActiveTab('tatamis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tatamis'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('details.tab.tatamis')} ({tatamis.length})</span>
          </button>
        </div>

        {/* TAB 1: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  {language !== 'en' ? 'Официальное расписание турнира' : 'Official Championship Schedule'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language !== 'en' 
                    ? 'Временной регламент проведения мандатной комиссии, открытия, предварительных боев и финалов:' 
                    : 'Timetable for credentials check, opening ceremony, elimination bouts and finals:'}
                </p>
              </div>

              <button
                onClick={onNavigateToScoreboard}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800"
              >
                <Tv className="w-4 h-4 text-sky-400" />
                <span>{language !== 'en' ? 'Открыть онлайн-табло' : 'Open Scoreboard'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {localized.scheduleSummary && localized.scheduleSummary.length > 0 ? (
                localized.scheduleSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-28 shrink-0 text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-900/60 text-center">
                        {item.time}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.stage}</p>
                      </div>
                    </div>

                    {item.tatamiNumber && (
                      <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 self-start sm:self-auto shrink-0">
                        {language !== 'en' ? `Ковер №${item.tatamiNumber}` : `Mat #${item.tatamiNumber}`}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4">
                  {language !== 'en' ? 'Расписание формируется судейской коллегией.' : 'Schedule is being prepared by officials.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DISCIPLINES */}
        {activeTab === 'disciplines' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {language !== 'en' ? 'Соревновательные дисциплины и дивизионы' : 'Competition Disciplines & Brackets'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language !== 'en' 
                  ? 'Перечень весовых и возрастных категорий, заявленных в регламенте турнира:' 
                  : 'Official weight and age categories registered in this tournament program:'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {localized.disciplines?.map((discipline, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{discipline}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language !== 'en' 
                        ? 'Олимпийская сетка плей-офф с разведением земляков и соклубников в R1 и R2.' 
                        : 'Olympic elimination bracket with automated club and hometown separation in R1 & R2.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {language !== 'en' 
                  ? <>Всего в базе данных настроено дивизионов: <strong>{categories.length}</strong></> 
                  : <>Total categories configured in database: <strong>{categories.length}</strong></>}
              </span>

              <button
                onClick={onNavigateToBracket}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{language !== 'en' ? 'Смотреть турнирную сетку' : 'View Brackets'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RULES */}
        {activeTab === 'rules' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                {language !== 'en' 
                  ? `Спортивный регламент и правила судейства (${localized.rulesType.toUpperCase()})` 
                  : `Sport Regulations & Officiating Rules (${localized.rulesType.toUpperCase()})`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language !== 'en' 
                  ? 'Ключевые пункты официальных правил соревнований:' 
                  : 'Key articles of the official tournament rulebook:'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-blue-400 font-bold font-mono uppercase block">
                  {language !== 'en' ? '1. Оценки и баллы' : '1. Scoring Points'}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {isWkf ? (
                    language !== 'en' 
                      ? 'Юко (1 балл) — удары руками цуки; Ваза-ари (2 балла) — удары ногами чудан; Иппон (3 балла) — удары ногами дзедан или бросок с добиванием. Преимущество первого балла (Senshu).'
                      : 'Yuko (1 pt) — tsuki punches; Waza-ari (2 pts) — chudan kicks; Ippon (3 pts) — jodan kicks or takedown with follow-up. First unchallenged score advantage (Senshu).'
                  ) : (
                    language !== 'en'
                      ? 'Shobu Ippon: 1 решающий Иппон или 2 Ваза-ари (Awaseté Ippon). Чистота традиционной техники Тодоме.'
                      : 'Shobu Ippon: 1 decisive Ippon or 2 Waza-ari (Awaseté Ippon). Traditional decisiveness (Todome-waza).'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-rose-400 font-bold font-mono uppercase block">
                  {language !== 'en' ? '2. Наказания и фолы' : '2. Penalties & Fouls'}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {isWkf ? (
                    language !== 'en'
                      ? 'Категория 1 (C1): запрещенный контакт, удары по горлу и паху. Категория 2 (C2): выход за татами (Jogai), симуляция травмы, уклонение от боя.'
                      : 'Category 1 (C1): prohibited contact, throat/groin attacks. Category 2 (C2): stepping out of bounds (Jogai), feigning injury, avoiding combat.'
                  ) : (
                    language !== 'en'
                      ? 'Замечания Чуй и Хансоку. Строгий контроль за выходом за пределы ковра (Дзёгай).'
                      : 'Chui warnings and Hansoku disqualifications. Strict boundary control (Jogai).'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-emerald-400 font-bold font-mono uppercase block">
                  {language !== 'en' ? '3. Защита жеребьевки' : '3. Seeding Protection'}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {language !== 'en'
                    ? 'Алгоритм гарантированно исключает встречу представителей одного клуба, города или страны в 1-м круге (1/8 финала) и 2-м круге (1/4 финала).'
                    : 'The algorithm strictly guarantees competitors from the same dojo, club or hometown will not collide in R1 or R2.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TATAMIS */}
        {activeTab === 'tatamis' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                {language !== 'en' ? 'Распределение татами и судейских бригад' : 'Mat Allocation & Referee Panels'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language !== 'en' 
                  ? 'Площадки турнира и их специализация по дисциплинам:' 
                  : 'Arena tatamis and their specific discipline assignments:'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tatamis.map((tatami) => (
                <div
                  key={tatami.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center">
                      {tatami.number}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {language !== 'en' ? 'Активен' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {language !== 'en' ? tatami.name : `Tatami #${tatami.number}`}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {tatami.number === 4 
                        ? (language !== 'en' ? 'Специализированная зона Ката (WKF / SKIF)' : 'Dedicated Kata Mat (WKF / SKIF)')
                        : tatami.number === 3 
                        ? (language !== 'en' ? 'Детские и кадетские дивизионы' : 'Youth & Cadet Divisions')
                        : (language !== 'en' ? 'Кумитэ взрослые весовые категории' : 'Senior Kumite Weight Divisions')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
