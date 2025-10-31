'use client';

import React from 'react';
import LocalizationProvider from '@/providers/LocalizationProvider';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import type { SupportedLanguage } from '@/i18n/settings';

interface AppProvidersProps {
  children: React.ReactNode;
  initialLanguage: SupportedLanguage;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children, initialLanguage }) => (
  <LocalizationProvider initialLanguage={initialLanguage}>
    <ThemeProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </ThemeProvider>
  </LocalizationProvider>
);

export default AppProviders;
