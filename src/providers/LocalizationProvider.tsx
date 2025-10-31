'use client';

import React, { useEffect, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  getLanguageDirection,
  normalizeLanguage,
  type SupportedLanguage,
} from '@/i18n/settings';

interface LocalizationProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

const updateHtmlAttributes = (language: SupportedLanguage) => {
  if (typeof document === 'undefined') {
    return;
  }

  const direction = getLanguageDirection(language);
  const root = document.documentElement;
  const body = document.body;

  root.lang = language;
  root.dir = direction;
  body.dir = direction;
  body.setAttribute('data-direction', direction);
};

const persistLanguage = (language: SupportedLanguage) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}) => {
  const normalizedInitialLanguage = normalizeLanguage(initialLanguage);
  const hasSyncedRef = useRef(false);

  if (!hasSyncedRef.current && i18n.language !== normalizedInitialLanguage) {
    void i18n.changeLanguage(normalizedInitialLanguage);
  }

  useEffect(() => {
    hasSyncedRef.current = true;
  }, []);

  useEffect(() => {
    if (i18n.language !== normalizedInitialLanguage) {
      void i18n.changeLanguage(normalizedInitialLanguage);
    }
  }, [normalizedInitialLanguage]);

  useEffect(() => {
    const currentLanguage = normalizeLanguage(i18n.language);
    updateHtmlAttributes(currentLanguage);
    persistLanguage(currentLanguage);

    const handleLanguageChange = (nextLanguage: string) => {
      const normalizedLanguage = normalizeLanguage(nextLanguage);
      updateHtmlAttributes(normalizedLanguage);
      persistLanguage(normalizedLanguage);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default LocalizationProvider;
