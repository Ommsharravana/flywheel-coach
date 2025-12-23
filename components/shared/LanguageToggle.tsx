'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import type { Locale } from '@/lib/i18n/types';

interface LanguageToggleProps {
  /** Optional className for positioning */
  className?: string;
  /** Show label text alongside toggle */
  showLabel?: boolean;
}

/**
 * A prominent language toggle for EN/Tamil
 * Works without authentication - stores preference in localStorage
 * Reloads page to apply language change
 */
export function LanguageToggle({ className = '', showLabel = true }: LanguageToggleProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('flywheel-locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'ta')) {
      setLocale(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const newLocale: Locale = locale === 'en' ? 'ta' : 'en';
    localStorage.setItem('flywheel-locale', newLocale);
    setLocale(newLocale);
    // Reload to apply language change across the page
    window.location.reload();
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
        className="relative flex items-center h-10 rounded-full bg-stone-800/80 border border-stone-700 hover:border-amber-500/50 transition-all duration-300 shadow-lg"
        aria-label={`Switch to ${locale === 'en' ? 'Tamil' : 'English'}`}
      >
        {/* EN option */}
        <span
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
            locale === 'en'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          EN
        </span>

        {/* Tamil option */}
        <span
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
            locale === 'ta'
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
