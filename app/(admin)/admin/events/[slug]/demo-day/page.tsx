'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveBadge } from '@/components/ui/live-badge';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusLight } from '@/components/ui/status-light';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  ArrowLeft,
  LayoutGrid,
  Trophy,
  Sparkles,
  Presentation,
  RefreshCw,
  Loader2,
  Users,
  CheckCircle2,
  Vote,
  Timer,
  Activity,
  AlertTriangle,
  Eye,
  Clock,
  ChevronRight,
  MapPin,
  Gavel,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  TrackDrilldown,
  LeaderboardView,
  GlobalControls,
  AIAssistant,
} from '@/components/admin/demo-day';
import type {
  DemoDayState,
  TrackSubmission,
  LeaderboardEntry,
  TrackOverview,
} from '@/lib/admin/demo-day/types';
import type {
  JudgeActivity,
  JudgeScorePattern,
} from '@/lib/admin/demo-day/command-center-types';
import { cn } from '@/lib/utils';

// NASA Mission Control Track Card
function MissionControlTrackCard({
  track,
  onSelect,
  isSelected,
}: {
  track: TrackOverview;
  onSelect: (trackId: string) => void;
  isSelected?: boolean;
}) {
  // Determine track status for status light
  const getTrackHealth = (): 'success' | 'warning' | 'error' | 'inactive' => {
    if (!track.is_active) return 'inactive';
    if (track.status === 'delayed') return 'warning';
    if (track.status === 'completed') return 'success';
    if (track.pending_count > track.completed_count * 2) return 'warning';
    return 'success';
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-[#0b6d41]/50 bg-zinc-900/50 border-zinc-800',
        isSelected && 'border-[#0b6d41] ring-1 ring-[#0b6d41]/50'
      )}
      onClick={() => onSelect(track.id)}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusLight status={getTrackHealth()} pulse={track.is_active} />
            <div>
              <h3 className="font-semibold text-zinc-100">{track.name}</h3>
              {track.room_location && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="w-3 h-3" />
                  {track.room_location}
                </div>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              track.status === 'in-progress' && 'bg-green-500/10 text-green-400 border-green-500/30',
              track.status === 'completed' && 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              track.status === 'delayed' && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              track.status === 'paused' && 'bg-orange-500/10 text-orange-400 border-orange-500/30',
              !['in-progress', 'completed', 'delayed', 'paused'].includes(track.status) && 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
            )}
          >
            {track.status.replace('-', ' ')}
          </Badge>
        </div>

        {/* Progress Ring + Stats */}
        <div className="flex items-center gap-4">
          <ProgressRing
            value={track.completed_count}
            max={track.total_submissions}
            size={80}
            strokeWidth={8}
            color="jkkn"
            label="done"
          />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded bg-zinc-800/50">
              <div className="text-lg font-bold text-amber-400">{track.pending_count}</div>
              <div className="text-[10px] text-zinc-500 uppercase">Pending</div>
            </div>
            <div className="text-center p-2 rounded bg-zinc-800/50">
              <div className="text-lg font-bold text-green-400">{track.presenting_count}</div>
              <div className="text-[10px] text-zinc-500 uppercase">Live</div>
            </div>
            <div className="text-center p-2 rounded bg-zinc-800/50">
              <div className="text-lg font-bold text-blue-400">{track.completed_count}</div>
              <div className="text-[10px] text-zinc-500 uppercase">Done</div>
            </div>
            <div className="text-center p-2 rounded bg-zinc-800/50">
              <div className="text-lg font-bold text-zinc-400">{track.skipped_count}</div>
              <div className="text-[10px] text-zinc-500 uppercase">Skip</div>
            </div>
          </div>
        </div>

        {/* Current Presenter */}
        {track.current_presenter && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 font-medium mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              NOW PRESENTING
            </div>
            <div className="text-sm text-zinc-100 font-medium truncate">
              {track.current_presenter.app_name}
            </div>
            <div className="text-xs text-zinc-400">
              #{track.current_presenter.submission_number} - Slot {track.current_presenter.demo_slot}
            </div>
          </div>
        )}

        {/* Judges Row */}
        <div className="mt-4 flex items-center gap-2">
          <Gavel className="w-4 h-4 text-zinc-500" />
          <div className="flex items-center gap-1 flex-wrap">
            {track.judges.length > 0 ? (
              <>
                <span className="text-xs text-zinc-400">{track.judges.length} judges</span>
                {track.judges.filter(j => j.is_lead).length > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                    Lead assigned
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-xs text-red-400">No judges</span>
            )}
          </div>
        </div>

        {/* Manage Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4 border-zinc-700 hover:bg-[#0b6d41]/20 hover:border-[#0b6d41]/50 hover:text-[#0b6d41]"
        >
          Manage Track
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Judge Activity Monitor Side Panel
function JudgeActivityMonitor({ judgeActivities }: { judgeActivities: JudgeActivity[] }) {
  const formatLastActivity = (activity: JudgeActivity): string => {
    if (activity.status === 'never-scored') return 'No scores';
    if (activity.minutes_since_last_activity === null) return 'Unknown';
    const mins = activity.minutes_since_last_activity;
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const getStatusLight = (status: JudgeActivity['status']): 'success' | 'warning' | 'error' | 'inactive' => {
    switch (status) {
      case 'active': return 'success';
      case 'idle': return 'warning';
      case 'inactive': return 'error';
      case 'never-scored': return 'inactive';
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Judge Activity Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
        {judgeActivities.length === 0 ? (
          <div className="text-center py-4 text-zinc-500 text-sm">
            No judges assigned yet
          </div>
        ) : (
          judgeActivities.slice(0, 10).map((activity) => (
            <div
              key={`${activity.judge_id}-${activity.track_id}`}
              className="flex items-center justify-between p-2 rounded bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <StatusLight
                  status={getStatusLight(activity.status)}
                  size="sm"
                />
                <div>
                  <div className="text-xs text-zinc-100 flex items-center gap-1">
                    {activity.judge_name || activity.judge_email.split('@')[0]}
                    {activity.is_lead && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">
                        Lead
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {activity.track_name} &middot; {activity.total_scores_submitted} scored
                  </div>
                </div>
              </div>
              <div className={cn(
                "text-[10px]",
                activity.status === 'active' ? 'text-green-400' :
                activity.status === 'idle' ? 'text-amber-400' :
                activity.status === 'inactive' ? 'text-red-400' :
                'text-zinc-500'
              )}>
                {formatLastActivity(activity)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Score Anomaly Detection Side Panel
function ScoreAnomalyDetection({ scorePatterns }: { scorePatterns: JudgeScorePattern[] }) {
  const anomalies = scorePatterns.filter(p => p.is_anomaly);
  const hasAnomalies = anomalies.length > 0;
  const hasAnyScores = scorePatterns.length > 0;

  return (
    <Card className={cn(
      "bg-zinc-900/50 border-zinc-800",
      hasAnomalies && "border-amber-500/30"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
          <AlertTriangle className={cn("w-4 h-4", hasAnomalies ? "text-amber-400" : "text-zinc-500")} />
          Score Anomaly Detection
          {hasAnomalies && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
              {anomalies.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[250px] overflow-y-auto">
        {!hasAnyScores ? (
          <div className="text-center py-4 text-zinc-500 text-sm flex flex-col items-center gap-2">
            <Clock className="w-6 h-6 text-zinc-600" />
            No scoring data yet
          </div>
        ) : anomalies.length === 0 ? (
          <div className="text-center py-4 text-zinc-500 text-sm flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            No anomalies detected
          </div>
        ) : (
          anomalies.map((anomaly) => (
            <div
              key={`${anomaly.judge_id}-${anomaly.track_name}`}
              className="p-2 rounded bg-amber-500/10 border border-amber-500/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-amber-400 font-medium">
                    {anomaly.judge_name || anomaly.judge_email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-zinc-400">{anomaly.track_name}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">{anomaly.anomaly_reason}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">
                    Avg: {anomaly.avg_score.toFixed(1)} | Range: {anomaly.min_score.toFixed(0)}-{anomaly.max_score.toFixed(0)} | {anomaly.scores_given} scored
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-amber-400 hover:bg-amber-500/20">
                  <Eye className="w-3 h-3 mr-1" />
                  Review
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function EventDemoDayPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [state, setState] = useState<DemoDayState | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackSubmissions, setTrackSubmissions] = useState<TrackSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tracks' | 'leaderboard'>('tracks');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [judgeActivities, setJudgeActivities] = useState<JudgeActivity[]>([]);
  const [scorePatterns, setScorePatterns] = useState<JudgeScorePattern[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchState = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/demo-day');
      const data = await response.json();
      if (data.data) {
        setState(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch state:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchTrackSubmissions = useCallback(async (trackId: string) => {
    setIsTrackLoading(true);
    try {
      const response = await fetch(`/api/admin/demo-day/tracks/${trackId}`);
      const data = await response.json();
      if (data.data) {
        setTrackSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch track submissions:', error);
    } finally {
      setIsTrackLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/demo-day/leaderboard');
      const data = await response.json();
      if (data.data) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, []);

  const fetchCommandCenterData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/demo-day/command-center');
      const data = await response.json();
      if (data.data) {
        setJudgeActivities(data.data.judge_activities || []);
        setScorePatterns(data.data.score_patterns || []);
      }
    } catch (error) {
      console.error('Failed to fetch command center data:', error);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchLeaderboard();
    fetchCommandCenterData();
  }, [fetchState, fetchLeaderboard, fetchCommandCenterData]);

  useEffect(() => {
    if (selectedTrack) {
      fetchTrackSubmissions(selectedTrack);
    }
  }, [selectedTrack, fetchTrackSubmissions]);

  // Auto-refresh every 30 seconds when live
  useEffect(() => {
    if (state?.is_live) {
      const interval = setInterval(() => {
        fetchState();
        if (selectedTrack) {
          fetchTrackSubmissions(selectedTrack);
        }
        fetchLeaderboard();
        fetchCommandCenterData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [state?.is_live, selectedTrack, fetchState, fetchTrackSubmissions, fetchLeaderboard, fetchCommandCenterData]);

  const handleRefresh = () => {
    fetchState(true);
    if (selectedTrack) {
      fetchTrackSubmissions(selectedTrack);
    }
    fetchLeaderboard();
    fetchCommandCenterData();
  };

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrack(trackId);
  };

  const handleBackToOverview = () => {
    setSelectedTrack(null);
  };

  const handleAdvancePresenter = async (submissionId?: string) => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/advance-presenter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, submission_id: submissionId }),
    });
  };

  const handleSkipTeam = async (submissionId: string, reason?: string) => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/skip-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, submission_id: submissionId, reason }),
    });
  };

  const handleMoveToEnd = async (submissionId: string) => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/move-to-end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, submission_id: submissionId }),
    });
  };

  const handleCloseTrack = async () => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/close-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack }),
    });
    handleRefresh();
  };

  const handleReopenTrack = async () => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/close-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, action: 'reopen' }),
    });
    handleRefresh();
  };

  const handleCloseAllTracks = async () => {
    if (!state) return;
    for (const track of state.tracks.filter(t => t.is_active)) {
      await fetch('/api/admin/demo-day/close-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: track.id }),
      });
    }
    handleRefresh();
  };

  const handleExport = async (trackId?: string) => {
    setIsExporting(true);
    try {
      const url = trackId
        ? `/api/admin/demo-day/export-results?track_id=${trackId}`
        : '/api/admin/demo-day/export-results';
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${slug}-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedTrackData = state?.tracks.find(t => t.id === selectedTrack);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[#0b6d41] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-zinc-400">Failed to load Demo Day data</p>
          <Button onClick={() => fetchState()} className="mt-4 bg-[#0b6d41] hover:bg-[#0b6d41]/80">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = state.total_submissions > 0
    ? Math.round((state.total_completed / state.total_submissions) * 100)
    : 0;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* ===== COMMAND CENTER HEADER ===== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {selectedTrack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToOverview}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          ) : (
            <Link href={`/admin/events/${slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Event Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Center Title with LIVE badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">
            Demo Day Command Center
          </h1>
          {state.is_live ? (
            <LiveBadge variant="live" size="md" />
          ) : state.results_revealed ? (
            <LiveBadge variant="paused" label="REVEALED" size="md" />
          ) : (
            <LiveBadge variant="offline" label="STANDBY" size="md" />
          )}
        </div>

        {/* Right side - Time and Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <Link href={`/admin/events/${slug}/demo-day/backup-sheets`}>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            >
              <Presentation className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Backup</span>
            </Button>
          </Link>
          <Link href={`/admin/events/${slug}/demo-day/content-generator`}>
            <Button
              variant="outline"
              size="sm"
              className="border-[#0b6d41]/50 text-[#0b6d41] hover:bg-[#0b6d41]/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">AI Content</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-zinc-700"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* ===== GLOBAL STATS BAR ===== */}
      {!selectedTrack && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            icon={Presentation}
            value={state.total_submissions}
            label="Total Demos"
            variant="default"
            size="sm"
          />
          <MetricCard
            icon={CheckCircle2}
            value={`${state.total_completed}`}
            label={`Completed (${progressPercent}%)`}
            variant="success"
            size="sm"
          />
          <MetricCard
            icon={Timer}
            value={state.total_submissions - state.total_completed}
            label="In Progress"
            variant="warning"
            size="sm"
          />
          <MetricCard
            icon={Users}
            value={state.total_judges}
            label="Active Judges"
            variant="info"
            size="sm"
          />
          <MetricCard
            icon={Vote}
            value={state.total_votes.toLocaleString()}
            label="Audience Votes"
            variant="default"
            size="sm"
          />
          <MetricCard
            icon={TrendingUp}
            value={`${state.tracks.filter(t => t.is_active).length}/${state.tracks.length}`}
            label="Tracks Active"
            variant="jkkn"
            size="sm"
          />
        </div>
      )}

      {/* ===== GLOBAL CONTROLS & AI ASSISTANT ===== */}
      {!selectedTrack && (
        <>
          <GlobalControls
            state={state}
            onCloseAllTracks={handleCloseAllTracks}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          <AIAssistant state={state} onRefresh={handleRefresh} />
        </>
      )}

      {/* ===== MAIN CONTENT ===== */}
      {selectedTrack && selectedTrackData ? (
        <TrackDrilldown
          track={selectedTrackData}
          submissions={trackSubmissions}
          isLoading={isTrackLoading}
          onAdvancePresenter={handleAdvancePresenter}
          onSkipTeam={handleSkipTeam}
          onMoveToEnd={handleMoveToEnd}
          onCloseTrack={handleCloseTrack}
          onReopenTrack={handleReopenTrack}
          onRefresh={() => {
            fetchTrackSubmissions(selectedTrack);
            fetchState();
          }}
        />
      ) : (
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Main Content Area - 3 columns */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="bg-zinc-800/50 border border-zinc-700">
                <TabsTrigger
                  value="tracks"
                  className="data-[state=active]:bg-[#0b6d41] data-[state=active]:text-white"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Tracks Overview
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="data-[state=active]:bg-[#0b6d41] data-[state=active]:text-white"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tracks" className="mt-4">
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {state.tracks.map((track) => (
                    <MissionControlTrackCard
                      key={track.id}
                      track={track}
                      onSelect={handleSelectTrack}
                      isSelected={selectedTrack === track.id}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-4">
                <LeaderboardView
                  entries={leaderboard}
                  tracks={state.tracks}
                  isLoading={false}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Side Panel - 1 column */}
          <div className="space-y-4">
            <JudgeActivityMonitor judgeActivities={judgeActivities} />
            <ScoreAnomalyDetection scorePatterns={scorePatterns} />
          </div>
        </div>
      )}
    </div>
  );
}
