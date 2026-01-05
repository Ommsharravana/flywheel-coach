import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { checkEventAdminAccess } from '@/lib/methodologies/helpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, UserCheck, Users, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { SeniorLearnersTable } from './SeniorLearnersTable';

export const dynamic = 'force-dynamic';

interface SeniorLearnersPageProps {
  params: Promise<{ slug: string }>;
}

interface Team {
  id: string;
  team_name: string;
  app_name: string;
  status: string;
  submission_number: string | null;
}

interface SeniorLearnerStats {
  senior_learner_id: string;
  senior_learner_name: string;
  senior_learner_email: string;
  institution_id: string | null;
  team_count: number;
  teams: Team[];
}

interface Institution {
  id: string;
  name: string;
  short_name: string | null;
}

export default async function SeniorLearnersPage({ params }: SeniorLearnersPageProps) {
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

  // Fetch Senior Learner stats using RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: seniorLearners, error: statsError } = await (supabase as any).rpc(
    'get_senior_learner_stats',
    { target_event_id: event.id }
  ) as { data: SeniorLearnerStats[] | null; error: unknown };

  if (statsError) {
    console.error('Error fetching senior learner stats:', statsError);
  }

  // Fetch institutions for display
  const { data: institutions } = await supabase
    .from('institutions')
    .select('id, name, short_name') as { data: Institution[] | null };

  const institutionMap = new Map(
    (institutions || []).map(i => [i.id, i.short_name || i.name])
  );

  // Calculate aggregate stats
  const stats = {
    totalSeniorLearners: seniorLearners?.length || 0,
    totalTeams: seniorLearners?.reduce((sum, sl) => sum + sl.team_count, 0) || 0,
    avgTeamsPerSL: seniorLearners?.length
      ? Math.round((seniorLearners.reduce((sum, sl) => sum + sl.team_count, 0) / seniorLearners.length) * 10) / 10
      : 0,
    maxTeams: seniorLearners?.length
      ? Math.max(...seniorLearners.map(sl => sl.team_count))
      : 0,
  };

  // Enrich with institution names
  const enrichedData = (seniorLearners || []).map(sl => ({
    ...sl,
    institution_name: sl.institution_id ? institutionMap.get(sl.institution_id) || null : null,
  }));

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
          <h1 className="text-2xl font-bold text-stone-100">Senior Learner Monitor</h1>
          <p className="text-stone-400">
            Track mentorship distribution across teams
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.totalSeniorLearners}</div>
                <p className="text-xs text-stone-400">Senior Learners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.totalTeams}</div>
                <p className="text-xs text-stone-400">Teams Mentored</p>
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
                <div className="text-2xl font-bold text-stone-100">{stats.avgTeamsPerSL}</div>
                <p className="text-xs text-stone-400">Avg Teams / SL</p>
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

      {/* Senior Learners Table */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">All Senior Learners</CardTitle>
          <CardDescription>
            {stats.totalSeniorLearners > 0
              ? `${stats.totalSeniorLearners} senior learners mentoring ${stats.totalTeams} teams`
              : 'No senior learners assigned to teams yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedData.length > 0 ? (
            <SeniorLearnersTable
              data={enrichedData}
              eventSlug={slug}
            />
          ) : (
            <div className="text-center py-12 text-stone-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Senior Learners Yet</p>
              <p className="text-sm mt-1">
                Teams will appear here once they assign a Senior Learner mentor
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
