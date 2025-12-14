import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser, isImpersonating } from '@/lib/supabase/effective-user'
import { Header } from '@/components/shared/Header'
import { redirect } from 'next/navigation'

interface ProfileRow {
  role: 'learner' | 'facilitator' | 'admin' | 'superadmin';
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
    .select('role')
    .eq('id', authUser.id)
    .single()

  const profile = profileData as unknown as ProfileRow | null;

  // Create a user object compatible with Header
  const displayUser = {
    id: effectiveUser.id,
    email: effectiveUser.email,
    user_metadata: {
      name: effectiveUser.name,
    },
  }

  return (
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-mesh" />
      <div className="fixed inset-0 noise-bg" />

      <Header user={displayUser} role={profile?.role} />

      <main className={`relative z-10 pb-8 px-4 sm:px-6 lg:px-8 ${impersonating ? 'pt-32' : 'pt-20'}`}>
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
