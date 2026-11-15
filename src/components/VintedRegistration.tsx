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
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Share2,
  ExternalLink,
  ShieldAlert,
  Heart,
  ShoppingBag
} from 'lucide-react';

export interface VintedUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  gender: 'female' | 'male' | 'other' | 'unspecified';
  birthDate?: string;
  city?: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  agreedToCookies: boolean;
  marketingOptIn: boolean;
  createdAt: string;
}

interface VintedRegistrationProps {
  onSuccess?: (profile: VintedUserProfile) => void;
  onNavigateHome?: () => void;
}

export const VintedRegistration: React.FC<VintedRegistrationProps> = ({
  onSuccess,
  onNavigateHome
}) => {
  // Current active step: 1 (Agreements) -> 2 (Personal details) -> 3 (Completed)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Legal Agreements State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToCookies, setAgreedToCookies] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Document expand states for reading details
  const [expandedDoc, setExpandedDoc] = useState<'terms' | 'privacy' | 'cookies' | null>(null);

  // Step 2: Personal Details State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'unspecified'>('female');
  const [birthDate, setBirthDate] = useState('2000-01-01');
  const [city, setCity] = useState('Бишкек');

  // UI & Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredProfile, setRegisteredProfile] = useState<VintedUserProfile | null>(null);

  // Step 1 validation: all 3 mandatory checkboxes must be checked
  const isStep1Valid = useMemo(() => {
    return agreedToTerms && agreedToPrivacy && agreedToCookies;
  }, [agreedToTerms, agreedToPrivacy, agreedToCookies]);

  // "Select All" toggle helper
  const handleSelectAllAgreements = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreedToTerms(checked);
    setAgreedToPrivacy(checked);
    setAgreedToCookies(checked);
    setMarketingOptIn(checked);
    if (errors.step1) {
      setErrors((prev) => ({ ...prev, step1: '' }));
    }
  };

  const isAllAgreed = agreedToTerms && agreedToPrivacy && agreedToCookies && marketingOptIn;

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0..4
  }, [password]);

  const passwordStrengthLabel = useMemo(() => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Простой', color: 'text-rose-500', bar: 'bg-rose-500', width: '25%' };
      case 2:
        return { text: 'Средний', color: 'text-amber-500', bar: 'bg-amber-500', width: '50%' };
      case 3:
        return { text: 'Хороший', color: 'text-emerald-500', bar: 'bg-emerald-500', width: '75%' };
      case 4:
        return { text: 'Отличный', color: 'text-[#09B1BA]', bar: 'bg-[#09B1BA]', width: '100%' };
      default:
        return { text: '', color: 'text-slate-400', bar: 'bg-slate-200', width: '0%' };
    }
  }, [passwordStrength]);

  // Proceed from Step 1 to Step 2
  const handleNextToStep2 = () => {
    if (!isStep1Valid) {
      setErrors((prev) => ({
        ...prev,
        step1: 'Пожалуйста, подтвердите все обязательные пункты (Условия, Конфиденциальность и Cookie), чтобы продолжить.'
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, step1: '' }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-generate username from first and last name if empty
  const handleAutoSuggestUsername = () => {
    if (firstName && lastName) {
      const translit = (str: string) =>
        str
          .toLowerCase()
          .replace(/а/g, 'a').replace(/б/g, 'b').replace(/в/g, 'v').replace(/г/g, 'g')
          .replace(/д/g, 'd').replace(/е/g, 'e').replace(/ж/g, 'zh').replace(/з/g, 'z')
          .replace(/и/g, 'i').replace(/к/g, 'k').replace(/л/g, 'l').replace(/м/g, 'm')
          .replace(/н/g, 'n').replace(/о/g, 'o').replace(/п/g, 'p').replace(/р/g, 'r')
          .replace(/с/g, 's').replace(/т/g, 't').replace(/у/g, 'u').replace(/ф/g, 'f')
          .replace(/х/g, 'h').replace(/ц/g, 'ts').replace(/ч/g, 'ch').replace(/ш/g, 'sh')
          .replace(/я/g, 'ya');
      const randomNum = Math.floor(100 + Math.random() * 900);
      setUsername(`${translit(firstName)}_${translit(lastName)}_${randomNum}`);
    }
  };

  // Step 2 Validation and Finish ("Завершить")
  const handleFinishRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Введите адрес электронной почты';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Пожалуйста, укажите корректный email (например, name@example.com)';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Придумайте пароль для входа';
    } else if (password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }

    // Validate first name
    if (!firstName.trim()) {
      newErrors.firstName = 'Укажите ваше имя';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'Имя должно содержать не менее 2 букв';
    }

    // Validate last name
    if (!lastName.trim()) {
      newErrors.lastName = 'Укажите вашу фамилию';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Фамилия должна содержать не менее 2 букв';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first error
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`input-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Simulate authentic Vinted registration flow
    setTimeout(() => {
      const finalUsername = username.trim() || `${firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`;
      const newProfile: VintedUserProfile = {
        id: `vinted_usr_${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        username: finalUsername,
        gender,
        birthDate,
        city: city.trim(),
        agreedToTerms,
        agreedToPrivacy,
        agreedToCookies,
        marketingOptIn,
        createdAt: new Date().toISOString()
      };

      setRegisteredProfile(newProfile);
      setIsSubmitting(false);
      setCurrentStep(3);
      if (onSuccess) {
        onSuccess(newProfile);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
  };

  const handleResetForm = () => {
    setCurrentStep(1);
    setAgreedToTerms(false);
    setAgreedToPrivacy(false);
    setAgreedToCookies(false);
    setMarketingOptIn(false);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setRegisteredProfile(null);
    setErrors({});
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4 sm:px-6">
      {/* Vinted Style Container Card */}
      <div className="bg-white text-slate-800 rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden font-sans transition-all">
        
        {/* Header Bar with Signature Vinted Teal Accent */}
        <div className="bg-gradient-to-r from-[#09B1BA] to-[#079ca4] p-6 sm:p-8 text-white relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-2xl tracking-tight flex items-center gap-1.5 text-white">
                <ShoppingBag className="w-7 h-7 text-white stroke-[2.5]" />
                <span className="tracking-wide">vinted</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur">
                Регистрация
              </span>
            </div>

            {currentStep < 3 && (
              <span className="text-xs font-medium text-teal-100 bg-teal-900/20 px-3 py-1 rounded-full">
                Шаг {currentStep} из 2
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {currentStep === 1 && 'Добро пожаловать! Давайте начнем с соглашений'}
            {currentStep === 2 && 'Создание профиля: введите ваши личные данные'}
            {currentStep === 3 && 'Поздравляем! Ваш аккаунт успешно создан'}
          </h1>
          <p className="text-sm text-teal-50 mt-1 max-w-xl">
            {currentStep === 1 && 'Для безопасного и комфортного использования сервиса ознакомьтесь с правилами платформы и подтвердите согласие.'}
            {currentStep === 2 && 'Укажите достоверные контактные данные для входа в систему и персонализации вашего опыта.'}
            {currentStep === 3 && 'Теперь вы полноценный участник нашего сообщества. Приятных покупок, продаж и участия в событиях!'}
          </p>

          {/* Stepper Progress Indicator */}
          <div className="mt-6 flex items-center gap-3">
            {/* Step 1 Pill */}
            <div className={`flex-1 flex items-center gap-2 pb-2 border-b-4 transition-all ${
              currentStep >= 1 ? 'border-white text-white font-bold' : 'border-white/30 text-white/60'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep > 1 ? 'bg-white text-[#09B1BA]' : currentStep === 1 ? 'bg-white text-[#09B1BA]' : 'bg-white/20 text-white'
              }`}>
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </div>
              <span className="text-xs hidden sm:inline">Условия и Cookie</span>
            </div>

            {/* Step 2 Pill */}
            <div className={`flex-1 flex items-center gap-2 pb-2 border-b-4 transition-all ${
              currentStep >= 2 ? 'border-white text-white font-bold' : 'border-white/30 text-white/60'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep > 2 ? 'bg-white text-[#09B1BA]' : currentStep === 2 ? 'bg-white text-[#09B1BA]' : 'bg-white/20 text-white'
              }`}>
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
              </div>
              <span className="text-xs hidden sm:inline">Личные данные</span>
            </div>

            {/* Step 3 (Done) Pill */}
            <div className={`flex-1 flex items-center gap-2 pb-2 border-b-4 transition-all ${
              currentStep === 3 ? 'border-white text-white font-bold' : 'border-white/30 text-white/60'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3 ? 'bg-white text-[#09B1BA]' : 'bg-white/20 text-white'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs hidden sm:inline">Завершение</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 bg-[#FAFBFC]">

          {/* ========================================================
              STEP 1: УСЛОВИЯ ИСПОЛЬЗОВАНИЯ, КОНФИДЕНЦИАЛЬНОСТЬ, КУКИ
             ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#09B1BA]" />
                    Соглашения и конфиденциальность
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Отметьте обязательные пункты, чтобы перейти к вводу личных данных
                  </p>
                </div>

                {/* "Select All" Button/Checkbox */}
                <label className="flex items-center gap-2 text-xs font-semibold text-[#09B1BA] hover:text-[#079ca4] cursor-pointer bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={handleSelectAllAgreements}
                    className="w-4 h-4 rounded text-[#09B1BA] focus:ring-[#09B1BA] cursor-pointer border-slate-300"
                  />
                  <span>Выбрать все</span>
                </label>
              </div>

              {errors.step1 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>{errors.step1}</span>
                </div>
              )}

              {/* Card 1: Условия использования */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                agreedToTerms ? 'bg-white border-teal-300 shadow-sm' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <input
                    id="checkbox-terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (errors.step1) setErrors((prev) => ({ ...prev, step1: '' }));
                    }}
                    className="mt-1 w-5 h-5 rounded text-[#09B1BA] focus:ring-[#09B1BA] cursor-pointer border-slate-300 accent-[#09B1BA]"
                  />
                  <div className="flex-1">
                    <label htmlFor="checkbox-terms" className="text-sm font-semibold text-slate-900 cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#09B1BA]" />
                        Условия использования сервиса
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Обязательно
                        </span>
                      </span>
                    </label>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Я подтверждаю, что мне исполнилось 18 лет, принимаю правила поведения на платформе,
                      правила размещения объявлений и регламент проведения безопасных транзакций.
                    </p>

                    <button
                      type="button"
                      onClick={() => setExpandedDoc(expandedDoc === 'terms' ? null : 'terms')}
                      className="mt-2 text-xs font-semibold text-[#09B1BA] hover:text-[#079ca4] flex items-center gap-1 transition-colors"
                    >
                      {expandedDoc === 'terms' ? (
                        <>Свернуть текст условий <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Читать текст условий подробно <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>

                    {expandedDoc === 'terms' && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed animate-fadeIn">
                        <p className="font-semibold text-slate-800">1. Общие положения платформы Vinted</p>
                        <p>Настоящие Условия определяют порядок использования онлайн-сервиса, права и обязанности пользователей, а также регламент взаимодействия между участниками сообщества.</p>
                        <p className="font-semibold text-slate-800">2. Достоверность предоставляемой информации</p>
                        <p>Пользователь гарантирует актуальность и достоверность предоставляемых контактных данных и несет ответственность за сохранность учетных данных своего аккаунта.</p>
                        <p className="font-semibold text-slate-800">3. Безопасность и этика общения</p>
                        <p>Запрещается размещение спама, оскорбительных материалов и действий, нарушающих действующее законодательство.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Политика конфиденциальности */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                agreedToPrivacy ? 'bg-white border-teal-300 shadow-sm' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <input
                    id="checkbox-privacy"
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => {
                      setAgreedToPrivacy(e.target.checked);
                      if (errors.step1) setErrors((prev) => ({ ...prev, step1: '' }));
                    }}
                    className="mt-1 w-5 h-5 rounded text-[#09B1BA] focus:ring-[#09B1BA] cursor-pointer border-slate-300 accent-[#09B1BA]"
                  />
                  <div className="flex-1">
                    <label htmlFor="checkbox-privacy" className="text-sm font-semibold text-slate-900 cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#09B1BA]" />
                        Политика конфиденциальности
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Обязательно
                        </span>
                      </span>
                    </label>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Я даю согласие на обработку моих персональных данных (имя, email, город) в соответствии с политикой
                      конфиденциальности и требованиями регламента GDPR для авторизации и связи.
                    </p>

                    <button
                      type="button"
                      onClick={() => setExpandedDoc(expandedDoc === 'privacy' ? null : 'privacy')}
                      className="mt-2 text-xs font-semibold text-[#09B1BA] hover:text-[#079ca4] flex items-center gap-1 transition-colors"
                    >
                      {expandedDoc === 'privacy' ? (
                        <>Свернуть политику <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Читать политику конфиденциальности подробно <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>

                    {expandedDoc === 'privacy' && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed animate-fadeIn">
                        <p className="font-semibold text-slate-800">1. Сбор и защита персональных данных</p>
                        <p>Мы используем современные протоколы шифрования SSL/TLS и храним данные в изолированных защищенных дата-центрах.</p>
                        <p className="font-semibold text-slate-800">2. Цели обработки</p>
                        <p>Данные собираются исключительно в целях идентификации пользователя, защиты аккаунта от несанкционированного доступа и отправки сервисных уведомлений.</p>
                        <p className="font-semibold text-slate-800">3. Ваши права</p>
                        <p>Вы имеете право в любой момент запросить копию ваших данных, изменить их или запросить полное удаление учетной записи.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Файлы Cookie */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                agreedToCookies ? 'bg-white border-teal-300 shadow-sm' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-start gap-3.5">
                  <input
                    id="checkbox-cookies"
                    type="checkbox"
                    checked={agreedToCookies}
                    onChange={(e) => {
                      setAgreedToCookies(e.target.checked);
                      if (errors.step1) setErrors((prev) => ({ ...prev, step1: '' }));
                    }}
                    className="mt-1 w-5 h-5 rounded text-[#09B1BA] focus:ring-[#09B1BA] cursor-pointer border-slate-300 accent-[#09B1BA]"
                  />
                  <div className="flex-1">
                    <label htmlFor="checkbox-cookies" className="text-sm font-semibold text-slate-900 cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Cookie className="w-4 h-4 text-[#09B1BA]" />
                        Политика использования файлов Cookie
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Обязательно
                        </span>
                      </span>
                    </label>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Мы используем необходимые технические cookie для работы сессии, а также аналитические cookie,
                      помогающие совершенствовать интерфейс и запоминать ваши предпочтения.
                    </p>

                    <button
                      type="button"
                      onClick={() => setExpandedDoc(expandedDoc === 'cookies' ? null : 'cookies')}
                      className="mt-2 text-xs font-semibold text-[#09B1BA] hover:text-[#079ca4] flex items-center gap-1 transition-colors"
                    >
                      {expandedDoc === 'cookies' ? (
                        <>Свернуть информацию о cookie <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Подробнее о типах используемых cookie <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>

                    {expandedDoc === 'cookies' && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed animate-fadeIn">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Обязательные технические Cookie
                        </div>
                        <p>Обеспечивают авторизацию, защиту от CSRF-атак и сохранение состояния корзины/фильтров.</p>
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-[#09B1BA]" />
                          Функциональные и аналитические Cookie
                        </div>
                        <p>Позволяют запоминать язык интерфейса и оптимизировать скорость загрузки страниц.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Опциональная подписка на рассылку */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 transition-all">
                <div className="flex items-start gap-3.5">
                  <input
                    id="checkbox-marketing"
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded text-[#09B1BA] focus:ring-[#09B1BA] cursor-pointer border-slate-300 accent-[#09B1BA]"
                  />
                  <div className="flex-1">
                    <label htmlFor="checkbox-marketing" className="text-sm font-semibold text-slate-800 cursor-pointer flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      Персональные предложения и новости
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Опционально
                      </span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Получайте информацию о скидках, персональных подборках и новых акциях. Вы всегда сможете отписаться в настройках.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button for Step 1 */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#09B1BA]" />
                  <span>Для перехода к следующему шагу подтвердите 3 обязательных пункта</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextToStep2}
                  disabled={!isStep1Valid}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                    isStep1Valid
                      ? 'bg-[#09B1BA] hover:bg-[#079ca4] text-white cursor-pointer active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Продолжить</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 2: ВВОД ЛИЧНЫХ ДАННЫХ (EMAIL, ПАРОЛЬ, ИМЯ, ФАМИЛИЯ, ПОЛ)
             ======================================================== */}
          {currentStep === 2 && (
            <form onSubmit={handleFinishRegistration} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#09B1BA]" />
                    Ваши личные данные
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Заполните информацию профиля. После этого нажмите «Завершить» для создания аккаунта.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Назад к условиям</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. ИМЯ */}
                <div id="input-firstName" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Имя <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                      }}
                      onBlur={handleAutoSuggestUsername}
                      placeholder="Например, Анна"
                      className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                        errors.firstName 
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' 
                          : 'border-slate-300 focus:border-[#09B1BA] focus:ring-2 focus:ring-[#09B1BA]/20'
                      }`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* 2. ФАМИЛИЯ */}
                <div id="input-lastName" className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Фамилия <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                      }}
                      onBlur={handleAutoSuggestUsername}
                      placeholder="Например, Жумабекова"
                      className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                        errors.lastName 
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' 
                          : 'border-slate-300 focus:border-[#09B1BA] focus:ring-2 focus:ring-[#09B1BA]/20'
                      }`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. ПОЛ (VINTED-STYLE SELECTION CHIPS) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Пол <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'bg-[#09B1BA] text-white border-[#09B1BA] shadow-md shadow-teal-500/10'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>🌸</span>
                    <span>Женский</span>
                    {gender === 'female' && <Check className="w-4 h-4 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-[#09B1BA] text-white border-[#09B1BA] shadow-md shadow-teal-500/10'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>⚡</span>
                    <span>Мужской</span>
                    {gender === 'male' && <Check className="w-4 h-4 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('other')}
                    className={`py-3 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'other'
                        ? 'bg-[#09B1BA] text-white border-[#09B1BA] shadow-md shadow-teal-500/10'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>✨</span>
                    <span>Другой</span>
                    {gender === 'other' && <Check className="w-4 h-4 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('unspecified')}
                    className={`py-3 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      gender === 'unspecified'
                        ? 'bg-[#09B1BA] text-white border-[#09B1BA] shadow-md shadow-teal-500/10'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>🔒</span>
                    <span>Не указывать</span>
                    {gender === 'unspecified' && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Помогает подбирать подходящие категории товаров, одежды и спортивной экипировки в каталоге.
                </p>
              </div>

              {/* 4. EMAIL */}
              <div id="input-email" className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Электронная почта (Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="user@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                      errors.email 
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-[#09B1BA] focus:ring-2 focus:ring-[#09B1BA]/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Мы отправим ссылку для подтверждения учетной записи на этот адрес.
                </p>
              </div>

              {/* 5. ПАРОЛЬ */}
              <div id="input-password" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Пароль <span className="text-rose-500">*</span>
                  </label>
                  {password && (
                    <span className={`text-[11px] font-bold ${passwordStrengthLabel.color}`}>
                      Надежность: {passwordStrengthLabel.text}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Минимум 8 символов"
                    className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                      errors.password 
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' 
                        : 'border-slate-300 focus:border-[#09B1BA] focus:ring-2 focus:ring-[#09B1BA]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrengthLabel.bar}`}
                      style={{ width: passwordStrengthLabel.width }}
                    />
                  </div>
                )}

                {errors.password && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                  <span className={password.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>
                    ✓ От 8 символов
                  </span>
                  <span className={/[0-9]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>
                    ✓ Цифра
                  </span>
                  <span className={/[A-Za-z]/.test(password) ? 'text-emerald-600 font-semibold' : ''}>
                    ✓ Латинские буквы
                  </span>
                </div>
              </div>

              {/* 6. ДОПОЛНИТЕЛЬНЫЕ УДОБНЫЕ ПОЛЯ VINTED: НИКНЕЙМ И ГОРОД */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Имя пользователя (Никнейм)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSuggestUsername}
                      className="text-[11px] font-semibold text-[#09B1BA] hover:underline"
                    >
                      Сгенерировать
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="anna_fashion"
                      className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#09B1BA] focus:ring-2 focus:ring-[#09B1BA]/20 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Отображается в вашем профиле сообщества Vinted.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Город / Населенный пункт
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Бишкек"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#09B1BA] focus:ring-2 focus:ring-[#09B1BA]/20 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Для расчета доставки и поиска продавцов/клубов поблизости.
                  </p>
                </div>
              </div>

              {/* Bottom Action Bar with explicitly requested "Завершить" button */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>

                {/* EXACT REQUIRED BUTTON LABEL: "Завершить" */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-extrabold text-base bg-[#09B1BA] hover:bg-[#079ca4] text-white shadow-lg shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Создание аккаунта...</span>
                    </>
                  ) : (
                    <>
                      <span>Завершить</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              STEP 3: ЗАВЕРШЕНИЕ И ПРОФИЛЬ (SUCCESS STATE)
             ======================================================== */}
          {currentStep === 3 && registeredProfile && (
            <div className="text-center py-6 space-y-6 animate-fadeIn">
              {/* Vinted Success Badge */}
              <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-[#09B1BA] flex items-center justify-center mx-auto text-[#09B1BA] shadow-lg shadow-teal-500/10">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Добро пожаловать, {registeredProfile.firstName}!
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Ваш профиль в стиле Vinted успешно зарегистрирован. Все соглашения зафиксированы, личные данные сохранены.
                </p>
              </div>

              {/* Vinted Profile Summary Card */}
              <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-left space-y-4">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  {/* Avatar with initials */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#09B1BA] to-[#079ca4] text-white font-extrabold text-xl flex items-center justify-center shadow">
                    {registeredProfile.firstName[0]}
                    {registeredProfile.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {registeredProfile.firstName} {registeredProfile.lastName}
                      </h3>
                      <span className="text-[10px] font-bold text-[#09B1BA] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        Верифицирован
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500">
                      @{registeredProfile.username}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {registeredProfile.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Пол:</span>
                    <span className="font-semibold text-slate-800">
                      {registeredProfile.gender === 'female' && '🌸 Женский'}
                      {registeredProfile.gender === 'male' && '⚡ Мужской'}
                      {registeredProfile.gender === 'other' && '✨ Другой'}
                      {registeredProfile.gender === 'unspecified' && '🔒 Не указан'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Город:</span>
                    <span className="font-semibold text-slate-800">
                      📍 {registeredProfile.city || 'Не указан'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Соглашения:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Условия, Privacy, Cookie
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Дата создания:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(registeredProfile.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                {registeredProfile.marketingOptIn && (
                  <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-800 text-[11px] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Подписка на персональные рекомендации и новости Vinted активирована.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {onNavigateHome && (
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm bg-[#09B1BA] hover:bg-[#079ca4] text-white shadow-md transition-all cursor-pointer"
                  >
                    Перейти к платформе
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold text-sm text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
                >
                  Зарегистрировать новый профиль
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer brand info in Vinted style */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#09B1BA]">Vinted Experience</span>
            <span>•</span>
            <span>Многошаговая регистрация</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Шифрование данных 256-bit
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cookie className="w-3.5 h-3.5 text-amber-500" />
              GDPR & Cookie Compliant
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
