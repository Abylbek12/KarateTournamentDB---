import React from 'react';
import { Lock, LogIn, UserPlus, Home } from 'lucide-react';
import { ROLE_LABELS, type AccessRole } from '../utils/access';

interface AccessGateProps {
  role: AccessRole;
  onLogin: () => void;
  onRegister: () => void;
  onGoHome: () => void;
}

/** Shown instead of a screen the current visitor is not allowed to open. */
export const AccessGate: React.FC<AccessGateProps> = ({ role, onLogin, onRegister, onGoHome }) => {
  const isGuest = role === 'guest';
  return (
    <div className="theme-keep max-w-lg mx-auto my-10 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center shadow-sm">
      <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--app-text-primary)]">
        {isGuest ? 'Нужно войти в аккаунт' : 'Нет доступа к этому разделу'}
      </h2>
      <p className="mt-2 text-sm text-[var(--app-text-secondary)] leading-relaxed">
        {isGuest
          ? 'Этот раздел доступен только зарегистрированным пользователям. Войдите или создайте аккаунт — это займёт минуту.'
          : `Ваша роль — «${ROLE_LABELS[role]}». Этот раздел открыт для других ролей (например, судей или организатора). Если вам нужен доступ, попросите администратора турнира выдать роль.`}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {isGuest && (
          <>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Войти
            </button>
            <button
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] text-sm font-semibold cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Регистрация
            </button>
          </>
        )}
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-subtle)] text-sm cursor-pointer"
        >
          <Home className="w-4 h-4" /> К турнирам
        </button>
      </div>
    </div>
  );
};
