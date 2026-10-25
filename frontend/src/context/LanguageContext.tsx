'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { SupportedLanguageCode, LanguageInfo } from '@/types/i18n';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  resolveLanguage,
} from '@/i18n/languages';
import { translateKey } from '@/i18n/loader';

export const PRIMARY_LANG_KEY = 'vidhivraksh_preferred_language';
export const LEGACY_LANG_KEY = 'libra_preferred_language';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

interface LanguageContextType {
  language: SupportedLanguageCode;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguageCode>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize language from localStorage or browser detection on client mount
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(PRIMARY_LANG_KEY) || localStorage.getItem(LEGACY_LANG_KEY);
      if (saved) {
        const resolved = resolveLanguage(saved);
        setLanguageState(resolved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = resolved;
        }
      } else if (typeof navigator !== 'undefined' && navigator.language) {
        const detected = resolveLanguage(navigator.language);
        setLanguageState(detected);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = detected;
        }
      }
    } catch {
      // Storage restricted
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Stable, memoized setLanguage function to prevent render loops
  const setLanguage = useCallback((newLang: string) => {
    const resolved = resolveLanguage(newLang);
    setLanguageState(resolved);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = resolved;
    }

    try {
      localStorage.setItem(PRIMARY_LANG_KEY, resolved);
      localStorage.setItem(LEGACY_LANG_KEY, resolved);
      window.dispatchEvent(new CustomEvent('languagechange', { detail: resolved }));
    } catch {
      // Storage restricted
    }

    // If authenticated, synchronize language preference to the backend database
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('vidhivraksh_auth_token') ||
        localStorage.getItem('libra_auth_token');
      if (token) {
        fetch(`${API_URL}/api/v1/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ language: resolved }),
        }).catch((err) => {
          console.debug('Failed to sync language preference to profile:', err);
        });
      }
    }
  }, []);

  const currentLanguageInfo = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const t = useMemo(() => {
    return (key: string, fallback?: string) => translateKey(key, language, fallback);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageInfo,
        isLoaded,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
