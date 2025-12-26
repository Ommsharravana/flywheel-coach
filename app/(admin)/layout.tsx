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

  // Use RPC function (SECURITY DEFINER) to check role - same as middleware
  // This bypasses RLS to ensure consistent behavior
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any).rpc('get_user_role', { user_id: user.id });
  const userRole = (roleData as { role: string; institution_id: string }[] | null)?.[0];

  // Check admin role first using RPC (bypasses RLS)
  const allowedRoles = ['superadmin', 'institution_admin', 'event_admin'];
  if (!userRole || !allowedRoles.includes(userRole.role)) {
    redirect('/dashboard');
  }

  // Now fetch full profile for display purposes
  // If this fails due to RLS, we still have the role from RPC
  const { data: profileData } = await supabase
    .from('users')
    .select('name, email, avatar_url, role, institution_id')
    .eq('id', user.id)
    .single();

  // Use profile data if available, otherwise construct from RPC + auth user
  const profile: ProfileRow = profileData ? (profileData as unknown as ProfileRow) : {
    name: user.user_metadata?.name || null,
    email: user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    role: userRole.role as ProfileRow['role'],
    institution_id: userRole.institution_id,
  };

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
