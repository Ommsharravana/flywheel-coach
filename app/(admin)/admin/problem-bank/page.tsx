'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Database,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
  ProblemStatus,
  ValidationStatus,
  PaginatedProblems,
} from '@/lib/types/problem-bank';
import {
  PROBLEM_THEMES,
  PROBLEM_STATUSES,
  VALIDATION_STATUSES,
  getSeverityLabel,
  getSeverityColor,
} from '@/lib/types/problem-bank';

export default function ProblemBankPage() {
  const supabase = createClient();
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
  const [status, setStatus] = useState<ProblemStatus | 'all'>('all');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | 'all'>('all');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    solved: 0,
    validated: 0,
  });

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12',
      });

      if (search) params.set('search', search);
      if (theme !== 'all') params.set('theme', theme);
      if (status !== 'all') params.set('status', status);
      if (validationStatus !== 'all') params.set('validation_status', validationStatus);

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
  }, [page, search, theme, status, validationStatus]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Get all problems without filters for stats
      const response = await fetch('/api/problems?per_page=1000');
      if (response.ok) {
        const data: PaginatedProblems = await response.json();
        setStats({
          total: data.total,
          open: data.data.filter(p => p.status === 'open').length,
          solved: data.data.filter(p => p.status === 'solved').length,
          validated: data.data.filter(p =>
            p.validation_status === 'desperate_user_confirmed' ||
            p.validation_status === 'market_validated'
          ).length,
        });
      }
    } catch {
      // Stats are non-critical, silently fail
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
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Problem Bank
        </h1>
        <p className="text-stone-400">
          Repository of validated problems from across JKKN institutions
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-800">
                <Database className="h-5 w-5 text-stone-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.total}</div>
                <p className="text-sm text-stone-500">Total Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.open}</div>
                <p className="text-sm text-stone-500">Open for Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <CheckCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{stats.solved}</div>
                <p className="text-sm text-stone-500">Solved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Users className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{stats.validated}</div>
                <p className="text-sm text-stone-500">User Validated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-stone-400" />
              <CardTitle className="text-lg text-stone-100">Filter Problems</CardTitle>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-stone-800 border-stone-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Theme Filter */}
            <Select
              value={theme}
              onValueChange={(value) => {
                setTheme(value as ProblemTheme | 'all');
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[180px] bg-stone-800 border-stone-700">
                <SelectValue placeholder="Theme" />
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

            {/* Status Filter */}
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as ProblemStatus | 'all');
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[180px] bg-stone-800 border-stone-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(PROBLEM_STATUSES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Validation Status Filter */}
            <Select
              value={validationStatus}
              onValueChange={(value) => {
                setValidationStatus(value as ValidationStatus | 'all');
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[200px] bg-stone-800 border-stone-700">
                <SelectValue placeholder="Validation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Validation</SelectItem>
                {Object.entries(VALIDATION_STATUSES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setTheme('all');
                setStatus('all');
                setValidationStatus('all');
                setPage(1);
              }}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Problems Grid */}
      <div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-stone-700 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-stone-700 rounded w-full mb-2" />
                  <div className="h-3 bg-stone-700 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : problems.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="pt-6 text-center py-12">
              <Database className="h-12 w-12 text-stone-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-100">No problems found</h3>
              <p className="text-stone-400 mt-2">
                {search || theme !== 'all' || status !== 'all' || validationStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Problems will appear here when extracted from completed cycles'
                }
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
      </div>

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
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
  const statusInfo = PROBLEM_STATUSES[problem.status];
  const validationInfo = VALIDATION_STATUSES[problem.validation_status];

  return (
    <Card className="glass-card hover:ring-1 hover:ring-stone-700 transition-all">
      <CardContent className="pt-6">
        {/* Header with theme and status */}
        <div className="flex items-start justify-between mb-3">
          {themeInfo && (
            <span className={`text-sm ${themeInfo.color}`}>
              {themeInfo.emoji} {themeInfo.label}
            </span>
          )}
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-stone-100 line-clamp-2 mb-2">
          {problem.title}
        </h3>

        {/* Problem statement preview */}
        <p className="text-sm text-stone-400 line-clamp-3 mb-4">
          {problem.problem_statement}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={validationInfo.color}>
            {validationInfo.label}
          </Badge>
          {problem.severity_rating && (
            <Badge variant="outline" className={getSeverityColor(problem.severity_rating)}>
              {getSeverityLabel(problem.severity_rating)} Severity
            </Badge>
          )}
          {problem.attempt_count > 0 && (
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              {problem.attempt_count} attempt{problem.attempt_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800">
          <div className="text-xs text-stone-500">
            {problem.institution_short && (
              <span>{problem.institution_short} • </span>
            )}
            {new Date(problem.created_at).toLocaleDateString()}
          </div>
          <Link href={`/admin/problem-bank/${problem.id}`}>
            <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
              View <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
