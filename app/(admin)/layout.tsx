import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface ProfileRow {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  institution_id: string | null;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from('users')
    .select('name, email, avatar_url, role, institution_id')
    .eq('id', user.id)
    .single();

  const profile = profileData as unknown as ProfileRow | null;

  // Double-check admin role (middleware should catch this, but belt-and-suspenders)
  const allowedRoles = ['superadmin', 'institution_admin', 'event_admin'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-stone-950 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader
          user={user}
          profile={{
            name: profile.name,
            email: profile.email || user.email || '',
            avatarUrl: profile.avatar_url,
          }}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
