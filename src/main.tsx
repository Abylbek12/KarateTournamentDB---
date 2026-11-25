import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorNotice } from './components/GlobalErrorNotice';
import { installGlobalErrorHandlers } from './utils/globalErrors';
// Fonts served by the site itself (not Google Fonts): no visitor data goes to Google
// Inter: strict, neutral sans with full Cyrillic (incl. Kyrgyz ң ө ү)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/inter/400-italic.css';
import '@fontsource/inter/600-italic.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/jetbrains-mono/800.css';
import './index.css';
import './theme.generated.css';

// Saved theme and language right away (before React): no flash of the light theme on reload,
// and the error screen speaks the visitor's language even if the app itself failed to start
try {
  const theme = localStorage.getItem('tatami_theme') ?? localStorage.getItem('uventex_theme');
  if (theme === 'dark') document.documentElement.classList.add('dark');
  const lang = localStorage.getItem('tatami_lang') ?? localStorage.getItem('uventex_lang');
  if (lang === 'ru' || lang === 'ky' || lang === 'en') document.documentElement.setAttribute('lang', lang);
} catch {
  // storage blocked: defaults
}

// Before the first render: unexpected errors and lost connection show a calm notice, not a white screen
installGlobalErrorHandlers();

createRoot(document.getElementById('root')!).render(
  <>
    {/* Last line of defence: if the whole page breaks, a clear screen with «Обновить» */}
    <ErrorBoundary scope="app">
      {/* Fallback boundary for any lazily loaded screen rendered outside <main>. */}
      <React.Suspense fallback={null}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
    <GlobalErrorNotice />
  </>
);
