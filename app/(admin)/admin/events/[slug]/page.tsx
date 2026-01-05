import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { getMethodologyForEvent } from '@/lib/methodologies';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import { LiveBadge } from '@/components/ui/live-badge';
import {
  Users,
  Target,
  Database,
  Settings,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

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
  // Get params
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Create Supabase client
  const supabase = await createClient();

  // Get user ID
  const userId = await getEffectiveUserId();
  if (!userId) {
    redirect('/login');
  }

  // Get event
  const { data: eventData, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !eventData) {
    redirect('/admin/events');
  }

  const event = eventData as EventData;
  const eventId = event.id;

  // Check admin access
  const { isAdmin, role } = await checkEventAdminAccess(userId, eventId);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Get methodology (with fallback)
  const methodology = getMethodologyForEvent(event.config) || {
    name: 'Problem-to-Impact Flywheel',
    completionStep: 8,
  };

  // Get statistics (with error handling)
  let builderCount = 0;
  let totalCycles = 0;
  let completedCycles = 0;
  let problemCount = 0;
  let submissionCount = 0;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .rpc('get_event_registered_builder_count', { p_event_id: eventId });
    builderCount = data || 0;
  } catch {
    // Ignore error, use default 0
  }

  try {
    const { count } = await supabase
      .from('cycles')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    totalCycles = count || 0;
  } catch {
    // Ignore error, use default 0
  }

  try {
    const { count } = await supabase
      .from('cycles')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .gte('current_step', methodology.completionStep);
    completedCycles = count || 0;
  } catch {
    // Ignore error, use default 0
  }

  try {
    const { count } = await supabase
      .from('problem_bank')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    problemCount = count || 0;
  } catch {
    // Ignore error, use default 0
  }

  try {
    const { count } = await supabase
      .from('appathon_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    submissionCount = count || 0;
  } catch {
    // Ignore error, use default 0
  }

  // Calculate derived values
  const now = new Date();
  const startDate = event.start_date ? new Date(event.start_date) : null;
  const endDate = event.end_date ? new Date(event.end_date) : null;

  let eventStatus: 'upcoming' | 'active' | 'ended' = 'active';
  if (startDate && now < startDate) {
    eventStatus = 'upcoming';
  } else if (endDate && now > endDate) {
    eventStatus = 'ended';
  }

  const daysToEnd = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const completionRate = totalCycles ? Math.round((completedCycles / totalCycles) * 100) : 0;

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
      {/* Header */}
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

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          icon={Users}
          value={builderCount}
          label="Builders"
          variant="info"
        />
        <MetricCard
          icon={FileText}
          value={submissionCount}
          label="Submissions"
          variant="jkkn"
        />
        <MetricCard
          icon={Target}
          value={totalCycles}
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
          value={problemCount}
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

      {/* Quick Actions */}
      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Link href={`/admin/events/${slug}/submissions`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all cursor-pointer h-full">
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

          <Link href={`/admin/events/${slug}/builders`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer h-full">
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

          <Link href={`/admin/events/${slug}/demo-day`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-[#ffde59]/50 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ffde59]/20">
                  <Target className="h-5 w-5 text-[#ffde59]" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Demo Day</div>
                  <div className="text-xs text-zinc-500">Command center</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/events/${slug}/curate`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-[#0b6d41]/50 transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0b6d41]/20">
                  <Database className="h-5 w-5 text-[#0b6d41]" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100 text-sm">Curate</div>
                  <div className="text-xs text-zinc-500">Problem bank</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/events/${slug}/settings`}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-500/50 transition-all cursor-pointer h-full">
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
