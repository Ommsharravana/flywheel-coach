import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import Link from 'next/link';
import { Users, FileText, Rocket, Trophy } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  // DIAGNOSTIC: Test Step 2 - Add MetricCard with static data
  // No RPC calls yet - testing if component imports cause the error

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
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (error || !eventData) {
    redirect('/admin/events');
  }

  // Cast to expected type after validation
  const event = eventData as { id: string; name: string; slug: string };

  // Check admin access
  const { isAdmin, role } = await checkEventAdminAccess(userId, event.id);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // STATIC DATA for testing - no RPC calls
  const staticStats = {
    totalBuilders: 42,
    activeCycles: 15,
    submissions: 28,
    completedCycles: 7
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{event.name} - Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Role: {role || 'unknown'} | Event ID: {event.id}
        </p>
      </div>

      {/* Metrics Grid - Using static data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Builders"
          value={staticStats.totalBuilders}
          variant="jkkn"
        />
        <MetricCard
          icon={Rocket}
          label="Active Cycles"
          value={staticStats.activeCycles}
          variant="warning"
        />
        <MetricCard
          icon={FileText}
          label="Submissions"
          value={staticStats.submissions}
          variant="info"
        />
        <MetricCard
          icon={Trophy}
          label="Completed"
          value={staticStats.completedCycles}
          variant="success"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/admin/events/${slug}/submissions`}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
        >
          Submissions
        </Link>
        <Link
          href={`/admin/events/${slug}/builders`}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
        >
          Builders
        </Link>
        <Link
          href={`/admin/events/${slug}/demo-day`}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
        >
          Demo Day
        </Link>
        <Link
          href={`/admin/events/${slug}/settings`}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
        >
          Settings
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Diagnostic: Step 2 - MetricCard with static data (no RPC calls)
      </p>
    </div>
  );
}
