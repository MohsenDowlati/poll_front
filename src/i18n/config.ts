'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const supportedLanguages = ['en', 'fa'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: {
    translation: {
      'navigation.dashboard': 'Dashboard',
      'navigation.home': 'Home',
      'navigation.users': 'Users',
      'navigation.addSheet': 'Add Sheet',
      'navigation.menu': 'Menu',
      'navigation.others': 'Others',
      'header.toggleSidebar': 'Toggle Sidebar',
      'header.languageLabel': 'Language',
      'header.language.english': 'English',
      'header.language.persian': 'فارسی',
      'buttons.newSheet': 'New Sheet',
      'tables.surveySheets': 'Survey Sheets',
      'tables.headers.name': 'Name',
      'tables.headers.owner': 'Owner',
      'tables.headers.date': 'Date',
      'tables.headers.status': 'Status',
      'tables.headers.actions': 'Actions',
      'tables.headers.analyze': 'Analyze',
      'tables.headers.phone': 'Phone',
      'tables.headers.organization': 'Organization',
      'tables.headers.admin': 'Access Level',
      'tables.pagination.previous': 'Previous page',
      'tables.pagination.next': 'Next page',
      'tables.pagination.range': '{{start}}-{{end}} out of {{total}}',
      'tables.pagination.rangeNoTotal': '{{start}}-{{end}}',
      'tables.loading': 'Loading sheets...',
      'tables.empty': 'No sheets found.',
      'tables.error.load': 'Failed to load sheets.',
      'tables.error.unavailable': 'Unable to fetch sheets right now.',
      'status.pending': 'Pending',
      'status.approved': 'Approved',
      'status.published': 'Published',
      'status.active': 'Active',
      'status.verified': 'Verified',
      'status.rejected': 'Rejected',
      'status.deleted': 'Deleted',
      'status.inactive': 'Inactive',
      'status.closed': 'Closed',
      'status.unknown': 'Unknown',
      'actions.approve': 'Approve sheet',
      'actions.reject': 'Reject sheet',
      'actions.delete': 'Delete sheet',
      'labels.new': 'New',
      'labels.pro': 'Pro',
      'selector.venue': 'Venue',
      'analyze.header': 'Poll Results',
      'auth.signup.title': 'Sign up',
      'auth.signup.description': 'Enter your phone and password to sign up!',
      'auth.signup.organization': 'Organization',
      'auth.signup.name': 'Name',
      'auth.login.title': 'Sign In',
      'auth.login.description': 'Enter your phone and password to sign in!',
      'auth.login.phone': 'Phone',
      'auth.login.password': 'Password',
    },
  },
  fa: {
    translation: {
      'navigation.dashboard': 'داشبورد',
      'navigation.home': 'خانه',
      'navigation.users': 'کاربران',
      'navigation.addSheet': 'افزودن برگه',
      'navigation.menu': 'منو',
      'navigation.others': 'موارد دیگر',
      'header.toggleSidebar': 'باز و بسته کردن منو',
      'header.languageLabel': 'انتخاب زبان',
      'header.language.english': 'English',
      'header.language.persian': 'فارسی',
      'buttons.newSheet': 'برگه جدید',
      'tables.surveySheets': 'برگه‌های نظرسنجی',
      'tables.headers.name': 'نام',
      'tables.headers.owner': 'سازنده',
      'tables.headers.date': 'تاریخ',
      'tables.headers.status': 'وضعیت',
      'tables.headers.actions': 'اقدامات',
      'tables.headers.analyze': 'تحلیل',
      'tables.headers.phone': 'شماره همراه',
      'tables.headers.organization': 'سازمان',
      'tables.headers.admin': 'سطح دسترسی',
      'tables.pagination.previous': 'قبلی',
      'tables.pagination.next': 'بعدی',
      'tables.pagination.range': '{{start}}-{{end}} از {{total}}',
      'tables.pagination.rangeNoTotal': '{{start}}-{{end}}',
      'tables.loading': 'در حال بارگذاری برگه‌ها...',
      'tables.empty': 'برگه‌ای یافت نشد.',
      'tables.error.load': 'بارگذاری برگه‌ها ناموفق بود.',
      'tables.error.unavailable': 'در حال حاضر امکان دریافت برگه‌ها وجود ندارد.',
      'status.pending': 'در انتظار',
      'status.approved': 'تأیید شده',
      'status.published': 'منتشر شده',
      'status.active': 'فعال',
      'status.verified': 'تأیید شده',
      'status.rejected': 'رد شده',
      'status.deleted': 'حذف شده',
      'status.inactive': 'غیرفعال',
      'status.closed': 'بسته شده',
      'status.unknown': 'نامشخص',
      'actions.approve': 'تأیید برگه',
      'actions.reject': 'رد برگه',
      'actions.delete': 'حذف برگه',
      'labels.new': 'جدید',
      'labels.pro': 'حرفه‌ای',
      'selector.venue': 'سالن همایش',
      'analyze.header': 'نتایج نظرسنجی',
      'auth.signup.title': 'ثبت‌ نام',
      'auth.signup.description': 'شماره همراه و گذرواژه خود را برای ثبت‌ نام وارد کنید!',
      'auth.signup.organization': 'سازمان',
      'auth.signup.name': 'نام',
      'auth.login.title': 'ورود',
      'auth.login.description': 'شماره همراه و گذرواژه خود را برای ورود وارد کنید!',
      'auth.login.phone': 'شماره همراه',
      'auth.login.password': 'گذرواژه',
    },
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'fa',
      supportedLngs: supportedLanguages,
      nonExplicitSupportedLngs: true,
      load: 'languageOnly',
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
    })
    .catch((error) => {
      console.error('Failed to initialize i18n', error);
    });
}

export default i18n;
