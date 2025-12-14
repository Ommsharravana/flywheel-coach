import { createClient } from '@/lib/supabase/server';
import { UserTable } from '@/components/admin/UserTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/admin/ExportButton';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'learner' | 'facilitator' | 'admin' | 'superadmin';
  avatar_url: string | null;
  created_at: string;
}

interface CycleCountRow {
  user_id: string;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Fetch all users with their cycle counts
  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, name, role, avatar_url, created_at')
    .order('created_at', { ascending: false });

  const users = (usersData || []) as unknown as UserRow[];

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
            View and manage all {totalUsers} users
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
          <UserTable users={usersWithCycles} />
        </CardContent>
      </Card>
    </div>
  );
}
