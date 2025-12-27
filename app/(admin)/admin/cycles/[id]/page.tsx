import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Calendar,
  Target,
  FileText,
  Lightbulb,
  Workflow,
  Code,
  Rocket,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CycleNotes } from '@/components/admin/CycleNotes';
import { CycleReviewStatus } from '@/components/admin/CycleReviewStatus';

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  abandoned: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
};

const stepInfo: Record<number, { label: string; icon: typeof Target }> = {
  1: { label: 'Problem Discovery', icon: Target },
  2: { label: 'Context Discovery', icon: User },
  3: { label: 'Value Discovery', icon: Lightbulb },
  4: { label: 'Workflow Classification', icon: Workflow },
  5: { label: 'Prompt Generation', icon: Code },
  6: { label: 'Building', icon: FileText },
  7: { label: 'Deployment', icon: Rocket },
  8: { label: 'Impact Discovery', icon: BarChart3 },
};

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  interface CycleData {
    id: string;
    name: string | null;
    status: string;
    current_step: number;
    workflow_type: string | null;
    workflow_details: Record<string, unknown> | string | null;
    lovable_url: string | null;
    deployed_url: string | null;
    impact_metrics: Record<string, unknown> | string | null;
    created_at: string;
    updated_at: string;
    user_id: string;
  }

  interface CycleWithUser extends CycleData {
    users: { id: string; name: string | null; email: string } | null;
  }

  interface Problem {
    id: string;
    q_takes_too_long: string | null;
    q_repetitive: string | null;
    q_lookup_repeatedly: string | null;
    q_complaints: string | null;
    q_would_pay: string | null;
    selected_question: string | null;
    refined_statement: string | null;
    pain_level: number | null;
    frequency: string | null;
    completed: boolean;
  }

  interface Prompt {
    id: string;
    title: string | null;
    content: string;
    order: number;
  }

  interface UserRow {
    id: string;
    name: string | null;
    email: string;
  }

  // Fetch cycle without user join (avoids RLS issues)
  const { data: cycleData, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !cycleData) {
    notFound();
  }

  const rawCycle = cycleData as unknown as CycleData;

  // Fetch user using RPC (bypasses RLS for admin access)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (supabase as any).rpc('get_user_by_id_admin', {
    target_user_id: rawCycle.user_id
  });
  const userRow = (userData as UserRow[] | null)?.[0] || null;

  // Combine cycle with user data
  const cycle: CycleWithUser = {
    ...rawCycle,
    users: userRow
  };

  // Pre-compute stringified values for unknown types
  const workflowDetailsStr = cycle.workflow_details
    ? typeof cycle.workflow_details === 'string'
      ? cycle.workflow_details
      : JSON.stringify(cycle.workflow_details, null, 2)
    : null;

  const impactMetricsStr = cycle.impact_metrics
    ? typeof cycle.impact_metrics === 'string'
      ? cycle.impact_metrics
      : JSON.stringify(cycle.impact_metrics, null, 2)
    : null;

  // Fetch problems for this cycle
  const { data: problemsData } = await supabase
    .from('problems')
    .select('*')
    .eq('cycle_id', id)
    .order('created_at', { ascending: true });

  const problems = (problemsData || []) as unknown as Problem[];

  // Fetch prompts for this cycle
  const { data: promptsData } = await supabase
    .from('prompts')
    .select('*')
    .eq('cycle_id', id)
    .order('order', { ascending: true });

  const prompts = (promptsData || []) as unknown as Prompt[];

  const user = cycle.users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/cycles">
          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-stone-100">
            {cycle.name || 'Untitled Cycle'}
          </h1>
          <p className="text-stone-400">Cycle details and progress</p>
        </div>
        <Badge
          variant="outline"
          className={statusColors[cycle.status] || statusColors.active}
        >
          {cycle.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-stone-500" />
              <div>
                <p className="text-sm text-stone-400">User</p>
                {user ? (
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    {user.name || user.email}
                  </Link>
                ) : (
                  <span className="text-stone-500">Unknown</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-stone-500" />
              <div>
                <p className="text-sm text-stone-400">Current Step</p>
                <p className="text-stone-100">
                  {cycle.current_step}. {stepInfo[cycle.current_step]?.label || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-stone-500" />
              <div>
                <p className="text-sm text-stone-400">Created</p>
                <p className="text-stone-100">
                  {format(new Date(cycle.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-stone-500" />
              <div>
                <p className="text-sm text-stone-400">Last Updated</p>
                <p className="text-stone-100">
                  {format(new Date(cycle.updated_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Step Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                const info = stepInfo[step];
                const Icon = info.icon;
                const isComplete = step < cycle.current_step;
                const isCurrent = step === cycle.current_step;

                return (
                  <div key={step} className="flex-1">
                    <div
                      className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                        isComplete
                          ? 'bg-green-500/20'
                          : isCurrent
                          ? 'bg-amber-500/20 ring-2 ring-amber-500/50'
                          : 'bg-stone-800/50'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 mb-1 ${
                          isComplete
                            ? 'text-green-400'
                            : isCurrent
                            ? 'text-amber-400'
                            : 'text-stone-500'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isComplete
                            ? 'text-green-400'
                            : isCurrent
                            ? 'text-amber-400'
                            : 'text-stone-500'
                        }`}
                      >
                        S{step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Statement */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Problem Statement</CardTitle>
        </CardHeader>
        <CardContent>
          {problems && problems.length > 0 && problems[0].refined_statement ? (
            <div className="space-y-3">
              <p className="text-stone-300 whitespace-pre-wrap">{problems[0].refined_statement}</p>
              {problems[0].pain_level && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">Pain Level:</span>
                  <Badge className={problems[0].pain_level >= 7 ? 'bg-red-500/20 text-red-400' : problems[0].pain_level >= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}>
                    {problems[0].pain_level}/10
                  </Badge>
                </div>
              )}
              {problems[0].frequency && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">Frequency:</span>
                  <span className="text-sm text-stone-300 capitalize">{problems[0].frequency}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-stone-500 italic">No problem statement yet</p>
          )}
        </CardContent>
      </Card>

      {/* Problem Discovery Questions */}
      {problems && problems.length > 0 && problems[0].completed && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">
              Problem Discovery Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {problems[0].q_takes_too_long && (
                <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700">
                  <p className="text-xs font-medium text-amber-400 mb-1">What takes too long?</p>
                  <p className="text-stone-300">{problems[0].q_takes_too_long}</p>
                </div>
              )}
              {problems[0].q_repetitive && (
                <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700">
                  <p className="text-xs font-medium text-amber-400 mb-1">What is repetitive?</p>
                  <p className="text-stone-300">{problems[0].q_repetitive}</p>
                </div>
              )}
              {problems[0].q_lookup_repeatedly && (
                <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700">
                  <p className="text-xs font-medium text-amber-400 mb-1">What do you look up repeatedly?</p>
                  <p className="text-stone-300">{problems[0].q_lookup_repeatedly}</p>
                </div>
              )}
              {problems[0].q_complaints && (
                <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700">
                  <p className="text-xs font-medium text-amber-400 mb-1">What do people complain about?</p>
                  <p className="text-stone-300">{problems[0].q_complaints}</p>
                </div>
              )}
              {problems[0].q_would_pay && (
                <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700">
                  <p className="text-xs font-medium text-amber-400 mb-1">What would you pay to have solved?</p>
                  <p className="text-stone-300">{problems[0].q_would_pay}</p>
                </div>
              )}
              {problems[0].selected_question && (
                <div className="mt-4 pt-4 border-t border-stone-700">
                  <p className="text-xs font-medium text-green-400 mb-1">Selected Question:</p>
                  <p className="text-stone-300">{problems[0].selected_question}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Type */}
      {cycle.workflow_type && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Workflow Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-purple-500/20 text-purple-400 text-sm">
              {cycle.workflow_type}
            </Badge>
            {workflowDetailsStr && (
              <p className="mt-3 text-stone-400">{workflowDetailsStr}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Prompts */}
      {prompts && prompts.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">
              Generated Prompts ({prompts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-4 rounded-lg bg-stone-800/50 border border-stone-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-stone-100">
                      {prompt.title || `Prompt #${prompt.order}`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Order: {prompt.order}
                    </Badge>
                  </div>
                  <pre className="text-sm text-stone-400 whitespace-pre-wrap font-mono bg-stone-900/50 p-3 rounded">
                    {prompt.content}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Info */}
      {(cycle.lovable_url || cycle.deployed_url) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Deployment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cycle.lovable_url && (
              <div>
                <p className="text-sm text-stone-500 mb-1">Lovable Project</p>
                <a
                  href={cycle.lovable_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 break-all"
                >
                  {cycle.lovable_url}
                </a>
              </div>
            )}
            {cycle.deployed_url && (
              <div>
                <p className="text-sm text-stone-500 mb-1">Deployed URL</p>
                <a
                  href={cycle.deployed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 break-all"
                >
                  {cycle.deployed_url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Impact Metrics */}
      {cycle.impact_metrics && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Impact Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-stone-400 whitespace-pre-wrap">
              {impactMetricsStr}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Admin Tools Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CycleReviewStatus cycleId={cycle.id} />
        <CycleNotes cycleId={cycle.id} />
      </div>
    </div>
  );
}
