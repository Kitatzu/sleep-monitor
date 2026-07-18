import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Language, type Translations } from './translations';

interface LanguageContextValue {
  language: Language;
  t: Translations;
  toggle: () => void;
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: translations.en,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const stored = localStorage.getItem('language');
      if (stored === 'en' || stored === 'es') return stored;
    } catch {}
    return 'en';
  });

  const toggle = () => {
    setLanguage((previous) => {
      const next = previous === 'en' ? 'es' : 'en';
      localStorage.setItem('language', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider
      value={{ language, t: translations[language], toggle }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
