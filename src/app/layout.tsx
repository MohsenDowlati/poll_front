"use client";

import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import LocalizationProvider from '@/providers/LocalizationProvider';
import React from "react";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${outfit.className} dark:bg-gray-900`}
      >
        <LocalizationProvider>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
