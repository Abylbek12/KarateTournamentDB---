import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building2, 
  Award, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Ticket,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { EventItem } from '../data/eventsData';
import { EventEmblem } from './EventEmblems';
import { useApp } from '../context/AppContext';
import { localizeEventItem, trLang } from '../utils/globalDomTranslator';

interface TournamentInfoDetailViewProps {
  tournament: EventItem;
  onBack: () => void;
  onNavigateAction: (action: string) => void;
  onStartRegistration: () => void;
  /** Real number of entries (not withdrawn) for this tournament. */
  entriesCount?: number;
  /** Administrators can open the edit form from here. */
  onEdit?: () => void;
}

const RULES_NAMES: Record<string, string> = {
  wkf: 'WKF',
  skif: 'SKIF',
  kyokushin: 'Kyokushin',
  jka: 'JKA',
  olympic: 'Olympic WKF'
};

export const TournamentInfoDetailView: React.FC<TournamentInfoDetailViewProps> = ({
  tournament: rawTournament,
  onBack,
  onNavigateAction,
  onStartRegistration,
  entriesCount,
  onEdit,
}) => {
  const { language } = useApp();
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const tournament = localizeEventItem(rawTournament, language);

  // Countdown to the first day of the tournament (09:00 local time)
  const startsAt = new Date(`${(rawTournament.startDate || '').slice(0, 10)}T09:00:00`).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const msLeft = Number.isFinite(startsAt) ? Math.max(0, startsAt - now) : 0;
  const timeLeft = {
    days: Math.floor(msLeft / 86_400_000),
    hours: Math.floor(msLeft / 3_600_000) % 24,
    minutes: Math.floor(msLeft / 60_000) % 60,
    seconds: Math.floor(msLeft / 1000) % 60
  };
  const rulesText = (rawTournament as any).rulesLabel || RULES_NAMES[rawTournament.rulesType] || 'WKF';
  const showDetails = () => document.getElementById('event-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-4 animate-fadeIn font-sans pb-16 max-w-7xl mx-auto">
      {/* Top Breadcrumbs with back button */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{tr('Главная', 'Башкы бет', 'Home')}</span>
          </button>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px] sm:max-w-md">{tournament.title}</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{tr('Информация', 'Маалымат', 'Information')}</span>
        </div>

        {/* Quick action buttons on top right */}
        <div className="flex items-center gap-2">
          {tournament.availableActions.includes('categories_prices') && (
            <button
              onClick={() => onNavigateAction('categories_prices')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {tr('Категории и цены', 'Категориялар жана баалар', 'Categories & Prices')}
            </button>
          )}
          {tournament.availableActions.includes('brackets') && (
            <button
              onClick={() => onNavigateAction('brackets')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {tr('Сетки', 'Торчолор', 'Brackets')}
            </button>
          )}
        </div>
      </div>

      {/* Main Tournament Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Left Emblem */}
          <div className="shrink-0 flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-2xs w-32 h-32 md:w-40 md:h-40 mx-auto md:mx-0">
            <EventEmblem type={tournament.emblemType} imageUrl={tournament.imageUrl} title={tournament.title} color={tournament.accentColor} className="w-24 h-24 md:w-32 md:h-32 text-[18px] md:text-[22px]" />
          </div>

          {/* Middle Information */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>{tournament.league || tr('Официальный турнир', 'Расмий мелдеш', 'Official Tournament')}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {tournament.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600 justify-center md:justify-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span className="font-medium text-slate-800">{tournament.dateLabel}</span>
              </div>
              {tournament.locationLabel && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{tournament.locationLabel}</span>
                </div>
              )}
              {tournament.venueName && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span>{tournament.venueName}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl pt-1">
              {tournament.description || tr(
                'Официальные спортивные соревнования. Регистрация открыта для индивидуальных спортсменов и клубов.',
                'Расмий спорттук мелдештер. Каттоо жеке спортчулар жана клубдар үчүн ачык.',
                'Official sports competition. Registration is open for individual athletes and clubs.'
              )}
            </p>

            {/* CTA action buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <button
                onClick={onStartRegistration}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>{tr('Зарегистрироваться на событие', 'Иш-чарага катталуу', 'Register for Event')}</span>
              </button>

              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  <span>{tr('Изменить турнир', 'Мелдешти өзгөртүү', 'Edit tournament')}</span>
                </button>
              )}

              {tournament.availableActions.includes('live_scoring') && (
                <button
                  onClick={() => onNavigateAction('live_scoring')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Scoring</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Countdown Timer Block */}
          <div className="w-full md:w-64 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border border-slate-200/90 p-4 shrink-0 text-center space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {tr('До старта турнира', 'Мелдештин башталышына чейин', 'Countdown to Event')}
            </div>

            <div className="grid grid-cols-4 gap-1.5 tabular-nums">
              <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs">
                <div className="text-lg font-black text-slate-800">{timeLeft.days}</div>
                <div className="text-[9px] text-slate-400 font-sans uppercase">{tr('Дней', 'Күн', 'Days')}</div>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs">
                <div className="text-lg font-black text-slate-800">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[9px] text-slate-400 font-sans uppercase">{tr('Час', 'Саат', 'Hrs')}</div>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs">
                <div className="text-lg font-black text-slate-800">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-[9px] text-slate-400 font-sans uppercase">{tr('Мин', 'Мүн', 'Min')}</div>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs">
                <div className="text-lg font-black text-teal-600">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-[9px] text-slate-400 font-sans uppercase">{tr('Сек', 'Сек', 'Sec')}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{tr('Приём заявок до', 'Өтүнмөлөр', 'Entries until')}: {tournament.registrationDeadline || '—'}</span>
            </div>
          </div>
        </div>

        {/* Quick Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-4 border-r border-b md:border-b-0 border-slate-100 text-center">
            <div className="text-[11px] text-slate-400">{tr('Организатор', 'Уюштуруучу', 'Organization')}</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{tournament.organization || '—'}</div>
          </div>
          <div className="p-4 border-r border-b md:border-b-0 border-slate-100 text-center">
            <div className="text-[11px] text-slate-400">{tr('Татами / Рингов', 'Татами / Рингдер', 'Tatami / Rings')}</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {tournament.tatamiCount || tournament.ringsCount || 1} {tr('татами', 'татами', 'tatami')}
            </div>
          </div>
          <div className="p-4 border-r border-slate-100 text-center">
            <div className="text-[11px] text-slate-400">{tr('Участников заявлено', 'Катталган катышуучулар', 'Registered Athletes')}</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {entriesCount ?? 0} {tr('заявок', 'өтүнмө', 'entries')}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-[11px] text-slate-400">{tr('Регламент', 'Регламент', 'Rules Standard')}</div>
            <div className="text-xs font-bold text-sky-600 mt-0.5 truncate" title={rulesText}>{rulesText}</div>
          </div>
        </div>
      </div>

      {/* Full information: what the organizer entered */}
      <div id="event-details" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4 scroll-mt-20">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>{tr('Информация о турнире', 'Мелдеш жөнүндө маалымат', 'Tournament information')}</span>
        </h3>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
          {[
            [tr('Даты', 'Даталар', 'Dates'), [rawTournament.startDate, rawTournament.endDate].filter(Boolean).join(' — ')],
            [tr('Приём заявок до', 'Өтүнмөлөр кабыл алынат', 'Entries until'), rawTournament.registrationDeadline || '—'],
            [tr('Место', 'Орун', 'Venue'), [rawTournament.venueName, rawTournament.city, rawTournament.country].filter(Boolean).join(', ') || '—'],
            [tr('Организатор', 'Уюштуруучу', 'Organizer'), rawTournament.organization || '—'],
            [tr('Правила и регламент', 'Эрежелер жана регламент', 'Rules'), rulesText],
            [tr('Татами', 'Татами', 'Tatami'), String(rawTournament.tatamiCount || 1)]
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
              <dd className="text-slate-800 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {rawTournament.disciplines && rawTournament.disciplines.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">{tr('Дисциплины в программе', 'Программадагы дисциплиналар', 'Disciplines')}</div>
            <div className="flex flex-wrap gap-1.5">
              {rawTournament.disciplines.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs">{d}</span>
              ))}
            </div>
          </div>
        )}
        {rawTournament.description && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">{tr('Описание и условия допуска', 'Сүрөттөмө жана шарттар', 'Description & eligibility')}</div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{rawTournament.description}</p>
          </div>
        )}
      </div>

      {/* Available Modules for this Sport Category */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>{tr('Доступные разделы для события', 'Иш-чара үчүн жеткиликтүү бөлүмдөр', 'Available Event Sections')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tournament.availableActions.map((actionKey) => {
            let title = '';
            let desc = '';
            const icon = <Award className="w-4 h-4 text-sky-600" />;

            if (actionKey === 'info') {
              title = tr('Информация', 'Маалымат', 'Event Info');
              desc = tr('Описание, регламент и расписание', 'Сүрөттөмө, регламент жана ырааттама', 'Description, regulations, schedule');
            } else if (actionKey === 'categories_prices') {
              title = tr('Категории и цены', 'Категориялар жана баалар', 'Categories & Pricing');
              desc = tr('Список весовых и возрастных категорий, стоимость', 'Салмак жана курактык категориялар, баасы', 'Age/weight classes and registration fees');
            } else if (actionKey === 'brackets') {
              title = tr('Сетки (Brackets)', 'Торчолор (Brackets)', 'Playoff Brackets');
              desc = tr('Турнирные сетки по татами и времени', 'Татами жана убакыт боюнча мелдеш торчолору', 'Live playoff elimination brackets by ring');
            } else if (actionKey === 'results') {
              title = tr('Результаты', 'Жыйынтыктар', 'Official Results');
              desc = tr('Итоговые протоколы и призеры поединков', 'Жыйынтыктоочу протоколдор жана жеңүүчүлөр', 'Scorecards and podium standings');
            } else if (actionKey === 'medals') {
              title = tr('Медали', 'Медалдар', 'Medal Standings');
              desc = tr('Зачет по клубам, федерациям и странам', 'Клубдар, федерациялар жана өлкөлөр боюнча эсеп', 'Club, federation and national medal ranks');
            } else if (actionKey === 'live_scoring') {
              title = tr('Live Scoring', 'Түз эфир таблосу', 'Live Scoring');
              desc = tr('Счёт и время на каждом татами в реальном времени', 'Ар бир татамидеги эсеп жана убакыт', 'Score and clock on every tatami in real time');
            }

            return (
              <button
                key={actionKey}
                onClick={() => (actionKey === 'info' ? showDetails() : onNavigateAction(actionKey))}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-sky-700 transition-colors flex items-center justify-between">
                    <span>{title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
                    {desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
