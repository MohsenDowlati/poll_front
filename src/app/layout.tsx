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

export const dynamic = 'force-dynamic';

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
  const runtimeEnv = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  };
  // Prevent a deployment-provided value from terminating the script element.
  const runtimeEnvScript = JSON.stringify(runtimeEnv).replace(/</g, '\\u003c');

  return (
    <html lang={initialLanguage} dir={direction} suppressHydrationWarning>
      <body
        data-direction={direction}
        suppressHydrationWarning
        className={`${outfit.variable} ${vazirmatn.variable} dark:bg-gray-900`}
      >
        {/* Inject runtime configuration so client-side services can read deployment environment variables. */}
        <script
          id="runtime-env"
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = Object.assign({}, window.__ENV__ || {}, ${runtimeEnvScript});`,
          }}
        />
        <AppProviders initialLanguage={initialLanguage}>{children}</AppProviders>
      </body>
    </html>
  );
}
