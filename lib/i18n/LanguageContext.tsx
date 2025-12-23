'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createTranslator, getDictionary } from './index';
import type { Locale, Dictionary, TranslationParams } from './types';
import { toast } from 'sonner';

interface LanguageContextType {
  /** Current locale */
  locale: Locale;
  /** Full dictionary for current locale */
  dictionary: Dictionary;
  /** Translation function - t('key') or t('key', { param: value }) */
  t: (key: string, params?: TranslationParams) => string;
  /** Change locale and persist to database */
  setLocale: (locale: Locale) => Promise<void>;
  /** True while language is being changed */
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  /** Initial locale from server (from user's database preference) */
  initialLocale: Locale;
  /** User ID for persisting language preference */
  userId?: string;
}

/**
 * Provider component that wraps the app and provides language context
 *
 * Usage in layout:
 * <LanguageProvider initialLocale={userLocale} userId={user.id}>
 *   {children}
 * </LanguageProvider>
 */
export function LanguageProvider({
  children,
  initialLocale,
  userId,
}: LanguageProviderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isChanging, setIsChanging] = useState(false);

  // Memoize dictionary and translator for performance
  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const t = useMemo(() => createTranslator(locale), [locale]);

  // Change locale and persist to database
  const setLocale = useCallback(
    async (newLocale: Locale) => {
      if (newLocale === locale) return;
      if (!userId) {
        console.warn('Cannot change language: userId not provided');
        return;
      }

      setIsChanging(true);
      try {
        const { error } = await supabase
          .from('users')
          .update({
            language: newLocale,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) throw error;

        // Update local state
        setLocaleState(newLocale);

        // Show success toast in the new language
        toast.success(
          newLocale === 'ta'
            ? 'மொழி தமிழ் ஆக மாற்றப்பட்டது!'
            : 'Language changed to English!'
        );

        // Refresh to update server components
        router.refresh();
      } catch (error) {
        console.error('Error updating language:', error);
        toast.error('Failed to update language');
      } finally {
        setIsChanging(false);
      }
    },
    [locale, userId, supabase, router]
  );

  // Memoize context value
  const value = useMemo(
    () => ({
      locale,
      dictionary,
      t,
      setLocale,
      isChanging,
    }),
    [locale, dictionary, t, setLocale, isChanging]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Default English values for when outside provider
const defaultT = createTranslator('en');
const defaultDictionary = getDictionary('en');
const defaultContextValue: LanguageContextType = {
  locale: 'en',
  dictionary: defaultDictionary,
  t: defaultT,
  setLocale: async () => {
    console.warn('setLocale called outside LanguageProvider');
  },
  isChanging: false,
};

/**
 * Hook to access the full language context
 *
 * Usage:
 * const { locale, t, setLocale, isChanging } = useLanguage();
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook that returns language context or safe defaults if outside provider
 * Use this in components that may be rendered outside LanguageProvider (e.g., Header on landing page)
 */
export function useOptionalLanguage() {
  const context = useContext(LanguageContext);
  return context ?? defaultContextValue;
}

/**
 * Convenience hook for just the translation function
 * Safe to use outside LanguageProvider - will default to English
 *
 * Usage:
 * const { t, locale } = useTranslation();
 * <h1>{t('dashboard.welcome')}</h1>
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context) {
    return { t: context.t, locale: context.locale };
  }
  // Fallback to English when outside provider
  return { t: defaultT, locale: 'en' as Locale };
}
