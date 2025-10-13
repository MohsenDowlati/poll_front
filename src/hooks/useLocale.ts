'use client';

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import i18n, { supportedLanguages, type SupportedLanguage } from '@/i18n/config';

const normalizeLanguage = (language: string | undefined): SupportedLanguage => {
  const base = language?.split('-')[0] ?? 'en';
  return (supportedLanguages.includes(base as SupportedLanguage) ? base : 'en') as SupportedLanguage;
};

export const useLocale = () => {
  const { t, i18n: i18nextInstance } = useTranslation();

  const language = useMemo<SupportedLanguage>(() => normalizeLanguage(i18nextInstance.language), [i18nextInstance.language]);
  const direction = useMemo(() => i18n.dir(language), [language]);

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
