"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS, TranslationKey } from './translations';

interface I18nObject {
  [key: string]: string | undefined | any; // allow any for flexibility but prefer stronger types if possible
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  getI18nText: (obj: any, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Persist preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('authentik_lang') as Language;
      if (saved && (saved === 'vi' || saved === 'en')) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authentik_lang', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    return TRANSLATIONS[language][key] || key;
  };

  /*
   * Helper to get dynamic content based on language
   * Strict mode: No fallback to other languages to avoid mixing content
   */
  const getI18nText = (obj: any, field: string): string => {
    if (!obj) return '';

    // If language is English, strictly look for field_en
    if (language === 'en') {
      const enField = `${field}_en`;
      return obj[enField] || '';
    }

    // If language is Vietnamese, strictly look for field_vi (or legacy field if mapped)
    if (language === 'vi') {
      const viField = `${field}_vi`;
      return obj[viField] || obj[field] || '';
    }

    return obj[field] || '';
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getI18nText }}>
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
