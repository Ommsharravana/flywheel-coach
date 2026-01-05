import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { getMethodologyForEvent } from '@/lib/methodologies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusLight } from '@/components/ui/status-light';
import { LiveBadge } from '@/components/ui/live-badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  Users,
  Target,
  Database,
  Settings,
  Activity,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Presentation,
  AlertTriangle,
  TrendingUp,
  Zap,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

// Event type for type safety after fetching
type EventData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  let userId: string | null = null;
  try {
    userId = await getEffectiveUserId();
  } catch (err) {
    console.error('[EventAdminPage] getEffectiveUserId error:', err);
    redirect('/login');
  }

  if (!userId) {
    redirect('/login');
  }

  // Get event by slug
  let event: EventData | null = null;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[EventAdminPage] Event fetch error:', error);
      redirect('/admin/events');
    }
    event = data as EventData;
  } catch (err) {
    console.error('[EventAdminPage] Event query exception:', err);
    redirect('/admin/events');
  }

  if (!event) {
    redirect('/admin/events');
  }

  // TypeScript doesn't recognize redirect() throws, so cast to known type
  const validEvent = event as EventData;
  const eventId = validEvent.id;

  // Check if user has admin access to this event
  let isAdmin = false;
  let role: string | null = null;
  try {
    const accessResult = await checkEventAdminAccess(userId, eventId);
    isAdmin = accessResult.isAdmin;
    role = accessResult.role;
  } catch (err) {
    console.error('[EventAdminPage] checkEventAdminAccess error:', err);
    redirect('/admin/events');
  }

  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Get methodology
  const methodology = getMethodologyForEvent(event.config);

  // Get statistics with error handling
  let builderCount: number | null = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .rpc('get_event_registered_builder_count', { p_event_id: eventId });
    if (error) {
      console.error('[EventAdminPage] get_event_registered_builder_count error:', error);
    } else {
      builderCount = data;
    }
  } catch (err) {
    console.error('[EventAdminPage] builderCount RPC exception:', err);
  }

  let totalCycles: number | null = 0;
  let completedCycles: number | null = 0;
  let problemCount: number | null = 0;
  let submissionCount: number | null = 0;

  try {
    const { count } = await supabase
      .from('cycles')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    totalCycles = count;
  } catch (err) {
    console.error('[EventAdminPage] totalCycles query error:', err);
  }

  try {
    const { count } = await supabase
      .from('cycles')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .gte('current_step', methodology.completionStep);
    completedCycles = count;
  } catch (err) {
    console.error('[EventAdminPage] completedCycles query error:', err);
  }

  try {
    const { count } = await supabase
      .from('problem_bank')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    problemCount = count;
  } catch (err) {
    console.error('[EventAdminPage] problemCount query error:', err);
  }

  // Get submissions count
  try {
    const { count } = await supabase
      .from('appathon_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    submissionCount = count;
  } catch (err) {
    console.error('[EventAdminPage] submissionCount query error:', err);
  }

  // Get judging tracks with progress
  let tracks: Array<{
    id: string;
    name: string;
    theme: string;
    room_location: string | null;
    is_active: boolean;
    track_judges: Array<{
      id: string;
      user_id: string;
      is_lead: boolean;
      users: { name: string | null; email: string } | null;
    }>;
  }> | null = null;

  try {
    const { data, error } = await supabase
      .from('judging_tracks')
      .select(`
        id,
        name,
        theme,
        room_location,
        is_active,
        track_judges (
          id,
          user_id,
          is_lead,
          users:user_id (name, email)
        )
      `)
      .eq('event_id', eventId)
      .order('demo_order', { ascending: true });
    if (error) {
      console.error('[EventAdminPage] tracks query error:', error);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tracks = data as any;
    }
  } catch (err) {
    console.error('[EventAdminPage] tracks query exception:', err);
  }

  // Get submission counts per track
  let trackSubmissionCounts: Array<{
    track_id: string;
    status: string;
  }> | null = null;

  try {
    const { data, error } = await supabase
      .from('submission_track_assignments')
      .select('track_id, status')
      .in('track_id', tracks?.map(t => t.id) || []);
    if (error) {
      console.error('[EventAdminPage] trackSubmissionCounts query error:', error);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackSubmissionCounts = data as any;
    }
  } catch (err) {
    console.error('[EventAdminPage] trackSubmissionCounts query exception:', err);
  }

  // Aggregate track stats
  const trackStats = tracks?.map(track => {
    const assignments = trackSubmissionCounts?.filter(a => a.track_id === track.id) || [];
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const presenting = assignments.filter(a => a.status === 'presenting').length;
    return {
      ...track,
      total,
      completed,
      presenting,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }) || [];

  // Get recent activity (removed institutions join - table doesn't exist)
  let recentCycles: Array<{
    id: string;
    name: string;
    current_step: number;
    status: string;
    created_at: string;
    updated_at: string;
    users: {
      name: string;
      email: string;
      institution: string | null;
    } | null;
  }> | null = null;

  try {
    const { data, error } = await supabase
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
          institution
        )
      `)
      .eq('event_id', eventId)
      .order('updated_at', { ascending: false })
      .limit(8);
    if (error) {
      console.error('[EventAdminPage] recentCycles query error:', error);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentCycles = data as any;
    }
  } catch (err) {
    console.error('[EventAdminPage] recentCycles query exception:', err);
  }

  // Get institution breakdown with error handling
  let institutionBreakdown: Array<{
    institution_id: string;
    institution_name: string;
    builder_count: number;
    cycle_count: number;
  }> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .rpc('get_event_institution_stats', { target_event_id: eventId });
    if (error) {
      console.error('[EventAdminPage] get_event_institution_stats error:', error);
    } else {
      institutionBreakdown = data;
    }
  } catch (err) {
    console.error('[EventAdminPage] institutionBreakdown RPC exception:', err);
  }

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

  // Days until event end (for countdown)
  const daysToEnd = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const completionRate = totalCycles ? Math.round(((completedCycles || 0) / totalCycles) * 100) : 0;

  // Check for issues that need attention
  const issues: Array<{ type: 'warning' | 'error'; message: string; action?: string; href?: string }> = [];

  if (trackStats.some(t => t.track_judges.length === 0)) {
    issues.push({
      type: 'warning',
      message: 'Some tracks have no judges assigned',
      action: 'Assign Judges',
      href: `/admin/events/${slug}/demo-day`,
    });
  }

  if (trackStats.some(t => t.total === 0)) {
    issues.push({
      type: 'warning',
      message: 'Some tracks have no submissions assigned',
      action: 'Assign Submissions',
      href: `/admin/events/${slug}/demo-day/track-assignment`,
    });
  }

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
      {/* Mission Control Header */}
      <div className="flex items-start justify-between border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#0b6d41]/20 border border-[#0b6d41]/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0b6d41]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-zinc-100">{event.name}</h1>
              <LiveBadge
                variant={eventStatus === 'active' ? 'active' : eventStatus === 'upcoming' ? 'paused' : 'offline'}
                label={eventStatus === 'active' ? 'ACTIVE' : eventStatus === 'upcoming' ? 'UPCOMING' : 'ENDED'}
              />
              <Badge variant="outline" className="text-[#ffde59] border-[#ffde59]/30 bg-[#ffde59]/10">
                {role}
              </Badge>
            </div>
            <p className="text-zinc-500 text-sm">
              {event.description || `Mission Control for ${methodology.name}`}
            </p>
            {(startDate || endDate) && (
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
                <Calendar className="h-3 w-3" />
                {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/events/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800">
              View Public
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href={`/admin/events/${slug}/settings`}>
            <Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          icon={Users}
          value={builderCount || 0}
          label="Builders"
          variant="info"
        />
        <MetricCard
          icon={FileText}
          value={submissionCount || 0}
          label="Submissions"
          variant="jkkn"
        />
        <MetricCard
          icon={Target}
          value={totalCycles || 0}
          label="Cycles"
          variant="default"
        />
        <MetricCard
          icon={CheckCircle2}
          value={`${completionRate}%`}
          label="Completion"
          variant="success"
        />
        <MetricCard
          icon={Database}
          value={problemCount || 0}
          label="Problems"
          variant="warning"
        />
        <MetricCard
          icon={Calendar}
          value={daysToEnd !== null ? (daysToEnd <= 0 ? 'Today!' : `${daysToEnd}d`) : '--'}
          label="To Demo Day"
          variant={daysToEnd !== null && daysToEnd <= 3 ? 'error' : 'default'}
        />
      </div>

      {/* Alert Panel - Only show if there are issues */}
      {issues.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm text-amber-400">Action Required ({issues.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-2">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-zinc-900/50">
                  <div className="flex items-center gap-2">
                    <StatusLight status={issue.type === 'error' ? 'error' : 'warning'} size="sm" />
                    <span className="text-sm text-zinc-300">{issue.message}</span>
                  </div>
                  {issue.href && (
                    <Link href={issue.href}>
                      <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 h-7">
                        {issue.action}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mission Control Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Track Status - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#0b6d41]" />
              Track Status
            </h2>
            <Link href={`/admin/events/${slug}/demo-day`}>
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                Command Center
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {trackStats.map((track) => (
              <Card
                key={track.id}
                className="bg-zinc-900/50 border-zinc-800 hover:border-[#0b6d41]/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-zinc-100 text-sm">{track.name}</h3>
                        <StatusLight
                          status={
                            track.presenting > 0 ? 'success' :
                            track.total === 0 ? 'inactive' :
                            track.completed === track.total ? 'info' : 'warning'
                          }
                          size="sm"
                          pulse={track.presenting > 0}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                        {track.theme}
                      </Badge>
                    </div>
                    <ProgressRing
                      value={track.completed}
                      max={track.total || 1}
                      size={48}
                      strokeWidth={4}
                      color={track.total === 0 ? 'default' : 'jkkn'}
                      showValue={false}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">
                        <span className="text-zinc-100 font-medium">{track.completed}</span>/{track.total} demos
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Users className="h-3 w-3" />
                        {track.track_judges.length}
                      </span>
                    </div>
                    {track.room_location && (
                      <span className="flex items-center gap-1 text-zinc-600">
                        <MapPin className="h-3 w-3" />
                        {track.room_location}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Activity Feed - Takes 1 column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#ffde59]" />
            Recent Activity
          </h2>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-0">
              {recentCycles && recentCycles.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {recentCycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusLight
                          status={
                            cycle.status === 'completed' ? 'success' :
                            cycle.status === 'active' ? 'warning' : 'inactive'
                          }
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-100 truncate">
                            {cycle.users?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            Step {cycle.current_step}/{methodology.steps.length}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-600 whitespace-nowrap ml-2">
                        {getRelativeTime(cycle.updated_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Institution Breakdown */}
          {institutionBreakdown && institutionBreakdown.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mt-6">
                <MapPin className="h-5 w-5 text-blue-400" />
                By Institution
              </h2>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-800">
                    {institutionBreakdown.slice(0, 5).map((inst, index) => (
                      <div
                        key={inst.institution_id}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#0b6d41]/20 flex items-center justify-center text-[#0b6d41] text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm text-zinc-100">{inst.institution_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-zinc-400">
                            <span className="font-medium text-zinc-100">{inst.builder_count}</span> builders
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Link href={`/admin/events/${slug}/submissions`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Submissions</div>
                  <div className="text-xs text-zinc-500">Review & score</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/events/${slug}/demo-day`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-[#ffde59]/50 hover:bg-[#ffde59]/5 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ffde59]/20">
                  <Presentation className="h-5 w-5 text-[#ffde59]" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Demo Day</div>
                  <div className="text-xs text-zinc-500">Command center</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/events/${slug}/builders`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Builders</div>
                  <div className="text-xs text-zinc-500">Manage users</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/events/${slug}/curate`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-[#0b6d41]/50 hover:bg-[#0b6d41]/5 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0b6d41]/20">
                  <Target className="h-5 w-5 text-[#0b6d41]" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Curate</div>
                  <div className="text-xs text-zinc-500">Problem bank</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/events/${slug}/problems`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Database className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Problems</div>
                  <div className="text-xs text-zinc-500">View bank</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/events/${slug}/settings`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-500/20">
                  <Settings className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Settings</div>
                  <div className="text-xs text-zinc-500">Configure</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper function for relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
