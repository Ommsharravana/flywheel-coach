import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/supabase/effective-user';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Trophy } from 'lucide-react';
import { SettingsForm } from './SettingsForm';
import { AppathonToggle } from '@/components/appathon/AppathonToggle';
import { InstitutionChangeRequest } from '@/components/settings/InstitutionChangeRequest';
import { Suspense } from 'react';
import { GeminiSetup } from '@/components/settings/GeminiSetup';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { createTranslator } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/types';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  institution: string | null;
  institution_id: string | null;
  department: string | null;
  year_of_study: number | null;
  role: string | null;
  language: string | null;
  onboarding_completed: boolean | null;
  appathon_mode: boolean | null;
  created_at: string;
  updated_at: string;
}

interface Institution {
  id: string;
  name: string;
  short_name: string;
  type: 'college' | 'school' | 'external';
  slug: string;
}

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get effective user (respects impersonation)
  const effectiveUser = await getEffectiveUser();

  if (!effectiveUser) {
    redirect('/login');
  }

  // Get user profile from public.users table (using effective user ID)
  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', effectiveUser.id)
    .single();

  const profile = profileData as UserProfile | null;
  const locale = (profile?.language as Locale) || 'en';
  const t = createTranslator(locale);

  // Fetch user's institution if they have one
  let userInstitution: Institution | null = null;
  if (profile?.institution_id) {
    const { data: institutionData } = await supabase
      .from('institutions')
      .select('id, name, short_name, type, slug')
      .eq('id', profile.institution_id)
      .single();
    userInstitution = institutionData as Institution | null;
  }

  // Get stats for effective user
  const { count: cycleCount } = await supabase
    .from('cycles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', effectiveUser.id);

  const { count: completedCount } = await supabase
    .from('cycles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', effectiveUser.id)
    .eq('status', 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-stone-400">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <User className="w-5 h-5 text-amber-400" />
            {t('settings.profile')}
          </CardTitle>
          <CardDescription>{t('settings.accountInfo')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-stone-900">
              {(profile?.name || effectiveUser.email)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-lg font-semibold text-stone-100">
                {profile?.name || effectiveUser.name || t('common.learner')}
              </div>
              <div className="text-sm text-stone-400">{effectiveUser.email}</div>
              <Badge variant="outline" className="mt-1 text-amber-400 border-amber-500/50">
                {profile?.role || 'learner'}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-stone-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{cycleCount || 0}</div>
              <div className="text-sm text-stone-400">{t('settings.cyclesStarted')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{completedCount || 0}</div>
              <div className="text-sm text-stone-400">{t('settings.completed')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <SettingsForm profile={profile} userId={effectiveUser.id} />

      {/* Competition Mode */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Trophy className="w-5 h-5 text-amber-400" />
            {t('settings.competitionMode')}
          </CardTitle>
          <CardDescription>
            {t('settings.competitionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppathonToggle
            userId={effectiveUser.id}
            initialValue={profile?.appathon_mode ?? false}
          />
        </CardContent>
      </Card>

      {/* AI Provider Setup */}
      <Suspense fallback={<div className="glass-card p-6 animate-pulse" />}>
        <GeminiSetup />
      </Suspense>

      {/* Institution Change Request */}
      <InstitutionChangeRequest
        userId={effectiveUser.id}
        currentInstitution={userInstitution}
      />

      {/* Language Preference */}
      <LanguageSettings />

      {/* Account Info */}
      <Card className="glass-card border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Shield className="w-5 h-5 text-stone-400" />
            {t('settings.account')}
          </CardTitle>
          <CardDescription>{t('settings.accountDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-stone-400">{t('settings.email')}</Label>
            <div className="mt-1 text-stone-200">{effectiveUser.email}</div>
          </div>
          <div>
            <Label className="text-stone-400">{t('settings.created')}</Label>
            <div className="mt-1 text-stone-200">
              {new Date(profile?.created_at || new Date()).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div>
            <Label className="text-stone-400">{t('settings.lastUpdated')}</Label>
            <div className="mt-1 text-stone-200">
              {profile?.updated_at
                ? new Date(profile.updated_at).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : t('common.never')
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
