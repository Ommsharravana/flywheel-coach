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

export default async function AdminCyclesPage() {
  const supabase = await createClient();

  // Get auth user for passing to RPC
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');

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

  // Stats
  const totalCycles = cycles?.length || 0;
  const activeCycles = cycles?.filter((c) => c.status === 'active').length || 0;
  const completedCycles = cycles?.filter((c) => c.status === 'completed').length || 0;
  const abandonedCycles = cycles?.filter((c) => c.status === 'abandoned').length || 0;

  // Step distribution
  const stepCounts = Array.from({ length: 8 }, (_, i) => ({
    step: i + 1,
    count: cycles?.filter((c) => c.status === 'active' && c.current_step === i + 1).length || 0,
  }));

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
