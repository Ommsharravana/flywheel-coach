'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  Users,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Play,
  AlertCircle,
} from 'lucide-react';
import {
  autoAssignSubmissions,
  getTrackAssignmentSummary,
  getEventJudges,
} from '@/lib/judge/admin-actions';
import type { DemoDayState } from '@/lib/admin/demo-day/types';

interface AIAssistantProps {
  state: DemoDayState;
  onRefresh: () => void;
}

interface Recommendation {
  id: string;
  type: 'action' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: () => Promise<void>;
  actionLabel?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TrackSummary {
  track_id: string;
  track_name: string;
  theme: string;
  assigned_count: number;
  pending_count: number;
  presenting_count: number;
  completed_count: number;
  skipped_count: number;
}

export function AIAssistant({ state, onRefresh }: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trackSummary, setTrackSummary] = useState<TrackSummary[]>([]);
  const [judgeCount, setJudgeCount] = useState(0);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Analyze the current state and generate recommendations
  const analyzeState = async () => {
    setIsAnalyzing(true);
    try {
      const [summaryResult, judgesResult] = await Promise.all([
        getTrackAssignmentSummary(),
        getEventJudges(),
      ]);

      setTrackSummary(summaryResult.tracks);
      setJudgeCount(judgesResult.judges.length);

      // Generate recommendations based on current state
      const recs: Recommendation[] = [];

      // Check if submissions are assigned to tracks
      const unassignedTracks = summaryResult.tracks.filter(t => t.assigned_count === 0);
      const totalAssigned = summaryResult.tracks.reduce((sum, t) => sum + t.assigned_count, 0);

      if (totalAssigned === 0) {
        recs.push({
          id: 'auto-assign-submissions',
          type: 'action',
          title: 'Auto-assign submissions to tracks',
          description: `No submissions assigned yet. Click to auto-assign all ${state.total_submissions} submissions based on their categories.`,
          action: handleAutoAssign,
          actionLabel: 'Auto-Assign All',
          priority: 'high',
        });
      } else if (unassignedTracks.length > 0) {
        recs.push({
          id: 'some-unassigned',
          type: 'warning',
          title: `${unassignedTracks.length} track(s) have no submissions`,
          description: `Tracks without submissions: ${unassignedTracks.map(t => t.theme).join(', ')}`,
          priority: 'medium',
        });
      }

      // Check judge coverage
      const tracksWithJudges = new Set(judgesResult.judges.map(j => j.track_theme));
      const tracksWithoutJudges = summaryResult.tracks.filter(t => !tracksWithJudges.has(t.theme));

      if (judgesResult.judges.length === 0) {
        recs.push({
          id: 'no-judges',
          type: 'warning',
          title: 'No judges assigned yet',
          description: 'Assign judges to tracks before Demo Day starts.',
          priority: 'high',
        });
      } else if (tracksWithoutJudges.length > 0) {
        recs.push({
          id: 'tracks-need-judges',
          type: 'warning',
          title: `${tracksWithoutJudges.length} track(s) need judges`,
          description: `Assign judges to: ${tracksWithoutJudges.map(t => t.theme).join(', ')}`,
          priority: 'high',
        });
      } else {
        recs.push({
          id: 'judges-ready',
          type: 'success',
          title: 'All tracks have judges',
          description: `${judgesResult.judges.length} judges assigned across ${tracksWithJudges.size} tracks.`,
          priority: 'low',
        });
      }

      // Demo Day live status
      if (state.is_live) {
        // Calculate progress and ETA
        const completionRate = state.total_completed / Math.max(state.total_submissions, 1);
        const remainingDemos = state.total_submissions - state.total_completed;

        if (completionRate > 0) {
          const avgTimePerDemo = 5; // 3 min demo + 2 min Q&A
          const estimatedMinutes = remainingDemos * avgTimePerDemo;
          const hours = Math.floor(estimatedMinutes / 60);
          const mins = estimatedMinutes % 60;

          recs.push({
            id: 'eta',
            type: 'info',
            title: `Estimated completion: ${hours > 0 ? `${hours}h ` : ''}${mins}m`,
            description: `${remainingDemos} demos remaining at ~5 min each.`,
            priority: 'medium',
          });
        }

        // Check for stuck tracks
        const stuckTracks = summaryResult.tracks.filter(t =>
          t.presenting_count > 0 && t.completed_count === 0
        );
        if (stuckTracks.length > 0) {
          recs.push({
            id: 'stuck-tracks',
            type: 'warning',
            title: 'Some tracks may be stuck',
            description: `${stuckTracks.map(t => t.theme).join(', ')} - demos in progress but none completed.`,
            priority: 'high',
          });
        }

      } else if (!state.results_revealed) {
        // Pre-event readiness check
        const isReady = judgesResult.judges.length > 0 &&
                       totalAssigned > 0 &&
                       tracksWithoutJudges.length === 0;

        if (isReady) {
          recs.push({
            id: 'ready',
            type: 'success',
            title: 'Ready for Demo Day! 🎉',
            description: `${totalAssigned} submissions assigned, ${judgesResult.judges.length} judges ready.`,
            priority: 'low',
          });
        } else {
          recs.push({
            id: 'not-ready',
            type: 'warning',
            title: 'Not ready for Demo Day',
            description: 'Complete the high-priority items above before starting.',
            priority: 'high',
          });
        }
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setRecommendations(recs);
      setLastAnalysis(new Date());
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeState();
  }, [state]);

  const handleAutoAssign = async () => {
    setActionInProgress('auto-assign-submissions');
    try {
      const result = await autoAssignSubmissions();
      if (result.success && result.stats) {
        // Show success message
        const newRec: Recommendation = {
          id: 'assign-result',
          type: 'success',
          title: 'Auto-assignment complete!',
          description: `Assigned ${result.stats.successful} submissions. ${result.stats.alreadyAssigned} already assigned. ${result.stats.failed} failed.`,
          priority: 'low',
        };
        setRecommendations(prev => [newRec, ...prev.filter(r => r.id !== 'auto-assign-submissions')]);
        onRefresh();
        analyzeState();
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'action': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTypeBg = (type: Recommendation['type']) => {
    switch (type) {
      case 'action': return 'bg-amber-500/10 border-amber-500/30';
      case 'warning': return 'bg-orange-500/10 border-orange-500/30';
      case 'success': return 'bg-green-500/10 border-green-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <Card className="glass-card border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            AI Admin Assistant
            <Badge variant="outline" className="ml-2 border-purple-500/50 text-purple-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeState}
              disabled={isAnalyzing}
              className="text-stone-400 hover:text-stone-100"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-stone-400 hover:text-stone-100"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {lastAnalysis && (
          <p className="text-xs text-stone-500 mt-1">
            Last analyzed: {lastAnalysis.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 text-center">
              <div className="text-lg font-bold text-stone-100">{judgeCount}</div>
              <div className="text-xs text-stone-500 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                Judges
              </div>
            </div>
            <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 text-center">
              <div className="text-lg font-bold text-stone-100">
                {trackSummary.reduce((sum, t) => sum + t.assigned_count, 0)}
              </div>
              <div className="text-xs text-stone-500 flex items-center justify-center gap-1">
                <Target className="w-3 h-3" />
                Assigned
              </div>
            </div>
            <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 text-center">
              <div className="text-lg font-bold text-stone-100">
                {trackSummary.reduce((sum, t) => sum + t.pending_count, 0)}
              </div>
              <div className="text-xs text-stone-500 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </div>
            </div>
            <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 text-center">
              <div className="text-lg font-bold text-stone-100">
                {trackSummary.reduce((sum, t) => sum + t.completed_count, 0)}
              </div>
              <div className="text-xs text-stone-500 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Scored
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-stone-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Recommendations
            </div>

            {isAnalyzing ? (
              <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-stone-400">Analyzing event state...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-400">All systems ready!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-3 rounded-lg border ${getTypeBg(rec.type)} transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getTypeIcon(rec.type)}</div>
                        <div>
                          <div className="text-sm font-medium text-stone-100">{rec.title}</div>
                          <div className="text-xs text-stone-400 mt-0.5">{rec.description}</div>
                        </div>
                      </div>
                      {rec.action && (
                        <Button
                          size="sm"
                          onClick={rec.action}
                          disabled={actionInProgress === rec.id}
                          className="bg-amber-600 hover:bg-amber-700 shrink-0"
                        >
                          {actionInProgress === rec.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          {rec.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Track Health Overview */}
          {trackSummary.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-stone-400">Track Health</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {trackSummary.map((track) => {
                  const total = track.assigned_count;
                  const completed = track.completed_count;
                  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div
                      key={track.track_id}
                      className="p-3 rounded-lg bg-stone-800/50 border border-stone-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-300 truncate">{track.theme}</span>
                        <span className="text-xs text-stone-500">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-stone-500">
                        <span>{track.assigned_count} demos</span>
                        <span>{completed} scored</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
