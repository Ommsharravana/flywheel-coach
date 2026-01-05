import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import Link from 'next/link';
import { Users, FileText, Rocket, Trophy } from 'lucide-react';
// DIAGNOSTIC: Testing without MetricCard import to isolate issue

interface EventAdminPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventAdminPage({ params }: EventAdminPageProps) {
  // DIAGNOSTIC: Test Step 3 - Icons only (no MetricCard)
  // Testing if lucide-react icons work in Server Component

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

  // STATIC DATA for testing
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

      {/* Metrics Grid - Manual divs with icons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#0b6d41]/30 bg-[#0b6d41]/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Builders</p>
              <p className="text-2xl font-bold">{staticStats.totalBuilders}</p>
            </div>
            <Users className="h-5 w-5 text-[#0b6d41]" />
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Cycles</p>
              <p className="text-2xl font-bold">{staticStats.activeCycles}</p>
            </div>
            <Rocket className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Submissions</p>
              <p className="text-2xl font-bold">{staticStats.submissions}</p>
            </div>
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{staticStats.completedCycles}</p>
            </div>
            <Trophy className="h-5 w-5 text-green-500" />
          </div>
        </div>
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
        Diagnostic: Step 3 - Icons only (no MetricCard import)
      </p>
    </div>
  );
}
