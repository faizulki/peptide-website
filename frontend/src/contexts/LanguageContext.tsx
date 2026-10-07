'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, TranslationKey } from '@/lib/translations';

export type Language = 'en' | 'sv';

const STORAGE_KEY = 'language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  // Picks the variant of a bilingual field for the active language, falling
  // back to the other language when that one hasn't been filled in (e.g. an
  // article written only in Swedish still shows to English visitors).
  pick: (en: string | null | undefined, sv: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('sv');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sv') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  const pick = (en: string | null | undefined, sv: string | null | undefined): string => {
    if (language === 'sv') return sv?.trim() ? sv : en || '';
    return en?.trim() ? en : sv || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, pick }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
