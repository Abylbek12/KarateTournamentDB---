import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw, Home } from 'lucide-react';
import { isStaleBundleError, reportNotice } from '../utils/globalErrors';

export type UiLang = 'ru' | 'ky' | 'en';

/** The visitor's language without the app context (it may be the part that broke). */
export function currentUiLang(): UiLang {
  try {
    const l = document.documentElement.getAttribute('lang') || localStorage.getItem('tatami_lang') || 'ru';
    return l === 'ky' || l === 'en' ? l : 'ru';
  } catch {
    return 'ru';
  }
}

const say = (lang: UiLang, ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

interface Props {
  children: React.ReactNode;
  /** 'app': whole page; 'section': one screen, the rest of the site keeps working. */
  scope?: 'app' | 'section';
  /** When this value changes (another tab, another tournament) the screen is tried again. */
  resetKey?: unknown;
  /** Show nothing instead of the message (small optional widgets such as the assistant). */
  silent?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Catches a crash in its part of the page and shows a calm message with «Обновить»
 * instead of a white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[screen error]', error, info.componentStack);
    // A screen file vanished after a site update: the notice offers to reload
    if (isStaleBundleError(error?.message || '')) reportNotice('update', error.message);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.silent) return null;
    return <ErrorScreen error={error} scope={this.props.scope ?? 'section'} onRetry={this.retry} />;
  }
}

export const ErrorScreen: React.FC<{ error?: Error | null; scope: 'app' | 'section'; onRetry?: () => void }> = ({ error, scope, onRetry }) => {
  const lang = currentUiLang();
  const t = (ru: string, ky: string, en: string) => say(lang, ru, ky, en);
  const stale = isStaleBundleError(error?.message || '');
  const isApp = scope === 'app';
  return (
    <div
      role="alert"
      className={`theme-keep ${isApp ? 'min-h-[100dvh] flex items-center justify-center px-4 bg-[var(--app-bg)]' : 'py-8'}`}
    >
      <div className="pop-in w-full max-w-lg mx-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 sm:p-8 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-[var(--accent)]" aria-hidden />
        </div>
        <h2 className="mt-4 text-[var(--app-text-primary)]">
          {stale
            ? t('Вышла новая версия сайта', 'Сайттын жаңы версиясы чыкты', 'A new version of the site is out')
            : isApp
              ? t('Что-то пошло не так', 'Бир нерсе туура эмес болду', 'Something went wrong')
              : t('Этот раздел не открылся', 'Бул бөлүм ачылган жок', 'This section did not open')}
        </h2>
        <p className="mt-2 text-[15px] text-[var(--app-text-secondary)]">
          {stale
            ? t(
                'Обновите страницу, чтобы загрузить свежую версию. Ваши данные сохранены.',
                'Жаңы версияны жүктөө үчүн баракты жаңыртыңыз. Маалыматтарыңыз сакталган.',
                'Refresh the page to load the fresh version. Your data is saved.'
              )
            : t(
                'Ваши данные не потеряны — они хранятся на сервере. Нажмите «Обновить», обычно этого достаточно.',
                'Маалыматтарыңыз жоголгон жок — алар серверде сакталат. «Жаңыртуу» баскычын басыңыз, адатта ушул жетиштүү.',
                'Your data is not lost — it is kept on the server. Press “Refresh”, that is usually enough.'
              )}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-semibold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            {t('Обновить', 'Жаңыртуу', 'Refresh')}
          </button>
          {!isApp && onRetry && !stale && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-[var(--app-border)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] text-sm font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden />
              {t('Попробовать снова', 'Кайра аракет кылуу', 'Try again')}
            </button>
          )}
          {!isApp && (
            <a
              href="#tournaments"
              onClick={() => onRetry?.()}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-subtle)] text-sm font-semibold"
            >
              <Home className="w-4 h-4" aria-hidden />
              {t('На главную', 'Башкы бетке', 'Home')}
            </a>
          )}
        </div>
        {error?.message && (
          <details className="mt-5 text-left text-xs text-[var(--app-text-muted)]">
            <summary className="cursor-pointer select-none">{t('Подробности для поддержки', 'Колдоо үчүн толук маалымат', 'Details for support')}</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[var(--app-surface-subtle)] p-3" translate="no">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};
