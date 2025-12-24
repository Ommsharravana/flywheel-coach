'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Clock,
  Save,
  Loader2,
  FileCheck,
  CircleDot,
  CheckCircle2,
  Download,
  BarChart3,
  PieChart,
  Plus,
  Sparkles,
  Building2,
  Trophy,
  Medal,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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

interface CycleData {
  id: string;
  name: string;
  status: string;
  current_step: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  institution_id: string | null;
  institution_name: string | null;
  institution_short: string | null;
  problem_preview: string;
  theme: string | null;
  is_saved: boolean;
  is_eligible: boolean;
}

interface CyclesResponse {
  eligible: CycleData[];
  in_progress: CycleData[];
  saved: CycleData[];
  total: number;
  already_saved: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  short_name: string;
  total_cycles: number;
  completed_cycles: number;
  problems_identified: number;
  problems_saved: number;
  problems_solved: number;
  problems_validated: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totals: {
    total_cycles: number;
    completed_cycles: number;
    problems_identified: number;
    problems_saved: number;
    institutions: number;
  };
}

export default function ProblemBankPage() {
  const [problems, setProblems] = useState<ProblemCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All cycles data
  const [cyclesData, setCyclesData] = useState<CyclesResponse>({
    eligible: [],
    in_progress: [],
    saved: [],
    total: 0,
    already_saved: 0,
  });
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [savingCycleId, setSavingCycleId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Active tab
  const [activeTab, setActiveTab] = useState('all');

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
    inProgress: 0,
    eligible: 0,
    saved: 0,
  });

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    total: number;
    themeDistribution: { theme: string; count: number }[];
    institutionDistribution: { id: string; name: string; short_name: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    avgSeverity: number | null;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Quick Submit
  const [showQuickSubmit, setShowQuickSubmit] = useState(false);
  const [quickSubmitData, setQuickSubmitData] = useState({
    title: '',
    problem_statement: '',
    theme: 'other' as string,
    who_affected: '',
  });
  const [quickSubmitting, setQuickSubmitting] = useState(false);

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

  // Fetch all cycles with problems
  const fetchCycles = useCallback(async () => {
    setCyclesLoading(true);
    try {
      const response = await fetch('/api/problems/eligible-cycles?all=true');
      if (response.ok) {
        const data: CyclesResponse = await response.json();
        setCyclesData(data);
        setStats({
          total: data.total,
          inProgress: data.in_progress.length,
          eligible: data.eligible.length,
          saved: data.already_saved,
        });
      }
    } catch {
      // Non-critical, silently fail
    } finally {
      setCyclesLoading(false);
    }
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (analyticsData) return; // Already fetched
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/problems/stats');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch {
      // Non-critical
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsData]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (leaderboard) return; // Already fetched
    setLeaderboardLoading(true);
    try {
      const response = await fetch('/api/problems/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch {
      // Non-critical
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboard]);

  // Fetch analytics and leaderboard when panel opens
  useEffect(() => {
    if (showAnalytics) {
      if (!analyticsData) fetchAnalytics();
      if (!leaderboard) fetchLeaderboard();
    }
  }, [showAnalytics, analyticsData, leaderboard, fetchAnalytics, fetchLeaderboard]);

  // Save cycle to problem bank
  const saveCycleToProblemBank = async (cycleId: string) => {
    setSavingCycleId(cycleId);
    try {
      const response = await fetch('/api/problems/from-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle_id: cycleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save problem');
      }

      // Refresh cycles and problems
      await Promise.all([fetchCycles(), fetchProblems()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save problem');
    } finally {
      setSavingCycleId(null);
    }
  };

  // Bulk save all eligible cycles
  const saveAllEligible = async () => {
    if (cyclesData.eligible.length === 0) return;

    setBulkSaving(true);
    setBulkProgress({ current: 0, total: cyclesData.eligible.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < cyclesData.eligible.length; i++) {
      const cycle = cyclesData.eligible[i];
      setBulkProgress({ current: i + 1, total: cyclesData.eligible.length });

      try {
        const response = await fetch('/api/problems/from-cycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycle_id: cycle.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    // Refresh data
    await Promise.all([fetchCycles(), fetchProblems()]);

    setBulkSaving(false);
    setBulkProgress({ current: 0, total: 0 });

    alert(`Saved ${successCount} problems to bank. ${failCount > 0 ? `${failCount} failed.` : ''}`);
  };

  // Export functions
  const exportToJSON = () => {
    const allData = [...cyclesData.in_progress, ...cyclesData.eligible, ...cyclesData.saved];
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem-bank-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const allData = [...cyclesData.in_progress, ...cyclesData.eligible, ...cyclesData.saved];
    const headers = ['Name', 'Problem Preview', 'Theme', 'Step', 'User', 'Status', 'Created At'];
    const rows = allData.map(c => [
      c.name,
      c.problem_preview.replace(/,/g, ';').replace(/\n/g, ' '),
      c.theme || 'other',
      c.current_step,
      c.user_name,
      c.is_saved ? 'Saved' : c.is_eligible ? 'Eligible' : 'In Progress',
      new Date(c.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem-bank-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick Submit
  const handleQuickSubmit = async () => {
    if (!quickSubmitData.title || !quickSubmitData.problem_statement) {
      alert('Please fill in title and problem statement');
      return;
    }

    setQuickSubmitting(true);
    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickSubmitData.title,
          problem_statement: quickSubmitData.problem_statement,
          theme: quickSubmitData.theme,
          who_affected: quickSubmitData.who_affected || null,
          source_type: 'manual',
          validation_status: 'unvalidated',
          status: 'open',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit problem');
      }

      // Reset form and refresh
      setQuickSubmitData({ title: '', problem_statement: '', theme: 'other', who_affected: '' });
      setShowQuickSubmit(false);
      await Promise.all([fetchCycles(), fetchProblems()]);
      alert('Problem submitted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit problem');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Calculate theme distribution for analytics
  const getThemeDistribution = () => {
    const allCycles = [...cyclesData.in_progress, ...cyclesData.eligible, ...cyclesData.saved];
    const distribution: Record<string, number> = {};
    allCycles.forEach(c => {
      const t = c.theme || 'other';
      distribution[t] = (distribution[t] || 0) + 1;
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count }));
  };

  // Calculate institution distribution from cycles data (fallback when problem_bank is empty)
  const getInstitutionDistribution = () => {
    const allCycles = [...cyclesData.in_progress, ...cyclesData.eligible, ...cyclesData.saved];
    const distribution: Record<string, { name: string; short_name: string; count: number }> = {};
    allCycles.forEach(c => {
      if (c.institution_id && c.institution_name) {
        if (!distribution[c.institution_id]) {
          distribution[c.institution_id] = {
            name: c.institution_name,
            short_name: c.institution_short || c.institution_name,
            count: 0,
          };
        }
        distribution[c.institution_id].count++;
      }
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { name, short_name, count }]) => ({ id, name, short_name, count }));
  };

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

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

  const getStepLabel = (step: number) => {
    const steps: Record<number, string> = {
      1: 'Problem Discovery',
      2: 'Context Discovery',
      3: 'Value Discovery',
      4: 'Workflow Classification',
      5: 'Lovable Prompting',
      6: 'Build & Iterate',
      7: 'Impact Discovery',
      8: 'Complete',
    };
    return steps[step] || `Step ${step}`;
  };

  const getStepColor = (step: number) => {
    if (step >= 7) return 'text-green-400 border-green-400/30';
    if (step >= 4) return 'text-amber-400 border-amber-400/30';
    return 'text-blue-400 border-blue-400/30';
  };

  // Get all cycles combined for "All" tab
  const allCycles = [
    ...cyclesData.in_progress,
    ...cyclesData.eligible,
  ];

  // Filter cycles by search
  const filterCycles = (cycles: CycleData[]) => {
    if (!search) return cycles;
    const searchLower = search.toLowerCase();
    return cycles.filter(
      c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.problem_preview.toLowerCase().includes(searchLower) ||
        c.user_name.toLowerCase().includes(searchLower)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Problem Bank
        </h1>
        <p className="text-stone-400">
          All problem statements from Flywheel cycles across JKKN institutions
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
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CircleDot className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                <p className="text-sm text-stone-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <FileCheck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{stats.eligible}</div>
                <p className="text-sm text-stone-500">Ready to Save</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.saved}</div>
                <p className="text-sm text-stone-500">Saved to Bank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Analytics, Export, Quick Submit */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {showAnalytics ? 'Hide' : 'Show'} Analytics
        </Button>
        <Button
          variant="outline"
          onClick={exportToJSON}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={exportToCSV}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          onClick={() => setShowQuickSubmit(!showQuickSubmit)}
          className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
        >
          <Plus className="h-4 w-4 mr-2" />
          Quick Submit
        </Button>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="space-y-6">
          {/* Theme Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-stone-100 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-400" />
                Problems by Theme (Appathon 2.0 Tracks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                </div>
              ) : (() => {
                // Use saved problem_bank data if available, otherwise fall back to cycles
                const themeData = (analyticsData?.themeDistribution && analyticsData.themeDistribution.length > 0)
                  ? analyticsData.themeDistribution
                  : getThemeDistribution();
                const total = (analyticsData?.total && analyticsData.total > 0) ? analyticsData.total : stats.total;

                if (themeData.length === 0) {
                  return (
                    <p className="text-stone-500 text-center py-4">
                      No theme data available yet. Problems will be categorized by theme as they are added.
                    </p>
                  );
                }

                return (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {themeData.map(({ theme, count }) => {
                      const themeInfo = PROBLEM_THEMES[theme as keyof typeof PROBLEM_THEMES];
                      const percentage = Math.round((count / total) * 100) || 0;
                      return (
                        <div key={theme} className="p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{themeInfo?.emoji || '📋'}</span>
                            <span className={`font-medium ${themeInfo?.color || 'text-stone-300'}`}>
                              {themeInfo?.label || 'Other'}
                            </span>
                          </div>
                          <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-stone-100">{count}</span>
                            <span className="text-sm text-stone-500">{percentage}%</span>
                          </div>
                          <div className="mt-2 h-2 bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Institution Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-stone-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                Problems by Institution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : (() => {
                // Use saved problem_bank data if available, otherwise fall back to cycles
                const institutionData = (analyticsData?.institutionDistribution && analyticsData.institutionDistribution.length > 0)
                  ? analyticsData.institutionDistribution
                  : getInstitutionDistribution();
                const total = (analyticsData?.total && analyticsData.total > 0) ? analyticsData.total : stats.total;

                if (institutionData.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Building2 className="h-8 w-8 text-stone-600 mx-auto mb-2" />
                      <p className="text-stone-400 font-medium">No institution data available</p>
                      <p className="text-stone-500 text-sm mt-1">
                        Institution breakdown will appear once cycles are linked to institutions.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {institutionData.map(({ id, name, short_name, count }) => {
                      const percentage = Math.round((count / total) * 100) || 0;
                      return (
                        <div key={id} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium text-stone-300 truncate" title={name}>
                            {short_name || name}
                          </div>
                          <div className="flex-1 h-6 bg-stone-800 rounded overflow-hidden">
                            <div
                              className="h-full bg-blue-500/70 rounded flex items-center justify-end pr-2 transition-all"
                              style={{ width: `${Math.max(percentage, 10)}%` }}
                            >
                              <span className="text-xs font-medium text-white">{count}</span>
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm text-stone-500">
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Institution Leaderboard */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-stone-100 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Institution Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                </div>
              ) : !leaderboard || leaderboard.leaderboard.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy className="h-8 w-8 text-stone-600 mx-auto mb-2" />
                  <p className="text-stone-400 font-medium">No leaderboard data yet</p>
                  <p className="text-stone-500 text-sm mt-1">
                    Rankings will appear as institutions submit problems.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-stone-800/50 border border-stone-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-stone-100">{leaderboard.totals.institutions}</div>
                      <div className="text-xs text-stone-500">Institutions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{leaderboard.totals.total_cycles}</div>
                      <div className="text-xs text-stone-500">Total Cycles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{leaderboard.totals.completed_cycles}</div>
                      <div className="text-xs text-stone-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{leaderboard.totals.problems_identified}</div>
                      <div className="text-xs text-stone-500">Problems Found</div>
                    </div>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-700">
                          <th className="text-left py-3 px-2 text-stone-400 font-medium">Rank</th>
                          <th className="text-left py-3 px-2 text-stone-400 font-medium">Institution</th>
                          <th className="text-center py-3 px-2 text-stone-400 font-medium">Cycles</th>
                          <th className="text-center py-3 px-2 text-stone-400 font-medium">Completed</th>
                          <th className="text-center py-3 px-2 text-stone-400 font-medium">Problems</th>
                          <th className="text-center py-3 px-2 text-stone-400 font-medium">Saved</th>
                          <th className="text-center py-3 px-2 text-stone-400 font-medium">Validated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.leaderboard.map((entry, index) => (
                          <tr
                            key={entry.id}
                            className={`border-b border-stone-800 ${index < 3 ? 'bg-stone-800/30' : ''}`}
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                {index === 0 && <Medal className="h-5 w-5 text-yellow-400" />}
                                {index === 1 && <Medal className="h-5 w-5 text-gray-300" />}
                                {index === 2 && <Medal className="h-5 w-5 text-amber-600" />}
                                {index > 2 && <span className="text-stone-500 w-5 text-center">{index + 1}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium text-stone-100">{entry.short_name}</div>
                                <div className="text-xs text-stone-500 truncate max-w-[200px]">{entry.name}</div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center text-stone-300">{entry.total_cycles}</td>
                            <td className="py-3 px-2 text-center">
                              <span className="text-green-400">{entry.completed_cycles}</span>
                              <span className="text-stone-600">/{entry.total_cycles}</span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="font-semibold text-amber-400">{entry.problems_identified}</span>
                            </td>
                            <td className="py-3 px-2 text-center text-blue-400">{entry.problems_saved}</td>
                            <td className="py-3 px-2 text-center">
                              {entry.problems_validated > 0 ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {entry.problems_validated}
                                </Badge>
                              ) : (
                                <span className="text-stone-600">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Submit Form */}
      {showQuickSubmit && (
        <Card className="glass-card border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-stone-100 flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-400" />
              Quick Submit Problem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Problem Title *
              </label>
              <Input
                value={quickSubmitData.title}
                onChange={(e) => setQuickSubmitData(d => ({ ...d, title: e.target.value }))}
                placeholder="Brief title describing the problem..."
                className="bg-stone-800 border-stone-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                Problem Statement *
              </label>
              <textarea
                value={quickSubmitData.problem_statement}
                onChange={(e) => setQuickSubmitData(d => ({ ...d, problem_statement: e.target.value }))}
                placeholder="Describe the problem in detail..."
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-stone-800 border border-stone-700 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Theme
                </label>
                <Select
                  value={quickSubmitData.theme}
                  onValueChange={(value) => setQuickSubmitData(d => ({ ...d, theme: value }))}
                >
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROBLEM_THEMES).map(([key, { label, emoji }]) => (
                      <SelectItem key={key} value={key}>
                        {emoji} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Who is affected?
                </label>
                <Input
                  value={quickSubmitData.who_affected}
                  onChange={(e) => setQuickSubmitData(d => ({ ...d, who_affected: e.target.value }))}
                  placeholder="e.g., Hospital staff, Students..."
                  className="bg-stone-800 border-stone-700"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleQuickSubmit}
                disabled={quickSubmitting}
                className="bg-amber-500 text-stone-900 hover:bg-amber-400"
              >
                {quickSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Problem
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQuickSubmit(false)}
                className="border-stone-700 text-stone-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                placeholder="Search problems by name, content, or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-stone-800 border-stone-700"
              />
            </div>
            {search && (
              <Button
                variant="outline"
                onClick={() => setSearch('')}
                className="border-stone-700 text-stone-300"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-stone-800 border border-stone-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-stone-700">
            All Problems ({allCycles.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="data-[state=active]:bg-stone-700">
            In Progress ({cyclesData.in_progress.length})
          </TabsTrigger>
          <TabsTrigger value="eligible" className="data-[state=active]:bg-stone-700">
            Ready to Save ({cyclesData.eligible.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-stone-700">
            Saved ({cyclesData.saved.length})
          </TabsTrigger>
        </TabsList>

        {/* All Problems Tab */}
        <TabsContent value="all" className="mt-4">
          <CyclesList
            cycles={filterCycles(allCycles)}
            loading={cyclesLoading}
            savingCycleId={savingCycleId}
            onSave={saveCycleToProblemBank}
            getStepLabel={getStepLabel}
            getStepColor={getStepColor}
            emptyMessage="No problem statements found. Cycles will appear here once learners define their problems."
          />
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="mt-4">
          <CyclesList
            cycles={filterCycles(cyclesData.in_progress)}
            loading={cyclesLoading}
            savingCycleId={savingCycleId}
            onSave={saveCycleToProblemBank}
            getStepLabel={getStepLabel}
            getStepColor={getStepColor}
            emptyMessage="No cycles in progress. Problems appear here when learners are still working on their cycles."
          />
        </TabsContent>

        {/* Ready to Save Tab */}
        <TabsContent value="eligible" className="mt-4">
          {cyclesData.eligible.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-stone-400">
                {cyclesData.eligible.length} problem{cyclesData.eligible.length !== 1 ? 's' : ''} ready to save
              </p>
              <Button
                onClick={saveAllEligible}
                disabled={bulkSaving}
                className="bg-amber-500 text-stone-900 hover:bg-amber-400"
              >
                {bulkSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving {bulkProgress.current}/{bulkProgress.total}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Save All {cyclesData.eligible.length} to Bank
                  </>
                )}
              </Button>
            </div>
          )}
          <CyclesList
            cycles={filterCycles(cyclesData.eligible)}
            loading={cyclesLoading}
            savingCycleId={savingCycleId}
            onSave={saveCycleToProblemBank}
            getStepLabel={getStepLabel}
            getStepColor={getStepColor}
            showSaveButton
            emptyMessage="No cycles ready to save. Cycles at Impact Discovery stage or beyond will appear here."
          />
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved" className="mt-4">
          <SavedProblemsSection
            problems={problems}
            loading={loading}
            error={error}
            search={search}
            theme={theme}
            status={status}
            validationStatus={validationStatus}
            page={page}
            totalPages={totalPages}
            total={total}
            setTheme={setTheme}
            setStatus={setStatus}
            setValidationStatus={setValidationStatus}
            setPage={setPage}
            handleFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Cycles List Component
function CyclesList({
  cycles,
  loading,
  savingCycleId,
  onSave,
  getStepLabel,
  getStepColor,
  showSaveButton = false,
  emptyMessage,
}: {
  cycles: CycleData[];
  loading: boolean;
  savingCycleId: string | null;
  onSave: (id: string) => void;
  getStepLabel: (step: number) => string;
  getStepColor: (step: number) => string;
  showSaveButton?: boolean;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center py-12">
          <Database className="h-12 w-12 text-stone-500 mx-auto mb-4" />
          <p className="text-stone-400">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {cycles.map((cycle) => (
        <Card
          key={cycle.id}
          className="glass-card hover:ring-1 hover:ring-stone-600 transition-all"
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {cycle.theme && PROBLEM_THEMES[cycle.theme as keyof typeof PROBLEM_THEMES] && (
                    <span className={`text-sm ${PROBLEM_THEMES[cycle.theme as keyof typeof PROBLEM_THEMES].color}`}>
                      {PROBLEM_THEMES[cycle.theme as keyof typeof PROBLEM_THEMES].emoji}
                    </span>
                  )}
                  <h3 className="font-semibold text-stone-100">
                    {cycle.name}
                  </h3>
                  <Badge variant="outline" className={getStepColor(cycle.current_step)}>
                    {getStepLabel(cycle.current_step)}
                  </Badge>
                  {cycle.theme && PROBLEM_THEMES[cycle.theme as keyof typeof PROBLEM_THEMES] && (
                    <Badge variant="outline" className={`${PROBLEM_THEMES[cycle.theme as keyof typeof PROBLEM_THEMES].color} border-current/30`}>
                      {PROBLEM_THEMES[cycle.theme as keyof typeof PROBLEM_THEMES].label}
                    </Badge>
                  )}
                  {cycle.is_saved && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Saved
                    </Badge>
                  )}
                </div>
                <p className="text-stone-300 mb-3">
                  {cycle.problem_preview}
                </p>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {cycle.user_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(cycle.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/cycle/${cycle.id}`} target="_blank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-stone-400 hover:text-stone-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                {(showSaveButton || cycle.is_eligible) && !cycle.is_saved && (
                  <Button
                    size="sm"
                    onClick={() => onSave(cycle.id)}
                    disabled={savingCycleId === cycle.id}
                    className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                  >
                    {savingCycleId === cycle.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Saved Problems Section (with filters)
function SavedProblemsSection({
  problems,
  loading,
  error,
  search,
  theme,
  status,
  validationStatus,
  page,
  totalPages,
  total,
  setTheme,
  setStatus,
  setValidationStatus,
  setPage,
  handleFilterChange,
}: {
  problems: ProblemCardData[];
  loading: boolean;
  error: string | null;
  search: string;
  theme: ProblemTheme | 'all';
  status: ProblemStatus | 'all';
  validationStatus: ValidationStatus | 'all';
  page: number;
  totalPages: number;
  total: number;
  setTheme: (t: ProblemTheme | 'all') => void;
  setStatus: (s: ProblemStatus | 'all') => void;
  setValidationStatus: (v: ValidationStatus | 'all') => void;
  setPage: (p: number | ((prev: number) => number)) => void;
  handleFilterChange: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
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

            <Button
              variant="outline"
              onClick={() => {
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
            <h3 className="text-lg font-medium text-stone-100">No saved problems yet</h3>
            <p className="text-stone-400 mt-2">
              {search || theme !== 'all' || status !== 'all' || validationStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Save eligible cycles from the "Ready to Save" tab to add them here'
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
        <div className="flex items-start justify-between mb-3">
          {themeInfo && (
            <span className={`text-sm ${themeInfo.color}`}>
              {themeInfo.emoji} {themeInfo.label}
            </span>
          )}
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        <h3 className="text-lg font-semibold text-stone-100 line-clamp-2 mb-2">
          {problem.title}
        </h3>

        <p className="text-sm text-stone-400 line-clamp-3 mb-4">
          {problem.problem_statement}
        </p>

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
