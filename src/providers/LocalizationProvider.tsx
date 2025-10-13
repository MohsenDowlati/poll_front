'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

interface LocalizationProviderProps {
  children: React.ReactNode;
}

const updateHtmlAttributes = (language: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  const direction = i18n.dir(language);
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body.setAttribute('data-direction', direction);
};

const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  useEffect(() => {
    updateHtmlAttributes(i18n.language);

    const handleLanguageChange = (nextLanguage: string) => {
      updateHtmlAttributes(nextLanguage);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default LocalizationProvider;
