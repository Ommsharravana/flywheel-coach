import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Users, UsersRound, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { LearnersTable } from './LearnersTable';

export const dynamic = 'force-dynamic';

interface LearnersPageProps {
  params: Promise<{ slug: string }>;
}

interface Team {
  id: string;
  team_name: string;
  app_name: string;
  status: string;
  submission_number: string | null;
}

interface LearnerStats {
  learner_id: string;
  learner_name: string;
  learner_email: string;
  learner_role: string | null;
  institution_name: string | null;
  team_count: number;
  teams: Team[];
}

export default async function LearnersPage({ params }: LearnersPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect('/login');
  }

  // Get event by slug
  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, slug')
    .eq('slug', slug)
    .single() as { data: { id: string; name: string; slug: string } | null; error: unknown };

  if (error || !event) {
    redirect('/admin/events');
  }

  // Check admin access
  const { isAdmin } = await checkEventAdminAccess(userId, event.id);
  if (!isAdmin) {
    redirect('/admin/events');
  }

  // Fetch Learner stats using RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: learners, error: statsError } = await (supabase as any).rpc(
    'get_learner_stats',
    { target_event_id: event.id }
  ) as { data: LearnerStats[] | null; error: unknown };

  if (statsError) {
    console.error('Error fetching learner stats:', statsError);
  }

  // Calculate aggregate stats
  // Get unique teams (a learner in multiple teams should count each team once)
  const uniqueTeamIds = new Set<string>();
  (learners || []).forEach(l => {
    l.teams.forEach(team => uniqueTeamIds.add(team.id));
  });

  const totalParticipations = learners?.reduce((sum, l) => sum + l.team_count, 0) || 0;

  const stats = {
    totalLearners: learners?.length || 0,
    uniqueTeams: uniqueTeamIds.size,  // Actual unique teams with learners
    totalParticipations,  // Total learner-to-team memberships
    avgTeamsPerLearner: learners?.length
      ? Math.round((totalParticipations / learners.length) * 10) / 10
      : 0,
    maxTeams: learners?.length
      ? Math.max(...learners.map(l => l.team_count))
      : 0,
  };

  // Count unique roles
  const roleCounts = (learners || []).reduce((acc, l) => {
    const role = l.learner_role || 'unspecified';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/admin/events/${slug}`}
            className="inline-flex items-center text-stone-400 hover:text-stone-200 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {event.name}
          </Link>
          <h1 className="text-2xl font-bold text-stone-100">Learner Monitor</h1>
          <p className="text-stone-400">
            Track learner participation across teams
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.totalLearners}</div>
                <p className="text-xs text-stone-400">Total Learners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <UsersRound className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.uniqueTeams}</div>
                <p className="text-xs text-stone-400">Teams with Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.avgTeamsPerLearner}</div>
                <p className="text-xs text-stone-400">Avg Teams / Learner</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.maxTeams}</div>
                <p className="text-xs text-stone-400">Most Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution (if meaningful) */}
      {Object.keys(roleCounts).length > 1 && (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-stone-300">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => (
                  <div
                    key={role}
                    className="px-3 py-1.5 bg-stone-800 rounded-full text-sm"
                  >
                    <span className="text-stone-300 capitalize">{role}</span>
                    <span className="ml-2 text-stone-500">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learners Table */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">All Learners</CardTitle>
          <CardDescription>
            {stats.totalLearners > 0
              ? `${stats.totalLearners} learners across ${stats.uniqueTeams} teams`
              : 'No learners found in teams yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(learners || []).length > 0 ? (
            <LearnersTable
              data={learners || []}
              eventSlug={slug}
            />
          ) : (
            <div className="text-center py-12 text-stone-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Learners Yet</p>
              <p className="text-sm mt-1">
                Learners will appear here once teams add members
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
