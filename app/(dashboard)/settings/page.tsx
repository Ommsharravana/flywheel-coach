import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/supabase/effective-user';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Globe, Shield } from 'lucide-react';
import { SettingsForm } from './SettingsForm';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  institution: string | null;
  department: string | null;
  year_of_study: number | null;
  role: string | null;
  language: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
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
          Settings
        </h1>
        <p className="mt-1 text-stone-400">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <User className="w-5 h-5 text-amber-400" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-stone-900">
              {(profile?.name || effectiveUser.email)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-lg font-semibold text-stone-100">
                {profile?.name || effectiveUser.name || 'Learner'}
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
              <div className="text-sm text-stone-400">Cycles Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{completedCount || 0}</div>
              <div className="text-sm text-stone-400">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <SettingsForm profile={profile} userId={effectiveUser.id} />

      {/* Institution Info (Read Only) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Building2 className="w-5 h-5 text-blue-400" />
            Institution
          </CardTitle>
          <CardDescription>Your educational institution details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-400">Institution</Label>
              <div className="mt-1 text-stone-200">{profile?.institution || 'JKKN'}</div>
            </div>
            <div>
              <Label className="text-stone-400">Department</Label>
              <div className="mt-1 text-stone-200">{profile?.department || 'Not specified'}</div>
            </div>
            <div>
              <Label className="text-stone-400">Year of Study</Label>
              <div className="mt-1 text-stone-200">
                {profile?.year_of_study ? `Year ${profile.year_of_study}` : 'Not specified'}
              </div>
            </div>
            <div>
              <Label className="text-stone-400">Role</Label>
              <div className="mt-1 text-stone-200 capitalize">{profile?.role || 'Learner'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Preference */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Globe className="w-5 h-5 text-purple-400" />
            Language
          </CardTitle>
          <CardDescription>Your preferred language for the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={profile?.language === 'en' ? 'default' : 'outline'}
              className={profile?.language === 'en' ? 'bg-amber-500 text-stone-900' : 'text-stone-400'}
            >
              English
            </Badge>
            <Badge
              variant={profile?.language === 'ta' ? 'default' : 'outline'}
              className={profile?.language === 'ta' ? 'bg-amber-500 text-stone-900' : 'text-stone-400'}
            >
              தமிழ் (Tamil)
            </Badge>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Tamil support coming soon in a future update.
          </p>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="glass-card border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Shield className="w-5 h-5 text-stone-400" />
            Account
          </CardTitle>
          <CardDescription>Account security and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-stone-400">Email</Label>
            <div className="mt-1 text-stone-200">{effectiveUser.email}</div>
          </div>
          <div>
            <Label className="text-stone-400">Account Created</Label>
            <div className="mt-1 text-stone-200">
              {new Date(profile?.created_at || new Date()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div>
            <Label className="text-stone-400">Last Updated</Label>
            <div className="mt-1 text-stone-200">
              {profile?.updated_at
                ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Never'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
