'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  FileText,
  Sparkles,
  CheckCircle,
  Target,
  Lightbulb,
  Eye,
} from 'lucide-react';
import type { FlywheelSummary as FlywheelSummaryType } from '@/lib/types/problem-bank';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}

function MetricCard({ label, value, subtitle, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-stone-100">{value}</p>
          {subtitle && <p className="text-xs text-stone-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function FlywheelSummary() {
  const [summary, setSummary] = useState<FlywheelSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/flywheel/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/flywheel/summary', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh metrics');
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercent = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0%';
    return `${Math.round(num * 100)}%`;
  };

  const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '₹0';
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num}`;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl text-stone-100">
            <TrendingUp className="h-6 w-6 text-amber-400" />
            Learning Flywheel Summary
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-stone-700"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!summary ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-stone-600 mx-auto mb-3" />
            <p className="text-stone-400">No flywheel data available yet</p>
            <p className="text-stone-500 text-sm mt-1">
              Record problem outcomes to see summary metrics
            </p>
          </div>
        ) : (
          <>
            {/* Problems & Outcomes */}
            <div>
              <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
                Problems & Outcomes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Problems"
                  value={formatNumber(summary.total_problems)}
                  icon={Lightbulb}
                  color="bg-amber-500/20 text-amber-400"
                />
                <MetricCard
                  label="With Outcomes"
                  value={formatNumber(summary.problems_with_outcomes)}
                  subtitle={formatPercent(summary.outcome_rate)}
                  icon={Target}
                  color="bg-blue-500/20 text-blue-400"
                />
                <MetricCard
                  label="Success Rate"
                  value={formatPercent(summary.success_rate)}
                  icon={CheckCircle}
                  color="bg-green-500/20 text-green-400"
                />
                <MetricCard
                  label="Avg Solution Time"
                  value={summary.average_solution_time_days ? `${summary.average_solution_time_days}d` : 'N/A'}
                  icon={Clock}
                  color="bg-purple-500/20 text-purple-400"
                />
              </div>
            </div>

            {/* Impact Metrics */}
            <div>
              <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
                Impact Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="Users Impacted"
                  value={formatNumber(summary.total_users_impacted)}
                  icon={Users}
                  color="bg-blue-500/20 text-blue-400"
                />
                <MetricCard
                  label="Hours Saved"
                  value={formatNumber(summary.total_time_saved_hours)}
                  icon={Clock}
                  color="bg-green-500/20 text-green-400"
                />
                <MetricCard
                  label="Cost Saved"
                  value={formatCurrency(summary.total_cost_saved)}
                  icon={DollarSign}
                  color="bg-yellow-500/20 text-yellow-400"
                />
                <MetricCard
                  label="Revenue Generated"
                  value={formatCurrency(summary.total_revenue_generated)}
                  icon={TrendingUp}
                  color="bg-orange-500/20 text-orange-400"
                />
              </div>
            </div>

            {/* Case Studies */}
            <div>
              <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
                Case Studies
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard
                  label="Total Case Studies"
                  value={formatNumber(summary.total_case_studies)}
                  icon={FileText}
                  color="bg-purple-500/20 text-purple-400"
                />
                <MetricCard
                  label="Published"
                  value={formatNumber(summary.published_case_studies)}
                  icon={CheckCircle}
                  color="bg-green-500/20 text-green-400"
                />
                <MetricCard
                  label="Total Views"
                  value={formatNumber(summary.total_case_study_views)}
                  icon={Eye}
                  color="bg-blue-500/20 text-blue-400"
                />
              </div>
            </div>

            {/* AI Refinements */}
            <div>
              <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
                AI Refinements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard
                  label="Total Refinements"
                  value={formatNumber(summary.total_refinements)}
                  icon={Sparkles}
                  color="bg-purple-500/20 text-purple-400"
                />
                <MetricCard
                  label="Accepted"
                  value={formatNumber(summary.refinements_accepted)}
                  icon={CheckCircle}
                  color="bg-green-500/20 text-green-400"
                />
                <MetricCard
                  label="Acceptance Rate"
                  value={formatPercent(summary.refinement_acceptance_rate)}
                  icon={TrendingUp}
                  color="bg-amber-500/20 text-amber-400"
                />
              </div>
            </div>

            {/* Learning Patterns */}
            <div>
              <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mb-3">
                Learning Patterns
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Total Patterns"
                  value={formatNumber(summary.total_patterns)}
                  icon={Lightbulb}
                  color="bg-amber-500/20 text-amber-400"
                />
                <MetricCard
                  label="Active Patterns"
                  value={formatNumber(summary.active_patterns)}
                  icon={Target}
                  color="bg-green-500/20 text-green-400"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
