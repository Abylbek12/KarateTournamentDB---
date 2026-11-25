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
import { disciplineLabel } from '../utils/eventI18n';
import { splitDescription, descriptionLead } from '../utils/eventDescription';

/** "2026-12-01" → "1 декабря 2026" in the interface language; any other text is shown as is. */
const parseIsoDay = (value: string | undefined): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || '').trim());
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const dayFormat = (language: string) =>
  new Intl.DateTimeFormat(language === 'ky' ? 'ky-KG' : language === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const dropRuYear = (s: string) => s.replace(/\s?г\.$/, '');
// Browsers often ship without Kyrgyz calendar data, so Kyrgyz dates are written by hand: "28-ноябрь 2026-ж."
const KY_MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const kyDay = (d: Date) => `${d.getDate()}-${KY_MONTHS[d.getMonth()]}`;
function kyRange(a: Date, b: Date | null): string {
  if (!b || b.getTime() === a.getTime()) return `${kyDay(a)} ${a.getFullYear()}-ж.`;
  if (a.getFullYear() !== b.getFullYear()) return `${kyDay(a)} ${a.getFullYear()}-ж. – ${kyDay(b)} ${b.getFullYear()}-ж.`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${kyDay(b)} ${a.getFullYear()}-ж.`;
  return `${kyDay(a)} – ${kyDay(b)} ${a.getFullYear()}-ж.`;
}

function formatDay(value: string | undefined, language: string): string {
  const date = parseIsoDay(value);
  if (!date) return String(value || '').trim();
  if (language === 'ky') return kyRange(date, null);
  try {
    return dropRuYear(dayFormat(language).format(date));
  } catch {
    return String(value);
  }
}

/** "2026-11-28" + "2026-11-29" → "28–29 ноября 2026"; empty string if the dates are not ISO. */
function formatDayRange(start: string | undefined, end: string | undefined, language: string): string {
  const a = parseIsoDay(start);
  const b = parseIsoDay(end);
  if (!a) return '';
  if (language === 'ky') return kyRange(a, b);
  try {
    if (!b || b.getTime() === a.getTime()) return dropRuYear(dayFormat(language).format(a));
    return dropRuYear(dayFormat(language).formatRange(a, b));
  } catch {
    return '';
  }
}

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
  const descriptionBlocks = splitDescription(rawTournament.description);
  const deadlineText = formatDay(rawTournament.registrationDeadline, language) || '—';
  const venueLine = rawTournament.venueName || '';
  const placeLine = [rawTournament.city, rawTournament.country].filter(Boolean).join(', ') || tournament.locationLabel || '';
  const keyFacts: Array<{ key: string; label: string; value: string; sub?: string; icon: typeof Calendar; tone: string; noTranslate?: boolean }> = [
    {
      key: 'dates',
      label: tr('Даты проведения', 'Өтүүчү күндөрү', 'Dates'),
      value: formatDayRange(rawTournament.startDate, rawTournament.endDate, language) || tournament.dateLabel || [rawTournament.startDate, rawTournament.endDate].filter(Boolean).join(' — ') || '—',
      icon: Calendar,
      tone: 'bg-sky-50 border-sky-200 text-sky-600',
    },
    {
      key: 'venue',
      label: tr('Место проведения', 'Өтүүчү жери', 'Venue'),
      value: venueLine || placeLine || '—',
      sub: venueLine ? placeLine : undefined,
      icon: MapPin,
      tone: 'bg-rose-50 border-rose-200 text-rose-600',
      noTranslate: Boolean(venueLine),
    },
    {
      key: 'deadline',
      label: tr('Приём заявок до', 'Өтүнмөлөр кабыл алынат', 'Entries until'),
      value: deadlineText,
      icon: Clock,
      tone: 'bg-amber-50 border-amber-200 text-amber-600',
    },
    {
      key: 'organizer',
      label: tr('Организатор', 'Уюштуруучу', 'Organizer'),
      value: rawTournament.organization || '—',
      icon: Building2,
      tone: 'bg-indigo-50 border-indigo-200 text-indigo-600',
      noTranslate: true,
    },
  ];
  const showDetails = () => document.getElementById('event-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-4 animate-fadeIn font-sans pb-16 max-w-7xl mx-auto">
      {/* Top Breadcrumbs with back button */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{tr('Главная', 'Башкы бет', 'Home')}</span>
          </button>
          <span>/</span>
          <span translate="no" className="text-slate-400 truncate max-w-[200px] sm:max-w-md">{tournament.title}</span>
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

            <h1
              className="text-3xl! sm:text-4xl! lg:text-5xl! leading-[1.1]! font-extrabold tracking-tight text-slate-900 [text-wrap:balance] break-words"
              translate="no"
            >
              {tournament.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-sm text-slate-600 justify-center md:justify-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="font-semibold text-slate-800">{formatDayRange(rawTournament.startDate, rawTournament.endDate, language) || tournament.dateLabel}</span>
              </div>
              {tournament.locationLabel && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{tournament.locationLabel}</span>
                </div>
              )}
            </div>

            {/* Short lead only: the full description is below, split into paragraphs */}
            <p translate={tournament.description ? 'no' : undefined} className="text-base text-slate-600 leading-relaxed max-w-prose pt-1 line-clamp-3 [text-wrap:pretty]">
              {descriptionLead(tournament.description) || tr(
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
            <div className="text-xs text-slate-500">{tr('Организатор', 'Уюштуруучу', 'Organization')}</div>
            <div translate="no" className="text-sm md:text-base font-bold text-slate-800 mt-1 truncate">{tournament.organization || '—'}</div>
          </div>
          <div className="p-4 border-r border-b md:border-b-0 border-slate-100 text-center">
            <div className="text-xs text-slate-500">{tr('Татами / Рингов', 'Татами / Рингдер', 'Tatami / Rings')}</div>
            <div className="text-sm md:text-base font-bold text-slate-800 mt-1">
              {tournament.tatamiCount || tournament.ringsCount || 1} {tr('татами', 'татами', 'tatami')}
            </div>
          </div>
          <div className="p-4 border-r border-slate-100 text-center">
            <div className="text-xs text-slate-500">{tr('Участников заявлено', 'Катталган катышуучулар', 'Registered Athletes')}</div>
            <div className="text-sm md:text-base font-bold text-slate-800 mt-1">
              {entriesCount ?? 0} {tr('заявок', 'өтүнмө', 'entries')}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xs text-slate-500">{tr('Регламент', 'Регламент', 'Rules Standard')}</div>
            <div className="text-sm md:text-base font-bold text-sky-600 mt-1 truncate" title={rulesText}>{rulesText}</div>
          </div>
        </div>
      </div>

      {/* Full information: what the organizer entered */}
      <section id="event-details" aria-labelledby="event-details-title" className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 md:p-8 space-y-6 md:space-y-8 scroll-mt-20">
        <h2 id="event-details-title" className="text-xl! md:text-2xl! font-bold text-slate-900 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-sky-600 shrink-0" />
          <span>{tr('Информация о турнире', 'Мелдеш жөнүндө маалымат', 'Tournament information')}</span>
        </h2>

        {/* Key facts: one card per fact, value large and bold */}
        <dl className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {keyFacts.map(({ key, label, value, sub, icon: Icon, tone, noTranslate }) => (
            <div key={key} className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 min-w-0">
              <span className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border ${tone}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                <dd translate={noTranslate ? 'no' : undefined} className="mt-1 text-base md:text-lg font-bold text-slate-900 leading-snug break-words">
                  {value}
                </dd>
                {sub && <dd translate="no" className="mt-0.5 text-sm text-slate-600 leading-snug break-words">{sub}</dd>}
              </div>
            </div>
          ))}
        </dl>

        {/* Secondary facts: rules and tatami */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-100 pt-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tr('Правила и регламент', 'Эрежелер жана регламент', 'Rules')}</div>
            <div className="mt-0.5 text-base font-bold text-slate-900">{rulesText}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tr('Татами', 'Татами', 'Tatami')}</div>
            <div className="mt-0.5 text-base font-bold text-slate-900 tabular-nums">{rawTournament.tatamiCount || 1}</div>
          </div>
        </div>

        {rawTournament.disciplines && rawTournament.disciplines.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">{tr('Дисциплины в программе', 'Программадагы дисциплиналар', 'Disciplines')}</div>
            <div className="flex flex-wrap gap-2">
              {/* Same discipline written two ways (old and new wording) is shown once */}
              {Array.from(new Set(rawTournament.disciplines.map((d) => disciplineLabel(d, language)))).map((label) => (
                <span key={label} translate="no" className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-sm font-medium">{label}</span>
              ))}
            </div>
          </div>
        )}

        {descriptionBlocks.length > 0 && (
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg! md:text-xl! font-bold text-slate-900 mb-4">{tr('Описание и условия допуска', 'Сүрөттөмө жана шарттар', 'Description & eligibility')}</h3>
            <div translate="no" className="max-w-prose space-y-4 text-base text-slate-700 leading-7 md:leading-8 [text-wrap:pretty]">
              {descriptionBlocks.map((block, i) =>
                block.type === 'list' ? (
                  <ul key={i} className="list-disc pl-6 space-y-2 marker:text-sky-500">
                    {block.items.map((item, j) => <li key={j} className="pl-1">{item}</li>)}
                  </ul>
                ) : (
                  <p key={i}>{block.text}</p>
                )
              )}
            </div>
          </div>
        )}
      </section>

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
