'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import type { SupportedLanguage } from '@/i18n/config';

const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage, t } = useLocale();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(event.target.value as SupportedLanguage);
  };

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
      <span className="sr-only">{t('header.languageLabel')}</span>
      <select
        dir="ltr"
        value={language}
        onChange={handleChange}
        aria-label={t('header.languageLabel')}
        className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 shadow-theme-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        <option value="en">{t('header.language.english')}</option>
        <option value="fa">{t('header.language.persian')}</option>
      </select>
    </label>
  );
};

export default LanguageSwitcher;
