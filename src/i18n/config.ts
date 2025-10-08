import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية'
};

// Locale flags/emojis for UI
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  ar: '🇸🇦'
};

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

// Check if locale is RTL
export const isRTL = (locale: Locale): boolean => rtlLocales.includes(locale);

// Get locale from pathname
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  return locales.includes(locale) ? locale : null;
}

// Remove locale from pathname
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}

// Add locale to pathname
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const cleanPath = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPath}`;
}

// Next-intl configuration
export default getRequestConfig(async ({ locale }) => {
  // If no locale is provided, use default locale
  const validLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});
