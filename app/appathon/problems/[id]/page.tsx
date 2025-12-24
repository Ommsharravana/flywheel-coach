'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Building2,
  AlertTriangle,
  Users,
  MessageSquare,
  Target,
  GitFork,
  Loader2,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ProblemWithDetails } from '@/lib/types/problem-bank';
import { SimilarProblems } from '@/components/problem-bank/SimilarProblems';
import {
  PROBLEM_THEMES,
  PROBLEM_STATUSES,
  VALIDATION_STATUSES,
  getSeverityLabel,
  getSeverityColor,
  formatDesperateUserScore,
} from '@/lib/types/problem-bank';

export default function PublicProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<ProblemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const response = await fetch(`/api/problems/${id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch problem');
        }
        const data = await response.json();
        setProblem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProblem();
  }, [id]);

  const handleFork = async () => {
    setForking(true);
    try {
      const response = await fetch('/api/problems/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: id }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          router.push('/login?redirect=/appathon/problems/' + id);
          return;
        }
        throw new Error(data.error || 'Failed to fork problem');
      }

      const data = await response.json();
      router.push(`/cycle/${data.cycle_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fork problem');
      setForking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 bg-stone-800 rounded w-48 animate-pulse mb-6" />
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="h-6 bg-stone-700 rounded w-3/4 mb-4 animate-pulse" />
              <div className="h-4 bg-stone-700 rounded w-full mb-2 animate-pulse" />
              <div className="h-4 bg-stone-700 rounded w-2/3 animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/appathon/problems">
            <Button variant="ghost" className="gap-2 text-stone-400 hover:text-stone-100 mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Problems
            </Button>
          </Link>
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p>{error || 'Problem not found'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const themeInfo = problem.theme ? PROBLEM_THEMES[problem.theme] : null;
  const statusInfo = PROBLEM_STATUSES[problem.status];
  const validationInfo = VALIDATION_STATUSES[problem.validation_status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/appathon/problems">
            <Button variant="ghost" className="gap-2 text-stone-400 hover:text-stone-100">
              <ArrowLeft className="h-4 w-4" /> Back to Problems
            </Button>
          </Link>
          {problem.status === 'open' && (
            <Button
              onClick={handleFork}
              disabled={forking}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950"
            >
              {forking ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating your cycle...</>
              ) : (
                <><GitFork className="h-4 w-4 mr-2" /> Fork & Start Building</>
              )}
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Problem Card */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                {themeInfo && (
                  <span className={`text-sm ${themeInfo.color}`}>
                    {themeInfo.emoji} {themeInfo.label}
                  </span>
                )}
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
              <CardTitle className="text-2xl text-stone-100">{problem.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-300 whitespace-pre-wrap text-lg leading-relaxed">
                {problem.problem_statement}
              </p>
            </CardContent>
          </Card>

          {/* Why This Matters */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Why This Problem Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={validationInfo.color}>
                      {validationInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-400">{validationInfo.description}</p>
                </div>
                {problem.severity_rating && (
                  <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                    <p className="text-sm text-stone-500 mb-1">Severity Level</p>
                    <p className={`text-lg font-semibold ${getSeverityColor(problem.severity_rating)}`}>
                      {getSeverityLabel(problem.severity_rating)} ({problem.severity_rating}/10)
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-3 rounded-lg bg-stone-800/30">
                  <div className="text-2xl font-bold text-stone-100">{problem.users_interviewed}</div>
                  <div className="text-xs text-stone-500">Users Interviewed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-stone-800/30">
                  <div className="text-2xl font-bold text-amber-400">{problem.desperate_user_count}</div>
                  <div className="text-xs text-stone-500">Desperate Users</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-stone-800/30">
                  <div className="text-2xl font-bold text-blue-400">{problem.attempt_count || 0}</div>
                  <div className="text-xs text-stone-500">Solution Attempts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context */}
          {(problem.who_affected || problem.when_occurs || problem.where_occurs) && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100">Problem Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {problem.who_affected && (
                    <div>
                      <p className="text-sm text-stone-500">Who is Affected</p>
                      <p className="text-stone-200">{problem.who_affected}</p>
                    </div>
                  )}
                  {problem.when_occurs && (
                    <div>
                      <p className="text-sm text-stone-500">When it Occurs</p>
                      <p className="text-stone-200">{problem.when_occurs}</p>
                    </div>
                  )}
                  {problem.where_occurs && (
                    <div>
                      <p className="text-sm text-stone-500">Where it Occurs</p>
                      <p className="text-stone-200">{problem.where_occurs}</p>
                    </div>
                  )}
                  {problem.frequency && (
                    <div>
                      <p className="text-sm text-stone-500">Frequency</p>
                      <p className="text-stone-200 capitalize">{problem.frequency}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence (limited for public view) */}
          {problem.evidence && problem.evidence.length > 0 && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
                  <MessageSquare className="h-5 w-5" />
                  User Feedback
                </CardTitle>
                <CardDescription className="text-stone-400">
                  What real users said about this problem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {problem.evidence.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
                      <p className="text-stone-300 italic">&ldquo;{ev.content}&rdquo;</p>
                      {ev.pain_level && (
                        <div className="mt-2">
                          <Badge variant="outline" className={getSeverityColor(ev.pain_level)}>
                            Pain Level: {ev.pain_level}/10
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                  {problem.evidence.length > 3 && (
                    <p className="text-sm text-stone-500 text-center">
                      +{problem.evidence.length - 3} more testimonials
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solution Attempts */}
          {problem.attempts && problem.attempts.length > 0 && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
                  <Target className="h-5 w-5" />
                  Solution Attempts ({problem.attempts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {problem.attempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-stone-700">
                      <div>
                        <span className="font-medium text-stone-100">
                          {attempt.team_name || 'Team'}
                        </span>
                        <span className="text-stone-500 text-sm ml-2">
                          started {new Date(attempt.started_at).toLocaleDateString()}
                        </span>
                      </div>
                      {attempt.outcome && (
                        <Badge className={
                          attempt.outcome === 'success' || attempt.outcome === 'deployed'
                            ? 'bg-green-500/20 text-green-400'
                            : attempt.outcome === 'abandoned'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }>
                          {attempt.outcome}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Info */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-stone-500">
                <div className="flex items-center gap-4">
                  {problem.institution && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {problem.institution.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Added {new Date(problem.created_at).toLocaleDateString()}
                  </span>
                </div>
                {problem.source_event && (
                  <span>Source: {problem.source_event}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Similar Problems */}
          <SimilarProblems problemId={id} variant="public" />

          {/* CTA */}
          {problem.status === 'open' && (
            <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/30">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-100 mb-1">
                      Ready to solve this problem?
                    </h3>
                    <p className="text-stone-400">
                      Fork this problem to start your own Flywheel cycle and build a solution.
                    </p>
                  </div>
                  <Button
                    onClick={handleFork}
                    disabled={forking}
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 whitespace-nowrap"
                  >
                    {forking ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      <><GitFork className="h-4 w-4 mr-2" /> Fork & Start Building</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
