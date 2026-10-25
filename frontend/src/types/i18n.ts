export type SupportedLanguageCode = 'en' | 'hi' | 'bn' | 'ta' | 'mr' | 'te';

export interface LanguageInfo {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  script: string;
}

export type TranslationDictionary = Record<string, string>;
