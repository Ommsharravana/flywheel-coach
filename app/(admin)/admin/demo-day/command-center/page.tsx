'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Radio,
  LayoutGrid,
  Users,
  BarChart3,
  Bell,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  JudgeActivityMonitor,
  ScoreAnomalyDetection,
  AlertsPanel,
  CommandCenterTrackCard,
} from '@/components/admin/demo-day/command-center';
import type {
  CommandCenterState,
  JudgeActivity,
  JudgeScorePattern,
  CommandCenterAlert,
} from '@/lib/admin/demo-day/command-center-types';
import { cn } from '@/lib/utils';

export default function CommandCenterPage() {
  const [state, setState] = useState<CommandCenterState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchState = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/demo-day/command-center');
      const data = await response.json();
      if (data.success && data.data) {
        setState(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch command center state:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Auto-refresh every 15 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchState();
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchState]);

  const handleRefresh = () => {
    fetchState(true);
  };

  const handlePingJudge = (judge: JudgeActivity) => {
    // In a real implementation, this would send a notification to the judge
    console.log('Pinging judge:', judge.judge_email);
    // Could integrate with WhatsApp, email, or in-app notification
    alert(`Notification sent to ${judge.judge_name || judge.judge_email}`);
  };

  const handleReviewAnomaly = (pattern: JudgeScorePattern) => {
    // Navigate to judge's scores or open a modal
    console.log('Reviewing anomaly:', pattern);
  };

  const handleAlertAction = (alert: CommandCenterAlert) => {
    // Handle different alert types
    if (alert.track_id) {
      window.location.href = `/admin/demo-day?track=${alert.track_id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-400 mt-4">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-stone-400">Failed to load Command Center data</p>
          <Button onClick={() => fetchState()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isLive = state.tracks.some(t => t.status === 'in-progress');
  const criticalAlerts = state.alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/demo-day">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-400 hover:text-stone-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Demo Day
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-stone-100">
              Command Center
            </h1>
            {isLive && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            {criticalAlerts > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                <Bell className="w-3 h-3 mr-1" />
                {criticalAlerts} Critical
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-stone-500">
            {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'border-stone-700',
              autoRefresh && 'bg-green-500/20 border-green-500/30 text-green-400'
            )}
          >
            {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-stone-700"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Live Stats Banner */}
      <Card className={cn(
        'glass-card',
        isLive ? 'border-green-500/50 bg-green-500/5' : 'border-stone-700'
      )}>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-stone-100">{state.total_submissions}</div>
              <div className="text-xs text-stone-500">Total Apps</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">{state.total_completed}</div>
              <div className="text-xs text-stone-500">Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">{state.total_presenting}</div>
              <div className="text-xs text-stone-500">Presenting</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">{state.total_pending}</div>
              <div className="text-xs text-stone-500">Pending</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">{state.total_judges}</div>
              <div className="text-xs text-stone-500">Judges</div>
            </div>
            <div>
              <div className={cn(
                'text-3xl font-bold',
                state.overall_progress_percent >= 80 ? 'text-green-400' :
                state.overall_progress_percent >= 50 ? 'text-amber-400' : 'text-stone-100'
              )}>
                {state.overall_progress_percent}%
              </div>
              <div className="text-xs text-stone-500">Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Panel - Always visible if there are alerts */}
      {state.alerts.length > 0 && (
        <AlertsPanel
          alerts={state.alerts}
          onAction={handleAlertAction}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Track Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-amber-400" />
              Track Overview
            </h2>
            <Link href="/admin/demo-day">
              <Button variant="outline" size="sm" className="border-stone-700 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Full View
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {state.tracks.map((track) => (
              <CommandCenterTrackCard
                key={track.id}
                track={track}
                onSelect={(trackId) => {
                  window.location.href = `/admin/demo-day?track=${trackId}`;
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Judge Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-stone-100">Judge Activity</h2>
          </div>
          <JudgeActivityMonitor
            activities={state.judge_activities}
            totalJudges={state.total_judges}
            activeJudges={state.active_judges}
            inactiveJudges={state.inactive_judges}
            onPingJudge={handlePingJudge}
          />
        </div>
      </div>

      {/* Score Analysis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-stone-100">Score Analysis</h2>
        </div>
        <ScoreAnomalyDetection
          scorePatterns={state.score_patterns}
          trackDistributions={state.track_distributions}
          anomaliesDetected={state.anomalies_detected}
          onReviewAnomaly={handleReviewAnomaly}
        />
      </div>

      {/* Quick Actions Footer */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-stone-400">
              Command Center - Real-time monitoring for Demo Day operations
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/demo-day">
                <Button variant="outline" size="sm" className="border-stone-700">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Track Management
                </Button>
              </Link>
              <Link href="/results">
                <Button variant="outline" size="sm" className="border-stone-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Public Results
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
