import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Repeat, Activity } from 'lucide-react';
import Link from 'next/link';
import { getAdminEvents } from '@/lib/methodologies/helpers';
import { getEffectiveUser } from '@/lib/supabase/effective-user';
import { redirect } from 'next/navigation';

interface UserRow {
  id: string;
  role: string;
  created_at: string;
}

interface CycleRow {
  id: string;
  status: string;
  current_step: number;
  user_id: string;
}

interface RecentCycleRow {
  id: string;
  name: string | null;
  status: string;
  current_step: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  users: { name: string | null; email: string } | null;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get effective user (supports impersonation)
  const effectiveUser = await getEffectiveUser();
  if (!effectiveUser) {
    redirect('/login');
  }

  // Check admin access and get event scope for effective user
  const adminEvents = await getAdminEvents(effectiveUser.id);
  const isSuperadmin = adminEvents.some(e => e.role === 'superadmin');

  if (adminEvents.length === 0) {
    redirect('/dashboard');
  }

  // Get event IDs for filtering (null if superadmin sees all)
  const eventIds = isSuperadmin ? null : adminEvents.map(e => e.id);

  // Fetch cycles (filtered by event for non-superadmin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cyclesQuery = (supabase as any)
    .from('cycles')
    .select('id, status, current_step, user_id');

  if (eventIds) {
    cyclesQuery = cyclesQuery.in('event_id', eventIds);
  }

  const { data: cyclesData } = await cyclesQuery;
  const cycles = (cyclesData || []) as unknown as CycleRow[];

  // Get unique user IDs from cycles for event admins
  const cycleUserIds = [...new Set(cycles.map((c) => c.user_id))];

  // Fetch users using RPC to bypass RLS
  // Use get_all_users_admin for superadmin, filter by cycle users for event admins
  let users: UserRow[] = [];

  if (isSuperadmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersData } = await (supabase as any).rpc('get_all_users_admin', {
      caller_user_id: effectiveUser.id
    });
    users = ((usersData || []) as { id: string; role: string; created_at: string }[]).map(u => ({
      id: u.id,
      role: u.role,
      created_at: u.created_at
    }));
  } else {
    // For event admins, get all users via RPC (includes users by active_event_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersData } = await (supabase as any).rpc('get_all_users_admin', {
      caller_user_id: effectiveUser.id
    });
    users = ((usersData || []) as { id: string; role: string; created_at: string }[]).map(u => ({
      id: u.id,
      role: u.role,
      created_at: u.created_at
    }));
  }

  const totalUsers = users.length;
  const learners = users.filter((u) => u.role === 'learner').length;
  const facilitators = users.filter((u) => u.role === 'facilitator').length;
  const admins = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;

  // New users this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newUsersThisWeek = users.filter(
    (u) => new Date(u.created_at) > oneWeekAgo
  ).length;
  const totalCycles = cycles.length;
  const activeCycles = cycles.filter((c) => c.status === 'active').length;
  const completedCycles = cycles.filter((c) => c.status === 'completed').length;
  const abandonedCycles = cycles.filter((c) => c.status === 'abandoned').length;

  // Average step for active cycles
  const activeSteps = cycles.filter((c) => c.status === 'active').map((c) => c.current_step);
  const avgStep = activeSteps.length > 0
    ? (activeSteps.reduce((a, b) => a + b, 0) / activeSteps.length).toFixed(1)
    : '0';

  // Step funnel data
  const stepCounts = Array.from({ length: 8 }, (_, i) => ({
    step: i + 1,
    count: cycles.filter((c) => c.status === 'active' && c.current_step === i + 1).length,
  }));

  // Fetch recent activity (cycles created/updated recently)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentQuery = (supabase as any)
    .from('cycles')
    .select(`
      id,
      name,
      status,
      current_step,
      created_at,
      updated_at,
      user_id,
      users (name, email)
    `)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (eventIds) {
    recentQuery = recentQuery.in('event_id', eventIds);
  }

  const { data: recentCyclesData } = await recentQuery;
  const recentCycles = (recentCyclesData || []) as unknown as RecentCycleRow[];

  // Get event names for display (for event admins)
  const eventNames = isSuperadmin ? null : adminEvents.map(e => e.name).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          {isSuperadmin ? 'Super Admin Dashboard' : 'Event Admin Dashboard'}
        </h1>
        <p className="text-stone-400">
          {isSuperadmin
            ? 'Overview of all Solution Studio activity across institutions'
            : `Dashboard for: ${eventNames}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          description={`${learners} learners, ${facilitators} senior learners`}
          iconName="users"
          trend={{
            value: newUsersThisWeek,
            label: 'new this week',
            isPositive: newUsersThisWeek > 0,
          }}
        />
        <StatsCard
          title="Total Cycles"
          value={totalCycles}
          description={`${activeCycles} active, ${completedCycles} completed`}
          iconName="repeat"
        />
        <StatsCard
          title="Average Step"
          value={avgStep}
          description="For active cycles"
          iconName="target"
        />
        <StatsCard
          title="Completion Rate"
          value={totalCycles > 0 ? `${Math.round((completedCycles / totalCycles) * 100)}%` : '0%'}
          description={`${abandonedCycles} abandoned`}
          iconName="trending"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step Funnel */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Step Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stepCounts.map((item) => {
                const percentage = activeCycles > 0
                  ? Math.round((item.count / activeCycles) * 100)
                  : 0;
                return (
                  <div key={item.step} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-stone-400">S{item.step}</span>
                    <div className="flex-1 h-6 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-stone-400 text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-stone-100">Recent Activity</CardTitle>
            <Link
              href="/admin/cycles"
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCycles && recentCycles.length > 0 ? (
                recentCycles.map((cycle) => {
                  const user = cycle.users as { name: string | null; email: string } | null;
                  return (
                    <div
                      key={cycle.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-100">
                          {cycle.name || 'Untitled Cycle'}
                        </p>
                        <p className="text-xs text-stone-500">
                          {user?.name || user?.email || 'Unknown user'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              cycle.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : cycle.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-stone-500/20 text-stone-400'
                            }`}
                          >
                            {cycle.status}
                          </span>
                          <span className="text-xs text-stone-500">
                            Step {cycle.current_step}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-stone-500 text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors"
            >
              <Users className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-stone-100">Manage Users</p>
                <p className="text-xs text-stone-500">View and edit user accounts</p>
              </div>
            </Link>
            <Link
              href="/admin/cycles"
              className="flex items-center gap-3 p-4 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors"
            >
              <Repeat className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-stone-100">View Cycles</p>
                <p className="text-xs text-stone-500">Monitor all flywheel cycles</p>
              </div>
            </Link>
            <Link
              href="/admin/activity"
              className="flex items-center gap-3 p-4 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors"
            >
              <Activity className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-stone-100">Activity Log</p>
                <p className="text-xs text-stone-500">View admin actions</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
