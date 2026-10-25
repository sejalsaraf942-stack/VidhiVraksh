import { SupportedLanguageCode, TranslationDictionary } from '@/types/i18n';
import { DEFAULT_LANGUAGE, resolveLanguage, SUPPORTED_CODES } from './languages';

import en from './translations/en.json';
import hi from './translations/hi.json';
import bn from './translations/bn.json';
import ta from './translations/ta.json';
import mr from './translations/mr.json';
import te from './translations/te.json';

export const dictionaries: Record<SupportedLanguageCode, TranslationDictionary> = {
  en,
  hi,
  bn,
  ta,
  mr,
  te,
};

/**
 * Returns the translation string for a given key in the requested language.
 * Strict rule: If a key is missing in the active language dictionary, do not silently
 * disguise it as English. Instead, log the issue and clearly flag the missing key.
 */
export function translateKey(
  key: string,
  lang: SupportedLanguageCode,
  fallback?: string
): string {
  const resolvedLang = resolveLanguage(lang);
  const activeDict = dictionaries[resolvedLang];

  if (activeDict && typeof activeDict[key] === 'string' && activeDict[key].trim().length > 0) {
    return activeDict[key];
  }

  // If missing in active language:
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.warn(`[i18n WARNING] Missing translation key "${key}" in language "${resolvedLang}".`);
  }

  // Explicit indicator so missing translations are immediately obvious during testing/dev
  if (fallback) {
    return fallback;
  }

  return `[MISSING: ${key} (${resolvedLang})]`;
}

export function getDictionary(lang: SupportedLanguageCode): TranslationDictionary {
  const resolved = resolveLanguage(lang);
  return dictionaries[resolved] || dictionaries[DEFAULT_LANGUAGE];
}

/**
 * Validates that all supported languages have full key parity with 'en.json'
 * Returns a list of error descriptions if any dictionary has missing or empty keys.
 */
export function checkTranslationCompleteness(): {
  isValid: boolean;
  errors: string[];
  totalKeys: number;
} {
  const referenceKeys = Object.keys(en);
  const errors: string[] = [];

  for (const lang of SUPPORTED_CODES) {
    const dict = dictionaries[lang];
    if (!dict) {
      errors.push(`Language '${lang}' dictionary is missing entirely.`);
      continue;
    }

    const dictKeys = new Set(Object.keys(dict));

    for (const key of referenceKeys) {
      if (!dictKeys.has(key)) {
        errors.push(`Language '${lang}' is missing key: "${key}"`);
      } else if (!dict[key] || dict[key].trim().length === 0) {
        errors.push(`Language '${lang}' has empty value for key: "${key}"`);
      }
    }

    // Verify brand name rule
    if (dict['brand.name'] !== 'VIDHIVRAKSH') {
      errors.push(`Language '${lang}' brand.name must be 'VIDHIVRAKSH', found: '${dict['brand.name']}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalKeys: referenceKeys.length,
  };
}
