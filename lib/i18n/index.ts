import { en } from './dictionaries/en';
import { ta } from './dictionaries/ta';
import type { Locale, Dictionary, TranslationParams } from './types';

const dictionaries: Record<Locale, Dictionary> = { en, ta };

/**
 * Get the full dictionary for a locale
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, 'dashboard.welcome') -> obj.dashboard.welcome
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      // Return key if not found (helps with debugging)
      console.warn(`Translation key not found: ${path}`);
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Interpolate params into string
 * e.g., interpolate('Hello, {name}!', { name: 'John' }) -> 'Hello, John!'
 */
function interpolate(str: string, params?: TranslationParams): string {
  if (!params) return str;

  return str.replace(/{(\w+)}/g, (_, key) => {
    return params[key]?.toString() || `{${key}}`;
  });
}

/**
 * Create a translation function for a specific locale
 *
 * Usage:
 * const t = createTranslator('ta');
 * t('dashboard.welcome') // "மீண்டும் வரவேற்கிறோம்!"
 * t('dashboard.welcomeWithName', { name: 'John' }) // "மீண்டும் வரவேற்கிறோம், John!"
 */
export function createTranslator(locale: Locale) {
  const dictionary = getDictionary(locale);

  return function t(key: string, params?: TranslationParams): string {
    const value = getNestedValue(dictionary as unknown as Record<string, unknown>, key);
    return interpolate(value, params);
  };
}

/**
 * Translate a key directly (utility for one-off translations)
 */
export function translate(locale: Locale, key: string, params?: TranslationParams): string {
  const t = createTranslator(locale);
  return t(key, params);
}

// Export types and dictionaries
export type { Locale, Dictionary, TranslationParams };
export { en, ta };
