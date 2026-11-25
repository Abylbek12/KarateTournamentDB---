import React from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import { WifiOff, ServerCrash, RefreshCw, Info, X } from 'lucide-react';
import { subscribeNotice, dismissNotice, GlobalNotice } from '../utils/globalErrors';
import { currentUiLang } from './ErrorBoundary';

/** Big tatami screens (TV) have nobody to tap a notice: they stay clean. */
const isWallScreen = () => {
  try {
    const s = new URLSearchParams(window.location.search).get('screen');
    return s === 'tatami' || s === 'calls';
  } catch {
    return false;
  }
};

/**
 * A calm notice at the bottom of the page for problems nobody caught:
 * no connection, a server failure, a new site version, an unexpected error.
 */
export const GlobalErrorNotice: React.FC = () => {
  const [notice, setNotice] = React.useState<GlobalNotice | null>(null);
  React.useEffect(() => subscribeNotice(setNotice), []);

  // Passing problems hide by themselves; «no connection» and «new version» stay until resolved
  React.useEffect(() => {
    if (!notice || notice.kind === 'offline' || notice.kind === 'update') return;
    const timer = setTimeout(dismissNotice, 8000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (isWallScreen()) return null;
  const lang = currentUiLang();
  const t = (ru: string, ky: string, en: string) => (lang === 'ky' ? ky : lang === 'en' ? en : ru);

  const view = notice
    ? {
        offline: {
          Icon: WifiOff,
          text: t(
            'Нет связи с сервером. Данные на экране сохранены и обновятся сами, когда связь вернётся.',
            'Сервер менен байланыш жок. Экрандагы маалымат сакталды, байланыш калыбына келгенде өзү жаңырат.',
            'No connection to the server. What you see is kept and will update by itself when the connection is back.'
          ),
          reload: false
        },
        server: {
          Icon: ServerCrash,
          text: t(
            'Сервер ответил с ошибкой. Попробуйте ещё раз через несколько секунд.',
            'Сервер ката менен жооп берди. Бир нече секунддан кийин кайра аракет кылыңыз.',
            'The server answered with an error. Please try again in a few seconds.'
          ),
          reload: false
        },
        update: {
          Icon: RefreshCw,
          text: t('Вышла новая версия сайта. Обновите страницу.', 'Сайттын жаңы версиясы чыкты. Баракты жаңыртыңыз.', 'A new version of the site is out. Please refresh the page.'),
          reload: true
        },
        error: {
          Icon: Info,
          text: t(
            'Что-то пошло не так. Если экран выглядит неправильно — обновите страницу.',
            'Бир нерсе туура эмес болду. Экран туура эмес көрүнсө — баракты жаңыртыңыз.',
            'Something went wrong. If the screen looks wrong, refresh the page.'
          ),
          reload: true
        }
      }[notice.kind]
    : null;

  return (
    <div className="theme-keep fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-5 z-[300] flex justify-center px-3 pointer-events-none">
      {/* LazyMotion: only the small animation core is loaded (keeps the first page light on phones) */}
      <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {notice && view && (
          <m.div
            key={notice.kind}
            role={notice.kind === 'offline' || notice.kind === 'update' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-full max-w-xl flex items-start gap-3 rounded-xl bg-[var(--app-text-primary)] text-[var(--app-surface)] px-4 py-3 shadow-lg"
          >
            <view.Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
            <span className="flex-1 text-sm leading-snug">{view.text}</span>
            {view.reload && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="shrink-0 h-8 px-3 rounded-lg bg-[var(--accent-fill)] hover:bg-[var(--accent-strong)] text-white text-xs font-semibold cursor-pointer"
              >
                {t('Обновить', 'Жаңыртуу', 'Refresh')}
              </button>
            )}
            <button
              type="button"
              onClick={dismissNotice}
              aria-label={t('Закрыть', 'Жабуу', 'Close')}
              className="shrink-0 w-8 h-8 -mr-1 -mt-0.5 rounded-lg inline-flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </m.div>
        )}
      </AnimatePresence>
      </LazyMotion>
    </div>
  );
};
