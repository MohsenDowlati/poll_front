import { Outfit, Vazirmatn } from 'next/font/google';
import './globals.css';

import { cookies } from 'next/headers';
import AppProviders from '@/providers/AppProviders';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  getLanguageDirection,
  normalizeLanguage,
} from '@/i18n/settings';

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-vazirmatn",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_LANGUAGE;
  const initialLanguage = normalizeLanguage(cookieLanguage);
  const direction = getLanguageDirection(initialLanguage);

  return (
    <html lang={initialLanguage} dir={direction} suppressHydrationWarning>
      <body
        data-direction={direction}
        suppressHydrationWarning
        className={`${outfit.variable} ${vazirmatn.variable} dark:bg-gray-900`}
      >
        <AppProviders initialLanguage={initialLanguage}>{children}</AppProviders>
      </body>
    </html>
  );
}
