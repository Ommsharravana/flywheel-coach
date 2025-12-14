import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface ProfileRow {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'superadmin';
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
    .select('name, email, avatar_url, role')
    .eq('id', user.id)
    .single();

  const profile = profileData as unknown as ProfileRow | null;

  // Double-check superadmin role (middleware should catch this, but belt-and-suspenders)
  if (!profile || profile.role !== 'superadmin') {
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
