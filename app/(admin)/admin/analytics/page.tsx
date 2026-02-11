import { createClient } from '@/lib/supabase/server';
import { StepFunnelChart } from '@/components/admin/charts/StepFunnelChart';
import { WorkflowPieChart } from '@/components/admin/charts/WorkflowPieChart';
import { UserGrowthChart } from '@/components/admin/charts/UserGrowthChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, subWeeks } from 'date-fns';
import { getAdminEvents } from '@/lib/methodologies/helpers';
import { getEffectiveUser } from '@/lib/supabase/effective-user';
import { redirect } from 'next/navigation';

interface CycleRow {
  id: string;
  status: string;
  current_step: number;
  created_at: string;
  user_id: string;
  workflow_type?: string;
}

interface UserRow {
  id: string;
  created_at: string;
  role: string;
}

export default async function AdminAnalyticsPage() {
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
  // Use batch fetching to overcome Supabase's 1000 row limit
  const CYCLES_BATCH_SIZE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allCyclesData: any[] = [];
  let cyclesOffset = 0;
  let hasMoreCycles = true;

  while (hasMoreCycles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cyclesQuery = (supabase as any)
      .from('cycles')
      .select('id, status, current_step, user_id, created_at')
      .range(cyclesOffset, cyclesOffset + CYCLES_BATCH_SIZE - 1);

    if (eventIds) {
      cyclesQuery = cyclesQuery.in('event_id', eventIds);
    }

    const { data: cyclesBatch } = await cyclesQuery;

    if (!cyclesBatch || cyclesBatch.length === 0) {
      hasMoreCycles = false;
    } else {
      allCyclesData = [...allCyclesData, ...cyclesBatch];
      cyclesOffset += CYCLES_BATCH_SIZE;

      // Stop if we've fetched less than batch size (last batch)
      if (cyclesBatch.length < CYCLES_BATCH_SIZE) {
        hasMoreCycles = false;
      }
    }
  }

  const cycles = allCyclesData as CycleRow[];

  // Get unique user IDs from cycles for event admins
  const cycleUserIds = [...new Set(cycles.map((c) => c.user_id))];

  // Fetch users using RPC to bypass RLS (for superadmin) or filtered by cycle users (for event admins)
  // Use batch fetching to overcome Supabase's 1000 row limit
  let users: UserRow[] = [];

  if (isSuperadmin) {
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

    users = allUsersData.map(u => ({
      id: u.id,
      created_at: u.created_at,
      role: u.role
    })) as UserRow[];
  } else if (cycleUserIds.length > 0) {
    // For event admins, only show users who have cycles in their events
    // Batch fetch in chunks of 1000 user IDs
    const BATCH_SIZE = 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allUsersData: any[] = [];

    for (let i = 0; i < cycleUserIds.length; i += BATCH_SIZE) {
      const batchIds = cycleUserIds.slice(i, i + BATCH_SIZE);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: usersData } = await (supabase as any)
        .from('users')
        .select('id, created_at, role')
        .in('id', batchIds);

      if (usersData) {
        allUsersData = [...allUsersData, ...usersData];
      }
    }

    users = allUsersData as UserRow[];
  }

  // Step Funnel Data
  const activeCycles = cycles.filter((c) => c.status === 'active');
  const stepData = Array.from({ length: 8 }, (_, i) => ({
    step: i + 1,
    label: `Step ${i + 1}`,
    count: activeCycles.filter((c) => c.current_step === i + 1).length,
    total: activeCycles.length,
  }));

  // Workflow Distribution Data
  const workflowCounts: Record<string, number> = {};
  cycles.forEach((c) => {
    if (c.workflow_type) {
      workflowCounts[c.workflow_type] = (workflowCounts[c.workflow_type] || 0) + 1;
    }
  });

  const workflowData = Object.entries(workflowCounts)
    .map(([type, count]) => ({ type, count, color: '' }))
    .sort((a, b) => b.count - a.count);

  // User Growth Data (last 8 weeks)
  const now = new Date();
  const growthData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = subWeeks(now, 7 - i);
    const weekEnd = subWeeks(now, 6 - i);
    const count = users.filter((u) => {
      const date = new Date(u.created_at);
      return date >= weekStart && date < weekEnd;
    }).length;
    return {
      period: format(weekStart, 'yyyy-MM-dd'),
      label: format(weekStart, 'MMM d'),
      count,
    };
  });

  // Calculate key metrics
  const totalUsers = users.length;
  const totalCycles = cycles.length;
  const completedCycles = cycles.filter((c) => c.status === 'completed').length;
  const completionRate = totalCycles > 0 ? Math.round((completedCycles / totalCycles) * 100) : 0;

  // Users with at least one cycle
  const usersWithCycles = new Set(cycles.map((c) => c.user_id)).size;
  const engagementRate = totalUsers > 0 ? Math.round((usersWithCycles / totalUsers) * 100) : 0;

  // Active this week
  const oneWeekAgo = subDays(now, 7);
  const activeThisWeek = cycles.filter(
    (c) => new Date(c.created_at) > oneWeekAgo
  ).length;

  // Get event names for display (for event admins)
  const eventNames = isSuperadmin ? null : adminEvents.map(e => e.name).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">Analytics</h1>
        <p className="text-stone-400">
          {isSuperadmin
            ? 'Detailed metrics and visualizations across all events'
            : `Analytics for: ${eventNames}`}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-stone-100">{totalUsers}</div>
            <p className="text-sm text-stone-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-stone-100">{totalCycles}</div>
            <p className="text-sm text-stone-500">Total Cycles</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">{completionRate}%</div>
            <p className="text-sm text-stone-500">Completion Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-400">{engagementRate}%</div>
            <p className="text-sm text-stone-500">Engagement Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StepFunnelChart data={stepData} title="Active Cycles by Step" />
        <WorkflowPieChart data={workflowData} title="Workflow Distribution" />
      </div>

      {/* Charts Row 2 */}
      <UserGrowthChart data={growthData} title="New Users per Week" />

      {/* Detailed Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cycle Status Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Cycle Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-stone-300">Active</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {cycles.filter((c) => c.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-stone-300">Completed</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {cycles.filter((c) => c.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-stone-500" />
                  <span className="text-sm text-stone-300">Abandoned</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {cycles.filter((c) => c.status === 'abandoned').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Role Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-stone-500" />
                  <span className="text-sm text-stone-300">Builders</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'builder').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm text-stone-300">Admins</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'admin').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-sm text-stone-300">Event Admins</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'event_admin').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-stone-300">Institution Admins</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'institution_admin').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-stone-300">Superadmins</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'superadmin').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">New Users</span>
                <span className="text-sm font-medium text-green-400">
                  +{users.filter((u) => new Date(u.created_at) > oneWeekAgo).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">New Cycles</span>
                <span className="text-sm font-medium text-blue-400">+{activeThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-300">Cycles Completed</span>
                <span className="text-sm font-medium text-amber-400">
                  {cycles.filter(
                    (c) =>
                      c.status === 'completed' && new Date(c.created_at) > oneWeekAgo
                  ).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
