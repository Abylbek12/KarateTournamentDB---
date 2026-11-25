import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// Fonts served by the site itself (not Google Fonts): no visitor data goes to Google
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/montserrat/600-italic.css';
import '@fontsource/montserrat/700-italic.css';
import '@fontsource/montserrat/800-italic.css';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/800.css';
import '@fontsource/unbounded/900.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/jetbrains-mono/800.css';
import './index.css';
import './theme.generated.css';

createRoot(document.getElementById('root')!).render(
  // Fallback boundary for any lazily loaded screen rendered outside <main>.
  <React.Suspense fallback={null}>
    <App />
  </React.Suspense>
);
