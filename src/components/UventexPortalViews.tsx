import React, { useState } from 'react';
import { 
  Tv, 
  Play, 
  Eye, 
  ShieldCheck, 
  Award, 
  Search, 
  Building2,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  UserCheck,
  CreditCard,
  Trophy
} from 'lucide-react';
import { SAMPLE_CLUBS, SAMPLE_BOUTS, SAMPLE_TOURNAMENT_CATEGORIES } from '../data/sampleTournamentData';
import { TournamentClubAccountingModule } from './TournamentClubAccountingModule';
import { Club, UserRole, Participant, Bout, TournamentCategory, TournamentRules } from '../types/schema';
import { trLang } from '../utils/globalDomTranslator';

// -------------------------------------------------------------
// 1. Studios & Dojos Portal View (#studios)
// -------------------------------------------------------------
interface StudiosPortalProps {
  language: 'ru' | 'en' | 'ky';
  currentUserRole?: UserRole;
  onNavigateTab: (tab: string) => void;
  clubs?: Club[];
  participants?: Participant[];
  bouts?: Bout[];
  categories?: TournamentCategory[];
  tournamentRules?: TournamentRules;
  onSelectConsoleBout?: (boutId: string) => void;
}

export const StudiosView: React.FC<StudiosPortalProps> = ({
  language,
  onNavigateTab,
  clubs = SAMPLE_CLUBS,
  participants = [],
  bouts = SAMPLE_BOUTS,
  categories = SAMPLE_TOURNAMENT_CATEGORIES,
  tournamentRules = 'wkf',
  onSelectConsoleBout
}) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'schedule' | 'accounting'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedStudioModal, setSelectedStudioModal] = useState<any | null>(null);
  const [enrollSuccessToast, setEnrollSuccessToast] = useState<string | null>(null);

  const studiosData = [
    {
      id: 'c1',
      cityKey: 'Москва',
      name: tr(
        'СК "Самурай" — Центр Спортивного Каратэ WKF',
        'СК "Самурай" — WKF Спорттук Каратэ Борбору',
        'SC "Samurai" — WKF Sport Karate Center'
      ),
      city: tr('Москва', 'Москва', 'Moscow'),
      address: tr(
        'Ленинградский проспект, 39, стр. 1 (СК ЦСКА)',
        'Ленинград проспектиси, 39, 1-к. (СК ЦСКА)',
        '39 Leningradsky Ave, Bldg 1 (CSKA Arena)'
      ),
      headCoach: tr('Алексеев Владимир Сергеевич', 'Алексеев Владимир Сергеевич', 'Vladimir Alekseev'),
      rank: tr('5 Дан WKF, Заслуженный тренер России', '5 Дан WKF, Россиянын эмгек сиңирген машыктыруучусу', '5th Dan WKF, Honored Coach'),
      phone: '+7 (495) 123-45-67',
      email: 'info@samurai-karate.ru',
      rating: 4.9,
      reviewsCount: 84,
      studentCount: 160,
      disciplines: [
        tr('WKF Кумитэ', 'WKF Кумитэ', 'WKF Kumite'),
        tr('Ката', 'Ката', 'Kata'),
        tr('Детское каратэ U8-U14', 'Балдар каратэси U8-U14', 'Youth Karate U8-U14')
      ],
      disciplineKeys: ['WKF', 'Ката'],
      emblem: '⛩️',
      scheduleSummary: tr(
        'Пн, Ср, Пт: 17:00 (дети), 19:30 (взрослые)',
        'Дш, Шр, Жм: 17:00 (балдар), 19:30 (чоңдор)',
        'Mon, Wed, Fri: 17:00 (Kids), 19:30 (Adults)'
      ),
      feeMonth: tr('7 500 ₽/мес', '7 500 ₽/ай', '7,500 RUB/mo'),
      isVerified: true
    },
    {
      id: 'c2',
      cityKey: 'Санкт-Петербург',
      name: tr(
        'Додзё "Бусидо" — Академия Традиционных Единоборств',
        '"Бусидо" Додзёсу — Салттуу Жекпе-жек Академиясы',
        'Dojo "Bushido" — Traditional Martial Arts Academy'
      ),
      city: tr('Санкт-Петербург', 'Санкт-Петербург', 'Saint Petersburg'),
      address: tr(
        'Каменноостровский проспект, 42',
        'Каменноостровский проспектиси, 42',
        '42 Kamennoostrovsky Ave'
      ),
      headCoach: tr('Ковалев Михаил Дмитриевич', 'Ковалев Михаил Дмитриевич', 'Mikhail Kovalev'),
      rank: tr('6 Дан Сётокан SKIF, СВК', '6 Дан Сётокан SKIF, Эл аралык калыс', '6th Dan Shotokan SKIF, Chief Referee'),
      phone: '+7 (812) 987-65-43',
      email: 'dojo@bushido-spb.ru',
      rating: 4.8,
      reviewsCount: 62,
      studentCount: 125,
      disciplines: [
        tr('Сётокан Shobu Ippon', 'Сётокан Shobu Ippon', 'Shotokan Shobu Ippon'),
        tr('Ката Bunkai', 'Ката Bunkai', 'Kata Bunkai'),
        tr('Кобудо', 'Кобудо', 'Kobudo')
      ],
      disciplineKeys: ['Сётокан', 'Кобудо'],
      emblem: '🥋',
      scheduleSummary: tr(
        'Вт, Чт, Сб: 18:00 (юниоры), 20:00 (мастера)',
        'Шш, Бш, Иш: 18:00 (өспүрүмдөр), 20:00 (чеберлер)',
        'Tue, Thu, Sat: 18:00 (Juniors), 20:00 (Masters)'
      ),
      feeMonth: tr('6 800 ₽/мес', '6 800 ₽/ай', '6,800 RUB/mo'),
      isVerified: true
    },
    {
      id: 'c3',
      cityKey: 'Казань',
      name: tr(
        'СШОР "Олимп" — Центр Олимпийского Резерва',
        '"Олимп" СШОР — Олимпиадалык Резерв Борбору',
        'Olympic Reserve Center "Olymp"'
      ),
      city: tr('Казань', 'Казань', 'Kazan'),
      address: tr(
        'ул. Фатыха Амирхана, 1г (Дворец Единоборств)',
        'Фатых Амирхан көч., 1г (Жекпе-жек сарайы)',
        '1G Fatykh Amirkhan St (Martial Arts Palace)'
      ),
      headCoach: tr('Хабибуллин Рустем Ильнурович', 'Хабибуллин Рустем Ильнурович', 'Rustem Khabibullin'),
      rank: tr('Мастер спорта международного класса (МСМК)', 'Эл аралык класстагы спорт чебери', 'International Master of Sports'),
      phone: '+7 (843) 555-12-34',
      email: 'olymp.kazan@sport.tatar.ru',
      rating: 4.9,
      reviewsCount: 95,
      studentCount: 210,
      disciplines: [
        tr('Олимпийское каратэ', 'Олимпиадалык каратэ', 'Olympic Karate'),
        tr('Сборная региона', 'Аймактык курама', 'Regional National Team'),
        tr('ОФП', 'ЖФД', 'Conditioning')
      ],
      disciplineKeys: ['Олимпийское', 'WKF'],
      emblem: '🏅',
      scheduleSummary: tr(
        'Ежедневно: утренние и вечерние тренировки',
        'Күн сайын: эртең мененки жана кечки машыгуулар',
        'Daily: morning and evening training sessions'
      ),
      feeMonth: tr('Бесплатно (Бюджет) / 4 500 ₽', 'Акысыз (Бюджет) / 4 500 ₽', 'Free (Scholarship) / 4,500 RUB'),
      isVerified: true
    },
    {
      id: 'c4',
      cityKey: 'Екатеринбург',
      name: tr(
        'Клуб Единоборств "Торнадо"',
        '"Торнадо" Жекпе-жек Клубу',
        'Martial Arts Club "Tornado"'
      ),
      city: tr('Екатеринбург', 'Екатеринбург', 'Yekaterinburg'),
      address: tr(
        'ул. Радищева, 28 (ТЦ Гермес)',
        'Радищев көч., 28 (Гермес СБ)',
        '28 Radishcheva St (Hermes Center)'
      ),
      headCoach: tr('Григорьев Андрей Павлович', 'Григорьев Андрей Павлович', 'Andrey Grigoriev'),
      rank: tr('4 Дан JKA, Судья Международной категории', '4 Дан JKA, Эл аралык категориядагы калыс', '4th Dan JKA, International Referee'),
      phone: '+7 (343) 222-33-44',
      email: 'tornado@ekb-karate.ru',
      rating: 4.7,
      reviewsCount: 48,
      studentCount: 95,
      disciplines: [
        tr('Кумитэ WKF', 'Кумитэ WKF', 'WKF Kumite'),
        tr('Самооборона', 'Өзүн-өзү коргоо', 'Self-Defense'),
        tr('Кёкусинкай', 'Кёкусинкай', 'Kyokushinkai')
      ],
      disciplineKeys: ['WKF'],
      emblem: '🌪️',
      scheduleSummary: tr(
        'Пн, Ср, Пт: 16:30, 18:30, 20:30',
        'Дш, Шр, Жм: 16:30, 18:30, 20:30',
        'Mon, Wed, Fri: 16:30, 18:30, 20:30'
      ),
      feeMonth: tr('5 500 ₽/мес', '5 500 ₽/ай', '5,500 RUB/mo'),
      isVerified: true
    },
    {
      id: 'c5',
      cityKey: 'Новосибирск',
      name: tr(
        'ЦБИ "Восток" — Центр Боевых Искусств',
        '"Восток" ЖӨБ — Согуш Өнөрлөр Борбору',
        '"Vostok" Martial Arts Center'
      ),
      city: tr('Новосибирск', 'Новосибирск', 'Novosibirsk'),
      address: tr(
        'Красный проспект, 163',
        'Красный проспектиси, 163',
        '163 Krasny Ave'
      ),
      headCoach: tr('Морозов Сергей Николаевич', 'Морозов Сергей Николаевич', 'Sergey Morozov'),
      rank: tr('5 Дан Сито-рю, Чемпион Европы', '5 Дан Сито-рю, Европа Чемпиону', '5th Dan Shito-Ryu, European Champion'),
      phone: '+7 (383) 777-88-99',
      email: 'vostok@budo-nsk.ru',
      rating: 4.8,
      reviewsCount: 53,
      studentCount: 110,
      disciplines: [
        tr('Сито-рю Ката', 'Сито-рю Ката', 'Shito-Ryu Kata'),
        tr('WKF Кумитэ', 'WKF Кумитэ', 'WKF Kumite'),
        tr('Дзюдо', 'Дзюдо', 'Judo')
      ],
      disciplineKeys: ['WKF', 'Кобудо'],
      emblem: '🐉',
      scheduleSummary: tr(
        'Вт, Чт, Сб: 17:30, 19:30',
        'Шш, Бш, Иш: 17:30, 19:30',
        'Tue, Thu, Sat: 17:30, 19:30'
      ),
      feeMonth: tr('5 900 ₽/мес', '5 900 ₽/ай', '5,900 RUB/mo'),
      isVerified: true
    }
  ];

  const filteredStudios = studiosData.filter((s) => {
    if (selectedCity !== 'all' && s.cityKey !== selectedCity) return false;
    if (selectedDiscipline !== 'all' && !s.disciplineKeys.includes(selectedDiscipline)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.headCoach.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleEnrollStudio = (studio: any) => {
    setEnrollSuccessToast(
      tr(
        `Заявка на пробное занятие в «${studio.name}» успешно отправлена администратору студии!`,
        `«${studio.name}» студиясына сыноо сабагына табыштама администраторго ийгиликтүү жөнөтүлдү!`,
        `Trial class application for "${studio.name}" has been sent to the studio administrator!`
      )
    );
    setTimeout(() => setEnrollSuccessToast(null), 5000);
    setSelectedStudioModal(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>{tr('КАТАЛОГ СТУДИЙ И ДОДЗЁ UVENTEX', 'UVENTEX СТУДИЯЛАР ЖАНА ДОДЗЁЛОР КАТАЛОГУ', 'UVENTEX STUDIOS & DOJOS DIRECTORY')}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {tr('Аккредитованных студий:', 'Аккредитацияланган студиялар:', 'Accredited studios:')}{' '}
              <strong className="text-slate-800">{studiosData.length}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {tr('Студии, Клубы и Додзё', 'Студиялар, Клубдар жана Додзёлор', 'Studios & Training Dojos')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tr(
              'Единый реестр сертифицированных клубов боевых искусств, расписание тренировок и запись спортсменов',
              'Сертификатталган согуш өнөрлөр клубдарынын бирдиктүү реестри, машыгуу ырааттамасы жана спортчуларды жазуу',
              'Official directory of certified martial arts dojos, class schedules and membership registration'
            )}
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-stretch md:self-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr('Каталог студий', 'Студиялар каталогу', 'Directory')}
          </button>
          <button
            onClick={() => setActiveSubTab('accounting')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'accounting'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>{tr('Управление клубом и взносами', 'Клубду жана төгүмдөрдү башкаруу', 'Club Hub & Invoices')}</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {enrollSuccessToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{enrollSuccessToast}</span>
        </div>
      )}

      {/* Subtab 1: Directory */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={tr(
                  'Поиск студии по названию, тренеру, адресу...',
                  'Студияны аталышы, машыктыруучусу, дареги боюнча издөө...',
                  'Search studios, sensei, address...'
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* City & Discipline Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">{tr('Все города', 'Бардык шаарлар', 'All Cities')}</option>
                <option value="Москва">{tr('Москва', 'Москва', 'Moscow')}</option>
                <option value="Санкт-Петербург">{tr('Санкт-Петербург', 'Санкт-Петербург', 'Saint Petersburg')}</option>
                <option value="Казань">{tr('Казань', 'Казань', 'Kazan')}</option>
                <option value="Екатеринбург">{tr('Екатеринбург', 'Екатеринбург', 'Yekaterinburg')}</option>
                <option value="Новосибирск">{tr('Новосибирск', 'Новосибирск', 'Novosibirsk')}</option>
              </select>

              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">{tr('Все направления', 'Бардык багыттар', 'All Disciplines')}</option>
                <option value="WKF">{tr('WKF Каратэ', 'WKF Каратэ', 'WKF Karate')}</option>
                <option value="Сётокан">{tr('Сётокан SKIF/JKA', 'Сётокан SKIF/JKA', 'Shotokan SKIF/JKA')}</option>
                <option value="Олимпийское">{tr('Олимпийский резерв', 'Олимпиадалык резерв', 'Olympic Reserve')}</option>
                <option value="Кобудо">{tr('Кобудо и Ката', 'Кобудо жана Ката', 'Kobudo & Kata')}</option>
              </select>
            </div>
          </div>

          {/* Studios Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudios.map((studio) => (
              <div 
                key={studio.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header with Emblem and Badge */}
                  <div className="p-5 border-b border-slate-100 flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {studio.emblem}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          {studio.city}
                        </span>
                        {studio.isVerified && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-0.5"
                            title={tr('Проверено оргкомитетом', 'Уюштуруу комитети тарабынан текшерилген', 'Verified by Committee')}
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{tr('Проверено', 'Текшерилген', 'Verified')}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                        {studio.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-500 line-clamp-1">{studio.address}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">{studio.headCoach}</span>
                        <div className="text-[11px] text-slate-400">{studio.rank}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">{studio.scheduleSummary}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {studio.disciplines.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{tr('Стоимость', 'Баасы', 'Tuition')}</span>
                    <span className="text-xs font-bold text-slate-900">{studio.feeMonth}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedStudioModal(studio)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {tr('Детали', 'Толугураак', 'Details')}
                    </button>
                    <button
                      onClick={() => handleEnrollStudio(studio)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      {tr('Записаться', 'Жазылуу', 'Join')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Accounting & Club Hub */}
      {activeSubTab === 'accounting' && (
        <TournamentClubAccountingModule
          clubs={clubs}
          participants={participants}
          bouts={bouts}
          categories={categories}
          tournamentRules={tournamentRules}
          onNavigateToScoreboard={(bId) => {
            if (onSelectConsoleBout) onSelectConsoleBout(bId);
            onNavigateTab('scoreboard');
          }}
          onNavigateToBracket={() => onNavigateTab('bracket')}
        />
      )}

      {/* Modal: Studio Details */}
      {selectedStudioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedStudioModal.emblem}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedStudioModal.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudioModal.city} · {selectedStudioModal.address}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudioModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('Главный тренер:', 'Башкы машыктыруучу:', 'Head Coach:')}</span>
                <span className="font-semibold text-slate-800">{selectedStudioModal.headCoach}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('Квалификация:', 'Квалификациясы:', 'Qualification:')}</span>
                <span className="text-slate-700">{selectedStudioModal.rank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('Телефон:', 'Телефон:', 'Phone:')}</span>
                <span className="font-mono text-sky-600 font-semibold">{selectedStudioModal.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('Расписание:', 'Ырааттама:', 'Schedule:')}</span>
                <span className="text-slate-700">{selectedStudioModal.scheduleSummary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{tr('Стоимость абонемента:', 'Абонементтин баасы:', 'Monthly Tuition:')}</span>
                <span className="font-bold text-emerald-700">{selectedStudioModal.feeMonth}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedStudioModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                {tr('Закрыть', 'Жабуу', 'Close')}
              </button>
              <button
                onClick={() => handleEnrollStudio(selectedStudioModal)}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                {tr('Подать заявку на пробную тренировку', 'Сыноо машыгуусуна табыштама берүү', 'Book a Trial Session')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 2. Rankings & Leaderboards View (#rankings)
// -------------------------------------------------------------
export const RankingsView: React.FC<{ language: 'ru' | 'en' | 'ky' }> = ({ language }) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const [activeRankTab, setActiveRankTab] = useState<'athletes' | 'clubs'>('athletes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('2026');

  const athletesRankData = [
    {
      rank: 1,
      name: tr('Иванов Артем', 'Иванов Артем', 'Artem Ivanov'),
      club: tr('СК "Самурай"', 'СК "Самурай"', 'SC "Samurai"'),
      city: tr('Москва', 'Москва', 'Moscow'),
      country: tr('Россия', 'Россия', 'Russia'),
      flag: '🇷🇺',
      points: 480,
      gold: 8,
      silver: 2,
      bronze: 1,
      division: tr('Мужчины Кумитэ -75 кг', 'Эркектер Кумитэ -75 кг', 'Male Kumite -75 kg')
    },
    {
      rank: 2,
      name: tr('Петров Дмитрий', 'Петров Дмитрий', 'Dmitry Petrov'),
      club: tr('Додзё "Бусидо"', '"Бусидо" Додзёсу', 'Dojo "Bushido"'),
      city: tr('Санкт-Петербург', 'Санкт-Петербург', 'Saint Petersburg'),
      country: tr('Россия', 'Россия', 'Russia'),
      flag: '🇷🇺',
      points: 395,
      gold: 6,
      silver: 3,
      bronze: 2,
      division: tr('Мужчины Кумитэ -75 кг', 'Эркектер Кумитэ -75 кг', 'Male Kumite -75 kg')
    },
    {
      rank: 3,
      name: tr('Смирнова Екатерина', 'Смирнова Екатерина', 'Ekaterina Smirnova'),
      club: tr('СШОР "Олимп"', '"Олимп" СШОР', 'Olympic Center "Olymp"'),
      city: tr('Казань', 'Казань', 'Kazan'),
      country: tr('Россия', 'Россия', 'Russia'),
      flag: '🇷🇺',
      points: 370,
      gold: 6,
      silver: 2,
      bronze: 1,
      division: tr('Женщины Кумитэ -61 кг', 'Аялдар Кумитэ -61 кг', 'Female Kumite -61 kg')
    },
    {
      rank: 4,
      name: 'James Miller',
      club: 'Tigers Karate Dojo',
      city: 'Hampton',
      country: tr('США', 'АКШ', 'United States'),
      flag: '🇺🇸',
      points: 320,
      gold: 5,
      silver: 2,
      bronze: 3,
      division: tr('Мужчины Кумитэ -84 кг', 'Эркектер Кумитэ -84 кг', 'Senior Kumite -84 kg')
    },
    {
      rank: 5,
      name: tr('Морозов Сергей', 'Морозов Сергей', 'Sergey Morozov'),
      club: 'Kyoto Shotokan Assoc.',
      city: tr('Москва', 'Москва', 'Moscow'),
      country: tr('Россия', 'Россия', 'Russia'),
      flag: '🇷🇺',
      points: 310,
      gold: 5,
      silver: 1,
      bronze: 1,
      division: tr('Ката Индивидуальное', 'Жеке Ката', 'Individual Kata')
    },
    {
      rank: 6,
      name: 'Marco Rossi',
      club: 'Milano Martial Arts',
      city: 'Milano',
      country: tr('Италия', 'Италия', 'Italy'),
      flag: '🇮🇹',
      points: 290,
      gold: 4,
      silver: 3,
      bronze: 2,
      division: tr('Мужчины Кумитэ -67 кг', 'Эркектер Кумитэ -67 кг', 'Senior Kumite -67 kg')
    },
    {
      rank: 7,
      name: 'Emily Clark',
      club: 'Boston MA Academy',
      city: 'Boston',
      country: tr('США', 'АКШ', 'United States'),
      flag: '🇺🇸',
      points: 285,
      gold: 4,
      silver: 2,
      bronze: 2,
      division: tr('Женщины Кумитэ -55 кг', 'Аялдар Кумитэ -55 кг', 'Female Kumite -55 kg')
    },
    {
      rank: 8,
      name: 'Olena Shevchenko',
      club: 'Kyiv Budo Center',
      city: 'Kyiv',
      country: tr('Украина', 'Украина', 'Ukraine'),
      flag: '🇺🇦',
      points: 260,
      gold: 3,
      silver: 4,
      bronze: 1,
      division: tr('Женщины Кумитэ -68 кг', 'Аялдар Кумитэ -68 кг', 'Female Kumite -68 kg')
    }
  ];

  const clubsRankData = [
    {
      rank: 1,
      name: tr('СК "Самурай"', 'СК "Самурай"', 'SC "Samurai"'),
      city: tr('Москва', 'Москва', 'Moscow'),
      country: tr('Россия', 'Россия', 'Russia'),
      coach: tr('Алексеев В.С.', 'Алексеев В.С.', 'V. Alekseev'),
      points: 1450,
      gold: 24,
      silver: 16,
      bronze: 11,
      totalMedals: 51
    },
    {
      rank: 2,
      name: 'Tigers Karate Dojo',
      city: 'Hampton, VA',
      country: tr('США', 'АКШ', 'USA'),
      coach: 'Robert Henderson',
      points: 1220,
      gold: 19,
      silver: 14,
      bronze: 12,
      totalMedals: 45
    },
    {
      rank: 3,
      name: tr('Додзё "Бусидо"', '"Бусидо" Додзёсу', 'Dojo "Bushido"'),
      city: tr('Санкт-Петербург', 'Санкт-Петербург', 'Saint Petersburg'),
      country: tr('Россия', 'Россия', 'Russia'),
      coach: tr('Ковалев М.Д.', 'Ковалев М.Д.', 'M. Kovalev'),
      points: 1150,
      gold: 18,
      silver: 13,
      bronze: 10,
      totalMedals: 41
    },
    {
      rank: 4,
      name: tr('СШОР "Олимп"', '"Олимп" СШОР', 'Olympic Center "Olymp"'),
      city: tr('Казань', 'Казань', 'Kazan'),
      country: tr('Россия', 'Россия', 'Russia'),
      coach: tr('Хабибуллин Р.И.', 'Хабибуллин Р.И.', 'R. Khabibullin'),
      points: 980,
      gold: 15,
      silver: 10,
      bronze: 9,
      totalMedals: 34
    },
    {
      rank: 5,
      name: 'Boston Martial Arts Academy',
      city: 'Boston, MA',
      country: tr('США', 'АКШ', 'USA'),
      coach: 'David Clark',
      points: 890,
      gold: 13,
      silver: 11,
      bronze: 8,
      totalMedals: 32
    }
  ];

  const filteredAthletes = athletesRankData.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return a.name.toLowerCase().includes(q) || a.club.toLowerCase().includes(q) || a.division.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{tr('Официальный рейтинг Uventex', 'Uventex расмий рейтинги', 'Official Rankings')}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {tr('Сезон:', 'Сезон:', 'Season:')} <strong>{selectedSeason}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {tr('Рейтинги спортсменов и клубов', 'Спортчулардын жана клубдардын рейтинги', 'Athletes & Clubs Leaderboard')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tr(
              'Начисление рейтинговых очков по результатам официальных соревнований WKF и лиги Uventex',
              'WKF жана Uventex лигасынын расмий мелдештеринин жыйынтыгы боюнча рейтингдик упайларды эсептөө',
              'Official national and league ranking points accrued from certified championships'
            )}
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveRankTab('athletes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRankTab === 'athletes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr('Спортсмены', 'Спортчулар', 'Athletes')}
          </button>
          <button
            onClick={() => setActiveRankTab('clubs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRankTab === 'clubs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr('Клубы и Студии', 'Клубдар жана Студиялар', 'Clubs')}
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={tr(
              'Поиск в рейтинге по имени или клубу...',
              'Рейтингден аты же клубу боюнча издөө...',
              'Search ranking by name or club...'
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-pointer"
        >
          <option value="2026">{tr('Сезон 2026', 'Сезон 2026', 'Season 2026')}</option>
          <option value="2025">{tr('Сезон 2025', 'Сезон 2025', 'Season 2025')}</option>
        </select>
      </div>

      {/* Athletes Leaderboard Table */}
      {activeRankTab === 'athletes' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">{tr('Спортсмен', 'Спортчу', 'Athlete')}</th>
                <th className="py-3 px-4">{tr('Клуб / Регион', 'Клуб / Аймак', 'Club / Region')}</th>
                <th className="py-3 px-4">{tr('Весовая категория', 'Салмак категориясы', 'Weight Division')}</th>
                <th className="py-3 px-3 text-center">🥇 {tr('Золото', 'Алтын', 'Gold')}</th>
                <th className="py-3 px-3 text-center">🥈 {tr('Серебро', 'Күмүш', 'Silver')}</th>
                <th className="py-3 px-3 text-center">🥉 {tr('Бронза', 'Коло', 'Bronze')}</th>
                <th className="py-3 px-4 text-right">{tr('Рейтинг (pts)', 'Рейтинг (упай)', 'Rating (pts)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAthletes.map((a) => (
                <tr key={a.rank} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-bold font-mono">
                    {a.rank === 1 ? '🥇 1' : a.rank === 2 ? '🥈 2' : a.rank === 3 ? '🥉 3' : a.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{a.flag}</span>
                      <span className="font-bold text-slate-900">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {a.club} <span className="text-slate-400">({a.city})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {a.division}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-600">{a.gold}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">{a.silver}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-orange-600">{a.bronze}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sky-600 text-sm">
                    {a.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clubs Leaderboard Table */}
      {activeRankTab === 'clubs' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">{tr('Клуб / Студия', 'Клуб / Студия', 'Club / Studio')}</th>
                <th className="py-3 px-4">{tr('Главный тренер', 'Башкы машыктыруучу', 'Head Coach')}</th>
                <th className="py-3 px-4">{tr('Локация', 'Жайгашкан жери', 'Location')}</th>
                <th className="py-3 px-3 text-center">🥇 {tr('Золото', 'Алтын', 'Gold')}</th>
                <th className="py-3 px-3 text-center">🥈 {tr('Серебро', 'Күмүш', 'Silver')}</th>
                <th className="py-3 px-3 text-center">🥉 {tr('Бронза', 'Коло', 'Bronze')}</th>
                <th className="py-3 px-4 text-right">{tr('Очки (PTS)', 'Упайлар (PTS)', 'Points (PTS)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clubsRankData.map((c) => (
                <tr key={c.rank} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-bold font-mono">
                    {c.rank === 1 ? '🏆 1' : c.rank === 2 ? '🥈 2' : c.rank === 3 ? '🥉 3' : c.rank}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {c.coach}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.city}, {c.country}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-600">{c.gold}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">{c.silver}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-orange-600">{c.bronze}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sky-600 text-sm">
                    {c.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 3. Virtual Studios & Live Streams View (#virtual_studios)
// -------------------------------------------------------------
export const VirtualStudiosView: React.FC<{ language: 'ru' | 'en' | 'ky'; onNavigateTab: (tab: string) => void }> = ({ language, onNavigateTab }) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const [activeStreamId, setActiveStreamId] = useState<string>('stream-1');

  const streams = [
    {
      id: 'stream-1',
      title: tr(
        'Татами №1 — Главный ковёр (Финалы Кумитэ 18+)',
        'Татами №1 — Башкы килем (Кумитэ 18+ финалдары)',
        'Tatami 1 — Main Mat (Senior Kumite Finals)'
      ),
      presenter: tr(
        'ГСК: Главный судья Белов А.Г.',
        'БКК: Башкы калыс Белов А.Г.',
        'Chief Referee Board: A. Belov'
      ),
      viewers: 1420,
      isLive: true,
      category: tr('Взрослые Кумитэ 18+', 'Чоңдор Кумитэ 18+', 'Senior Kumite 18+'),
      poster: '/src/assets/images/martial_arts_arena_1794135363803.jpg'
    },
    {
      id: 'stream-2',
      title: tr(
        'Татами №2 — Юниоры и Кадеты',
        'Татами №2 — Юниорлор жана Кадеттер',
        'Tatami 2 — Juniors & Cadets'
      ),
      presenter: tr('Судейская бригада №2', '№2 Калыстар бригадасы', 'Referee Team 2'),
      viewers: 680,
      isLive: true,
      category: tr('14-17 лет (-63, -70 кг)', '14-17 жаш (-63, -70 кг)', 'Ages 14-17 (-63, -70 kg)'),
      poster: '/src/assets/images/martial_arts_action_1794135363457.jpg'
    },
    {
      id: 'stream-3',
      title: tr(
        'Татами №3 — Традиционное Shobu Ippon / Sanbon',
        'Татами №3 — Салттуу Shobu Ippon / Sanbon',
        'Tatami 3 — Traditional Shobu Ippon / Sanbon'
      ),
      presenter: tr('Судьи традиционных единоборств', 'Салттуу жекпе-жек калыстары', 'Traditional Referees'),
      viewers: 490,
      isLive: true,
      category: tr('Традиционный абсолют', 'Салттуу абсолюттук категория', 'Traditional Open Weight'),
      poster: '/src/assets/images/karate_tatami_arena_1793821750724.jpg'
    },
    {
      id: 'stream-4',
      title: tr(
        'Татами №4 — Первенство по Ката (Мужчины / Женщины)',
        'Татами №4 — Ката боюнча биринчилик (Эркектер / Аялдар)',
        'Tatami 4 — Kata Master Finals (Men / Women)'
      ),
      presenter: tr('Судейство по 7-критериальной шкале', '7 критерийлүү шкала боюнча калыстык', '7-Criteria Kata Panel'),
      viewers: 820,
      isLive: true,
      category: tr('Финалы Ката Мастера', 'Ката Чеберлер Финалдары', 'Master Kata Finals'),
      poster: '/src/assets/images/championship_podium_1794135363745.jpg'
    }
  ];

  const currentStream = streams.find(s => s.id === activeStreamId) || streams[0];

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>{tr('ПРЯМОЙ ЭФИР · UVENTEX VIRTUAL STUDIOS', 'ТҮЗ ЭФИР · UVENTEX VIRTUAL STUDIOS', 'LIVE BROADCAST · UVENTEX VIRTUAL STUDIOS')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {tr('Virtual Studios — Прямой эфир татами', 'Virtual Studios — Татамиден түз эфир', 'Virtual Studios — Live Tatami Streams')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tr(
              'Прямой эфир поединков с 4-х татами, онлайн-судейство и тайминг в реальном времени',
              '4 татамиден беттештердин түз эфири, онлайн-калыстык жана реалдуу убакыттагы тайминг',
              'Direct live streams from competition tatamis, real-time electronic scores and referee reviews'
            )}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('scoreboard')}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Tv className="w-4 h-4 text-white" />
          <span>{tr('Открыть табло LIVE', 'LIVE таблону ачуу', 'Open Live Scoreboard')}</span>
        </button>
      </div>

      {/* Main Stream Player View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs flex flex-col">
          {/* Player screen */}
          <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden group">
            <img 
              src={currentStream.poster} 
              alt={currentStream.title}
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            
            {/* Live Indicator Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs backdrop-blur font-mono">
                1080p 60fps
              </span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs bg-slate-900/80 text-white px-3 py-1 rounded-lg backdrop-blur">
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {currentStream.viewers.toLocaleString(language === 'en' ? 'en-US' : 'ru-RU')}{' '}
                {tr('зрителей', 'көрүүчү', 'viewers')}
              </span>
            </div>

            {/* Play Button Overlay */}
            <div className="w-16 h-16 rounded-full bg-sky-600/90 hover:bg-sky-500 text-white flex items-center justify-center cursor-pointer shadow-2xl transition-transform hover:scale-110">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-base sm:text-lg font-bold text-white">
                {currentStream.title}
              </div>
              <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
                <span>{currentStream.category}</span>
                <span>•</span>
                <span>{currentStream.presenter}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tatami Channel Switcher */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 space-y-3 shadow-2xs">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
            {tr('Каналы татами', 'Татами каналдары', 'Available Tatami Channels')}
          </div>

          <div className="space-y-2">
            {streams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setActiveStreamId(stream.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  activeStreamId === stream.id 
                    ? 'bg-sky-50 border-sky-300 text-slate-900 shadow-2xs' 
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                  <img src={stream.poster} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[8px] bg-rose-600 text-white font-bold">
                    LIVE
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{stream.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{stream.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. About Us View (#about)
// -------------------------------------------------------------
export const AboutUsView: React.FC<{ language: 'ru' | 'en' | 'ky' }> = ({ language }) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-7xl mx-auto pb-16">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="max-w-3xl space-y-4">
          <span className="px-3 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold uppercase">
            UVENTEX SPORT EVENT SYSTEM
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            {tr('О платформе Uventex', 'Uventex платформасы жөнүндө', 'About Uventex Sport System')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {tr(
              'Uventex — профессиональная цифровая операционная система для управления соревнованиями по спортивным единоборствам и традиционным боевым искусствам. Платформа объединяет онлайн-регистрацию участников, электронное судейство, сетки олимпийской системы, эквайринг и протоколы Минспорта.',
              'Uventex — спорттук жекпе-жек жана салттуу согуш өнөрлөрү боюнча мелдештерди башкаруу үчүн кесиптик санариптик операциялык система. Платформа катышуучуларды онлайн каттоону, электрондук калыстыкты, олимпиадалык системанын торчолорун, эквайрингди жана расмий протоколдорду бириктирет.',
              'Uventex is a dedicated digital management ecosystem for martial arts championships: electronic scoring, elimination draw brackets, medical control, and acquiring.'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {tr('Международные стандарты судейства', 'Калыстыктын эл аралык стандарттары', 'International Standards')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Полная поддержка официальных регламентов соревнований по Кумитэ & Ката: система оценок Иппон/Ваза-ари/Юко, преимущество Сеншу, отрыв 8 очков и автоматическое разведение соклубников.',
              'Кумитэ жана Ката боюнча мелдештердин расмий регламенттерин толук колдоо: Иппон/Ваза-ари/Юко баалоо системасы, Сеншу артыкчылыгы, 8 упай айырмасы жана бир клубдун спортчуларын автоматтык бөлүштүрүү.',
              'Official competition scoring rules: Ippon, Waza-ari, Senshu advantage, 8-point lead mercy rule, and club athlete separation.'
            )}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {tr('Локальная сеть LAN Hub', 'Жергиликтүү LAN Hub тармагы', 'Offline LAN Venue Hub')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Бесперебойное проведение турнира даже при отключении интернета на спортивной арене: автономный локальный сервер синхронизирует татами 1–4 через Wi-Fi.',
              'Спорттук аренада интернет өчүп калса да мелдешти үзгүлтүксүз өткөрүү: автономдук жергиликтүү сервер Wi-Fi аркылуу 1–4 татамини синхрондоштурат.',
              'Offline-ready venue hub guarantees uninterrupted bouts and scoring across all tatamis without external internet connection.'
            )}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {tr('Готовые протоколы Минспорта', 'Спорт министрлигинин даяр протоколдору', 'Certified Protocols')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Автоматическое формирование итоговых протоколов соревнований с официальной печатью и подписями Главного судьи (СВК) и секретаря.',
              'Башкы калыстын жана катчынын расмий мөөрү жана кол тамгалары менен мелдештин жыйынтыктоочу протоколдорун автоматтык түрдө түзүү.',
              'Instant generation of official results bulletins, weigh-in acts, and medal standings ready for sports ministry submission.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. Help & FAQ View (#help)
// -------------------------------------------------------------
export const HelpFaqView: React.FC<{ language: 'ru' | 'en' | 'ky' }> = ({ language }) => {
  const tr = (ru: string, ky: string, en: string) => trLang(language, ru, ky, en);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: tr(
        'Как подать индивидуальную заявку спортсмена?',
        'Спортчунун жеке табыштамасын кантип берсе болот?',
        'How to register an individual athlete?'
      ),
      a: tr(
        'На главной странице выберите турнир и нажмите «Подать заявку». Заполните данные спортсмена (ФИО, дата рождения, вес, клуб, разряд), выберите весовую категорию и подтвердите оплату взноса.',
        'Башкы беттен мелдешти тандап, «Катталуу» баскычын басыңыз. Спортчунун маалыматтарын (аты-жөнү, туулган күнү, салмагы, клубу, разряды) толтуруп, салмак категориясын тандап, төгүмдү төлөөнү ырастаңыз.',
        'Select the tournament on the homepage and click "Register Athlete". Fill in the athlete profile, weight category, club affiliation and confirm payment.'
      )
    },
    {
      q: tr(
        'Как тренеру подать общую командную заявку?',
        'Машыктыруучу жалпы командалык табыштаманы кантип бере алат?',
        'How can coaches submit a full team entry?'
      ),
      a: tr(
        'Тренер может войти через «Кабинет тренера» или раздел «Studios», выбрать нужный турнир и подать заявку списком на всех спортсменов своего клуба с автоматическим выставлением единого счёта.',
        'Машыктыруучу «Машыктыруучунун кабинети» же «Studios» бөлүмү аркылуу кирип, керектүү мелдешти тандап, өз клубунун бардык спортчуларына бирдиктүү эсеп менен тизме түрүндө табыштама бере алат.',
        'Coaches can use the Coach Portal to batch-register their club roster and generate a single team entry fee invoice.'
      )
    },
    {
      q: tr(
        'Какие способы оплаты взносов поддерживаются?',
        'Төгүмдөрдү төлөөнүн кандай ыкмалары колдоого алынат?',
        'What payment methods are supported?'
      ),
      a: tr(
        'Поддерживаются: СБП (динамический QR-код без комиссии), банковские карты МИР, Visa, Mastercard, безналичный расчёт для юрлиц (выставление счёта клубу), а также наличные на мандатной комиссии.',
        'Төмөнкүлөр колдоого алынат: СБП (динамикалык QR-код), МИР, Visa, Mastercard банк карталары, юридикалык жактар үчүн накталай эмес эсептешүү (клубка эсеп коюу), ошондой эле мандаттык комиссияда накталай төлөө.',
        'Fast QR-code payments, bank cards (MIR/Visa/Mastercard), corporate invoice for clubs, and cash at weigh-in.'
      )
    },
    {
      q: tr(
        'Как работает видеоповтор (VR) и апелляция тренера?',
        'Видеокайталоо (VR) жана машыктыруучунун апелляциясы кантип иштейт?',
        'How does Video Review (VR) challenge work?'
      ),
      a: tr(
        'Тренер имеет право запросить видеоповтор (карточка VR), подняв карточку во время поединка. Главный судья ГСК пересматривает момент по мульти-камерной записи и выносит окончательное решение.',
        'Машыктыруучу беттеш учурунда VR карточкасын көтөрүү менен видеокайталоону суроого укуктуу. Башкы калыс көп камералуу жазуу боюнча учурду кайра карап чыгып, акыркы чечимди чыгарат.',
        'Coaches can challenge a decision by presenting their VR card. The Chief Referee reviews multi-camera footage and issues the verdict.'
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-4xl mx-auto pb-16">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
          {tr('СПРАВКА И ПОДДЕРЖКА', 'ЖАРДАМ ЖАНА КОЛДОО', 'FAQ & SUPPORT')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {tr('Центр помощи и частые вопросы', 'Жардам борбору жана көп берилүүчү суроолор', 'Help Center & Knowledge Base')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {tr(
            'Ответы на ключевые вопросы по регламенту, регистрации и оплате',
            'Регламент, каттоо жана төлөө боюнча негизги суроолорго жооптор',
            'Answers to common questions regarding registration, rules and scoring'
          )}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              className="w-full p-4 sm:p-5 text-left font-semibold text-sm text-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span>{faq.q}</span>
              <span className="text-sky-600 text-lg font-bold">{openFaqIndex === idx ? '−' : '+'}</span>
            </button>
            {openFaqIndex === idx && (
              <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            {tr('Остались вопросы по турниру?', 'Мелдеш боюнча суроолоруңуз калдыбы?', 'Need direct assistance?')}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {tr(
              'Служба технической поддержки: support@myuventex.com',
              'Техникалык колдоо кызматы: support@myuventex.com',
              'Direct email: support@myuventex.com'
            )}
          </p>
        </div>
        <a 
          href="mailto:support@myuventex.com"
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-sm"
        >
          {tr('Написать в оргкомитет', 'Уюштуруу комитетине жазуу', 'Contact Support')}
        </a>
      </div>
    </div>
  );
};
