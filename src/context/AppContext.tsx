import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, t as translateKey } from '../utils/translations';
import { Tournament } from '../types/schema';
import { getLocalizedTournament } from '../utils/tournamentLocalization';

export interface AppContextType {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isBoldReadability: boolean;
  setIsBoldReadability: (val: boolean) => void;
  toggleBoldReadability: () => void;
  t: (key: string) => string;
  localizeTournament: (tournament: Tournament) => Tournament;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state with localStorage persistence
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = (localStorage.getItem('tatami_theme') ?? localStorage.getItem('uventex_theme'));
      return saved === 'light' || saved === 'dark' ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  // Language state with localStorage persistence
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = (localStorage.getItem('tatami_lang') ?? localStorage.getItem('uventex_lang'));
      return saved === 'en' || saved === 'ru' || saved === 'ky' ? saved : 'ru';
    } catch {
      return 'ru';
    }
  });

  // Font readability state with localStorage persistence
  const [isBoldReadability, setIsBoldReadabilityState] = useState<boolean>(() => {
    try {
      const saved = (localStorage.getItem('tatami_bold') ?? localStorage.getItem('uventex_bold'));
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  // Synchronize DOM root classes with Theme
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('theme-light');
      } else {
        root.classList.remove('dark');
        root.classList.add('theme-light');
      }
      localStorage.setItem('tatami_theme', theme);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [theme]);

  // Synchronize DOM root with Bold Readability mode
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isBoldReadability) {
        root.classList.add('font-bold-readable');
      } else {
        root.classList.remove('font-bold-readable');
      }
      localStorage.setItem('tatami_bold', String(isBoldReadability));
    } catch {
      // Ignore storage errors
    }
  }, [isBoldReadability]);

  // Synchronize DOM root with Language
  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', language);
      localStorage.setItem('tatami_lang', language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ru' ? 'ky' : prev === 'ky' ? 'en' : 'ru'));
  };

  const setIsBoldReadability = (val: boolean) => {
    setIsBoldReadabilityState(val);
  };

  const toggleBoldReadability = () => {
    setIsBoldReadabilityState((prev) => !prev);
  };

  const t = (key: string): string => {
    return translateKey(key, language);
  };

  const localizeTournament = (tournament: Tournament): Tournament => {
    return getLocalizedTournament(tournament, language);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        toggleLanguage,
        isBoldReadability,
        setIsBoldReadability,
        toggleBoldReadability,
        t,
        localizeTournament
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
