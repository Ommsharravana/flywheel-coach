'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  CheckCircle,
  Users,
  MessageSquare,
  Clock,
  Target,
  Edit2,
  Save,
  X,
  Trash2,
  ExternalLink,
  GitFork,
  Loader2,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import type { ProblemWithDetails } from '@/lib/types/problem-bank';
import { SimilarProblems } from '@/components/problem-bank/SimilarProblems';
import { ProblemScoring } from '@/components/problem-bank/ProblemScoring';
import { ProblemOutcomes } from '@/components/problem-bank/ProblemOutcomes';
import { AIRefinements } from '@/components/problem-bank/AIRefinements';
import {
  PROBLEM_THEMES,
  PROBLEM_STATUSES,
  VALIDATION_STATUSES,
  getSeverityLabel,
  getSeverityColor,
  formatDesperateUserScore,
} from '@/lib/types/problem-bank';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<ProblemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [attemptTeamName, setAttemptTeamName] = useState('');
  const [forking, setForking] = useState(false);
  const [isInPipeline, setIsInPipeline] = useState(false);
  const [addingToPipeline, setAddingToPipeline] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editStatement, setEditStatement] = useState('');
  const [editStatus, setEditStatus] = useState('');

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
        setEditTitle(data.title);
        setEditStatement(data.problem_statement);
        setEditStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    async function checkPipeline() {
      try {
        const response = await fetch(`/api/pipeline?include_stats=false`);
        if (response.ok) {
          const data = await response.json();
          const inPipeline = data.candidates?.some(
            (c: { problem_id: string }) => c.problem_id === id
          );
          setIsInPipeline(inPipeline);
        }
      } catch {
        // Ignore errors - just won't show pipeline status
      }
    }

    fetchProblem();
    checkPipeline();
  }, [id]);

  const handleAddToPipeline = async () => {
    setAddingToPipeline(true);
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to pipeline');
      }

      setIsInPipeline(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to pipeline');
    } finally {
      setAddingToPipeline(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/problems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          problem_statement: editStatement,
          status: editStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update problem');
      }

      const updated = await response.json();
      setProblem({ ...problem!, ...updated });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/problems/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete problem');
      }

      router.push('/admin/problem-bank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  const handleStartAttempt = async () => {
    setStartingAttempt(true);
    try {
      const response = await fetch(`/api/problems/${id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: attemptTeamName || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start attempt');
      }

      // Refresh problem data to show new attempt
      const refreshResponse = await fetch(`/api/problems/${id}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setProblem(data);
      }

      setShowAttemptForm(false);
      setAttemptTeamName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start attempt');
    } finally {
      setStartingAttempt(false);
    }
  };

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
        throw new Error(data.error || 'Failed to fork problem');
      }

      const data = await response.json();
      // Redirect to the new cycle
      router.push(`/cycle/${data.cycle_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fork problem');
      setForking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-stone-800 rounded w-48 animate-pulse" />
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="h-6 bg-stone-700 rounded w-3/4 mb-4 animate-pulse" />
            <div className="h-4 bg-stone-700 rounded w-full mb-2 animate-pulse" />
            <div className="h-4 bg-stone-700 rounded w-2/3 animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="space-y-6">
        <Link href="/admin/problem-bank">
          <Button variant="ghost" className="gap-2 text-stone-400 hover:text-stone-100">
            <ArrowLeft className="h-4 w-4" /> Back to Problem Bank
          </Button>
        </Link>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p>{error || 'Problem not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const themeInfo = problem.theme ? PROBLEM_THEMES[problem.theme] : null;
  const statusInfo = PROBLEM_STATUSES[problem.status];
  const validationInfo = VALIDATION_STATUSES[problem.validation_status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/problem-bank">
          <Button variant="ghost" className="gap-2 text-stone-400 hover:text-stone-100">
            <ArrowLeft className="h-4 w-4" /> Back to Problem Bank
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setEditTitle(problem.title);
                  setEditStatement(problem.problem_statement);
                  setEditStatus(problem.status);
                }}
                className="border-stone-700"
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950"
              >
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleFork}
                disabled={forking}
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
              >
                {forking ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Forking...</>
                ) : (
                  <><GitFork className="h-4 w-4 mr-2" /> Fork to New Cycle</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="border-stone-700"
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-stone-900 border-stone-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-stone-100">Delete Problem?</AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-400">
                      This will permanently delete this problem and all associated evidence and attempts.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-300">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-500 hover:bg-red-400"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Card */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {themeInfo && (
                    <span className={`text-sm ${themeInfo.color}`}>
                      {themeInfo.emoji} {themeInfo.label}
                    </span>
                  )}
                </div>
                {editing ? (
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-[180px] bg-stone-800 border-stone-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROBLEM_STATUSES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                )}
              </div>
              {editing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full mt-2 text-xl font-semibold bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 text-stone-100"
                />
              ) : (
                <CardTitle className="text-xl text-stone-100 mt-2">{problem.title}</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={editStatement}
                  onChange={(e) => setEditStatement(e.target.value)}
                  rows={6}
                  className="bg-stone-800 border-stone-700 text-stone-300"
                />
              ) : (
                <p className="text-stone-300 whitespace-pre-wrap">{problem.problem_statement}</p>
              )}
            </CardContent>
          </Card>

          {/* Context Card */}
          <Card className="glass-card">
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
                {problem.current_workaround && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-stone-500">Current Workaround</p>
                    <p className="text-stone-200">{problem.current_workaround}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
                <MessageSquare className="h-5 w-5" />
                Evidence ({problem.evidence?.length || 0})
              </CardTitle>
              <CardDescription className="text-stone-400">
                User interviews and validation data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problem.evidence && problem.evidence.length > 0 ? (
                <div className="space-y-4">
                  {problem.evidence.map((ev) => (
                    <div key={ev.id} className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ev.evidence_type}
                          </Badge>
                          {ev.pain_level && (
                            <Badge variant="outline" className={getSeverityColor(ev.pain_level)}>
                              Pain: {ev.pain_level}/10
                            </Badge>
                          )}
                        </div>
                        {ev.collected_at && (
                          <span className="text-xs text-stone-500">
                            {new Date(ev.collected_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-300 italic">&ldquo;{ev.content}&rdquo;</p>
                      {(ev.source_name || ev.source_role) && (
                        <p className="text-sm text-stone-500 mt-2">
                          — {ev.source_name || 'Anonymous'}{ev.source_role && `, ${ev.source_role}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 text-center py-8">No evidence collected yet</p>
              )}
            </CardContent>
          </Card>

          {/* Attempts Section */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
                  <Target className="h-5 w-5" />
                  Solution Attempts ({problem.attempt_count || 0})
                </CardTitle>
                {problem.is_open_for_attempts && problem.status === 'open' && (
                  <Button
                    onClick={() => setShowAttemptForm(!showAttemptForm)}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950"
                  >
                    Start Attempt
                  </Button>
                )}
              </div>
              {showAttemptForm && (
                <div className="mt-4 p-4 bg-stone-800/50 rounded-lg border border-stone-700">
                  <p className="text-sm text-stone-400 mb-3">
                    Start working on a solution for this problem. Your attempt will be tracked.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-stone-300 block mb-1">
                        Team Name (optional)
                      </label>
                      <input
                        type="text"
                        value={attemptTeamName}
                        onChange={(e) => setAttemptTeamName(e.target.value)}
                        placeholder="Enter your team name..."
                        className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 placeholder:text-stone-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleStartAttempt}
                        disabled={startingAttempt}
                        className="bg-green-600 hover:bg-green-500 text-white"
                      >
                        {startingAttempt ? 'Starting...' : 'Claim This Problem'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowAttemptForm(false);
                          setAttemptTeamName('');
                        }}
                        className="text-stone-400"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {problem.attempts && problem.attempts.length > 0 ? (
                <div className="space-y-4">
                  {problem.attempts.map((attempt) => (
                    <div key={attempt.id} className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-stone-100">
                            {attempt.team_name || 'Unnamed Team'}
                          </h4>
                          <p className="text-sm text-stone-500">
                            Started {new Date(attempt.started_at).toLocaleDateString()}
                          </p>
                        </div>
                        {attempt.outcome && (
                          <Badge className={
                            attempt.outcome === 'success' || attempt.outcome === 'deployed'
                              ? 'bg-green-100 text-green-800'
                              : attempt.outcome === 'abandoned'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {attempt.outcome}
                          </Badge>
                        )}
                      </div>
                      {attempt.outcome_notes && (
                        <p className="text-stone-300 text-sm">{attempt.outcome_notes}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-stone-400">
                        {attempt.users_reached > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" /> {attempt.users_reached} users
                          </span>
                        )}
                        {attempt.impact_score && (
                          <span>Impact: {attempt.impact_score}/100</span>
                        )}
                        {attempt.app_url && (
                          <a
                            href={attempt.app_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                          >
                            <ExternalLink className="h-4 w-4" /> View App
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 text-center py-8">No solution attempts yet</p>
              )}
            </CardContent>
          </Card>

          {/* Learning Flywheel Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Problem Outcomes */}
            <ProblemOutcomes
              problemId={id}
              onOutcomeAdded={() => {
                // Refresh problem data
                fetch(`/api/problems/${id}`)
                  .then(res => res.json())
                  .then(data => setProblem(data))
                  .catch(console.error);
              }}
            />

            {/* AI Refinements */}
            <AIRefinements
              problemId={id}
              currentStatement={problem.problem_statement}
              onStatementUpdated={(newStatement) => {
                setProblem({ ...problem, problem_statement: newStatement });
                setEditStatement(newStatement);
              }}
            />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Validation Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Validation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className={`${validationInfo.color} text-sm`}>
                {validationInfo.label}
              </Badge>
              <p className="text-sm text-stone-400">{validationInfo.description}</p>

              <div className="pt-4 border-t border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Users Interviewed</span>
                  <span className="text-stone-100 font-medium">{problem.users_interviewed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Desperate Users</span>
                  <span className="text-stone-100 font-medium">{problem.desperate_user_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Desperate Score</span>
                  <span className="text-stone-100 font-medium">
                    {formatDesperateUserScore(problem.desperate_user_score)}
                  </span>
                </div>
                {problem.severity_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-400">Severity</span>
                    <span className={`font-medium ${getSeverityColor(problem.severity_rating)}`}>
                      {getSeverityLabel(problem.severity_rating)} ({problem.severity_rating}/10)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Problem Scoring Card */}
          <ProblemScoring
            problemId={id}
            isInPipeline={isInPipeline}
            onAddToPipeline={handleAddToPipeline}
          />

          {/* Pipeline Status */}
          {isInPipeline && (
            <Card className="glass-card border-orange-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-orange-400 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">In NIF Pipeline</p>
                    <p className="text-sm text-stone-400">Being tracked for incubation</p>
                  </div>
                </div>
                <Link href="/admin/nif-pipeline">
                  <Button variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    View Pipeline
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Source Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {problem.institution && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-stone-800">
                    <Building2 className="h-4 w-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Institution</p>
                    <p className="text-stone-200">{problem.institution.name}</p>
                  </div>
                </div>
              )}
              {problem.submitter && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-stone-800">
                    <User className="h-4 w-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Submitted By</p>
                    <p className="text-stone-200">{problem.submitter.name || problem.submitter.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-stone-800">
                  <Calendar className="h-4 w-4 text-stone-400" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Created</p>
                  <p className="text-stone-200">
                    {new Date(problem.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {problem.source_event && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-stone-800">
                    <Clock className="h-4 w-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Source Event</p>
                    <p className="text-stone-200">{problem.source_event}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags Card */}
          {problem.tags && problem.tags.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-stone-300">
                      {tag.tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Problems */}
          <SimilarProblems problemId={id} variant="admin" />

          {/* Original Cycle Link */}
          {problem.original_cycle_id && (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <Link href={`/admin/cycles/${problem.original_cycle_id}`}>
                  <Button variant="outline" className="w-full border-stone-700 text-stone-300">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original Cycle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
