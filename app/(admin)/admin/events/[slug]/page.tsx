import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import Link from 'next/link';
import { Users, FileText, Rocket, Trophy, Settings, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const supabase = await createClient();

  const userId = await getEffectiveUserId();
  if (!userId) {
    redirect('/login');
  }

  // Get event with full details
  // Note: events table has is_active (boolean) not status, and methodology is in config jsonb
  const { data: eventData, error } = await supabase
    .from('events')
    .select('id, name, slug, is_active, config, start_date, end_date')
    .eq('slug', slug)
    .single();

  if (error || !eventData) {
    redirect('/admin/events');
  }

  const event = eventData as {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    config: Record<string, unknown> | null;
    start_date: string | null;
    end_date: string | null;
  };

  const { isAdmin, role } = await checkEventAdminAccess(userId, event.id);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Fetch stats - using RPC for builder count (bypasses RLS, counts correctly)
  const [buildersResult, cyclesResult, submissionsResult, completedResult] = await Promise.all([
    // Total builders in this event - use RPC that counts users with active_event_id + cycles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .rpc('get_event_registered_builder_count', { p_event_id: event.id }),
    // Active cycles
    supabase
      .from('cycles')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .neq('status', 'completed'),
    // Total submissions (appathon_submissions table)
    supabase
      .from('appathon_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id),
    // Completed cycles
    supabase
      .from('cycles')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'completed'),
  ]);

  const stats = {
    totalBuilders: (buildersResult.data as number) ?? 0,
    activeCycles: cyclesResult.count ?? 0,
    submissions: submissionsResult.count ?? 0,
    completedCycles: completedResult.count ?? 0,
  };

  const isLive = event.is_active === true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            {isLive && (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-white animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Event Admin' : 'Organizer'}
          </p>
        </div>
      </div>

      {/* Stats Grid - Inline implementation (no MetricCard import) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#0b6d41]/30 bg-[#0b6d41]/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Builders</p>
              <p className="text-2xl font-bold tracking-tight">{stats.totalBuilders}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-[#0b6d41]">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Cycles</p>
              <p className="text-2xl font-bold tracking-tight">{stats.activeCycles}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-amber-500">
              <Rocket className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Submissions</p>
              <p className="text-2xl font-bold tracking-tight">{stats.submissions}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Completed</p>
              <p className="text-2xl font-bold tracking-tight">{stats.completedCycles}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-green-500">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/admin/events/${slug}/submissions`}
          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Submissions</p>
            <p className="text-sm text-muted-foreground">Review & grade</p>
          </div>
        </Link>
        <Link
          href={`/admin/events/${slug}/builders`}
          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Builders</p>
            <p className="text-sm text-muted-foreground">Manage participants</p>
          </div>
        </Link>
        <Link
          href={`/admin/events/${slug}/demo-day`}
          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <Award className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Demo Day</p>
            <p className="text-sm text-muted-foreground">Command center</p>
          </div>
        </Link>
        <Link
          href={`/admin/events/${slug}/settings`}
          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Settings</p>
            <p className="text-sm text-muted-foreground">Event configuration</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
