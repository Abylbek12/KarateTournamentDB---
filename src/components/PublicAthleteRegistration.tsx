import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Globe, 
  MapPin, 
  Building2, 
  Calendar, 
  Scale, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  QrCode, 
  Printer, 
  User, 
  ChevronRight,
  Tv,
  Lock,
  WifiOff
} from 'lucide-react';
import { 
  Participant, 
  Club, 
  TournamentCategory, 
  Tatami, 
  Gender, 
  BeltRank, 
  Discipline 
} from '../types/schema';
import { getAutoAssignedTatami } from '../utils/wkfBracketSeeding';

interface PublicAthleteRegistrationProps {
  clubs: Club[];
  tournamentCategories: TournamentCategory[];
  tatamis: Tatami[];
  isRegistrationOpen?: boolean;
  registrationDeadline?: string;
  onToggleRegistration?: () => void;
  onRegisterAthlete: (athlete: Participant) => void;
  onNavigateToBracket?: () => void;
  onNavigateToParticipants?: () => void;
  onNavigateToVintedRegistration?: () => void;
}

const POPULAR_COUNTRIES = [
  'Кыргызстан',
  'Казахстан',
  'Узбекистан',
  'Армения',
  'Узбекистан',
  'Азербайджан',
  'Кыргызстан',
  'Грузия',
  'Турция',
  'Япония'
];

const POPULAR_CITIES = [
  'Бишкек',
  'Ош',
  'Каракол',
  'Кант',
  'Джалал-Абад',
  'Красноярск',
  'Нижний Новгород',
  'Самара',
  'Уфа',
  'Челябинск',
  'Алматы',
  'Астана',
  'Ташкент'
];

export const PublicAthleteRegistration: React.FC<PublicAthleteRegistrationProps> = ({
  clubs,
  tournamentCategories,
  tatamis,
  isRegistrationOpen = true,
  registrationDeadline,
  onToggleRegistration,
  onRegisterAthlete,
  onNavigateToBracket,
  onNavigateToParticipants,
  onNavigateToVintedRegistration
}) => {
  // Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('2002-05-15');
  const [beltRank, setBeltRank] = useState<BeltRank>('black_1dan');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Mandatory Territory & Club Information
  const [clubId, setClubId] = useState(clubs[0]?.id || 'c1');
  const [city, setCity] = useState(clubs[0]?.city || 'Бишкек');
  const [country, setCountry] = useState('Кыргызстан');
  const [customClubName, setCustomClubName] = useState('');
  const [isCustomClub, setIsCustomClub] = useState(false);

  // Anthropometry & Category
  const [declaredWeightKg, setDeclaredWeightKg] = useState<number>(73.5);
  const [discipline, setDiscipline] = useState<Discipline>('kumite');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(tournamentCategories[0]?.id || '');
  const [isMedicalCleared, setIsMedicalCleared] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Submission UI state
  const [submittedAthlete, setSubmittedAthlete] = useState<Participant | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Age calculation
  const calculatedAge = useMemo(() => {
    if (!birthDate) return 20;
    const bDate = new Date(birthDate);
    const today = new Date('2026-11-04'); // Tournament competition date
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  }, [birthDate]);

  // Sync city when club changes from predefined list
  const handleClubChange = (newClubId: string) => {
    setClubId(newClubId);
    if (newClubId === 'custom') {
      setIsCustomClub(true);
    } else {
      setIsCustomClub(false);
      const c = clubs.find((item) => item.id === newClubId);
      if (c) {
        setCity(c.city);
      }
    }
  };

  // Recommended category suggestion based on age, gender, discipline and weight
  const matchedCategories = useMemo(() => {
    return tournamentCategories.filter((cat) => {
      if (cat.gender !== gender) return false;
      if (cat.discipline !== discipline) return false;
      return true;
    });
  }, [tournamentCategories, gender, discipline]);

  // Current selected category object and its auto-assigned tatami
  const currentCategoryObj = useMemo(() => {
    return tournamentCategories.find((tc) => tc.id === selectedCategoryId) || tournamentCategories[0];
  }, [tournamentCategories, selectedCategoryId]);

  const autoTatamiInfo = useMemo(() => {
    if (!currentCategoryObj) return null;
    return getAutoAssignedTatami(currentCategoryObj, tatamis);
  }, [currentCategoryObj, tatamis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!lastName.trim() || !firstName.trim()) {
      setValidationError('Пожалуйста, укажите фамилию и имя атлета.');
      return;
    }

    if (!city.trim()) {
      setValidationError('Город является обязательным полем для проверки посева WKF.');
      return;
    }

    if (!country.trim()) {
      setValidationError('Страна является обязательным полем для исключения поединков в первых 2-х кругах.');
      return;
    }

    if (declaredWeightKg <= 15 || declaredWeightKg >= 250) {
      setValidationError('Укажите корректный соревновательный вес (от 15 до 250 кг).');
      return;
    }

    const resolvedClub = isCustomClub 
      ? { id: `c_custom_${Date.now()}`, name: customClubName.trim() || 'Независимый клуб' }
      : clubs.find((c) => c.id === clubId) || { id: 'c1', name: 'СК "Тигр"' };

    const generatedLicense = licenseNumber.trim() || `${country === 'Кыргызстан' ? 'RUS' : country.substring(0, 3).toUpperCase()}-KRT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newParticipant: Participant = {
      id: `p_reg_${Date.now()}`,
      tournamentId: 'tourn1',
      clubId: resolvedClub.id,
      clubName: resolvedClub.name,
      city: city.trim(),
      country: country.trim(),
      categoryId: selectedCategoryId || currentCategoryObj?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate,
      beltRank,
      declaredWeightKg: Number(declaredWeightKg),
      actualWeightKg: null,
      isWeighedIn: false,
      isMedicalCleared,
      status: 'registered',
      licenseNumber: generatedLicense
    };

    onRegisterAthlete(newParticipant);
    setSubmittedAthlete(newParticipant);
  };

  const handleResetForm = () => {
    setSubmittedAthlete(null);
    setLastName('');
    setFirstName('');
    setLicenseNumber('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Vinted Registration Mode Switcher Banner */}
      {onNavigateToVintedRegistration && (
        <div className="bg-gradient-to-r from-[#09B1BA]/20 via-[#09B1BA]/10 to-transparent border border-[#09B1BA]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#09B1BA] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              V
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Многошаговая регистрация в стиле Vinted</span>
                <span className="text-[10px] bg-[#09B1BA] text-white font-bold px-2 py-0.5 rounded-full uppercase">
                  Новое
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Шаг 1: условия, конфиденциальность и cookie. Шаг 2: email, пароль, имя, фамилия и пол. Кнопка «Завершить».
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToVintedRegistration}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#09B1BA] hover:bg-[#079ca4] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Открыть регистрацию Vinted</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 p-6 sm:p-8 md:p-10 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold tracking-wider uppercase">
              Официальная WKF регистрация
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Защита жеребьевки: Клуб · Город · Страна
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Публичная электронная заявка спортсмена
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Подайте онлайн-заявку на участие в турнире. Все указанные параметры (<strong className="text-rose-400">клуб, город, страна, вес и возраст</strong>) 
            автоматически передаются в базу данных PostgreSQL и используются алгоритмом WKF для исключения 
            поединков между соклубниками и земляками в первых двух кругах соревнований.
          </p>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {submittedAthlete ? (
        <div className="p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500 shadow-2xl space-y-6 animate-scaleIn">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                  Заявка успешно принята и внесена в базу данных
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">
                  {submittedAthlete.lastName} {submittedAthlete.firstName}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 font-mono">
                  <span>Лицензия: <strong className="text-white">{submittedAthlete.licenseNumber}</strong></span>
                  <span>·</span>
                  <span>ID: <strong className="text-slate-300">{submittedAthlete.id}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>Печать аккредитационного талона</span>
              </button>
              <button
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-rose-900/30"
              >
                <UserPlus className="w-4 h-4" />
                <span>Зарегистрировать следующего атлета</span>
              </button>
            </div>
          </div>

          {/* Electronic Accreditation Pass Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Карточка допуска и распределения в сетку</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Клуб / Организация:</span>
                  <span className="font-bold text-white text-sm">{submittedAthlete.clubName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Город и страна:</span>
                  <span className="font-bold text-sky-400 text-sm">{submittedAthlete.city}, {submittedAthlete.country}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Заявленный вес:</span>
                  <span className="font-bold text-rose-400 text-sm">{submittedAthlete.declaredWeightKg} кг</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Дата рождения / Возраст:</span>
                  <span className="font-bold text-white text-sm">{submittedAthlete.birthDate} ({calculatedAge} лет)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Квалификация:</span>
                  <span className="font-bold text-amber-300 text-sm">{submittedAthlete.beltRank.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Статус взвешивания:</span>
                  <span className="font-bold text-amber-400 text-sm">Ожидает взвешивания</span>
                </div>
              </div>

              {/* Automatic Tatami Placement Box */}
              {autoTatamiInfo && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-900/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-600/40 flex items-center justify-center text-rose-400 font-black text-sm">
                      №{autoTatamiInfo.tatami.number}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Автоматически назначенная соревновательная площадка</div>
                      <div className="text-[11px] text-slate-400 font-mono">{autoTatamiInfo.tatami.name} · {autoTatamiInfo.reason}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded bg-slate-800 text-emerald-400 text-xs font-mono font-bold border border-slate-700 whitespace-nowrap">
                    Дивизион закреплен
                  </span>
                </div>
              )}
            </div>

            {/* QR Ticket / Barcode simulation */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-32 h-32 p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                Электронный пропуск участника
                <div className="text-slate-200 font-bold mt-0.5">{submittedAthlete.licenseNumber}</div>
              </div>
              <div className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800 font-mono">
                ✓ WKF Protection Tag Active
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            {onNavigateToParticipants && (
              <button
                onClick={onNavigateToParticipants}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Открыть список всех участников
              </button>
            )}
            {onNavigateToBracket && (
              <button
                onClick={onNavigateToBracket}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Перейти к турнирной сетке</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : !isRegistrationOpen ? (
        /* Registration Closed View */
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border-2 border-rose-900/60 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center">
            <Lock className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono font-bold tracking-wider uppercase">
              Сбор онлайн-заявок завершен
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Приём заявок на турнир закрыт
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Мандатная комиссия закрыла приём предварительных заявок. База данных спортсменов зафиксирована 
              для проведения жеребьевки и переведена в режим работы по локальной сети зала соревнований (LAN).
            </p>
          </div>

          <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Клубов турнира:</span>
              <span className="text-lg font-bold text-sky-400 mt-0.5 block">{clubs.length} команд</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Дивизионов:</span>
              <span className="text-lg font-bold text-rose-400 mt-0.5 block">{tournamentCategories.length} категорий</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onToggleRegistration && (
              <button
                onClick={onToggleRegistration}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              >
                Администратор: Открыть сбор заявок
              </button>
            )}
            {onNavigateToBracket && (
              <button
                onClick={onNavigateToBracket}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
              >
                <span>Перейти к турнирной сетке (WKF)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* The Registration Form */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields: 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Validation Message */}
            {validationError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Step 1: Personal Credentials */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-600/40 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="text-base font-bold text-white">Персональные данные спортсмена</h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Паспортные данные WKF</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Фамилия атлета <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Например: Абдыкадыров"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Имя атлета <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Например: Данияр"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Пол <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        gender === 'male'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Мужской
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        gender === 'female'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Женский
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Дата рождения <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 transition-colors font-mono"
                  />
                  <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                    Возраст: <strong className="text-rose-400">{calculatedAge} лет</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Квалификация / Пояс
                  </label>
                  <select
                    value={beltRank}
                    onChange={(e) => setBeltRank(e.target.value as BeltRank)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors font-mono"
                  >
                    <option value="black_3dan_plus">3+ Дан (Черный пояс)</option>
                    <option value="black_2dan">2 Дан (Черный пояс)</option>
                    <option value="black_1dan">1 Дан (Черный пояс)</option>
                    <option value="brown_1kyu">1 Кю (Коричневый пояс)</option>
                    <option value="brown_3kyu">3 Кю (Коричневый пояс)</option>
                    <option value="blue_4kyu">4 Кю (Синий пояс)</option>
                    <option value="green_6kyu">6 Кю (Зеленый пояс)</option>
                    <option value="orange_7kyu">7 Кю (Оранжевый пояс)</option>
                    <option value="yellow_8kyu">8 Кю (Желтый пояс)</option>
                    <option value="white_10kyu">10 Кю (Белый пояс)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Номер лицензии спортсмена (WKF ID / ФКР)
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Оставьте пустым для автогенерации (например: KGZ-KRT-8842)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Step 2: MANDATORY Club, City & Country */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-600/40 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Клубная и территориальная принадлежность</h2>
                    <span className="text-[11px] text-sky-400 font-mono">Обязательные поля: club_id, city, country</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-mono font-bold">
                  WKF Protection Core
                </span>
              </div>

              {/* Informative Banner on Seeding Protection */}
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-900/60 text-xs text-slate-300 flex items-start gap-3">
                <Globe className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white block font-medium">Критерий защиты жеребьевки ВКФ:</strong>
                  При генерации турнирной сетки атлеты с одинаковым клубом, городом или страной разводятся по 
                  противоположным квадрантам и половинам сетки. Поединок между ними в 1-м и 2-м кругах 
                  математически исключен.
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Страна представительства (country) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-normal text-slate-400">Международный реестр</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_COUNTRIES.map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => setCountry(cName)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        country === cName
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cName}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Введите страну вручную..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Город (city) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-normal text-slate-400">Для разведения земляков</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_CITIES.map((cCity) => (
                    <button
                      key={cCity}
                      type="button"
                      onClick={() => setCity(cCity)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        city === cCity
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cCity}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Введите город..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>

              {/* Club Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Спортивный клуб / Додзё (club_id) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={clubId}
                  onChange={(e) => handleClubChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city}, {c.region || 'РФ'}) — {c.shortCode}
                    </option>
                  ))}
                  <option value="custom">+ Заявить другой / новый клуб</option>
                </select>

                {isCustomClub && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={customClubName}
                      onChange={(e) => setCustomClubName(e.target.value)}
                      placeholder="Укажите точное наименование клуба или школы..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Anthropometry, Category and Medical Clearance */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h2 className="text-base font-bold text-white">Весовая категория и допуск к боям</h2>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Мандатная комиссия</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Заявленный вес (кг) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={declaredWeightKg}
                      onChange={(e) => setDeclaredWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">
                      КГ
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Дисциплина соревнований
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscipline('kumite')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        discipline === 'kumite'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Кумитэ (Бои)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscipline('kata')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        discipline === 'kata'
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Ката (Формы)
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Целевой дивизион соревнований
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {matchedCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.ageCategoryName || 'Взрослые'} · {cat.weightCategoryName || 'Ката'} ({cat.discipline === 'kata' ? 'Ката' : 'Кумитэ'})
                    </option>
                  ))}
                  {matchedCategories.length === 0 && (
                    tournamentCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.ageCategoryName} · {cat.weightCategoryName || 'Ката'} ({cat.gender === 'male' ? 'М' : 'Ж'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Medical & Regulations Checkboxes */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMedicalCleared}
                    onChange={(e) => setIsMedicalCleared(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-800 focus:ring-0"
                  />
                  <span>Имеется медицинский допуск врачебно-физкультурного диспансера (ВФД)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-800 focus:ring-0"
                  />
                  <span>Подтверждаю согласие с антидопинговыми правилами WADA и регламентом WKF</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-950/50 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <UserPlus className="w-5 h-5" />
              <span>ПОДАТЬ ЗАЯВКУ В БАЗУ ДАННЫХ И СЕТКУ ТУРНИРА</span>
            </button>
          </div>

          {/* Right Column: Live Accreditation Preview & Auto Tatami Assignment Info */}
          <div className="space-y-6">
            {/* Live Accreditation Badge Preview */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
                <span className="text-slate-400">ПРЕДПРОСМОТР БЕЙДЖА</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Preview
                </span>
              </div>

              {/* Digital Pass Card */}
              <div className="rounded-2xl bg-slate-950 border-2 border-slate-800 p-5 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                      WKF COMPETITOR PASS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    2026 СЕЗОН
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl font-bold">
                    <User className="w-7 h-7 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight">
                      {lastName || 'Фамилия'} {firstName || 'Имя'}
                    </h3>
                    <div className="text-xs text-sky-400 font-mono mt-0.5">
                      {city || 'Город'}, {country || 'Страна'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">КЛУБ:</span>
                    <span className="text-white font-bold truncate block">
                      {isCustomClub ? (customClubName || 'Новый клуб') : (clubs.find((c) => c.id === clubId)?.name || 'СК Самурай')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ВЕС / ВОЗРАСТ:</span>
                    <span className="text-rose-400 font-bold block">
                      {declaredWeightKg} кг · {calculatedAge} лет
                    </span>
                  </div>
                </div>

                {/* Protection Status Chip */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono flex items-center justify-between">
                  <span className="text-slate-400">Посев с разведением:</span>
                  <span className="text-emerald-400 font-bold">1-2 круги защищены</span>
                </div>
              </div>
            </div>

            {/* Automatic Tatami Assignment Details */}
            {autoTatamiInfo && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-rose-400" />
                    <span>Авто-назначение татами</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold">
                    Татами №{autoTatamiInfo.tatami.number}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Выбранный дивизион:</span>
                    <div className="text-white font-bold mt-0.5">
                      {currentCategoryObj?.ageCategoryName} · {currentCategoryObj?.weightCategoryName || 'Ката'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Основание выбора ковра:</span>
                    <div className="text-slate-300 leading-relaxed mt-0.5">
                      {autoTatamiInfo.reason}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Локация: {autoTatamiInfo.tatami.locationZone}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
