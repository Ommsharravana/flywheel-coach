'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Network,
  Building,
  Lightbulb,
  TrendingUp,
  Users,
  Layers,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import {
  PROBLEM_THEMES,
  type ProblemTheme,
  VALIDATION_STATUSES,
  getSeverityLabel,
  getSeverityColor,
} from '@/lib/types/problem-bank';

interface ClusterProblem {
  id: string;
  title: string;
  problem_statement: string;
  theme: ProblemTheme | null;
  validation_status: string;
  severity_rating: number | null;
  membership_score: number;
  is_centroid: boolean;
  institution_short?: string;
}

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  primary_theme: ProblemTheme | null;
  problem_count: number;
  avg_severity: number | null;
  cross_institutional: boolean;
  institutions_count: number;
  ai_summary: string | null;
  key_patterns: string[] | null;
  suggested_actions: string[] | null;
  problems: ClusterProblem[];
  institutions_list: string[];
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<ProblemTheme | 'all'>('all');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ include_problems: 'true' });
      if (themeFilter !== 'all') {
        params.set('theme', themeFilter);
      }

      const response = await fetch(`/api/clusters?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch clusters');
      }

      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [themeFilter]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const toggleCluster = (clusterId: string) => {
    setExpandedCluster(expandedCluster === clusterId ? null : clusterId);
  };

  // Stats
  const totalProblems = clusters.reduce((sum, c) => sum + c.problem_count, 0);
  const crossInstitutional = clusters.filter((c) => c.cross_institutional).length;
  const avgClusterSize = clusters.length > 0 ? totalProblems / clusters.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/problem-bank"
            className="text-stone-400 hover:text-stone-100 text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Problem Bank
          </Link>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
            <Network className="h-6 w-6 text-purple-400" />
            Problem Clusters
          </h1>
          <p className="text-stone-400 mt-1">
            Related problems grouped by theme and similarity. Identify patterns across institutions.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Layers className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{clusters.length}</div>
                <p className="text-sm text-stone-500">Total Clusters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Lightbulb className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{totalProblems}</div>
                <p className="text-sm text-stone-500">Clustered Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Building className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{crossInstitutional}</div>
                <p className="text-sm text-stone-500">Cross-Institutional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{avgClusterSize.toFixed(1)}</div>
                <p className="text-sm text-stone-500">Avg Cluster Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select
              value={themeFilter}
              onValueChange={(value) => setThemeFilter(value as ProblemTheme | 'all')}
            >
              <SelectTrigger className="w-[200px] bg-stone-800 border-stone-700">
                <SelectValue placeholder="Filter by theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                {Object.entries(PROBLEM_THEMES).map(([key, { label, emoji }]) => (
                  <SelectItem key={key} value={key}>
                    {emoji} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {themeFilter !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setThemeFilter('all')}
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clusters List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-stone-900/50 border-stone-800 animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-stone-700 rounded w-1/3 mb-3" />
                <div className="h-3 bg-stone-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-stone-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={() => fetchClusters()}
              className="mt-4 border-stone-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : clusters.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 text-center py-12">
            <Network className="h-12 w-12 text-stone-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-100">No clusters found</h3>
            <p className="text-stone-400 mt-2">
              {themeFilter !== 'all'
                ? 'No clusters match this theme. Try a different filter.'
                : 'Clusters will be generated as more problems are added.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clusters.map((cluster) => {
            const themeInfo = cluster.primary_theme ? PROBLEM_THEMES[cluster.primary_theme] : null;
            const isExpanded = expandedCluster === cluster.id;

            return (
              <Card
                key={cluster.id}
                className={`bg-stone-900/50 border-stone-800 transition-all ${
                  isExpanded ? 'border-purple-500/50' : 'hover:border-stone-700'
                }`}
              >
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleCluster(cluster.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {themeInfo && (
                          <Badge variant="outline" className={`${themeInfo.color} border-current/30`}>
                            {themeInfo.emoji} {themeInfo.label}
                          </Badge>
                        )}
                        {cluster.cross_institutional && (
                          <Badge variant="outline" className="text-green-400 border-green-400/30">
                            <Building className="h-3 w-3 mr-1" />
                            Cross-Institutional
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
                        {cluster.name}
                        <ChevronRight
                          className={`h-5 w-5 text-stone-500 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </CardTitle>
                      {cluster.description && (
                        <CardDescription className="mt-1">
                          {cluster.description}
                        </CardDescription>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        {cluster.problem_count}
                      </div>
                      <p className="text-xs text-stone-500">problems</p>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-800">
                    <div className="flex items-center gap-2 text-sm text-stone-400">
                      <Users className="h-4 w-4" />
                      <span>{cluster.institutions_count} institution{cluster.institutions_count !== 1 ? 's' : ''}</span>
                    </div>
                    {cluster.avg_severity && (
                      <div className={`flex items-center gap-2 text-sm ${getSeverityColor(cluster.avg_severity)}`}>
                        <span>Avg Severity: {getSeverityLabel(cluster.avg_severity)}</span>
                      </div>
                    )}
                    {cluster.institutions_list && cluster.institutions_list.length > 0 && (
                      <div className="flex items-center gap-1">
                        {cluster.institutions_list.slice(0, 3).map((inst, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-stone-800 text-stone-300">
                            {inst}
                          </Badge>
                        ))}
                        {cluster.institutions_list.length > 3 && (
                          <span className="text-xs text-stone-500">
                            +{cluster.institutions_list.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {/* Expanded content */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* AI Insights */}
                    {(cluster.ai_summary || cluster.key_patterns) && (
                      <div className="mb-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-300">AI Insights</span>
                        </div>
                        {cluster.ai_summary && (
                          <p className="text-sm text-stone-300 mb-2">{cluster.ai_summary}</p>
                        )}
                        {cluster.key_patterns && cluster.key_patterns.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {cluster.key_patterns.map((pattern, idx) => (
                              <Badge key={idx} variant="outline" className="text-purple-300 border-purple-500/30">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Problems in cluster */}
                    <h4 className="text-sm font-medium text-stone-300 mb-3">
                      Problems in this cluster ({cluster.problems?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {cluster.problems?.map((problem) => {
                        const validationInfo = VALIDATION_STATUSES[problem.validation_status as keyof typeof VALIDATION_STATUSES];

                        return (
                          <Link
                            key={problem.id}
                            href={`/dashboard/problem-bank/${problem.id}`}
                            className="block"
                          >
                            <div className="p-3 rounded-lg bg-stone-800/50 hover:bg-stone-800 transition-colors border border-stone-700/50 hover:border-stone-600">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {problem.is_centroid && (
                                      <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">
                                        Centroid
                                      </Badge>
                                    )}
                                    {problem.institution_short && (
                                      <Badge variant="secondary" className="text-xs bg-stone-700 text-stone-300">
                                        {problem.institution_short}
                                      </Badge>
                                    )}
                                  </div>
                                  <h5 className="text-sm font-medium text-stone-100 line-clamp-1">
                                    {problem.title}
                                  </h5>
                                  <p className="text-xs text-stone-400 line-clamp-2 mt-1">
                                    {problem.problem_statement}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {validationInfo && (
                                    <Badge variant="outline" className={`text-xs ${validationInfo.color}`}>
                                      {validationInfo.label}
                                    </Badge>
                                  )}
                                  <div className="text-xs text-stone-500">
                                    {Math.round(problem.membership_score * 100)}% match
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
