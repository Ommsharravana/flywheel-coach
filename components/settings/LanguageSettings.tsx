'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LanguageSettingsProps {
  userId: string;
  currentLanguage: string | null;
}

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    description: 'AI coach responds in English',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    description: 'AI coach responds in Tamil (தமிழ்)',
  },
] as const;

export function LanguageSettings({ userId, currentLanguage }: LanguageSettingsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === selectedLanguage) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          language: langCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setSelectedLanguage(langCode);
      toast.success(
        langCode === 'ta'
          ? 'மொழி தமிழ் ஆக மாற்றப்பட்டது!'
          : 'Language changed to English!'
      );
      router.refresh();
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language preference');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Globe className="w-5 h-5 text-purple-400" />
          AI Coach Language
        </CardTitle>
        <CardDescription>
          Choose the language for AI responses. The interface stays in English.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              disabled={isSaving}
              onClick={() => handleLanguageChange(lang.code)}
              className={`relative h-auto py-4 px-4 justify-start text-left transition-all ${
                selectedLanguage === lang.code
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
                  <p className="text-sm text-stone-400 mt-0.5">{lang.description}</p>
                </div>
                {selectedLanguage === lang.code && (
                  <div className="flex-shrink-0">
                    {isSaving ? (
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
            {selectedLanguage === 'ta' ? (
              <>
                <strong className="text-stone-300">குறிப்பு:</strong> AI பயிற்சியாளர் தமிழில் பதிலளிக்கும்.
                தொழில்நுட்ப சொற்கள் (Problem Discovery, Workflow) ஆங்கிலத்தில் இருக்கும்,
                ஆனால் விளக்கங்கள் தமிழில் இருக்கும்.
              </>
            ) : (
              <>
                <strong className="text-stone-300">Note:</strong> Technical terms stay in English.
                Select Tamil if you prefer explanations and guidance in your mother tongue.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
