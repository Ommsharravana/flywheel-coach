'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Database,
  Target,
  ExternalLink,
  Loader2,
  GitFork,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import type { ProblemCardData, ProblemTheme } from '@/lib/types/problem-bank';
import { InstitutionLeaderboard } from '@/components/problem-bank/InstitutionLeaderboard';
import {
  PROBLEM_THEMES,
  VALIDATION_STATUSES,
  getSeverityLabel,
  getSeverityColor,
} from '@/lib/types/problem-bank';

interface EventInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function EventProblemsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [problems, setProblems] = useState<ProblemCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forkingId, setForkingId] = useState<string | null>(null);

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
    themes: 0,
    institutions: 0,
  });

  // Fetch event info
  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events?slug=${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error('Failed to fetch event');
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setEventLoading(false);
      }
    }
    fetchEvent();
  }, [slug, router]);

  const fetchProblems = useCallback(async () => {
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12',
        status: 'open',
        event_id: event.id,
      });

      if (search) params.set('search', search);
      if (theme !== 'all') params.set('theme', theme);

      const response = await fetch(`/api/problems?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch problems');
      }

      const data = await response.json();
      setProblems(data.data);
      setTotalPages(data.total_pages);
      setTotal(data.total);

      // Calculate stats
      const uniqueThemes = new Set(data.data.map((p: ProblemCardData) => p.theme));
      const uniqueInstitutions = new Set(
        data.data.map((p: ProblemCardData) => p.institution_short).filter(Boolean)
      );
      setStats({
        total: data.total,
        themes: uniqueThemes.size,
        institutions: uniqueInstitutions.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [event, page, search, theme]);

  useEffect(() => {
    if (event) {
      fetchProblems();
    }
  }, [event, fetchProblems]);

  // Debounced search
  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchProblems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, event]);

  const handleFork = async (problemId: string) => {
    setForkingId(problemId);
    try {
      const response = await fetch('/api/problems/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem_id: problemId }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          router.push(`/login?redirect=/events/${slug}/problems`);
          return;
        }
        throw new Error(data.error || 'Failed to fork problem');
      }

      const data = await response.json();
      router.push(`/cycle/${data.cycle_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to fork problem');
      setForkingId(null);
    }
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex items-center justify-center">
        <Card className="bg-stone-900/50 border-stone-800 max-w-md">
          <CardContent className="pt-6 text-center py-12">
            <h2 className="text-xl font-semibold text-stone-100 mb-2">Event Not Found</h2>
            <p className="text-stone-400 mb-4">The event you're looking for doesn't exist.</p>
            <Link href="/">
              <Button variant="outline" className="border-stone-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center text-stone-400 hover:text-stone-200 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {event.name}
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-amber-400" />
            <h1 className="text-4xl font-display font-bold text-stone-100">
              {event.name} Problem Bank
            </h1>
          </div>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            Browse real problems from JKKN institutions. Find one that inspires you, fork it to
            your own cycle, and build a solution that makes a difference.
          </p>
        </div>

        {/* Stats and Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Stats */}
          <div className="lg:col-span-2 grid gap-4 grid-cols-3">
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 rounded-lg bg-amber-500/20 mb-2">
                    <Database className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-stone-100">{stats.total}</div>
                  <p className="text-sm text-stone-500">Open Problems</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 rounded-lg bg-blue-500/20 mb-2">
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-stone-100">{stats.themes}</div>
                  <p className="text-sm text-stone-500">Themes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 rounded-lg bg-green-500/20 mb-2">
                    <Building2 className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-stone-100">{stats.institutions}</div>
                  <p className="text-sm text-stone-500">Institutions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Institution Leaderboard */}
          <div className="lg:col-span-1">
            <InstitutionLeaderboard eventSlug={slug} />
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-stone-900/50 border-stone-800 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[250px]">
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
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[200px] bg-stone-800 border-stone-700">
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
                  className="border-stone-700 text-stone-300"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Problems Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : error ? (
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        ) : problems.length === 0 ? (
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6 text-center py-16">
              <Database className="h-12 w-12 text-stone-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stone-100 mb-2">No Problems Found</h3>
              <p className="text-stone-400">
                {search || theme !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Check back soon for new problems to solve!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                eventSlug={slug}
                onFork={handleFork}
                forking={forkingId === problem.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
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
    </div>
  );
}

// Problem Card Component
function ProblemCard({
  problem,
  eventSlug,
  onFork,
  forking,
}: {
  problem: ProblemCardData;
  eventSlug: string;
  onFork: (id: string) => void;
  forking: boolean;
}) {
  const themeInfo = problem.theme ? PROBLEM_THEMES[problem.theme] : null;
  const validationInfo = VALIDATION_STATUSES[problem.validation_status];

  return (
    <Card className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-all hover:shadow-lg hover:shadow-amber-500/5">
      <CardContent className="pt-6">
        {/* Theme & Badge */}
        <div className="flex items-start justify-between mb-3">
          {themeInfo && (
            <span className={`text-sm ${themeInfo.color}`}>
              {themeInfo.emoji} {themeInfo.label}
            </span>
          )}
          {problem.attempt_count > 0 && (
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              {problem.attempt_count} attempt{problem.attempt_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-stone-100 line-clamp-2 mb-2">{problem.title}</h3>

        {/* Description */}
        <p className="text-sm text-stone-400 line-clamp-3 mb-4">{problem.problem_statement}</p>

        {/* Validation & Severity */}
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
          <div className="text-xs text-stone-500">
            {problem.institution_short && <span>{problem.institution_short}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/events/${eventSlug}/problems/${problem.id}`}>
              <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-100">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => onFork(problem.id)}
              disabled={forking}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              {forking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <GitFork className="h-4 w-4 mr-1" />
                  Fork
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
