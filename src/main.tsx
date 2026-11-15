import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './theme.generated.css';

createRoot(document.getElementById('root')!).render(
  // Fallback boundary for any lazily loaded screen rendered outside <main>.
  <React.Suspense fallback={null}>
    <App />
  </React.Suspense>
);
