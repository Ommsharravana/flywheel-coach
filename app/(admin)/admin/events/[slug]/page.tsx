import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess, getMethodologyForCycle } from '@/lib/methodologies/helpers';
import { getMethodologyForEvent } from '@/lib/methodologies';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Target,
  Database,
  Settings,
  Activity,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect('/login');
  }

  // Get event by slug
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single() as { data: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      start_date: string | null;
      end_date: string | null;
      config: Record<string, unknown>;
      is_active: boolean;
      created_at: string;
    } | null; error: unknown };

  if (error || !event) {
    redirect('/admin/events');
  }

  // Check if user has admin access to this event
  const { isAdmin, role } = await checkEventAdminAccess(userId, event.id);

  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Get methodology
  const methodology = getMethodologyForEvent(event.config);

  // Get statistics
  const { count: participantCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('active_event_id', event.id);

  const { count: totalCycles } = await supabase
    .from('cycles')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id);

  const { count: completedCycles } = await supabase
    .from('cycles')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .gte('current_step', methodology.completionStep);

  const { count: problemCount } = await supabase
    .from('problem_bank')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id);

  // Get recent activity
  const { data: recentCycles } = await supabase
    .from('cycles')
    .select(`
      id,
      name,
      current_step,
      status,
      created_at,
      updated_at,
      users!cycles_user_id_fkey (
        name,
        email,
        institutions (short_name)
      )
    `)
    .eq('event_id', event.id)
    .order('updated_at', { ascending: false })
    .limit(10) as { data: Array<{
      id: string;
      name: string;
      current_step: number;
      status: string;
      created_at: string;
      updated_at: string;
      users: {
        name: string;
        email: string;
        institutions: { short_name: string } | null;
      } | null;
    }> | null };

  // Get participant breakdown by institution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: institutionBreakdown } = await (supabase as any)
    .rpc('get_event_institution_stats', { target_event_id: event.id }) as {
    data: Array<{
      institution_id: string;
      institution_name: string;
      participant_count: number;
      cycle_count: number;
    }> | null
  };

  // Calculate event status
  const now = new Date();
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  let eventStatus: 'upcoming' | 'active' | 'ended' = 'active';
  if (startDate && now < startDate) {
    eventStatus = 'upcoming';
  } else if (endDate && now > endDate) {
    eventStatus = 'ended';
  }

  const completionRate = totalCycles ? Math.round(((completedCycles || 0) / totalCycles) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-stone-100">{event.name}</h1>
            <Badge
              variant="outline"
              className={
                eventStatus === 'active'
                  ? 'text-green-400 border-green-500/30'
                  : eventStatus === 'upcoming'
                    ? 'text-blue-400 border-blue-500/30'
                    : 'text-stone-400 border-stone-500/30'
              }
            >
              {eventStatus === 'active' ? 'Active' : eventStatus === 'upcoming' ? 'Upcoming' : 'Ended'}
            </Badge>
            <Badge variant="outline" className="text-amber-400 border-amber-500/30">
              {role}
            </Badge>
          </div>
          <p className="text-stone-400">
            {event.description || `Managing ${methodology.name} event`}
          </p>
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
              <Calendar className="h-4 w-4" />
              {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/events/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="border-stone-700">
              View Public Page
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href={`/admin/events/${slug}/settings`}>
            <Button variant="outline" size="sm" className="border-stone-700">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-stone-100">{participantCount || 0}</div>
                <p className="text-sm text-stone-500">Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Target className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-stone-100">{totalCycles || 0}</div>
                <p className="text-sm text-stone-500">Total Cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-stone-100">{completionRate}%</div>
                <p className="text-sm text-stone-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Database className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-stone-100">{problemCount || 0}</div>
                <p className="text-sm text-stone-500">Problems Banked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="bg-stone-900/50 border border-stone-800">
          <TabsTrigger value="activity" className="data-[state=active]:bg-stone-800">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="institutions" className="data-[state=active]:bg-stone-800">
            <TrendingUp className="h-4 w-4 mr-2" />
            By Institution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Recent Cycle Activity</CardTitle>
              <CardDescription>Latest updates from participants</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCycles && recentCycles.length > 0 ? (
                <div className="space-y-3">
                  {recentCycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50 border border-stone-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            cycle.status === 'completed'
                              ? 'bg-green-400'
                              : cycle.status === 'active'
                                ? 'bg-amber-400'
                                : 'bg-stone-400'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-stone-100">
                            {cycle.users?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-stone-500">
                            {cycle.users?.institutions?.short_name || 'No Institution'} • Step{' '}
                            {cycle.current_step}/{methodology.steps.length}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-stone-400">
                          {new Date(cycle.updated_at).toLocaleDateString()}
                        </div>
                        <Link href={`/admin/cycles/${cycle.id}`}>
                          <Button variant="ghost" size="sm" className="text-stone-400 h-6 px-2">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institutions">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Institution Breakdown</CardTitle>
              <CardDescription>Participation by institution</CardDescription>
            </CardHeader>
            <CardContent>
              {institutionBreakdown && institutionBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {institutionBreakdown.map((inst, index) => (
                    <div
                      key={inst.institution_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50 border border-stone-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                          {index + 1}
                        </div>
                        <div className="font-medium text-stone-100">{inst.institution_name}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <span className="font-bold text-stone-100">{inst.participant_count}</span>
                          <span className="text-stone-500 ml-1">participants</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-amber-400">{inst.cycle_count}</span>
                          <span className="text-stone-500 ml-1">cycles</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No institution data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/admin/events/${slug}/participants`}>
          <Card className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-medium text-stone-100">Manage Participants</div>
                  <div className="text-sm text-stone-500">View and manage event participants</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/events/${slug}/problems`}>
          <Card className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-green-400" />
                <div>
                  <div className="font-medium text-stone-100">Problem Bank</div>
                  <div className="text-sm text-stone-500">View problems from this event</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/admin/events/${slug}/settings`}>
          <Card className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="font-medium text-stone-100">Event Settings</div>
                  <div className="text-sm text-stone-500">Configure event options</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
