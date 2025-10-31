export const supportedLanguages = ['en', 'fa'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'fa';
export const LANGUAGE_COOKIE_NAME = 'app-locale';

const rtlLanguages: SupportedLanguage[] = ['fa'];

export const normalizeLanguage = (
  language: string | null | undefined
): SupportedLanguage => {
  const base = language?.split('-')[0] ?? DEFAULT_LANGUAGE;
  return (supportedLanguages.includes(base as SupportedLanguage)
    ? base
    : DEFAULT_LANGUAGE) as SupportedLanguage;
};

export const getLanguageDirection = (
  language: SupportedLanguage
): 'ltr' | 'rtl' => (rtlLanguages.includes(language) ? 'rtl' : 'ltr');
