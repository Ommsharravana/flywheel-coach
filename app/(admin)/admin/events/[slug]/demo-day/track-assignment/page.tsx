'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Sparkles,
  Check,
  X,
  RefreshCw,
  GitBranch,
  Wand2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackInfo {
  id: string;
  name: string;
  theme: string;
  submission_count: number;
}

interface Submission {
  id: string;
  submission_number: number;
  app_name: string;
  category: string | null;
  description: string | null;
  user_name: string | null;
  institution: string | null;
  current_track_id: string | null;
  current_track_name: string | null;
}

interface TrackSuggestion {
  submission_id: string;
  suggested_track_id: string;
  suggested_track_name: string;
  suggested_theme: string;
  confidence: number;
  reasoning: string;
  current_track_id: string | null;
  current_track_name?: string | null;
  needs_change: boolean;
}

interface AIAssignmentResult {
  suggestions: TrackSuggestion[];
  track_stats: TrackInfo[];
  total_processed: number;
  high_confidence_count: number;
  needs_review_count: number;
}

interface CurrentState {
  submissions: Submission[];
  tracks: TrackInfo[];
  total: number;
  assigned: number;
  unassigned: number;
}

export default function TrackAssignmentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [currentState, setCurrentState] = useState<CurrentState | null>(null);
  const [aiResult, setAIResult] = useState<AIAssignmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCurrentState = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/demo-day/ai-assign', { method: 'PUT' });
      const data = await response.json();
      if (data.data) {
        setCurrentState(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch current state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentState();
  }, [fetchCurrentState]);

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/demo-day/ai-assign');
      const data = await response.json();
      if (data.data) {
        setAIResult(data.data);
        // Pre-select high confidence suggestions
        const highConfidence = data.data.suggestions
          .filter((s: TrackSuggestion) => s.confidence >= 80)
          .map((s: TrackSuggestion) => s.submission_id);
        setSelectedSubmissions(new Set(highConfidence));
        setMessage({
          type: 'success',
          text: `Analyzed ${data.data.total_processed} submissions. ${data.data.high_confidence_count} high confidence, ${data.data.needs_review_count} need review.`,
        });
      }
    } catch (error) {
      console.error('Failed to run AI analysis:', error);
      setMessage({ type: 'error', text: 'Failed to run AI analysis' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySelectedAssignments = async () => {
    if (!aiResult || selectedSubmissions.size === 0) return;
    setIsApplying(true);
    setMessage(null);
    try {
      const assignments = aiResult.suggestions
        .filter((s) => selectedSubmissions.has(s.submission_id))
        .map((s) => ({
          submission_id: s.submission_id,
          track_id: s.suggested_track_id,
        }));

      const response = await fetch('/api/admin/demo-day/ai-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      const data = await response.json();
      if (data.data) {
        setMessage({
          type: 'success',
          text: `Applied ${data.data.applied} track assignments`,
        });
        // Refresh state
        setAIResult(null);
        setSelectedSubmissions(new Set());
        fetchCurrentState();
      }
    } catch (error) {
      console.error('Failed to apply assignments:', error);
      setMessage({ type: 'error', text: 'Failed to apply assignments' });
    } finally {
      setIsApplying(false);
    }
  };

  const applyAllHighConfidence = async () => {
    setIsApplying(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/demo-day/ai-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply_all_high_confidence: true }),
      });
      const data = await response.json();
      if (data.data) {
        setMessage({
          type: 'success',
          text: `Applied ${data.data.applied} high-confidence assignments`,
        });
        setAIResult(null);
        setSelectedSubmissions(new Set());
        fetchCurrentState();
      }
    } catch (error) {
      console.error('Failed to apply assignments:', error);
      setMessage({ type: 'error', text: 'Failed to apply assignments' });
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSubmissionSelection = (id: string) => {
    setSelectedSubmissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTrackExpansion = (trackId: string) => {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">High ({confidence}%)</Badge>;
    }
    if (confidence >= 60) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium ({confidence}%)</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Low ({confidence}%)</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/events/${slug}/demo-day`}>
            <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Command Center
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-amber-400" />
          Track Assignment
        </h1>
        <div className="w-40" /> {/* Spacer */}
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={cn(
            'p-4 rounded-lg border flex items-center gap-3',
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      {currentState && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4">
            <p className="text-stone-500 text-sm">Total Submissions</p>
            <p className="text-2xl font-bold text-stone-100">{currentState.total}</p>
          </div>
          <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4">
            <p className="text-stone-500 text-sm">Assigned</p>
            <p className="text-2xl font-bold text-green-400">{currentState.assigned}</p>
          </div>
          <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4">
            <p className="text-stone-500 text-sm">Unassigned</p>
            <p className="text-2xl font-bold text-amber-400">{currentState.unassigned}</p>
          </div>
          <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4">
            <p className="text-stone-500 text-sm">Tracks</p>
            <p className="text-2xl font-bold text-stone-100">{currentState.tracks.length}</p>
          </div>
        </div>
      )}

      {/* Track Distribution */}
      {currentState && (
        <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Track Distribution</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {currentState.tracks.map((track) => (
              <div
                key={track.id}
                className="bg-stone-900/50 border border-stone-600 rounded-lg p-3 text-center"
              >
                <p className="text-xs text-stone-500 truncate">{track.name}</p>
                <p className="text-xl font-bold text-stone-100">{track.submission_count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Track Assignment
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>
            {!aiResult && (
              <Button
                onClick={applyAllHighConfidence}
                disabled={isApplying}
                variant="outline"
                className="border-green-600/50 text-green-400 hover:bg-green-600/20"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Auto-Assign All (High Confidence)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {!aiResult ? (
          <div className="text-center py-12 text-stone-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Run AI analysis to get track suggestions based on app descriptions</p>
            <p className="text-sm mt-2">Or use "Auto-Assign All" to quickly assign high-confidence matches</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* AI Stats */}
            <div className="flex gap-4 text-sm">
              <span className="text-stone-400">
                Processed: <span className="text-stone-100 font-semibold">{aiResult.total_processed}</span>
              </span>
              <span className="text-green-400">
                High Confidence: <span className="font-semibold">{aiResult.high_confidence_count}</span>
              </span>
              <span className="text-amber-400">
                Needs Review: <span className="font-semibold">{aiResult.needs_review_count}</span>
              </span>
              <span className="text-stone-400">
                Selected: <span className="text-stone-100 font-semibold">{selectedSubmissions.size}</span>
              </span>
            </div>

            {/* Apply Button */}
            {selectedSubmissions.size > 0 && (
              <Button
                onClick={applySelectedAssignments}
                disabled={isApplying}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Apply {selectedSubmissions.size} Selected Assignments
                  </>
                )}
              </Button>
            )}

            {/* Suggestions by Track */}
            <div className="space-y-2 mt-4">
              {aiResult.track_stats.map((track) => {
                const trackSuggestions = aiResult.suggestions.filter(
                  (s) => s.suggested_track_id === track.id
                );
                const isExpanded = expandedTracks.has(track.id);

                return (
                  <div
                    key={track.id}
                    className="bg-stone-900/50 border border-stone-600 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleTrackExpansion(track.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-stone-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-stone-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-500" />
                        )}
                        <span className="font-medium text-stone-100">{track.name}</span>
                        <Badge className="bg-stone-700 text-stone-300">
                          {trackSuggestions.length} suggestions
                        </Badge>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-stone-700 divide-y divide-stone-700">
                        {trackSuggestions.map((suggestion) => {
                          const submission = currentState?.submissions.find(
                            (s) => s.id === suggestion.submission_id
                          );
                          const isSelected = selectedSubmissions.has(suggestion.submission_id);

                          return (
                            <div
                              key={suggestion.submission_id}
                              className={cn(
                                'p-4 flex items-start justify-between',
                                isSelected && 'bg-amber-500/10'
                              )}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-stone-100">
                                    #{submission?.submission_number} - {submission?.app_name}
                                  </span>
                                  {getConfidenceBadge(suggestion.confidence)}
                                  {suggestion.needs_change && (
                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                      Reassignment
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-stone-500 mt-1">
                                  {submission?.user_name} • {submission?.institution}
                                </p>
                                <p className="text-sm text-stone-400 mt-2">{suggestion.reasoning}</p>
                                {suggestion.current_track_name && suggestion.needs_change && (
                                  <p className="text-xs text-amber-400 mt-1">
                                    Current: {suggestion.current_track_name} → Suggested: {track.name}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSubmissionSelection(suggestion.submission_id)}
                                  className={cn(
                                    isSelected
                                      ? 'text-green-400 hover:text-green-300'
                                      : 'text-stone-400 hover:text-stone-100'
                                  )}
                                >
                                  {isSelected ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unassigned Submissions */}
      {currentState && currentState.unassigned > 0 && (
        <div className="bg-stone-800/50 border border-amber-600/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Unassigned Submissions ({currentState.unassigned})
          </h2>
          <div className="space-y-2">
            {currentState.submissions
              .filter((s) => !s.current_track_id)
              .slice(0, 10)
              .map((sub) => (
                <div
                  key={sub.id}
                  className="bg-stone-900/50 border border-stone-600 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-stone-100">
                      #{sub.submission_number} - {sub.app_name}
                    </span>
                    <span className="text-stone-500 ml-2 text-sm">
                      {sub.category || 'No category'} • {sub.user_name}
                    </span>
                  </div>
                </div>
              ))}
            {currentState.unassigned > 10 && (
              <p className="text-stone-500 text-sm text-center pt-2">
                +{currentState.unassigned - 10} more unassigned submissions
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
