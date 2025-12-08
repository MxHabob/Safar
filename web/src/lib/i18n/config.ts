/**
 * Internationalization Configuration
 * Supports multiple languages for the Safar platform
 */

export const locales = ['en', 'ar', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
  es: 'Español',
};

export const localeConfig = {
  en: {
    name: 'English',
    dir: 'ltr',
    dateFormat: 'MM/DD/YYYY',
  },
  ar: {
    name: 'العربية',
    dir: 'rtl',
    dateFormat: 'DD/MM/YYYY',
  },
  fr: {
    name: 'Français',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
  },
  es: {
    name: 'Español',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
  },
} as const;

/**
 * Get locale from pathname or default
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return defaultLocale;
}

/**
 * Remove locale from pathname
 */
export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return '/' + segments.slice(1).join('/');
  }

  return pathname;
}

/**
 * Add locale to pathname
 */
export function addLocaleToPath(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return pathname;
  }

  const cleanPath = removeLocaleFromPath(pathname);
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
}

