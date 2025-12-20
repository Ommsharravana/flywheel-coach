import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserTable } from '@/components/admin/UserTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Building2 } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/admin/ExportButton';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'institution_admin' | 'superadmin';
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

  // Get current admin's profile
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role, institution_id')
    .eq('id', authUser.id)
    .single();

  const admin = adminProfile as AdminProfile | null;
  const isInstitutionAdmin = admin?.role === 'institution_admin';

  // Fetch institutions for lookup
  const { data: institutionsData } = await supabase
    .from('institutions')
    .select('id, name, short_name');

  const institutions = (institutionsData || []) as Institution[];
  const institutionMap = new Map(institutions.map(i => [i.id, i]));

  // Build users query - filter by institution for institution_admin
  let usersQuery = supabase
    .from('users')
    .select('id, email, name, role, avatar_url, created_at, institution_id')
    .order('created_at', { ascending: false });

  if (isInstitutionAdmin && admin?.institution_id) {
    usersQuery = usersQuery.eq('institution_id', admin.institution_id);
  }

  const { data: usersData } = await usersQuery;

  // Map users with institution names
  const users = (usersData || []).map((u: Record<string, unknown>) => ({
    ...u,
    institution_name: u.institution_id ? institutionMap.get(u.institution_id as string)?.short_name : null,
  })) as unknown as UserRow[];

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

  // Stats
  const totalUsers = users.length;
  const roleStats = {
    learner: users.filter((u) => u.role === 'learner').length,
    facilitator: users.filter((u) => u.role === 'facilitator').length,
    admin: users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length,
  };

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
            <div className="text-2xl font-bold text-blue-400">{roleStats.learner}</div>
            <p className="text-sm text-stone-500">Learners</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{roleStats.facilitator}</div>
            <p className="text-sm text-stone-500">Facilitators</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">{roleStats.admin}</div>
            <p className="text-sm text-stone-500">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-stone-100">All Users</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 w-64 bg-stone-800 border-stone-700"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable users={usersWithCycles} showInstitution={!isInstitutionAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
