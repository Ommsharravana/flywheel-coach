'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Rocket,
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  Plus,
  Search,
  Building,
  Star,
  AlertTriangle,
  Loader2,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import {
  NIF_STAGES,
  type NIFStage,
  PROBLEM_THEMES,
} from '@/lib/types/problem-bank';
import { FlywheelSummary } from '@/components/admin/FlywheelSummary';

interface PipelineCandidate {
  id: string;
  problem_id: string;
  stage: NIFStage;
  identified_at: string;
  startup_name: string | null;
  startup_status: string | null;
  jobs_created: number;
  revenue_generated: number;
  decision_notes: string | null;
  problem: {
    id: string;
    title: string;
    problem_statement: string;
    theme: string | null;
    validation_status: string;
    severity_rating: number | null;
  };
  institution_short?: string;
  composite_score?: number | null;
}

interface PipelineStats {
  total_candidates: number;
  by_stage: Record<string, number>;
  total_startups: number;
  total_jobs_created: number;
  total_revenue: number;
  avg_time_to_graduation_days: number | null;
}

const ACTIVE_STAGES: NIFStage[] = ['identified', 'screened', 'shortlisted', 'incubating', 'graduated'];

export default function NIFPipelinePage() {
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pipeline?include_stats=true');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pipeline');
      }

      const data = await response.json();
      setCandidates(data.candidates || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleStageChange = async (candidateId: string, newStage: NIFStage) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/pipeline/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      // Refresh data
      await fetchPipeline();
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Filter candidates by search
  const filteredCandidates = candidates.filter((c) =>
    c.problem.title.toLowerCase().includes(search.toLowerCase()) ||
    c.startup_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by stage
  const byStage = ACTIVE_STAGES.reduce((acc, stage) => {
    acc[stage] = filteredCandidates.filter((c) => c.stage === stage);
    return acc;
  }, {} as Record<NIFStage, PipelineCandidate[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/problem-bank"
            className="text-stone-400 hover:text-stone-100 text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Problem Bank
          </Link>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-orange-400" />
            NIF Innovation Pipeline
          </h1>
          <p className="text-stone-400 mt-1">
            Track problems from identification to successful startup graduation
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-stone-100">{stats.total_candidates}</div>
                  <p className="text-sm text-stone-500">Total Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Rocket className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">{stats.total_startups}</div>
                  <p className="text-sm text-stone-500">Active Startups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{stats.total_jobs_created}</div>
                  <p className="text-sm text-stone-500">Jobs Created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    ₹{(stats.total_revenue / 100000).toFixed(1)}L
                  </div>
                  <p className="text-sm text-stone-500">Revenue Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <GraduationCap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {stats.by_stage.graduated || 0}
                  </div>
                  <p className="text-sm text-stone-500">Graduated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <Input
              placeholder="Search candidates or startups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-stone-800 border-stone-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : error ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={fetchPipeline}
              className="mt-4 border-stone-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : candidates.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 text-center py-12">
            <Rocket className="h-12 w-12 text-stone-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-100">No candidates in pipeline</h3>
            <p className="text-stone-400 mt-2">
              Add high-potential problems to the NIF pipeline from the Problem Bank
            </p>
            <Link href="/admin/problem-bank">
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                Go to Problem Bank
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
          {ACTIVE_STAGES.map((stage) => {
            const stageInfo = NIF_STAGES[stage];
            const stageCandidates = byStage[stage] || [];

            return (
              <div key={stage} className="min-w-[280px]">
                {/* Column Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${stageInfo.color}`}>
                      {stageInfo.label}
                    </h3>
                    <Badge variant="outline" className="text-stone-400 border-stone-600">
                      {stageCandidates.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{stageInfo.description}</p>
                </div>

                {/* Column Content */}
                <div className="space-y-3">
                  {stageCandidates.map((candidate) => {
                    const themeInfo = candidate.problem.theme
                      ? PROBLEM_THEMES[candidate.problem.theme as keyof typeof PROBLEM_THEMES]
                      : null;

                    return (
                      <Dialog key={candidate.id}>
                        <DialogTrigger asChild>
                          <Card
                            className="bg-stone-800/50 border-stone-700 hover:border-stone-600 cursor-pointer transition-all"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            <CardContent className="p-4">
                              {/* Theme & Score */}
                              <div className="flex items-center justify-between mb-2">
                                {themeInfo && (
                                  <Badge variant="outline" className={`text-xs ${themeInfo.color} border-current/30`}>
                                    {themeInfo.emoji}
                                  </Badge>
                                )}
                                {candidate.composite_score && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-400" />
                                    <span className="text-xs text-yellow-400">
                                      {candidate.composite_score.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className="text-sm font-medium text-stone-100 line-clamp-2 mb-2">
                                {candidate.startup_name || candidate.problem.title}
                              </h4>

                              {/* Institution */}
                              {candidate.institution_short && (
                                <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                                  <Building className="h-3 w-3" />
                                  {candidate.institution_short}
                                </div>
                              )}

                              {/* Metrics */}
                              {(candidate.jobs_created > 0 || candidate.revenue_generated > 0) && (
                                <div className="flex items-center gap-3 text-xs text-stone-400 pt-2 border-t border-stone-700">
                                  {candidate.jobs_created > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {candidate.jobs_created} jobs
                                    </span>
                                  )}
                                  {candidate.revenue_generated > 0 && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ₹{(candidate.revenue_generated / 1000).toFixed(0)}K
                                    </span>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </DialogTrigger>

                        <DialogContent className="bg-stone-900 border-stone-700 max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-stone-100">
                              {candidate.startup_name || candidate.problem.title}
                            </DialogTitle>
                            <DialogDescription className="text-stone-400">
                              {candidate.problem.problem_statement?.substring(0, 200)}...
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 mt-4">
                            {/* Stage Selector */}
                            <div>
                              <label className="text-sm font-medium text-stone-300 mb-2 block">
                                Pipeline Stage
                              </label>
                              <Select
                                value={candidate.stage}
                                onValueChange={(value) => handleStageChange(candidate.id, value as NIFStage)}
                                disabled={updating}
                              >
                                <SelectTrigger className="bg-stone-800 border-stone-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(NIF_STAGES).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-stone-800">
                                <div className="text-2xl font-bold text-green-400">
                                  {candidate.jobs_created}
                                </div>
                                <div className="text-xs text-stone-500">Jobs Created</div>
                              </div>
                              <div className="p-3 rounded-lg bg-stone-800">
                                <div className="text-2xl font-bold text-yellow-400">
                                  ₹{(candidate.revenue_generated / 100000).toFixed(1)}L
                                </div>
                                <div className="text-xs text-stone-500">Revenue</div>
                              </div>
                            </div>

                            {/* Notes */}
                            {candidate.decision_notes && (
                              <div className="p-3 rounded-lg bg-stone-800">
                                <div className="text-xs text-stone-500 mb-1">Notes</div>
                                <p className="text-sm text-stone-300">{candidate.decision_notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                              <Link
                                href={`/admin/problem-bank/${candidate.problem_id}`}
                                className="flex-1"
                              >
                                <Button variant="outline" className="w-full border-stone-700">
                                  View Problem
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })}

                  {stageCandidates.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-stone-700 rounded-lg text-center">
                      <p className="text-sm text-stone-500">No candidates</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Learning Flywheel Summary */}
      <FlywheelSummary />
    </div>
  );
}
