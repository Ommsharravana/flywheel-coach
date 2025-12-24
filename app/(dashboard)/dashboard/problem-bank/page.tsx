'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Database,
  Lightbulb,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import type {
  ProblemCardData,
  ProblemTheme,
  PaginatedProblems,
} from '@/lib/types/problem-bank';
import {
  PROBLEM_THEMES,
  getSeverityLabel,
  getSeverityColor,
  VALIDATION_STATUSES,
} from '@/lib/types/problem-bank';

export default function DashboardProblemBankPage() {
  const [problems, setProblems] = useState<ProblemCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<ProblemTheme | 'all'>('all');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    validated: 0,
    openForAttempts: 0,
  });

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12',
        status: 'open', // Only show open problems
      });

      if (search) params.set('search', search);
      if (theme !== 'all') params.set('theme', theme);

      const response = await fetch(`/api/problems?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch problems');
      }

      const data: PaginatedProblems = await response.json();
      setProblems(data.data);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, search, theme]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/problems/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total || 0,
          validated: data.statusDistribution?.find((s: { status: string; count: number }) =>
            s.status === 'desperate_user_confirmed' || s.status === 'market_validated'
          )?.count || 0,
          openForAttempts: data.total || 0,
        });
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProblems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-400" />
            Problem Bank
          </h1>
          <p className="text-stone-400 mt-1">
            Explore validated problems from the community. Fork any problem to start your own solution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/problem-bank/clusters">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
              <GitBranch className="h-4 w-4 mr-2" />
              View Clusters
            </Button>
          </Link>
          <Link href="/dashboard/problem-bank/submit">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500">
              <Lightbulb className="h-4 w-4 mr-2" />
              Submit Problem
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.total}</div>
                <p className="text-sm text-stone-500">Total Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Sparkles className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.validated}</div>
                <p className="text-sm text-stone-500">Validated Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <GitBranch className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{stats.openForAttempts}</div>
                <p className="text-sm text-stone-500">Open for Solutions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-stone-800 border-stone-700"
              />
            </div>

            <Select
              value={theme}
              onValueChange={(value) => {
                setTheme(value as ProblemTheme | 'all');
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-stone-800 border-stone-700">
                <Filter className="h-4 w-4 mr-2 text-stone-500" />
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

            {(search || theme !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setTheme('all');
                  setPage(1);
                }}
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Problems Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-stone-900/50 border-stone-800 animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-stone-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-stone-700 rounded w-full mb-2" />
                <div className="h-3 bg-stone-700 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchProblems()}
                className="mt-4 border-stone-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : problems.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 text-center py-12">
            <Lightbulb className="h-12 w-12 text-stone-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-100">No problems found</h3>
            <p className="text-stone-400 mt-2">
              {search || theme !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Problems will appear here once they are added to the bank'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-400">
            Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, total)} of {total} problems
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-stone-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-stone-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-stone-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Problem Card Component
function ProblemCard({ problem }: { problem: ProblemCardData }) {
  const themeInfo = problem.theme ? PROBLEM_THEMES[problem.theme] : null;
  const validationInfo = VALIDATION_STATUSES[problem.validation_status];

  return (
    <Link href={`/dashboard/problem-bank/${problem.id}`}>
      <Card className="bg-stone-900/50 border-stone-800 hover:border-purple-500/50 hover:bg-stone-900/70 transition-all cursor-pointer h-full">
        <CardContent className="pt-6 flex flex-col h-full">
          {/* Theme Badge */}
          <div className="flex items-start justify-between mb-3">
            {themeInfo && (
              <Badge variant="outline" className={`${themeInfo.color} border-current/30`}>
                {themeInfo.emoji} {themeInfo.label}
              </Badge>
            )}
            {problem.attempt_count > 0 && (
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                <GitBranch className="h-3 w-3 mr-1" />
                {problem.attempt_count}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-stone-100 line-clamp-2 mb-2">
            {problem.title}
          </h3>

          {/* Problem Statement */}
          <p className="text-sm text-stone-400 line-clamp-3 mb-4 flex-1">
            {problem.problem_statement}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={validationInfo.color}>
              {validationInfo.label}
            </Badge>
            {problem.severity_rating && (
              <Badge variant="outline" className={getSeverityColor(problem.severity_rating)}>
                {getSeverityLabel(problem.severity_rating)}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-800">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              {problem.institution_short && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {problem.institution_short}
                </span>
              )}
            </div>
            <span className="text-xs text-purple-400 flex items-center gap-1">
              View Details <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
