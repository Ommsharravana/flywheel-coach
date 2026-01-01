import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserTable } from '@/components/admin/UserTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Building2 } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/admin/ExportButton';
import { getEffectiveUser } from '@/lib/supabase/effective-user';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'builder' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  user_category: 'learner' | 'senior_learner';
  avatar_url: string | null;
  created_at: string;
  institution_id: string | null;
  institution_name?: string | null;
}

interface CycleCountRow {
  user_id: string;
}

interface AdminProfile {
  role: string;
  institution_id: string | null;
}

interface Institution {
  id: string;
  name: string;
  short_name: string;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Get effective user (supports impersonation)
  const effectiveUser = await getEffectiveUser();
  if (!effectiveUser) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any).rpc('get_user_role', { user_id: effectiveUser.id });
  const admin = (roleData as { role: string; institution_id: string | null }[] | null)?.[0] as AdminProfile | null;
  const isInstitutionAdmin = admin?.role === 'institution_admin';

  // Simplified model: role='event_admin' grants global admin access
  const isEventAdmin = admin?.role === 'event_admin';

  // Fetch institutions for lookup
  const { data: institutionsData } = await supabase
    .from('institutions')
    .select('id, name, short_name');

  const institutions = (institutionsData || []) as Institution[];
  const institutionMap = new Map(institutions.map(i => [i.id, i]));

  // Use RPC function to fetch users (bypasses RLS, handles role-based filtering)
  // Pass effective user ID to support impersonation
  // Fetch in batches to overcome Supabase's 1000 row default limit
  const BATCH_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allUsersData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch } = await (supabase as any).rpc('get_all_users_admin', {
      caller_user_id: effectiveUser.id,
      page_offset: offset,
      page_limit: BATCH_SIZE
    });

    if (!batch || batch.length === 0) {
      hasMore = false;
    } else {
      allUsersData = [...allUsersData, ...batch];
      offset += BATCH_SIZE;

      // Stop if we've fetched less than batch size (last batch)
      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      }
    }
  }

  // Map users with institution names, remove total_count from batch response
  const users = allUsersData.map((u: Record<string, unknown>) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    user_category: u.user_category || 'learner',
    avatar_url: u.avatar_url,
    created_at: u.created_at,
    institution_id: u.institution_id,
    institution_name: u.institution_id ? institutionMap.get(u.institution_id as string)?.short_name : null,
  })) as UserRow[];

  // Get current admin's institution name for display
  const adminInstitution = isInstitutionAdmin && admin?.institution_id
    ? institutionMap.get(admin.institution_id)
    : null;

  // Fetch cycle counts for each user
  const { data: cycleCountsData } = await supabase
    .from('cycles')
    .select('user_id');

  const cycleCounts = (cycleCountsData || []) as unknown as CycleCountRow[];

  // Count cycles per user
  const cycleCountMap: Record<string, number> = {};
  cycleCounts.forEach((c) => {
    cycleCountMap[c.user_id] = (cycleCountMap[c.user_id] || 0) + 1;
  });

  // Combine data
  const usersWithCycles = users.map((user) => ({
    ...user,
    cycle_count: cycleCountMap[user.id] || 0,
    institution_name: user.institution_name,
  }));

  // Stats - separated by Category (identity) and Role (permissions)
  const totalUsers = users.length;
  const categoryStats = {
    learner: users.filter((u) => u.user_category === 'learner').length,
    senior_learner: users.filter((u) => u.user_category === 'senior_learner').length,
  };
  const adminCount = users.filter((u) =>
    u.role === 'admin' || u.role === 'superadmin' || u.role === 'event_admin' || u.role === 'institution_admin'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">
            User Management
          </h1>
          <p className="text-stone-400">
            {isInstitutionAdmin && adminInstitution ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-400" />
                {adminInstitution.short_name} - {totalUsers} users
              </span>
            ) : isEventAdmin ? (
              `Users in your events - ${totalUsers} users`
            ) : (
              `View and manage all ${totalUsers} users`
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton type="users" />
          <Link href="/admin/users/new">
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-stone-100">{totalUsers}</div>
            <p className="text-sm text-stone-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{categoryStats.learner}</div>
            <p className="text-sm text-stone-500">Learners (Students)</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-400">{categoryStats.senior_learner}</div>
            <p className="text-sm text-stone-500">Senior Learners (Faculty)</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">{adminCount}</div>
            <p className="text-sm text-stone-500">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={usersWithCycles} showInstitution={!isInstitutionAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
