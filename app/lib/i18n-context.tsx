"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  getI18nText: (obj: any, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolveI18nText(
  obj: Record<string, unknown> | null | undefined,
  field: string,
  language: Language
): string {
  if (!obj) return '';

  const fieldCandidates = language === 'en'
    ? [`${field}_en`, `${field}_vi`, field]
    : [`${field}_vi`, field, `${field}_en`];

  for (const candidate of fieldCandidates) {
    const value = getNonEmptyString(obj[candidate]);
    if (value) return value;
  }

  return '';
}

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

  // Helper to get dynamic content with non-empty fallback chain.
  const getI18nText = (obj: any, field: string): string => {
    return resolveI18nText(obj, field, language);
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
