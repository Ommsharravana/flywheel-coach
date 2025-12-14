import { createClient } from '@/lib/supabase/server';
import { StepFunnelChart } from '@/components/admin/charts/StepFunnelChart';
import { WorkflowPieChart } from '@/components/admin/charts/WorkflowPieChart';
import { UserGrowthChart } from '@/components/admin/charts/UserGrowthChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, subWeeks } from 'date-fns';

interface CycleRow {
  id: string;
  status: string;
  current_step: number;
  workflow_type: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  created_at: string;
  role: string;
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Fetch all cycles
  const { data: cyclesData } = await supabase
    .from('cycles')
    .select('id, status, current_step, workflow_type, created_at');
  const cycles = (cyclesData || []) as unknown as CycleRow[];

  // Fetch all users
  const { data: usersData } = await supabase.from('users').select('id, created_at, role');
  const users = (usersData || []) as unknown as UserRow[];

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
  const usersWithCycles = new Set(cycles.map((c) => (c as { user_id?: string }).user_id)).size;
  const engagementRate = totalUsers > 0 ? Math.round((usersWithCycles / totalUsers) * 100) : 0;

  // Active this week
  const oneWeekAgo = subDays(now, 7);
  const activeThisWeek = cycles.filter(
    (c) => new Date(c.created_at) > oneWeekAgo
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">Analytics</h1>
        <p className="text-stone-400">Detailed metrics and visualizations</p>
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
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-stone-300">Learners</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'learner').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm text-stone-300">Facilitators</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'facilitator').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-stone-300">Admins</span>
                </div>
                <span className="text-sm font-medium text-stone-100">
                  {users.filter((u) => u.role === 'admin').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
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
