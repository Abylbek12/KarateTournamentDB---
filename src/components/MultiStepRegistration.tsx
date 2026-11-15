import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Cookie, 
  FileText, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Building2,
  MapPin,
  Globe,
  Scale,
  Calendar,
  Award,
  QrCode,
  Printer,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  ClipboardCheck,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { 
  Participant, 
  Club, 
  TournamentCategory, 
  Tatami, 
  Gender, 
  BeltRank, 
  Discipline,
  Tournament
} from '../types/schema';
import { getAutoAssignedTatami } from '../utils/wkfBracketSeeding';
import { useApp } from '../context/AppContext';

interface MultiStepRegistrationProps {
  tournament?: Tournament;
  clubs: Club[];
  tournamentCategories: TournamentCategory[];
  tatamis: Tatami[];
  isRegistrationOpen?: boolean;
  registrationDeadline?: string;
  onBackToHome?: () => void;
  onRegisterAthlete: (athlete: Participant) => void;
  onNavigateToBracket?: () => void;
  onNavigateToParticipants?: () => void;
  onNavigateToScoreboard?: () => void;
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
  'ОАЭ'
];

export const MultiStepRegistration: React.FC<MultiStepRegistrationProps> = ({
  tournament: propTournament,
  clubs,
  tournamentCategories,
  tatamis,
  isRegistrationOpen = true,
  registrationDeadline = '2026-11-04T18:00',
  onBackToHome,
  onRegisterAthlete,
  onNavigateToBracket,
  onNavigateToParticipants,
  onNavigateToScoreboard
}) => {
  const { language, localizeTournament } = useApp();
  const tournament = propTournament ? localizeTournament(propTournament) : undefined;

  // Stepper state: 1 (Agreements) -> 2 (Personal & Athlete Details) -> 3 (Accreditation / Success)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // ==========================================
  // STEP 1 STATE: Legal Agreements & Cookies
  // ==========================================
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToCookies, setAgreedToCookies] = useState(false);
  const [marketingNotifications, setMarketingNotifications] = useState(true);

  // Document Accordion Expansion States
  const [expandedDoc, setExpandedDoc] = useState<'terms' | 'privacy' | 'cookies' | null>(null);

  // ==========================================
  // STEP 2 STATE: Personal Details & Athlete Profile
  // ==========================================
  // Account Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Personal Identification (ФИО)
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState('2002-05-15');

  // Affiliation (Mandatory for WKF smart seeding separation)
  const [clubId, setClubId] = useState(clubs[0]?.id || 'c1');
  const [city, setCity] = useState(clubs[0]?.city || 'Бишкек');
  const [country, setCountry] = useState('Кыргызстан');
  const [customClubName, setCustomClubName] = useState('');
  const [isCustomClub, setIsCustomClub] = useState(false);

  // Sports Parameters
  const [declaredWeightKg, setDeclaredWeightKg] = useState<number>(73.5);
  const [beltRank, setBeltRank] = useState<BeltRank>('black_1dan');
  const [discipline, setDiscipline] = useState<Discipline>('kumite');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(tournamentCategories[0]?.id || '');

  // UI, Submission and Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredAthlete, setRegisteredAthlete] = useState<Participant | null>(null);

  // Age calculation based on tournament date (2026-11-04)
  const calculatedAge = useMemo(() => {
    if (!birthDate) return 20;
    const bDate = new Date(birthDate);
    const today = new Date('2026-11-04');
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
      const matchGender = cat.gender === gender || cat.gender === 'mixed';
      const matchDiscipline = cat.discipline === discipline;
      return matchGender && matchDiscipline;
    });
  }, [tournamentCategories, gender, discipline]);

  // Selected Category Object
  const currentCategoryObj = useMemo(() => {
    return tournamentCategories.find((c) => c.id === selectedCategoryId) || tournamentCategories[0];
  }, [tournamentCategories, selectedCategoryId]);

  // Auto-assigned Tatami Preview based on division
  const autoTatamiInfo = useMemo(() => {
    if (!currentCategoryObj) return null;
    return getAutoAssignedTatami(currentCategoryObj, tatamis);
  }, [currentCategoryObj, tatamis]);

  // Step 1 Validation: All 3 mandatory legal checkboxes must be accepted
  const isStep1Valid = useMemo(() => {
    return agreedToTerms && agreedToPrivacy && agreedToCookies;
  }, [agreedToTerms, agreedToPrivacy, agreedToCookies]);

  // Handle "Select All" toggle for legal terms
  const handleSelectAllAgreements = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreedToTerms(checked);
    setAgreedToPrivacy(checked);
    setAgreedToCookies(checked);
    setMarketingNotifications(checked);
    if (errors.step1) {
      setErrors((prev) => ({ ...prev, step1: '' }));
    }
  };

  const isAllAgreed = agreedToTerms && agreedToPrivacy && agreedToCookies && marketingNotifications;

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const passwordStrengthLabel = useMemo(() => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Слабый пароль', color: 'text-rose-400', bar: 'bg-rose-500', width: '25%' };
      case 2:
        return { text: 'Средняя надежность', color: 'text-amber-400', bar: 'bg-amber-500', width: '50%' };
      case 3:
        return { text: 'Надежный пароль', color: 'text-blue-400', bar: 'bg-blue-500', width: '75%' };
      case 4:
        return { text: 'Максимальная защита', color: 'text-emerald-400', bar: 'bg-emerald-500', width: '100%' };
      default:
        return { text: '', color: 'text-slate-500', bar: 'bg-slate-700', width: '0%' };
    }
  }, [passwordStrength]);

  // Navigation from Step 1 to Step 2
  const handleProceedToStep2 = () => {
    if (!isStep1Valid) {
      setErrors((prev) => ({
        ...prev,
        step1: 'Необходимо подтвердить все три обязательных пункта (Условия, Конфиденциальность, Cookies) для перехода к следующему шагу.'
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, step1: '' }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 Submission: "Завершить"
  const handleFinishRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    // 1. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Укажите действующий адрес электронной почты';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Некорректный формат email (пример: athlete@domain.com)';
    }

    // 2. Password validation
    if (!password) {
      newErrors.password = 'Придумайте пароль для входа в кабинет участника';
    } else if (password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    }

    // 3. ФИО validation
    if (!lastName.trim()) {
      newErrors.lastName = 'Укажите фамилию участника';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Фамилия должна быть не короче 2 букв';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'Укажите имя участника';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'Имя должно быть не короче 2 букв';
    }

    // 4. Territory validation
    if (!city.trim()) {
      newErrors.city = 'Укажите город спортсмена (обязательно для разведения WKF)';
    }
    if (!country.trim()) {
      newErrors.country = 'Укажите страну спортсмена';
    }
    if (isCustomClub && !customClubName.trim()) {
      newErrors.customClub = 'Введите название спортивного клуба';
    }

    // 5. Weight validation
    if (!declaredWeightKg || declaredWeightKg <= 15 || declaredWeightKg > 150) {
      newErrors.weight = 'Укажите корректный вес спортсмена (от 15 до 150 кг)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstField}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Simulate authentic Uventex sports registration workflow
    setTimeout(() => {
      const generatedLicense = `UVX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const fullNameDisplay = middleName.trim() 
        ? `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`
        : `${lastName.trim()} ${firstName.trim()}`;

      const finalClubId = isCustomClub ? 'custom' : clubId;
      const targetCategory = currentCategoryObj || tournamentCategories[0];

      const newParticipant: Participant = {
        id: `p_reg_${Date.now()}`,
        tournamentId: tournament?.id || 't1',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthDate,
        clubId: finalClubId,
        city: city.trim(),
        country: country.trim(),
        categoryId: targetCategory.id,
        beltRank,
        declaredWeightKg: Number(declaredWeightKg),
        actualWeightKg: null,
        isWeighedIn: false,
        isMedicalCleared: true,
        status: 'registered',
        licenseNumber: generatedLicense
      };

      onRegisterAthlete(newParticipant);
      setRegisteredAthlete(newParticipant);
      setIsSubmitting(false);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 750);
  };

  const handleResetForNextAthlete = () => {
    setCurrentStep(1);
    setRegisteredAthlete(null);
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setPassword('');
    setEmail('');
    setErrors({});
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* ========================================================
          UVENTEX-STYLE PLATFORM SHELL
         ======================================================== */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden transition-all">
        
        {/* Top Minimalist Header in Uventex Sports Style */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 sm:px-8 py-6 relative">
          {/* Top-Left Back Button as requested */}
          {onBackToHome && (
            <div className="mb-4">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-semibold transition-all cursor-pointer group shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>Назад к турниру</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-900/40">
                  UX
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                  TATAMI.KG · {tournament ? tournament.rulesType.toUpperCase() : 'WKF'} PROTOCOL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  PostgreSQL Sync
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-2">
                Онлайн-регистрация {tournament ? `на «${tournament.title}»` : 'участников'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {tournament 
                  ? `Подача электронной заявки спортсмена (${tournament.city}, ${tournament.venueName}). Все указанные параметры автоматически передаются в судейскую базу данных.`
                  : 'Многошаговая подача электронной заявки спортсмена с соблюдением требований регламента WKF, проверкой защищенного разведения клубов и фиксацией в судейской базе данных турнира.'}
              </p>
            </div>

            {/* Step Counter Badge */}
            <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Статус процесса</span>
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 mt-0.5">
                {currentStep === 1 && 'Шаг 1 из 2 · Соглашения'}
                {currentStep === 2 && 'Шаг 2 из 2 · Личные данные'}
                {currentStep === 3 && '✓ Завершено'}
              </span>
            </div>
          </div>

          {/* Minimalist Professional Stepper Line */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {/* Step 1 Pill */}
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
              currentStep === 1 
                ? 'bg-blue-950/40 border-blue-500/60 text-white' 
                : currentStep > 1 
                ? 'bg-slate-900 border-emerald-600/50 text-emerald-300' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep > 1 
                  ? 'bg-emerald-500 text-white' 
                  : currentStep === 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold block truncate">1. Условия и Cookie</span>
                <span className="text-[10px] text-slate-400 block truncate">Правовые соглашения</span>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
              currentStep === 2 
                ? 'bg-blue-950/40 border-blue-500/60 text-white' 
                : currentStep > 2 
                ? 'bg-slate-900 border-emerald-600/50 text-emerald-300' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep > 2 
                  ? 'bg-emerald-500 text-white' 
                  : currentStep === 2 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold block truncate">2. Личные данные</span>
                <span className="text-[10px] text-slate-400 block truncate">Email, пароль, ФИО, пол</span>
              </div>
            </div>

            {/* Step 3 (Completed) Pill */}
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
              currentStep === 3 
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold block truncate">3. Аккредитация</span>
                <span className="text-[10px] text-slate-400 block truncate">Карточка WKF и QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            STEP 1: УСЛОВИЯ, ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ, COOKIES
           ======================================================== */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  Шаг 1: Условия использования, конфиденциальность и Cookies
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Для обеспечения безопасности данных участников и соблюдения регламента WKF подтвердите согласие с документами:
                </p>
              </div>

              {/* Fast "Select All" toggle button in clean minimalist style */}
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition-colors shrink-0">
                <input
                  type="checkbox"
                  checked={isAllAgreed}
                  onChange={handleSelectAllAgreements}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <span>Выбрать все пункты</span>
              </label>
            </div>

            {/* Error Notice */}
            {errors.step1 && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{errors.step1}</span>
              </div>
            )}

            {/* Document 1: Условия использования */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              agreedToTerms 
                ? 'bg-slate-950/60 border-blue-500/50 shadow-sm' 
                : 'bg-slate-950/30 border-slate-800'
            }`}>
              <div className="flex items-start gap-3.5">
                <input
                  id="chk-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (errors.step1) setErrors((prev) => ({ ...prev, step1: '' }));
                  }}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="chk-terms" className="text-sm font-bold text-white cursor-pointer flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      Условия использования соревновательной платформы
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                        Обязательно
                      </span>
                    </span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Я подтверждаю ознакомление с правилами турнира по карате (регламент WKF), согласен с условиями допуска,
                    прохождением мандатной комиссии, взвешивания и обязуюсь соблюдать спортивную этику.
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedDoc(expandedDoc === 'terms' ? null : 'terms')}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {expandedDoc === 'terms' ? (
                      <>Свернуть текст условий <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Читать подробный текст условий <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>

                  {expandedDoc === 'terms' && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed font-mono">
                      <p className="font-bold text-white">1. Общий соревновательный регламент WKF</p>
                      <p>Участник или его законный представитель подтверждает достоверность заявленной весовой и возрастной категории, а также наличие необходимой спортивной экипировки установленного образца (накладки, щитки, капа, защита груди/паха).</p>
                      <p className="font-bold text-white">2. Регламент жеребьевки и расписания</p>
                      <p>Турнирная сетка формируется автоматизированным модулем с защитой от встречи представителей одной команды в 1-м и 2-м кругах. Решение Главной судейской коллегии (ГСК) является окончательным.</p>
                      <p className="font-bold text-white">3. Ответственность за достоверность</p>
                      <p>Предоставление заведомо ложных сведений о дате рождения или клубе влечет дисквалификацию атлета без компенсации взноса.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document 2: Политика конфиденциальности */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              agreedToPrivacy 
                ? 'bg-slate-950/60 border-blue-500/50 shadow-sm' 
                : 'bg-slate-950/30 border-slate-800'
            }`}>
              <div className="flex items-start gap-3.5">
                <input
                  id="chk-privacy"
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => {
                    setAgreedToPrivacy(e.target.checked);
                    if (errors.step1) setErrors((prev) => ({ ...prev, step1: '' }));
                  }}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="chk-privacy" className="text-sm font-bold text-white cursor-pointer flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Политика конфиденциальности и защита персональных данных
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                        Обязательно
                      </span>
                    </span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Даю согласие на обработку моих персональных данных (ФИО, дата рождения, email, город, клуб) в соответствии
                    с законодательством о защите персональных данных (GDPR / 152-ФЗ) для формирования турнирных протоколов.
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedDoc(expandedDoc === 'privacy' ? null : 'privacy')}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {expandedDoc === 'privacy' ? (
                      <>Свернуть политику <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Читать политику конфиденциальности подробно <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>

                  {expandedDoc === 'privacy' && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed font-mono">
                      <p className="font-bold text-white">1. Цели сбора персональных данных</p>
                      <p>Персональные данные собираются исключительно для идентификации атлета, верификации лицензии в базе данных PostgreSQL, печати аккредитационных бейджей и публикации официальных протоколов ГСК.</p>
                      <p className="font-bold text-white">2. Хранение и безопасность</p>
                      <p>Данные хранятся в зашифрованном виде. Доступ к контактным данным ограничен оргкомитетом соревнований.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document 3: Файлы Cookie */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              agreedToCookies 
                ? 'bg-slate-950/60 border-blue-500/50 shadow-sm' 
                : 'bg-slate-950/30 border-slate-800'
            }`}>
              <div className="flex items-start gap-3.5">
                <input
                  id="chk-cookies"
                  type="checkbox"
                  checked={agreedToCookies}
                  onChange={(e) => {
                    setAgreedToCookies(e.target.checked);
                    if (errors.step1) setErrors((prev) => ({ ...prev, step1: '' }));
                  }}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="chk-cookies" className="text-sm font-bold text-white cursor-pointer flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-amber-400" />
                      Политика использования файлов Cookie
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                        Обязательно
                      </span>
                    </span>
                  </label>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Платформа использует обязательные сессионные файлы cookie для авторизации, безопасной синхронизации судейских
                    протоколов и сохранения выбранных фильтров татами в локальной сети зала.
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedDoc(expandedDoc === 'cookies' ? null : 'cookies')}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {expandedDoc === 'cookies' ? (
                      <>Свернуть информацию о cookie <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Подробнее о cookie-файлах платформы <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>

                  {expandedDoc === 'cookies' && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed font-mono">
                      <p className="font-bold text-white">Технические сессионные Cookie</p>
                      <p>Необходимы для работы веб-сокетов онлайн-табло, фиксации авторизации судьи татами и предотвращения повторной отправки заявок.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document 4: Опциональные уведомления */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/20 border border-slate-800 transition-all">
              <div className="flex items-start gap-3.5">
                <input
                  id="chk-notif"
                  type="checkbox"
                  checked={marketingNotifications}
                  onChange={(e) => setMarketingNotifications(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="chk-notif" className="text-sm font-semibold text-slate-300 cursor-pointer flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Оперативные уведомления о вызовах на татами
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Опционально
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Получать SMS и Email оповещения о готовности боя, выходе спортсмена на ковер и результатах поединков.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Все три обязательных пункта должны быть подтверждены для перехода к шагу 2</span>
              </div>

              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!isStep1Valid}
                className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isStep1Valid
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>Продолжить к личным данным</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================
            STEP 2: ВВОД ЛИЧНЫХ ДАННЫХ (EMAIL, ПАРОЛЬ, ФИО, ПОЛ)
           ======================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleFinishRegistration} className="p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Шаг 2: Ввод личных данных участника
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Укажите учетные данные, ФИО, пол, весовую категорию и клуб для протокола WKF:
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад к условиям</span>
              </button>
            </div>

            {/* BLOCK 1: УЧЕТНЫЕ ДАННЫЕ (EMAIL И ПАРОЛЬ) */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                Учетные данные для входа в кабинет атлета
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div id="field-email" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Электронная почта (Email) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="athlete@domain.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.email 
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                          : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div id="field-password" className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Пароль <span className="text-rose-500">*</span>
                    </label>
                    {password && (
                      <span className={`text-[10px] font-mono font-bold ${passwordStrengthLabel.color}`}>
                        {passwordStrengthLabel.text}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="Не менее 8 знаков"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.password 
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                          : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrengthLabel.bar}`}
                        style={{ width: passwordStrengthLabel.width }}
                      />
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* BLOCK 2: ФИО И ПОЛ СПОРТСМЕНА */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Личные данные атлета (ФИО и пол)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Фамилия */}
                <div id="field-lastName" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Фамилия <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                    }}
                    placeholder="Абдыкадыров"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.lastName ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-[11px] text-rose-400">{errors.lastName}</p>
                  )}
                </div>

                {/* Имя */}
                <div id="field-firstName" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Имя <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                    }}
                    placeholder="Александр"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.firstName ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-[11px] text-rose-400">{errors.firstName}</p>
                  )}
                </div>

                {/* Отчество */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Отчество <span className="text-slate-500 font-normal">(при наличии)</span>
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Сергеевич"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* ПОЛ: Минималистичные переключатели в стиле Uventex */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-300">
                  Пол спортсмена <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>🥋 Мужской</span>
                    {gender === 'male' && <Check className="w-3.5 h-3.5 ml-auto stroke-[2.5]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>🥋 Женский</span>
                    {gender === 'female' && <Check className="w-3.5 h-3.5 ml-auto stroke-[2.5]" />}
                  </button>
                </div>
              </div>

              {/* Дата рождения */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Дата рождения <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-blue-400 font-mono">
                    Возраст на дату турнира: <strong>{calculatedAge} лет</strong>
                  </p>
                </div>

                {/* Спортивный разряд / пояс */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Спортивная квалификация / Пояс
                  </label>
                  <select
                    value={beltRank}
                    onChange={(e) => setBeltRank(e.target.value as BeltRank)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="white_9kyu">9 кю (Белый пояс)</option>
                    <option value="yellow_8kyu">8 кю (Желтый пояс)</option>
                    <option value="orange_7kyu">7 кю (Оранжевый пояс)</option>
                    <option value="green_6kyu">6 кю (Зеленый пояс)</option>
                    <option value="blue_5kyu">5 кю (Синий пояс)</option>
                    <option value="purple_4kyu">4 кю (Фиолетовый пояс)</option>
                    <option value="brown_3kyu">3 кю (Коричневый пояс)</option>
                    <option value="brown_2kyu">2 кю (Коричневый пояс)</option>
                    <option value="brown_1kyu">1 кю (Кандидат в мастера спорта / КМС)</option>
                    <option value="black_1dan">1 Дан (Черный пояс / Мастер спорта)</option>
                    <option value="black_2dan">2 Дан (Черный пояс / МСМК)</option>
                    <option value="black_3dan">3 Дан (Черный пояс / ЗМС)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BLOCK 3: ПРИНАДЛЕЖНОСТЬ ДЛЯ ЗАЩИТЫ ЖЕРЕБЬЕВКИ WKF */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Принадлежность (Клуб, Город, Страна)
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  WKF Seeding Protection
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Клуб */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Спортивный клуб <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => handleClubChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                    <option value="custom">+ Другой спортивный клуб...</option>
                  </select>
                </div>

                {/* Город */}
                <div id="field-city" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Город <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    placeholder="Бишкек"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.city ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'
                    }`}
                  />
                  {errors.city && <p className="text-[11px] text-rose-400">{errors.city}</p>}
                </div>

                {/* Страна */}
                <div id="field-country" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Страна <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {POPULAR_COUNTRIES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isCustomClub && (
                <div id="field-customClub" className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Укажите название вашего клуба:
                  </label>
                  <input
                    type="text"
                    value={customClubName}
                    onChange={(e) => setCustomClubName(e.target.value)}
                    placeholder="Например, СК «Ала-Тоо»"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* BLOCK 4: ВЕС, ДИСЦИПЛИНА И АВТОМАТИЧЕСКИЙ ТАТАМИ */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                Вес, соревновательный дивизион и ковер
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Вес */}
                <div id="field-weight" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Заявленный вес (кг) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={declaredWeightKg}
                    onChange={(e) => {
                      setDeclaredWeightKg(parseFloat(e.target.value) || 0);
                      if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                    }}
                    placeholder="73.5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {errors.weight && <p className="text-[11px] text-rose-400">{errors.weight}</p>}
                </div>

                {/* Дисциплина */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Дисциплина
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as Discipline)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="kumite">Кумитэ (Поединки WKF)</option>
                    <option value="kata">Ката (Одиночное)</option>
                    <option value="team_kumite">Командное кумитэ</option>
                    <option value="team_kata">Командное ката</option>
                  </select>
                </div>

                {/* Дивизион / Категория */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Турнирная категория
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {matchedCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Uventex Auto-Assigned Tatami Banner */}
              {autoTatamiInfo && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-slate-300">
                      Назначенная площадка: <strong className="text-blue-300">{autoTatamiInfo.tatami.name}</strong>
                    </span>
                  </div>
                  <span className="text-slate-400 hidden sm:inline text-[11px]">
                    {autoTatamiInfo.reason}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions with exact requested "Завершить" button */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              {/* TARGET BUTTON REQUESTED BY USER: "Завершить" */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Фиксация в БД...</span>
                  </>
                ) : (
                  <>
                    <span>Завершить</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* ========================================================
            STEP 3: ЗАВЕРШЕНИЕ И АККРЕДИТАЦИОННАЯ КАРТОЧКА TATAMI.KG
           ======================================================== */}
        {currentStep === 3 && registeredAthlete && (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-fadeIn">
            
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Регистрация успешно завершена
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
                Спортсмен {registeredAthlete.firstName} {registeredAthlete.lastName} внесен в протокол!
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                Данные записаны в схему PostgreSQL. Лицензия WKF подтверждена, 
                клуб и город разведены алгоритмом жеребьевки в первых двух кругах.
              </p>
            </div>

            {/* Uventex Official Accreditation Pass Card */}
            <div className="max-w-xl mx-auto rounded-2xl bg-slate-950 border border-slate-800 p-6 text-left shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    UX
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {registeredAthlete.firstName} {registeredAthlete.lastName}
                    </h3>
                    <span className="text-[11px] font-mono text-blue-400">
                      Лицензия: {registeredAthlete.licenseNumber}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Статус</span>
                  <span className="text-xs font-bold text-emerald-400">Допущен к боям</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs font-mono border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">КЛУБ</span>
                  <span className="font-bold text-slate-200">
                    {clubs.find((c) => c.id === registeredAthlete.clubId)?.name || 'Спортивный клуб'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ГОРОД</span>
                  <span className="font-bold text-slate-200">{registeredAthlete.city}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ВЕС</span>
                  <span className="font-bold text-slate-200">{registeredAthlete.declaredWeightKg} кг</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ТАТАМИ</span>
                  <span className="font-bold text-blue-400">
                    {autoTatamiInfo?.tatami.name || 'Татами 1'}
                  </span>
                </div>
              </div>

              {/* QR and Security Seal */}
              <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-slate-300" />
                  <span className="font-mono text-[11px]">Электронный чек-ин на взвешивании</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date().toLocaleDateString('ru-RU')} {new Date().toLocaleTimeString('ru-RU')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onNavigateToBracket && (
                <button
                  type="button"
                  onClick={onNavigateToBracket}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors cursor-pointer"
                >
                  Смотреть турнирную сетку
                </button>
              )}

              {onNavigateToScoreboard && (
                <button
                  type="button"
                  onClick={onNavigateToScoreboard}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  Онлайн-табло
                </button>
              )}

              <button
                type="button"
                onClick={handleResetForNextAthlete}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                + Зарегистрировать еще одного спортсмена
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
