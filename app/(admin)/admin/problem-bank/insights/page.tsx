'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BarChart3,
  Building,
  Lightbulb,
  TrendingUp,
  Users,
  Network,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Target,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  PROBLEM_THEMES,
  type ProblemTheme,
} from '@/lib/types/problem-bank';

interface ThemeDistribution {
  theme: string;
  count: number;
}

interface InstitutionDistribution {
  id: string;
  name: string;
  short_name: string;
  count: number;
}

interface ValidationDistribution {
  validation: string;
  count: number;
}

interface SimilarityStats {
  total_problems: number;
  total_similarities: number;
  avg_similarity_score: number;
  total_clusters: number;
  clusters: {
    id: string;
    name: string;
    problem_count: number;
    primary_theme: string;
  }[];
}

interface CrossPattern {
  theme: ProblemTheme;
  problem_count: number;
  institutions_count: number;
  avg_severity: number | null;
  institutions: string[];
  recent_problems: string[];
}

export default function ProblemInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats data
  const [stats, setStats] = useState<{
    total: number;
    themeDistribution: ThemeDistribution[];
    institutionDistribution: InstitutionDistribution[];
    validationDistribution: ValidationDistribution[];
    avgSeverity: number | null;
  } | null>(null);

  const [similarityStats, setSimilarityStats] = useState<SimilarityStats | null>(null);
  const [crossPatterns, setCrossPatterns] = useState<CrossPattern[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats, similarity stats, and cross-patterns in parallel
      const [statsRes, simRes] = await Promise.all([
        fetch('/api/problems/stats'),
        fetch('/api/problems/compute-similarities'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (simRes.ok) {
        const data = await simRes.json();
        setSimilarityStats(data);
      }

      // Fetch cross-institutional patterns
      const clustersRes = await fetch('/api/clusters?include_problems=false');
      if (clustersRes.ok) {
        const data = await clustersRes.json();
        // Convert clusters to cross patterns
        const patterns: CrossPattern[] = data.clusters
          .filter((c: { cross_institutional: boolean }) => c.cross_institutional)
          .map((c: {
            primary_theme: ProblemTheme;
            problem_count: number;
            institutions_count: number;
            avg_severity: number | null;
            institutions_list?: string[];
            name: string;
          }) => ({
            theme: c.primary_theme,
            problem_count: c.problem_count,
            institutions_count: c.institutions_count,
            avg_severity: c.avg_severity,
            institutions: c.institutions_list || [],
            recent_problems: [c.name],
          }));
        setCrossPatterns(patterns);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecompute = async () => {
    setComputing(true);
    try {
      const response = await fetch('/api/problems/compute-similarities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recompute_all: true, threshold: 0.3 }),
      });

      if (response.ok) {
        // Refresh data after computing
        await fetchData();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to compute similarities');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute');
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4 text-stone-400" />
          <span className="text-stone-400">Back to Problem Bank</span>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

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
            Back to Problem Bank Admin
          </Link>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-400" />
            Problem Insights
          </h1>
          <p className="text-stone-400 mt-1">
            Analytics and patterns across all problems in the bank.
          </p>
        </div>
        <Button
          onClick={handleRecompute}
          disabled={computing}
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
        >
          {computing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Computing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recompute Similarities
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-900/30 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Lightbulb className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats?.total || 0}</div>
                <p className="text-sm text-stone-500">Total Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Network className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {similarityStats?.total_similarities || 0}
                </div>
                <p className="text-sm text-stone-500">Similarity Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {similarityStats?.total_clusters || 0}
                </div>
                <p className="text-sm text-stone-500">Active Clusters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {stats?.avgSeverity?.toFixed(1) || 'N/A'}
                </div>
                <p className="text-sm text-stone-500">Avg Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Theme Distribution */}
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Problems by Theme
            </CardTitle>
            <CardDescription>Distribution of problems across themes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.themeDistribution && stats.themeDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.themeDistribution.map((item) => {
                  const themeInfo = PROBLEM_THEMES[item.theme as ProblemTheme];
                  const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;

                  return (
                    <div key={item.theme} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <span>{themeInfo?.emoji || '💡'}</span>
                          <span className={themeInfo?.color || 'text-stone-300'}>
                            {themeInfo?.label || item.theme}
                          </span>
                        </span>
                        <span className="text-sm text-stone-400">{item.count}</span>
                      </div>
                      <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-stone-500 text-center py-4">No theme data available</p>
            )}
          </CardContent>
        </Card>

        {/* Institution Distribution */}
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
              <Building className="h-5 w-5 text-green-400" />
              Problems by Institution
            </CardTitle>
            <CardDescription>Which institutions are identifying problems</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.institutionDistribution && stats.institutionDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.institutionDistribution.slice(0, 8).map((item) => {
                  const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-300">
                          {item.short_name || item.name}
                        </span>
                        <span className="text-sm text-stone-400">{item.count}</span>
                      </div>
                      <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-stone-500 text-center py-4">No institution data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cross-Institutional Patterns */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            Cross-Institutional Patterns
          </CardTitle>
          <CardDescription>
            Problems identified by multiple institutions independently
          </CardDescription>
        </CardHeader>
        <CardContent>
          {crossPatterns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {crossPatterns.map((pattern, idx) => {
                const themeInfo = PROBLEM_THEMES[pattern.theme];

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-stone-800/50 border border-amber-500/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className={`${themeInfo?.color || ''} border-current/30`}>
                        {themeInfo?.emoji} {themeInfo?.label || pattern.theme}
                      </Badge>
                      <span className="text-lg font-bold text-amber-400">
                        {pattern.institutions_count} inst.
                      </span>
                    </div>
                    <p className="text-sm text-stone-400">
                      {pattern.problem_count} problem{pattern.problem_count !== 1 ? 's' : ''} identified
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pattern.institutions.slice(0, 4).map((inst, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-stone-700">
                          {inst}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500">
                No cross-institutional patterns detected yet.
              </p>
              <p className="text-stone-600 text-sm mt-1">
                Patterns emerge when multiple institutions identify similar problems.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Clusters */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-400" />
                Active Clusters
              </CardTitle>
              <CardDescription>Groups of related problems</CardDescription>
            </div>
            <Link href="/dashboard/problem-bank/clusters">
              <Button variant="outline" size="sm" className="border-stone-700">
                View All Clusters
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {similarityStats?.clusters && similarityStats.clusters.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {similarityStats.clusters.slice(0, 8).map((cluster) => {
                const themeInfo = cluster.primary_theme
                  ? PROBLEM_THEMES[cluster.primary_theme as ProblemTheme]
                  : null;

                return (
                  <Link
                    key={cluster.id}
                    href="/dashboard/problem-bank/clusters"
                    className="p-3 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors border border-stone-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {themeInfo && (
                        <span>{themeInfo.emoji}</span>
                      )}
                      <span className="text-sm font-medium text-stone-200 truncate">
                        {cluster.name}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      {cluster.problem_count} problem{cluster.problem_count !== 1 ? 's' : ''}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Network className="h-12 w-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500">No clusters created yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecompute}
                disabled={computing}
                className="mt-3 border-stone-700"
              >
                {computing ? 'Computing...' : 'Generate Clusters'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Distribution */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            Validation Status
          </CardTitle>
          <CardDescription>How well-validated are the problems</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.validationDistribution && stats.validationDistribution.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {stats.validationDistribution.map((item) => {
                const labels: Record<string, { label: string; color: string }> = {
                  unvalidated: { label: 'Unvalidated', color: 'bg-gray-500' },
                  user_tested: { label: 'User Tested', color: 'bg-blue-500' },
                  desperate_user_confirmed: { label: 'Desperate Users', color: 'bg-green-500' },
                  market_validated: { label: 'Market Validated', color: 'bg-purple-500' },
                };
                const info = labels[item.validation] || { label: item.validation, color: 'bg-gray-500' };

                return (
                  <div key={item.validation} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${info.color}`} />
                    <span className="text-sm text-stone-300">{info.label}</span>
                    <Badge variant="secondary" className="bg-stone-800">
                      {item.count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-stone-500 text-center py-4">No validation data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
