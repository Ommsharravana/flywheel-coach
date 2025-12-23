'use client';

import { useState, useEffect, useContext } from 'react';
import { Globe } from 'lucide-react';
import { useOptionalLanguage } from '@/lib/i18n/LanguageContext';
import type { Locale } from '@/lib/i18n/types';

interface LanguageToggleProps {
  /** Optional className for positioning */
  className?: string;
  /** Show label text alongside toggle */
  showLabel?: boolean;
}

/**
 * A prominent language toggle for EN/Tamil
 *
 * When inside LanguageProvider (authenticated):
 * - Uses context's setLocale to update database
 * - No page reload needed
 *
 * When outside LanguageProvider (landing page):
 * - Uses localStorage for persistence
 * - Reloads page to apply change
 */
export function LanguageToggle({ className = '', showLabel = true }: LanguageToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [localLocale, setLocalLocale] = useState<Locale>('en');

  // Get context if available (will return defaults if outside provider)
  const { locale: contextLocale, setLocale: contextSetLocale, isChanging } = useOptionalLanguage();

  // Check if we're inside a real LanguageProvider by checking if setLocale actually works
  // The default setLocale just logs a warning, so we detect this by checking if contextLocale changes
  const [hasContext, setHasContext] = useState(false);

  // Load preference from localStorage on mount (for unauthenticated users)
  useEffect(() => {
    setMounted(true);

    // Check if we have a real context by seeing if locale is not the default
    // If contextLocale comes from provider, it might be 'ta' from database
    // We also check localStorage to see if there's a mismatch
    const savedLocale = localStorage.getItem('flywheel-locale') as Locale | null;

    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ta')) {
      setLocalLocale(savedLocale);
    }

    // Detect if we're in a real provider by checking if contextLocale differs from 'en' default
    // or if it matches a user's saved database preference (we can't easily know, so we assume
    // if we're on dashboard pages, we have context)
    const onDashboardPage = typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/dashboard') ||
       window.location.pathname.startsWith('/settings') ||
       window.location.pathname.startsWith('/portfolio') ||
       window.location.pathname.startsWith('/cycle') ||
       window.location.pathname.startsWith('/admin'));

    setHasContext(onDashboardPage);
  }, [contextLocale]);

  // Determine current locale to display
  const currentLocale = hasContext ? contextLocale : localLocale;

  const toggleLanguage = async () => {
    const newLocale: Locale = currentLocale === 'en' ? 'ta' : 'en';

    if (hasContext) {
      // Inside LanguageProvider - use context to update database
      // Also update localStorage for consistency
      localStorage.setItem('flywheel-locale', newLocale);
      await contextSetLocale(newLocale);
    } else {
      // Outside LanguageProvider (landing page) - use localStorage + reload
      localStorage.setItem('flywheel-locale', newLocale);
      setLocalLocale(newLocale);
      window.location.reload();
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-10 w-24 rounded-full bg-stone-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <Globe className="w-5 h-5 text-amber-400" />
      )}

      {/* Toggle pill */}
      <button
        onClick={toggleLanguage}
        disabled={isChanging}
        className={`relative flex items-center h-10 rounded-full bg-stone-800/80 border border-stone-700 hover:border-amber-500/50 transition-all duration-300 shadow-lg ${isChanging ? 'opacity-50 cursor-wait' : ''}`}
        aria-label={`Switch to ${currentLocale === 'en' ? 'Tamil' : 'English'}`}
      >
        {/* EN option */}
        <span
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
            currentLocale === 'en'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          EN
        </span>

        {/* Tamil option */}
        <span
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
            currentLocale === 'ta'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          தமிழ்
        </span>
      </button>
    </div>
  );
}
