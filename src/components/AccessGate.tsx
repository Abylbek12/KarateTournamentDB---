import React from 'react';
import { Lock, LogIn, UserPlus, Home } from 'lucide-react';
import { roleLabel, type AccessRole } from '../utils/access';
import { useApp } from '../context/AppContext';

interface AccessGateProps {
  role: AccessRole;
  onLogin: () => void;
  onRegister: () => void;
  onGoHome: () => void;
}

/** Shown instead of a screen the current visitor is not allowed to open. */
export const AccessGate: React.FC<AccessGateProps> = ({ role, onLogin, onRegister, onGoHome }) => {
  const isGuest = role === 'guest';
  const { language } = useApp();
  const t = (ru: string, ky: string, en: string) => (language === 'ky' ? ky : language === 'en' ? en : ru);
  return (
    <div className="theme-keep max-w-lg mx-auto my-10 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center shadow-sm">
      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--app-text-primary)]">
        {isGuest ? t('Нужно войти в аккаунт', 'Аккаунтка кирүү керек', 'Please sign in') : t('Нет доступа к этому разделу', 'Бул бөлүмгө кирүүгө уруксат жок', 'No access to this section')}
      </h2>
      <p className="mt-2 text-sm text-[var(--app-text-secondary)] leading-relaxed">
        {isGuest
          ? t(
              'Этот раздел доступен только зарегистрированным пользователям. Войдите или создайте аккаунт — это займёт минуту.',
              'Бул бөлүм катталган колдонуучуларга гана ачык. Кириңиз же аккаунт түзүңүз — бир мүнөт талап кылат.',
              'This section is for registered users only. Sign in or create an account — it takes a minute.'
            )
          : t(
              `Ваша роль — «${roleLabel(role, 'ru')}». Этот раздел открыт для других ролей (например, судей или организатора). Если вам нужен доступ, попросите администратора турнира выдать роль.`,
              `Сиздин ролуңуз — «${roleLabel(role, 'ky')}». Бул бөлүм башка ролдор үчүн ачык (мисалы, калыстар же уюштуруучу). Кирүү керек болсо, мелдештин администраторунан ролду сураңыз.`,
              `Your role is “${roleLabel(role, 'en')}”. This section is open to other roles (for example, referees or the organizer). If you need access, ask the tournament administrator to grant the role.`
            )}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {isGuest && (
          <>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> {t('Войти', 'Кирүү', 'Sign in')}
            </button>
            <button
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] text-sm font-semibold cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> {t('Регистрация', 'Катталуу', 'Sign up')}
            </button>
          </>
        )}
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] text-sm cursor-pointer"
        >
          <Home className="w-4 h-4" /> {t('К турнирам', 'Мелдештерге', 'To tournaments')}
        </button>
      </div>
    </div>
  );
};
