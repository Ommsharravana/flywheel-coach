import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Team {
  id: string;
  team_name: string;
  app_name: string;
  status: string;
  submission_number: string | null;
}

interface MentoringStats {
  event_id: string;
  event_name: string;
  event_slug: string;
  team_count: number;
  teams: Team[];
  is_meeting_target: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  under_review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  shortlisted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  winner: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Review',
  shortlisted: 'Shortlisted',
  winner: 'Winner',
  rejected: 'Rejected',
};

export default async function MentoringPage() {
  const supabase = await createClient();
  const userId = await getEffectiveUserId();

  if (!userId) {
    redirect('/login');
  }

  // Check if user is a senior learner
  const { data: userData } = await supabase
    .from('users')
    .select('user_category, name')
    .eq('id', userId)
    .single() as { data: { user_category: string | null; name: string | null } | null };

  // Fetch mentoring stats using RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mentoringStats, error } = await (supabase as any).rpc(
    'get_my_mentoring_stats'
  ) as { data: MentoringStats[] | null; error: unknown };

  if (error) {
    console.error('Error fetching mentoring stats:', error);
  }

  // Calculate aggregate stats
  const totalTeams = mentoringStats?.reduce((sum, event) => sum + event.team_count, 0) || 0;
  const totalEvents = mentoringStats?.length || 0;
  const eventsMeetingTarget = mentoringStats?.filter(e => e.is_meeting_target).length || 0;
  const eventsBelowTarget = totalEvents - eventsMeetingTarget;

  // Check if user is a Senior Learner (either by category or by having mentored teams)
  const isSeniorLearner = userData?.user_category === 'senior_learner' || totalTeams > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-100">My Mentoring Dashboard</h1>
        <p className="text-stone-400 mt-1">
          Track your mentorship across events
        </p>
      </div>

      {/* Not a Senior Learner Message */}
      {!isSeniorLearner && (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-stone-500 opacity-50" />
            <h2 className="text-lg font-medium text-stone-300">Not Yet a Senior Learner</h2>
            <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
              You&apos;ll see your mentoring stats here once you&apos;re assigned as a Senior Learner
              to teams in an Appathon event.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Senior Learner Dashboard */}
      {isSeniorLearner && (
        <>
          {/* Target Alert Banner */}
          {eventsBelowTarget > 0 && (
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 border border-amber-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-200">Action Required</h3>
                  <p className="text-sm text-amber-300/80 mt-1">
                    You have {eventsBelowTarget} event{eventsBelowTarget > 1 ? 's' : ''} where
                    you&apos;re mentoring fewer than 5 teams. The target is to mentor at least 5 teams per event.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* All Meeting Target Banner */}
          {eventsBelowTarget === 0 && totalEvents > 0 && (
            <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border border-emerald-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-emerald-200">Great Work!</h3>
                  <p className="text-sm text-emerald-300/80 mt-1">
                    You&apos;re meeting the 5-team target in all your events. Keep up the excellent mentorship!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-100">{totalTeams}</div>
                    <p className="text-xs text-stone-400">Total Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Trophy className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-100">{totalEvents}</div>
                    <p className="text-xs text-stone-400">Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-800/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-stone-100">{eventsMeetingTarget}</div>
                    <p className="text-xs text-stone-400">Meeting Target</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${
              eventsBelowTarget > 0
                ? 'from-amber-900/40 to-amber-950/40 border-amber-800/50'
                : 'from-stone-900/40 to-stone-950/40 border-stone-800/50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    eventsBelowTarget > 0 ? 'bg-amber-500/20' : 'bg-stone-500/20'
                  }`}>
                    <TrendingUp className={`h-5 w-5 ${
                      eventsBelowTarget > 0 ? 'text-amber-400' : 'text-stone-400'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      eventsBelowTarget > 0 ? 'text-amber-400' : 'text-stone-100'
                    }`}>{eventsBelowTarget}</div>
                    <p className="text-xs text-stone-400">Below Target</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Breakdown */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Events Overview</CardTitle>
              <CardDescription>
                Your mentoring stats per event (target: 5+ teams per event)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mentoringStats && mentoringStats.length > 0 ? (
                mentoringStats.map((event) => (
                  <div
                    key={event.event_id}
                    className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-4"
                  >
                    {/* Event Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-stone-100">{event.event_name}</h3>
                        {event.is_meeting_target ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Meeting Target
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {5 - event.team_count} more needed
                          </Badge>
                        )}
                      </div>
                      <div className={cn(
                        "inline-flex items-center justify-center min-w-[2.5rem] h-8 px-3 font-semibold text-sm rounded-full border",
                        event.is_meeting_target
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      )}>
                        {event.team_count} / 5
                      </div>
                    </div>

                    {/* Teams List */}
                    {event.teams && event.teams.length > 0 && (
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {event.teams.map((team) => (
                          <Link
                            key={team.id}
                            href={`/appathon/${event.event_slug}/submissions/${team.id}`}
                            className="group flex items-center justify-between p-3 bg-stone-900/50 hover:bg-stone-900 border border-stone-700/30 hover:border-stone-600 rounded-lg transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-stone-200 truncate group-hover:text-stone-100">
                                  {team.team_name}
                                </span>
                                {team.submission_number && (
                                  <span className="text-xs text-stone-500 font-mono">
                                    #{team.submission_number}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-400 truncate">
                                {team.app_name || 'No app name'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge
                                variant="outline"
                                className={cn('text-xs shrink-0', statusColors[team.status])}
                              >
                                {statusLabels[team.status] || team.status}
                              </Badge>
                              <ExternalLink className="h-3 w-3 text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* No teams message */}
                    {(!event.teams || event.teams.length === 0) && (
                      <p className="text-sm text-stone-500 text-center py-4">
                        No teams assigned yet
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No mentoring assignments found</p>
                  <p className="text-sm mt-1">
                    You&apos;ll see teams here once you&apos;re assigned as their Senior Learner
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
