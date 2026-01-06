'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  GitBranch,
  Users,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Loader2,
  ExternalLink,
  Clock,
  Target,
  Sparkles,
  Mail,
  Phone,
  IndianRupee,
  Handshake,
  UserCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  PROBLEM_THEMES,
  PROBLEM_SOURCE_TYPES,
  VALIDATION_STATUSES,
  getSeverityLabel,
  getSeverityColor,
  type ProblemWithDetails,
  type ProblemTheme,
  type ProblemSourceType,
} from '@/lib/types/problem-bank';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SimilarProblem {
  id: string;
  title: string;
  problem_statement: string;
  theme: string | null;
  similarity_score: number;
}

interface UserTeam {
  id: string;
  name: string;
}

export default function ProblemDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<ProblemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forking, setForking] = useState(false);
  const [similarProblems, setSimilarProblems] = useState<SimilarProblem[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setError(null);

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
  }, [id]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  // Fetch similar problems
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!id) return;
      setLoadingSimilar(true);
      try {
        const response = await fetch(`/api/problems/${id}/similar`);
        if (response.ok) {
          const data = await response.json();
          setSimilarProblems(data.similar || []);
        }
      } catch {
        // Non-critical, silently fail
      } finally {
        setLoadingSimilar(false);
      }
    };
    fetchSimilar();
  }, [id]);

  // Fetch user's teams for claiming
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (response.ok) {
          const data = await response.json();
          setUserTeams(data.teams || []);
          if (data.teams?.length === 1) {
            setSelectedTeamId(data.teams[0].id);
          }
        }
      } catch {
        // Non-critical
      }
    };
    fetchTeams();
  }, []);

  const handleClaim = async () => {
    if (!selectedTeamId || !problem) return;

    setClaiming(true);
    try {
      const response = await fetch(`/api/problems/${problem.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: selectedTeamId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to claim problem');
      }

      // Refresh problem data
      fetchProblem();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to claim problem');
    } finally {
      setClaiming(false);
    }
  };

  const handleRelease = async () => {
    if (!problem) return;

    setReleasing(true);
    try {
      const response = await fetch(`/api/problems/${problem.id}/claim`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to release claim');
      }

      // Refresh problem data
      fetchProblem();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to release claim');
    } finally {
      setReleasing(false);
    }
  };

  const handleFork = async () => {
    if (!problem) return;

    setForking(true);
    try {
      // Use the fork API which handles everything
      const response = await fetch('/api/problems/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fork problem');
      }

      const result = await response.json();

      // Navigate to step 2 (Context Discovery) since problem is pre-filled
      router.push(`/cycle/${result.cycle_id}/step/2`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to fork problem');
      setForking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-stone-400 hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-100">Problem not found</h3>
            <p className="text-stone-400 mt-2">{error || 'This problem may not exist or is not available.'}</p>
            <Button
              onClick={() => router.push('/dashboard/problem-bank')}
              className="mt-4"
            >
              Browse Problem Bank
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const themeInfo = problem.theme ? PROBLEM_THEMES[problem.theme as ProblemTheme] : null;
  const validationInfo = VALIDATION_STATUSES[problem.validation_status];
  const sourceInfo = problem.source_type ? PROBLEM_SOURCE_TYPES[problem.source_type as ProblemSourceType] : null;
  const isIndustryProblem = problem.source_type === 'industry';
  const isClaimed = !!problem.claimed_by_team_id;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-stone-400 hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problem Bank
        </Button>

        <Button
          onClick={handleFork}
          disabled={forking}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {forking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Your Cycle...
            </>
          ) : (
            <>
              <GitBranch className="h-4 w-4 mr-2" />
              Fork This Problem
            </>
          )}
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Problem Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Card */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <div className="flex items-start gap-3 flex-wrap mb-2">
                {sourceInfo && (
                  <Badge variant="outline" className={`${sourceInfo.color} border-current/30`}>
                    {sourceInfo.emoji} {sourceInfo.label}
                  </Badge>
                )}
                {themeInfo && (
                  <Badge variant="outline" className={`${themeInfo.color} border-current/30`}>
                    {themeInfo.emoji} {themeInfo.label}
                  </Badge>
                )}
                <Badge variant="outline" className={validationInfo.color}>
                  {validationInfo.label}
                </Badge>
                {problem.severity_rating && (
                  <Badge variant="outline" className={getSeverityColor(problem.severity_rating)}>
                    {getSeverityLabel(problem.severity_rating)} Severity
                  </Badge>
                )}
                {isClaimed && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Claimed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl text-stone-100">{problem.title}</CardTitle>
              <CardDescription className="text-stone-400">
                Added {new Date(problem.created_at).toLocaleDateString()}
                {problem.institution && ` • ${problem.institution.short_name || problem.institution.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Problem Statement */}
              <div>
                <h3 className="text-sm font-medium text-stone-400 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Problem Statement
                </h3>
                <p className="text-stone-100 whitespace-pre-wrap">{problem.problem_statement}</p>
              </div>

              {/* Context Grid */}
              {(problem.who_affected || problem.when_occurs || problem.where_occurs) && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {problem.who_affected && (
                    <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                      <h4 className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Who is affected?
                      </h4>
                      <p className="text-sm text-stone-200">{problem.who_affected}</p>
                    </div>
                  )}
                  {problem.when_occurs && (
                    <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                      <h4 className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> When does it occur?
                      </h4>
                      <p className="text-sm text-stone-200">{problem.when_occurs}</p>
                    </div>
                  )}
                  {problem.where_occurs && (
                    <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                      <h4 className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Where does it happen?
                      </h4>
                      <p className="text-sm text-stone-200">{problem.where_occurs}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Current Workaround */}
              {problem.current_workaround && (
                <div>
                  <h3 className="text-sm font-medium text-stone-400 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Current Workaround
                  </h3>
                  <p className="text-stone-300 text-sm bg-stone-800/50 p-4 rounded-lg border border-stone-700">
                    {problem.current_workaround}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry Partner Info (for industry submissions) */}
          {isIndustryProblem && (problem.industry_partner_name || problem.industry_partner_company) && (
            <Card className="bg-emerald-900/20 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-emerald-400" />
                  Industry Partner
                </CardTitle>
                <CardDescription>
                  This problem was submitted by an industry partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {problem.industry_partner_company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-stone-500" />
                      <span className="text-stone-200">{problem.industry_partner_company}</span>
                    </div>
                  )}
                  {problem.industry_partner_name && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-stone-500" />
                      <span className="text-stone-200">{problem.industry_partner_name}</span>
                    </div>
                  )}
                  {problem.industry_partner_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-stone-500" />
                      <span className="text-stone-200">{problem.industry_partner_email}</span>
                    </div>
                  )}
                  {problem.industry_partner_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-stone-500" />
                      <span className="text-stone-200">{problem.industry_partner_phone}</span>
                    </div>
                  )}
                </div>
                {problem.budget_amount && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">
                        Budget: {problem.budget_currency} {problem.budget_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Evidence Section */}
          {problem.evidence && problem.evidence.length > 0 && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Evidence & Testimonials
                </CardTitle>
                <CardDescription>
                  User feedback and validation data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {problem.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-lg bg-stone-800/50 border border-stone-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                          {ev.evidence_type}
                        </Badge>
                        {ev.pain_level && (
                          <span className="text-xs text-stone-500">
                            Pain Level: {ev.pain_level}/10
                          </span>
                        )}
                      </div>
                      <p className="text-stone-200 text-sm italic">&quot;{ev.content}&quot;</p>
                      {(ev.source_name || ev.source_role) && (
                        <p className="text-xs text-stone-500 mt-2">
                          — {ev.source_name}{ev.source_role && `, ${ev.source_role}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Fork CTA Card */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <GitBranch className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-stone-100 mb-2">
                  Ready to Solve This?
                </h3>
                <p className="text-sm text-stone-400 mb-4">
                  Fork this problem to start your own solution. You&apos;ll get all the context and validation data to help you build.
                </p>
                <Button
                  onClick={handleFork}
                  disabled={forking}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {forking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Fork This Problem
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Claim Card */}
          {problem.status === 'open' && !isClaimed && userTeams.length > 0 && (
            <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <UserCheck className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-stone-100 mb-2">
                    Claim for Your Team
                  </h3>
                  <p className="text-sm text-stone-400 mb-4">
                    Reserve this problem for your team to work on. Others won&apos;t be able to claim it while you work.
                  </p>

                  {userTeams.length > 1 && (
                    <div className="mb-4">
                      <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                        <SelectTrigger className="bg-stone-800 border-stone-700">
                          <SelectValue placeholder="Select your team" />
                        </SelectTrigger>
                        <SelectContent>
                          {userTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    onClick={handleClaim}
                    disabled={claiming || !selectedTeamId}
                    className="w-full bg-blue-600 text-white hover:bg-blue-500"
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Claim Problem
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Release Claim Card (if claimed by user's team) */}
          {isClaimed && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <UserCheck className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-stone-100 mb-2">
                    Problem Claimed
                  </h3>
                  <p className="text-sm text-stone-400 mb-4">
                    This problem is currently claimed by a team. If this is your team, you can release the claim.
                  </p>
                  <Button
                    onClick={handleRelease}
                    disabled={releasing}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    {releasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Releasing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Release Claim
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Stats */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">Status</span>
                <Badge className={validationInfo.color}>{validationInfo.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">Users Interviewed</span>
                <span className="text-lg font-semibold text-stone-100">
                  {problem.users_interviewed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">Desperate Users</span>
                <span className="text-lg font-semibold text-green-400">
                  {problem.desperate_user_count || 0}
                </span>
              </div>
              {problem.desperate_user_score !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Desperation Score</span>
                  <span className="text-lg font-semibold text-amber-400">
                    {problem.desperate_user_score}/5
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attempts */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Solution Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-stone-100 mb-1">
                  {problem.attempt_count || 0}
                </div>
                <p className="text-sm text-stone-500">Total Attempts</p>
                {problem.successful_attempts > 0 && (
                  <p className="text-sm text-green-400 mt-2 flex items-center justify-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    {problem.successful_attempts} successful
                  </p>
                )}
              </div>

              {problem.attempts && problem.attempts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {problem.attempts.slice(0, 3).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-stone-200">
                          {attempt.team_name || 'Anonymous Team'}
                        </p>
                        <p className="text-xs text-stone-500">
                          {new Date(attempt.started_at).toLocaleDateString()}
                        </p>
                      </div>
                      {attempt.outcome && (
                        <Badge
                          variant="outline"
                          className={
                            attempt.outcome === 'success' || attempt.outcome === 'deployed'
                              ? 'text-green-400 border-green-400/30'
                              : attempt.outcome === 'building'
                                ? 'text-blue-400 border-blue-400/30'
                                : 'text-stone-400 border-stone-400/30'
                          }
                        >
                          {attempt.outcome}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Solution */}
          {problem.best_solution_url && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Best Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={problem.best_solution_url} target="_blank">
                  <Button className="w-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Solution
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Source Info */}
          {problem.source_event && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-sm text-stone-400">
                  <Calendar className="h-4 w-4" />
                  <span>Source: {problem.source_event}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Problems */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Similar Problems
              </CardTitle>
              <CardDescription>
                Related problems you might also want to explore
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSimilar ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
                </div>
              ) : similarProblems.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-4">
                  No similar problems found
                </p>
              ) : (
                <div className="space-y-3">
                  {similarProblems.slice(0, 4).map((similar) => {
                    const similarTheme = similar.theme ? PROBLEM_THEMES[similar.theme as ProblemTheme] : null;
                    return (
                      <Link
                        key={similar.id}
                        href={`/dashboard/problem-bank/${similar.id}`}
                        className="block p-3 rounded-lg bg-stone-800/50 border border-stone-700 hover:border-amber-500/50 hover:bg-stone-800 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-stone-200 line-clamp-2">
                            {similar.title}
                          </h4>
                          {similarTheme && (
                            <Badge variant="outline" className={`${similarTheme.color} border-current/30 text-xs shrink-0`}>
                              {similarTheme.emoji}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2">
                          {similar.problem_statement}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500/50 rounded-full"
                              style={{ width: `${Math.round(similar.similarity_score * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-stone-500">
                            {Math.round(similar.similarity_score * 100)}% match
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
