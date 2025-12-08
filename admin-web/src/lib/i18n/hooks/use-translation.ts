/**
 * Translation Hook
 * Provides translation function for components
 */

'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { messages, type Messages } from '../messages';
import { getLocaleFromPath, defaultLocale, type Locale } from '../config';

export function useTranslation() {
  const pathname = usePathname();
  const locale = useMemo(() => getLocaleFromPath(pathname), [pathname]);

  const t = useMemo(() => {
    const localeMessages = messages[locale] || messages[defaultLocale];

    return (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: any = localeMessages;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k as keyof typeof value];
        } else {
          // Fallback to default locale
          const defaultMessages = messages[defaultLocale];
          let fallbackValue: any = defaultMessages;
          for (const fk of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
              fallbackValue = fallbackValue[fk as keyof typeof fallbackValue];
            } else {
              return key; // Return key if translation not found
            }
          }
          value = fallbackValue;
          break;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      // Replace parameters
      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) => str.replace(`{{${paramKey}}}`, String(paramValue)),
          value
        );
      }

      return value;
    };
  }, [locale]);

  return { t, locale };
}

