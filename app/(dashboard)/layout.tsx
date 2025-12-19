import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser, isImpersonating } from '@/lib/supabase/effective-user'
import { Header } from '@/components/shared/Header'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
import { AppathonBanner } from '@/components/appathon/AppathonBanner'
import { AppathonProvider } from '@/lib/context/AppathonContext'
import { redirect } from 'next/navigation'

interface ProfileRow {
  role: 'learner' | 'facilitator' | 'admin' | 'superadmin';
  appathon_mode: boolean | null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Get effective user (respects impersonation)
  const effectiveUser = await getEffectiveUser()
  const impersonating = await isImpersonating()

  if (!effectiveUser) {
    redirect('/login')
  }

  // Fetch user role for admin link (always use auth user's role for admin access)
  const { data: profileData } = await supabase
    .from('users')
    .select('role, appathon_mode')
    .eq('id', authUser.id)
    .single()

  const profile = profileData as unknown as ProfileRow | null;

  // Fetch effective user's appathon mode (may differ if impersonating)
  const { data: effectiveProfileData } = await supabase
    .from('users')
    .select('appathon_mode')
    .eq('id', effectiveUser.id)
    .single()

  const effectiveProfile = effectiveProfileData as { appathon_mode: boolean | null } | null;
  const isAppathonMode = effectiveProfile?.appathon_mode ?? false;

  // Create a user object compatible with Header
  const displayUser = {
    id: effectiveUser.id,
    email: effectiveUser.email,
    user_metadata: {
      name: effectiveUser.name,
    },
  }

  // Calculate top padding based on banners shown
  const hasImpersonation = impersonating;
  const hasAppathon = isAppathonMode;
  let topPadding = 'pt-20';
  if (hasImpersonation && hasAppathon) {
    topPadding = 'pt-40';
  } else if (hasImpersonation) {
    topPadding = 'pt-32';
  } else if (hasAppathon) {
    topPadding = 'pt-28';
  }

  return (
    <AppathonProvider isAppathonMode={isAppathonMode}>
      <div className="relative min-h-screen">
        {/* Background effects */}
        <div className="fixed inset-0 gradient-mesh" />
        <div className="fixed inset-0 noise-bg" />

        <ImpersonationBanner />
        {isAppathonMode && <AppathonBanner />}
        <Header user={displayUser} role={profile?.role} />

        <main className={`relative z-10 pb-8 px-4 sm:px-6 lg:px-8 ${topPadding}`}>
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </AppathonProvider>
  )
}
