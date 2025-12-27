import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Trophy,
  Star,
  ExternalLink,
  Users,
  User,
  Building2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface SubmissionsPageProps {
  params: Promise<{ slug: string }>;
}

interface Submission {
  id: string;
  app_name: string;
  problem_statement: string;
  solution_summary: string | null;
  live_url: string | null;
  category: string;
  participation_type: string;
  team_name: string | null;
  applicant_name: string;
  institution_name: string | null;
  institution_short: string | null;
  submission_number: string | null;
  status: string;
  submitted_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Trophy }> = {
  winner: { label: 'Winner', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', icon: Trophy },
  shortlisted: { label: 'Shortlisted', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: Star },
  under_review: { label: 'Under Review', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: Sparkles },
  submitted: { label: 'Submitted', color: 'text-stone-400 bg-stone-500/20 border-stone-500/30', icon: Sparkles },
};

const categoryLabels: Record<string, string> = {
  healthcare: 'Healthcare',
  education: 'Education',
  operations: 'Operations',
  productivity: 'Productivity',
  other: 'Other',
};

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get event by slug
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, slug, description, config')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      config: Record<string, unknown>;
    } | null; error: unknown };

  if (eventError || !event) {
    redirect('/');
  }

  // Get submissions using RPC (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionsData, error: submissionsError } = await (supabase as any)
    .rpc('get_event_submissions_public', { target_event_slug: slug });

  const submissions = (submissionsData || []) as Submission[];

  // Group submissions by status
  const winners = submissions.filter(s => s.status === 'winner');
  const shortlisted = submissions.filter(s => s.status === 'shortlisted');
  const others = submissions.filter(s => !['winner', 'shortlisted'].includes(s.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/events/${slug}`}>
            <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-100">
              Submissions
            </h1>
            <p className="text-stone-400">{event.name} - {submissions.length} submissions</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="py-16 text-center">
              <Sparkles className="h-12 w-12 text-stone-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-stone-100 mb-2">No Submissions Yet</h2>
              <p className="text-stone-400 mb-6">
                Be the first to submit your solution!
              </p>
              <Link href="/cycle/new">
                <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900">
                  Start Your Cycle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Winners Section */}
            {winners.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-6 w-6 text-amber-400" />
                  <h2 className="text-xl font-bold text-amber-400">Winners</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {winners.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Shortlisted Section */}
            {shortlisted.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-6 w-6 text-green-400" />
                  <h2 className="text-xl font-bold text-green-400">Shortlisted</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shortlisted.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Submissions */}
            {others.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-stone-400" />
                  <h2 className="text-xl font-bold text-stone-300">All Submissions</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {others.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionCard({ submission, featured = false }: { submission: Submission; featured?: boolean }) {
  const status = statusConfig[submission.status] || statusConfig.submitted;
  const StatusIcon = status.icon;

  return (
    <Card className={`bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors ${featured ? 'ring-2 ring-amber-500/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg text-stone-100 line-clamp-2">
            {submission.app_name}
          </CardTitle>
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        {submission.submission_number && (
          <p className="text-xs text-stone-500 font-mono">{submission.submission_number}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Problem Statement */}
        <p className="text-sm text-stone-400 line-clamp-3">
          {submission.problem_statement}
        </p>

        {/* Category */}
        <Badge variant="outline" className="text-purple-400 border-purple-500/30">
          {categoryLabels[submission.category] || submission.category}
        </Badge>

        {/* Team/Individual Info */}
        <div className="flex items-center gap-2 text-sm text-stone-400">
          {submission.participation_type === 'team' ? (
            <>
              <Users className="h-4 w-4" />
              <span>{submission.team_name || 'Team'}</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span>{submission.applicant_name}</span>
            </>
          )}
        </div>

        {/* Institution */}
        {submission.institution_short && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Building2 className="h-4 w-4" />
            <span>{submission.institution_short}</span>
          </div>
        )}

        {/* Live URL */}
        {submission.live_url && (
          <a
            href={submission.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
          >
            <ExternalLink className="h-4 w-4" />
            View Live App
          </a>
        )}
      </CardContent>
    </Card>
  );
}
