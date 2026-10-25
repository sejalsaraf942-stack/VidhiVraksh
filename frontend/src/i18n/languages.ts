import { LanguageInfo, SupportedLanguageCode } from '@/types/i18n';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
];

export const SUPPORTED_CODES: SupportedLanguageCode[] = [
  'en', 'hi', 'bn', 'ta', 'mr', 'te'
];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';

export function isSupportedLanguage(code: string): code is SupportedLanguageCode {
  return SUPPORTED_CODES.includes(code as SupportedLanguageCode);
}

export function resolveLanguage(langCode?: string | null): SupportedLanguageCode {
  if (!langCode) return DEFAULT_LANGUAGE;
  const cleaned = langCode.trim().toLowerCase();
  const base = cleaned.split('-')[0].split('_')[0];
  if (isSupportedLanguage(base)) {
    return base;
  }
  return DEFAULT_LANGUAGE;
}
