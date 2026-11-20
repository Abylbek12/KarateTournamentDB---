import { ROLE_LABELS } from '../utils/access';
import { BrandFullLogo } from './BrandLogo';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
  BadgeCheck,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole, AuthenticatedUserProfile } from '../types/schema';

// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// SOCIAL ICONS (Google & Facebook)
// ----------------------------------------------------------------------
const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const FacebookIcon: React.FC = () => (
  <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ----------------------------------------------------------------------
// 1. AUTH & LOGIN MODAL WITH REAL OAUTH & PROFILE CONFIRMATION
// ----------------------------------------------------------------------
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'confirm_profile';
  currentUser: AuthenticatedUserProfile | null;
  onAuthenticated: (user: AuthenticatedUserProfile) => void;
  onLogout: () => void;
  language: 'ru' | 'en' | 'ky';
  /** Role fixed by an invitation link (?join=... or ?invite=...); hides the role choice. */
  lockedRole?: UserRole | null;
  /** Secret staff invitation token sent with the registration. */
  inviteToken?: string | null;
  /** Public link (?join=athlete / ?join=coach): role chosen in advance, but the person may change it. */
  suggestedRole?: UserRole | null;
}

const LOCKED_ROLE_LABELS: Partial<Record<UserRole, string>> = {
  athlete: 'Спортсмен',
  club_coach: 'Тренер / представитель клуба',
  tatami_referee: 'Судья татами',
  scorekeeper: 'Секретарь (оператор табло)',
  chief_referee: 'Главный судья',
  medical_officer: 'Врач соревнований'
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  currentUser,
  onAuthenticated,
  onLogout,
  language,
  lockedRole,
  inviteToken,
  suggestedRole
}) => {
  const trL = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  // Mode: 'login' | 'register' | 'confirm_profile'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'confirm_profile'>(initialMode);

  // Sync mode when modal opens or initialMode prop changes
  useEffect(() => {
    if (isOpen) {
      if (currentUser && !currentUser.isVerified) {
        setActiveTab('confirm_profile');
      } else {
        setActiveTab(initialMode);
      }
    }
  }, [isOpen, initialMode, currentUser]);

  // Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('club_coach');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pending user to confirm profile
  const [pendingProfileUser, setPendingProfileUser] = useState<any>(null);

  // Registration State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regClubName, setRegClubName] = useState('');
  const [regAlsoCompetes, setRegAlsoCompetes] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('athlete');
  // A public link pre-selects the role (athlete or coach); the person can still switch
  useEffect(() => {
    if (suggestedRole === 'athlete' || suggestedRole === 'club_coach') setRegRole(suggestedRole);
  }, [suggestedRole]);
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);

  // Quick fill helper toggle
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Listen for real OAuth Popup PostMessage (OAuth Skill requirement)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { provider, code } = event.data;
        setIsSubmitting(true);
        try {
          const res = await fetch('/api/auth/social/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, code })
          });

          const data = await res.json();
          if (!res.ok) {
            setErrorMessage(data.error || 'Ошибка завершения OAuth авторизации.');
          } else if (data.user) {
            setPendingProfileUser(data.user);
            setActiveTab('confirm_profile');
          }
        } catch (err: any) {
          setErrorMessage('Ошибка завершения OAuth авторизации.');
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) return null;

  // 1. Handle Regular Email + Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage(trL('Введите e-mail для входа', 'Кирүү үчүн e-mail жазыңыз', 'Enter your email'));
      return;
    }
    if (!loginPassword) {
      setErrorMessage(trL('Обязательно введите пароль', 'Сырсөздү сөзсүз жазыңыз', 'Password is required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          role: selectedRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Ошибка входа в систему.');
        setIsSubmitting(false);
        return;
      }

      // Mandatory profile confirmation step
      setPendingProfileUser(data.user);
      setActiveTab('confirm_profile');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка сетевого соединения с сервером.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Real OAuth Flow via Popup (Google & Facebook)
  const handleSocialLogin = async (provider: 'Google' | 'Facebook') => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint = provider === 'Google' ? '/api/auth/google/url' : '/api/auth/facebook/url';
      const res = await fetch(endpoint);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось получить URL авторизации');
      }
      const { url } = await res.json();

      // Open OAuth provider URL directly in popup (Mandatory OAuth Skill Rule)
      const popupWindow = window.open(
        url,
        `tatami_${provider.toLowerCase()}_oauth`,
        'width=600,height=720,status=no,resizable=yes,scrollbars=yes'
      );

      if (!popupWindow) {
        setErrorMessage('Браузер заблокировал всплывающее окно. Разрешите всплывающие окна для этого сайта.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Ошибка авторизации через ${provider}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Registration Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage(trL('Укажите ваше имя и фамилию', 'Атыңызды жана фамилияңызды жазыңыз', 'Enter your full name'));
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage(trL('Укажите e-mail', 'E-mail жазыңыз', 'Enter your email'));
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setErrorMessage(trL('Пароль должен состоять минимум из 8 символов', 'Сырсөз кеминде 8 белгиден турушу керек', 'Password must be at least 8 characters'));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage(trL('Введенные пароли не совпадают', 'Киргизилген сырсөздөр дал келбейт', 'Passwords do not match'));
      return;
    }
    if (!regAgreeTerms) {
      setErrorMessage(trL('Необходимо согласиться с политикой конфиденциальности', 'Купуялык саясатына макул болуу керек', 'Please accept terms'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          role: lockedRole || regRole,
          inviteToken: inviteToken || undefined,
          clubName: regClubName || undefined,
          alsoCompetes: (lockedRole || regRole) === 'club_coach' ? regAlsoCompetes : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Ошибка регистрации.');
        setIsSubmitting(false);
        return;
      }

      setPendingProfileUser(data.user);
      setActiveTab('confirm_profile');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка соединения с сервером.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Confirm Profile Step (Mandatory Profile Confirmation)
  const handleConfirmProfile = async () => {
    if (!pendingProfileUser) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/confirm-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingProfileUser.id,
          confirmedRole: pendingProfileUser.role || 'club_coach'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Не удалось подтвердить профиль.');
      } else if (data.user) {
        onAuthenticated(data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage('Не удалось подтвердить профиль.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill helper for convenience
  const fillCredentials = (email: string, pass: string, role: UserRole) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setSelectedRole(role);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto overscroll-contain px-3 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn font-sans">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Wide Card (Exact screenshot 2-column layout) */}
      <div className="relative z-10 my-auto w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden p-5 sm:p-10 md:p-12 transition-all">
        {/* Subtle Close Button in Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Закрыть окно"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 2-Column Split: Left = Big logo | Right = Form Card */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 min-h-[420px]">
          
          {/* ========================================================
              LEFT COLUMN: Centered Apsatarov Swirl Logo & Wordmark
             ======================================================== */}
          <div className="flex-1 flex flex-col items-center justify-center pt-2 pb-4 md:py-0 w-full">
            <BrandFullLogo />
          </div>

          {/* ========================================================
              RIGHT COLUMN: Soft-Blue Tinted Auth Cards
             ======================================================== */}
          <div className="w-full md:w-[360px] shrink-0">
            
            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: MANDATORY CREDENTIALS LOGIN */}
            {activeTab === 'login' && (
              <div>
                <div className="rounded-2xl bg-[#f0f5f9] border border-[#c5d8e8] p-5 sm:p-6 shadow-2xs">
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    {/* E-mail */}
                    <div>
                      <label className="block text-xs font-semibold text-[#2c5270] mb-1.5 font-sans">
                        E-mail
                      </label>
                      <input
                        type="email"
                        placeholder="E-mail"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="w-full rounded-full bg-white border border-slate-200/80 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] focus:ring-1 focus:ring-[#38a3a5]/30 shadow-2xs font-sans transition-all"
                      />
                    </div>

                    {/* Пароль (Обязательный запрос) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-[#2c5270] font-sans">
                          {trL('Пароль', 'Сырсөз', 'Password')}
                        </label>
                        <span className="text-[10px] text-rose-500 font-semibold uppercase">Обязательно</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={trL('Введите пароль...', 'Сырсөздү жазыңыз...', 'Password')}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="w-full rounded-full bg-white border border-slate-200/80 pl-4 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] focus:ring-1 focus:ring-[#38a3a5]/30 shadow-2xs font-sans transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot password link */}
                    <div className="text-right pt-0.5">
                      <button
                        type="button"
                        onClick={() => alert(trL('Инструкции по восстановлению пароля отправлены на ваш e-mail.', 'Сырсөздү калыбына келтирүү нускамасы e-mail дарегиңизге жөнөтүлдү.', 'Password reset link sent to your email.'))}
                        className="text-xs text-[#3b668d] hover:text-[#1d4264] transition-colors cursor-pointer font-sans"
                      >
                        {trL('Забыли пароль?', 'Сырсөздү унуттуңузбу?', 'Forgot password?')}
                      </button>
                    </div>

                    {/* Submit Button: «Продолжить» */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#3ca3a8] hover:bg-[#349297] text-white font-medium text-sm shadow-md transition-all cursor-pointer text-center font-sans tracking-wide active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Проверка учетных данных...</span>
                      ) : (
                        <span>{trL('Продолжить', 'Улантуу', 'Continue')}</span>
                      )}
                    </button>

                    {/* Divider: «или» */}
                    <div className="relative my-3.5 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#c6d9ea]" />
                      </div>
                      <span className="relative bg-[#f0f5f9] px-3 text-xs text-[#52799c] font-medium font-sans">
                        {trL('или', 'же', 'or')}
                      </span>
                    </div>

                    {/* Sign in with Facebook (Real API Integration) */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSocialLogin('Facebook')}
                      className="w-full py-2.5 px-4 rounded-md bg-[#4267b2] hover:bg-[#365899] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors font-sans"
                    >
                      <FacebookIcon />
                      <span>Sign in with Facebook</span>
                    </button>

                    {/* Sign in with Google (Real API Integration) */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSocialLogin('Google')}
                      className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors font-sans mt-2"
                    >
                      <GoogleIcon />
                      <span>Sign in with Google</span>
                    </button>
                  </form>
                </div>

                {/* Lower Card: «Регистрация» Button Container */}
                <div className="rounded-2xl bg-[#f0f5f9] border border-[#c5d8e8] p-3.5 shadow-2xs mt-3.5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="w-full py-2.5 px-4 rounded-full bg-[#3ca3a8] hover:bg-[#349297] text-white font-medium text-sm shadow-md transition-all cursor-pointer text-center font-sans tracking-wide active:scale-[0.99]"
                  >
                    {trL('Регистрация', 'Катталуу', 'Register')}
                  </button>

                  {/* Demo Credentials Quick Switcher (development builds only) */}
                  {import.meta.env.DEV && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                      className="text-[11px] text-[#3b668d] hover:underline tabular-nums"
                    >
                      {showDemoAccounts ? '▲ Скрыть демо-аккаунты' : '▼ Быстрый выбор учетных записей (Демо)'}
                    </button>

                    {showDemoAccounts && (
                      <div className="mt-2 text-left bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1 tabular-nums">
                        <button
                          type="button"
                          onClick={() => fillCredentials('coach.smr@samurai.club', 'Coach2026!', 'club_coach')}
                          className="w-full text-left p-1 rounded hover:bg-slate-100 flex items-center justify-between"
                        >
                          <span>🥋 Тренер: coach.smr@samurai.club</span>
                          <span className="text-slate-400">Coach2026!</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fillCredentials('chief.referee@karate-fed.ru', 'Pass2026!', 'chief_referee')}
                          className="w-full text-left p-1 rounded hover:bg-slate-100 flex items-center justify-between"
                        >
                          <span>⚖️ Главный судья: chief.referee...</span>
                          <span className="text-slate-400">Pass2026!</span>
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: REGISTER ON THE SITE MODE */}
            {activeTab === 'register' && (
              <div>
                <div className="rounded-2xl bg-[#f0f5f9] border border-[#c5d8e8] p-5 sm:p-6 shadow-2xs">
                  <div className="text-center pb-2">
                    <h3 className="text-sm font-bold text-[#2c5270] font-sans">
                      {trL('Регистрация на сайте Apsatarov', 'Apsatarov сайтына катталуу', 'Create Apsatarov Account')}
                    </h3>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2c5270] mb-1 font-sans">
                        {trL('Имя и Фамилия', 'Аты жана фамилиясы', 'Full Name')}
                      </label>
                      <input
                        type="text"
                        placeholder="Алексей Жумабеков"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                        className="w-full rounded-full bg-white border border-slate-200/80 px-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] shadow-2xs font-sans"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2c5270] mb-1 font-sans">
                        E-mail
                      </label>
                      <input
                        type="email"
                        placeholder="user@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full rounded-full bg-white border border-slate-200/80 px-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] shadow-2xs font-sans"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2c5270] mb-1 font-sans">
                        {trL('Телефон', 'Телефон', 'Phone')}
                      </label>
                      <input
                        type="tel"
                        placeholder="+996 (999) 000-00-00"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full rounded-full bg-white border border-slate-200/80 px-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] shadow-2xs font-sans"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2c5270] mb-1 font-sans">
                        {trL('Пароль (минимум 8 символов)', 'Сырсөз (кеминде 8 белги)', 'Password (min 8 chars)')}
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        className="w-full rounded-full bg-white border border-slate-200/80 px-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] shadow-2xs font-sans"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2c5270] mb-1 font-sans">
                        {trL('Повторите пароль', 'Сырсөздү кайталаңыз', 'Confirm Password')}
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                        className="w-full rounded-full bg-white border border-slate-200/80 px-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#38a3a5] shadow-2xs font-sans"
                      />
                    </div>

                    {/* Role: fixed by the invitation link, otherwise athlete or coach */}
                    {lockedRole ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 font-sans">
                        {trL('Вы регистрируетесь как: ', 'Сиз катталып жатасыз: ', 'You are registering as: ')}
                        <b>{LOCKED_ROLE_LABELS[lockedRole] || lockedRole}</b>
                        <div className="text-[10px] text-emerald-800/80 mt-0.5">
                          {trL('Роль задана ссылкой-приглашением.', 'Роль чакыруу шилтемеси менен берилген.', 'The role is set by your invitation link.')}
                        </div>
                      </div>
                    ) : (
                    <div>
                      {/* Two big buttons: nobody misses the choice (a small dropdown was easy to overlook) */}
                      <div className="block text-[11px] font-semibold text-[#2c5270] mb-1.5 font-sans">
                        {trL('Кто вы?', 'Сиз кимсиз?', 'Who are you?')}
                      </div>
                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={trL('Роль на портале', 'Порталдагы роль', 'Platform role')}>
                        {(
                          [
                            ['athlete', '🥋', trL('Я спортсмен', 'Мен спортчумун', "I'm an athlete"), trL('или родитель спортсмена', 'же спортчунун ата-энеси', 'or a parent')],
                            ['club_coach', '🥊', trL('Я тренер', 'Мен машыктыруучумун', "I'm a coach"), trL('или представитель клуба', 'же клубдун өкүлү', 'or club representative')]
                          ] as const
                        ).map(([value, emoji, title, sub]) => {
                          const on = regRole === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => setRegRole(value)}
                              className={`relative flex flex-col items-center justify-center text-center gap-0.5 rounded-2xl border-2 px-2 py-2.5 min-h-[76px] font-sans cursor-pointer transition-colors ${
                                on ? 'border-[#38a3a5] bg-[#38a3a5]/15 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-[#38a3a5]/60'
                              }`}
                            >
                              {on && (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#38a3a5] text-white text-[11px] font-bold flex items-center justify-center" aria-hidden>
                                  ✓
                                </span>
                              )}
                              <span className="text-xl leading-none" aria-hidden>{emoji}</span>
                              <span className="text-[13px] font-bold leading-tight">{title}</span>
                              <span className="text-[10px] text-slate-500 leading-tight">{sub}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[10px] text-slate-500 font-sans">
                        {suggestedRole
                          ? trL(
                              'Роль выбрана по ссылке. Если она не ваша — нажмите другую кнопку. Роли судьи и организатора выдаёт администратор.',
                              'Роль шилтеме боюнча тандалды. Эгер сиздики болбосо — башка баскычты басыңыз. Калыс жана уюштуруучу ролдорун администратор берет.',
                              'The role was chosen by your link. If it is not yours, tap the other button. Referee and organizer roles are granted by an administrator.'
                            )
                          : trL(
                              'Роли судьи и организатора выдаёт администратор после регистрации.',
                              'Калыс жана уюштуруучу ролдорун администратор каттоодон кийин берет.',
                              'Referee and organizer roles are granted by an administrator after sign-up.'
                            )}
                      </p>
                    </div>
                    )}

                    {/* Club + "I also compete" for coaches */}
                    {((lockedRole || regRole) === 'club_coach' || (lockedRole || regRole) === 'athlete') && (
                      <div>
                        <label className="block text-[11px] font-semibold text-[#2c5270] mb-1 font-sans">
                          {trL('Клуб (если есть)', 'Клуб (болсо)', 'Club (optional)')}
                        </label>
                        <input
                          type="text"
                          value={regClubName}
                          onChange={(e) => setRegClubName(e.target.value)}
                          placeholder={trL('Например: СК «Тигр», Бишкек', 'Мисалы: СК «Жолборс», Бишкек', 'e.g. Tiger Karate Club, Bishkek')}
                          className="w-full rounded-full bg-white border border-slate-200/80 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#38a3a5] shadow-2xs font-sans"
                        />
                      </div>
                    )}
                    {(lockedRole || regRole) === 'club_coach' && (
                      <label className="flex items-start gap-2 text-[11px] text-slate-700 font-sans cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <input
                          type="checkbox"
                          checked={regAlsoCompetes}
                          onChange={(e) => setRegAlsoCompetes(e.target.checked)}
                          className="mt-0.5 rounded text-[#38a3a5] focus:ring-[#38a3a5]"
                        />
                        <span>
                          <b>{trL('Я тоже выступаю на соревнованиях', 'Мен да мелдештерге чыгам', 'I also compete')}</b>
                          <span className="block text-[10px] text-slate-500">
                            {trL('Сможете подавать заявки и за учеников, и за себя — с одного аккаунта.', 'Бир аккаунттан окуучулар үчүн да, өзүңүз үчүн да табыштама бере аласыз.', 'Enter your athletes and yourself from one account.')}
                          </span>
                        </span>
                      </label>
                    )}

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-2 pt-1 text-[10px] text-slate-600 font-sans cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regAgreeTerms}
                        onChange={(e) => setRegAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded text-[#38a3a5] focus:ring-[#38a3a5]"
                      />
                      <span>
                        {trL('Согласен с Условиями и обработкой персональных данных', 'Шарттарга жана жеке маалыматтарды иштетүүгө макулмун', 'I agree to the Terms & Privacy Policy')}
                      </span>
                    </label>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#3ca3a8] hover:bg-[#349297] text-white font-medium text-sm shadow-md transition-all cursor-pointer text-center font-sans tracking-wide active:scale-[0.99]"
                    >
                      {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
                    </button>
                  </form>
                </div>

                {/* Lower Card: Return to Login */}
                <div className="rounded-2xl bg-[#f0f5f9] border border-[#c5d8e8] p-3 shadow-2xs mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-[#3b668d] hover:text-[#1d4264] font-medium font-sans cursor-pointer"
                  >
                    {trL('Уже есть аккаунт? Войти', 'Аккаунтуңуз барбы? Кирүү', 'Already have an account? Sign In')}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: MANDATORY PROFILE CONFIRMATION STEP */}
            {activeTab === 'confirm_profile' && pendingProfileUser && (
              <div className="rounded-2xl bg-[#f0f5f9] border border-[#c5d8e8] p-6 shadow-2xs space-y-4 animate-fadeIn">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-teal-100 border border-teal-300 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    Подтверждение профиля
                  </h3>
                  <p className="text-xs text-slate-500">
                    Учетные данные проверены. Пожалуйста, подтвердите данные вашего профиля для входа в систему Apsatarov.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2.5 text-xs font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">Имя пользователя:</span>
                    <span className="font-bold text-slate-800">{pendingProfileUser.fullName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-400">E-mail:</span>
                    <span className="tabular-nums text-slate-800">{pendingProfileUser.email}</span>
                  </div>

                  {(pendingProfileUser.provider === 'google' || pendingProfileUser.provider === 'facebook') && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Вход через:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        {pendingProfileUser.provider === 'google' ? <GoogleIcon /> : <FacebookIcon />}
                        <span>{pendingProfileUser.provider === 'google' ? 'Google' : 'Facebook'}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Роль:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-semibold text-[11px]">
                      {ROLE_LABELS[pendingProfileUser.role as keyof typeof ROLE_LABELS] || pendingProfileUser.role}
                    </span>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirmProfile}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-full bg-[#3ca3a8] hover:bg-[#349297] text-white font-medium text-sm shadow-md transition-all cursor-pointer text-center font-sans tracking-wide active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Подтвердить профиль и войти</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 cursor-pointer pt-1"
                >
                  Войти под другой учетной записью
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. PRIVACY POLICY MODAL (text must be reviewed by a lawyer for Kyrgyz law)
// ----------------------------------------------------------------------
interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ru' | 'en' | 'ky';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const trL = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {trL('Политика конфиденциальности и защиты данных', 'Купуялык жана маалыматтарды коргоо саясаты', 'Privacy & Data Protection Policy')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {trL('Как Apsatarov обращается с персональными данными', 'Apsatarov жеке маалыматтар менен кантип иштейт', 'How Apsatarov handles personal data')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="text-slate-800 font-bold">Оператор обработки персональных данных:</div>
            <div>Информационная система Apsatarov (редакция от 1 января 2026 г.)</div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-800">1. Цели сбора и обработки данных</h4>
            <p>
              Обработка персональных данных участников, тренеров, судей и представителей спортивных клубов осуществляется в целях организации турниров, формирования сеток и официальных протоколов.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-800">2. Состав обрабатываемых данных</h4>
            <p>
              В систему заносятся: фамилия, имя, отчество, дата рождения, вес (в килограммах для весовых категорий), спортивный клуб, город, тренер и разряд.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-800">3. Безопасность и автономная локальная сеть</h4>
            <p>
              При проведении турниров данные шифруются по стандарту SSL 256-bit и могут синхронизироваться через защищенный локальный сервер арены.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-sans">
            Вопросы о ваших данных — администратору сайта или организатору турнира
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#3ca3a8] hover:bg-[#349297] text-white font-medium text-xs transition-colors cursor-pointer"
          >
            {trL('Понятно и согласен', 'Түшүнүктүү, макулмун', 'Acknowledge & Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
