'use client';

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
  getLanguageDirection,
  normalizeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from '@/i18n/settings';

export const useLocale = () => {
  const { t, i18n: i18nextInstance } = useTranslation();

  const language = useMemo<SupportedLanguage>(() => normalizeLanguage(i18nextInstance.language), [i18nextInstance.language]);
  const direction = useMemo(() => getLanguageDirection(language), [language]);

  const changeLanguage = (nextLanguage: SupportedLanguage) => {
    void i18nextInstance.changeLanguage(nextLanguage);
  };

  return {
    t,
    language,
    direction,
    changeLanguage,
    availableLanguages: supportedLanguages,
  };
};
