import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CycleTable } from '@/components/admin/CycleTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Repeat, CheckCircle, XCircle, Play } from 'lucide-react';

interface CycleFromRPC {
  id: string;
  name: string | null;
  status: string;
  current_step: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  event_id: string | null;
  user_name: string | null;
  user_email: string;
}

interface CycleRow {
  id: string;
  name: string | null;
  status: 'active' | 'completed' | 'abandoned';
  current_step: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  users: { id: string; name: string | null; email: string } | null;
}

interface CycleStats {
  total_cycles: number;
  active_cycles: number;
  completed_cycles: number;
  abandoned_cycles: number;
  step_1_count: number;
  step_2_count: number;
  step_3_count: number;
  step_4_count: number;
  step_5_count: number;
  step_6_count: number;
  step_7_count: number;
  step_8_count: number;
}

export default async function AdminCyclesPage() {
  const supabase = await createClient();

  // Get auth user for passing to RPC
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');

  // Fetch stats separately (aggregates bypass 1000 row limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: statsData } = await (supabase as any).rpc('get_cycle_stats_admin', {
    caller_user_id: authUser.id
  });

  // Use RPC function to fetch cycles (bypasses RLS issues with auth.uid() in server components)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cyclesData } = await (supabase as any).rpc('get_all_cycles_admin', {
    caller_user_id: authUser.id
  });

  // Transform RPC response to match expected interface
  const cycles: CycleRow[] = ((cyclesData || []) as CycleFromRPC[]).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status as 'active' | 'completed' | 'abandoned',
    current_step: c.current_step,
    created_at: c.created_at,
    updated_at: c.updated_at,
    user_id: c.user_id,
    users: c.user_email ? { id: c.user_id, name: c.user_name, email: c.user_email } : null,
  }));

  // Transform to match expected type
  const cyclesWithUsers = cycles.map((cycle) => ({
    ...cycle,
    user: cycle.users,
  }));

  // Stats from dedicated RPC (accurate counts, not limited to 1000)
  const stats: CycleStats = statsData?.[0] || {
    total_cycles: 0, active_cycles: 0, completed_cycles: 0, abandoned_cycles: 0,
    step_1_count: 0, step_2_count: 0, step_3_count: 0, step_4_count: 0,
    step_5_count: 0, step_6_count: 0, step_7_count: 0, step_8_count: 0
  };

  const totalCycles = stats.total_cycles;
  const activeCycles = stats.active_cycles;
  const completedCycles = stats.completed_cycles;
  const abandonedCycles = stats.abandoned_cycles;

  // Step distribution from stats
  const stepCounts = [
    { step: 1, count: stats.step_1_count },
    { step: 2, count: stats.step_2_count },
    { step: 3, count: stats.step_3_count },
    { step: 4, count: stats.step_4_count },
    { step: 5, count: stats.step_5_count },
    { step: 6, count: stats.step_6_count },
    { step: 7, count: stats.step_7_count },
    { step: 8, count: stats.step_8_count },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Cycle Management
        </h1>
        <p className="text-stone-400">
          View and manage all {totalCycles} flywheel cycles
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-800">
                <Repeat className="h-5 w-5 text-stone-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{totalCycles}</div>
                <p className="text-sm text-stone-500">Total Cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Play className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{activeCycles}</div>
                <p className="text-sm text-stone-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CheckCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{completedCycles}</div>
                <p className="text-sm text-stone-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-700">
                <XCircle className="h-5 w-5 text-stone-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-400">{abandonedCycles}</div>
                <p className="text-sm text-stone-500">Abandoned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step Distribution */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Active Cycles by Step</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {stepCounts.map((item) => {
              const maxCount = Math.max(...stepCounts.map((s) => s.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div
                  key={item.step}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 to-orange-500 rounded-t-md transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-stone-100">{item.count}</p>
                    <p className="text-xs text-stone-500">S{item.step}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cycles Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-stone-100">All Cycles</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                placeholder="Search cycles..."
                className="pl-9 w-64 bg-stone-800 border-stone-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CycleTable cycles={cyclesWithUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
