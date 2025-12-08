/**
 * Messages index
 * Exports all translation files
 */

import { en } from './en';
import { ar } from './ar';

export const messages = {
  en,
  ar,
  // Add more languages as needed
  fr: en, // Placeholder - replace with actual French translations
  es: en, // Placeholder - replace with actual Spanish translations
} as const;

export type Messages = typeof messages;
export type MessageKey = keyof typeof messages.en;

