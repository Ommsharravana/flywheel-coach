import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser, isImpersonating } from '@/lib/supabase/effective-user'
import { Header } from '@/components/shared/Header'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
import { EventBanner } from '@/components/events/EventBanner'
import { EventProvider } from '@/lib/context/EventContext'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import type { Locale } from '@/lib/i18n/types'
import { redirect } from 'next/navigation'
import type { Event } from '@/lib/events/types'

interface ProfileRow {
  role: 'learner' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  active_event_id: string | null;
  language: string | null;
  institution_id: string | null;
  name: string | null;
  email: string | null;
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

  // Fetch user profile using RPC function (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .rpc('get_user_profile', { p_user_id: authUser.id });

  const profile = (profileData as ProfileRow[] | null)?.[0] ?? null;
  const userLocale: Locale = (profile?.language as Locale) || 'en';

  // Fetch effective user's profile using RPC (may differ if impersonating)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: effectiveProfileData } = await (supabase as any)
    .rpc('get_user_profile', { p_user_id: effectiveUser.id });

  const effectiveProfile = (effectiveProfileData as ProfileRow[] | null)?.[0] ?? null;
  const activeEventId = effectiveProfile?.active_event_id ?? null;

  // Fetch the active event if user is in one
  let activeEvent: Event | null = null;
  if (activeEventId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventData } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('id', activeEventId)
      .eq('is_active', true)
      .single();

    if (eventData) {
      activeEvent = eventData as Event;
    }
  }

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
  const hasEvent = activeEvent !== null;
  let topPadding = 'pt-20';
  if (hasImpersonation && hasEvent) {
    topPadding = 'pt-40';
  } else if (hasImpersonation) {
    topPadding = 'pt-32';
  } else if (hasEvent) {
    topPadding = 'pt-28';
  }

  return (
    <LanguageProvider initialLocale={userLocale} userId={authUser.id}>
      <EventProvider activeEvent={activeEvent}>
        <div className="relative min-h-screen">
          {/* Background effects */}
          <div className="fixed inset-0 gradient-mesh" />
          <div className="fixed inset-0 noise-bg" />

          <ImpersonationBanner />
          <EventBanner />
          <Header user={displayUser} role={profile?.role} isImpersonating={impersonating} />

          <main className={`relative z-10 pb-8 px-4 sm:px-6 lg:px-8 ${topPadding}`}>
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </EventProvider>
    </LanguageProvider>
  )
}
