'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Check, Loader2 } from 'lucide-react';

const LANGUAGES = [
  {
    code: 'en' as const,
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'ta' as const,
    name: 'Tamil',
    nativeName: 'தமிழ்',
  },
];

export function LanguageSettings() {
  const { locale, setLocale, isChanging, t } = useLanguage();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Globe className="w-5 h-5 text-purple-400" />
          {t('settings.languageTitle')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              disabled={isChanging}
              onClick={() => setLocale(lang.code)}
              className={`relative h-auto py-4 px-4 justify-start text-left transition-all ${
                locale === lang.code
                  ? 'border-purple-500 bg-purple-500/10 text-stone-100'
                  : 'border-stone-700 hover:border-stone-600 text-stone-300 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lang.nativeName}</span>
                    {lang.code === 'ta' && (
                      <span className="text-xs text-stone-500">({lang.name})</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 mt-0.5">
                    {lang.code === 'en'
                      ? t('language.englishDesc')
                      : t('language.tamilDesc')
                    }
                  </p>
                </div>
                {locale === lang.code && (
                  <div className="flex-shrink-0">
                    {isChanging ? (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    ) : (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        <div className="p-3 bg-stone-800/50 rounded-lg">
          <p className="text-xs text-stone-400">
            <strong className="text-stone-300">{t('language.note')}:</strong>{' '}
            {locale === 'ta'
              ? t('language.noteTamil')
              : t('language.noteEnglish')
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
