'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  JudgeScorePattern,
  TrackScoreDistribution,
} from '@/lib/admin/demo-day/command-center-types';
import { cn } from '@/lib/utils';

interface ScoreAnomalyDetectionProps {
  scorePatterns: JudgeScorePattern[];
  trackDistributions: TrackScoreDistribution[];
  anomaliesDetected: number;
  onReviewAnomaly?: (pattern: JudgeScorePattern) => void;
}

export function ScoreAnomalyDetection({
  scorePatterns,
  trackDistributions,
  anomaliesDetected,
  onReviewAnomaly,
}: ScoreAnomalyDetectionProps) {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());

  const toggleTrack = (trackId: string) => {
    const newExpanded = new Set(expandedTracks);
    if (newExpanded.has(trackId)) {
      newExpanded.delete(trackId);
    } else {
      newExpanded.add(trackId);
    }
    setExpandedTracks(newExpanded);
  };

  const anomalies = scorePatterns.filter(p => p.is_anomaly);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Score Analysis & Anomalies
          </CardTitle>
          {anomaliesDetected > 0 && (
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {anomaliesDetected} Anomalies
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="anomalies" className="space-y-4">
          <TabsList className="bg-stone-800/50 border border-stone-700">
            <TabsTrigger
              value="anomalies"
              className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Anomalies ({anomalies.length})
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Distribution
            </TabsTrigger>
          </TabsList>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4">
            {anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((pattern) => (
                  <div
                    key={`${pattern.judge_id}-${pattern.track_name}`}
                    className="p-4 rounded-lg bg-red-500/5 border border-red-500/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="font-medium text-stone-100">
                            {pattern.judge_name || pattern.judge_email}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {pattern.track_name}
                          </Badge>
                        </div>
                        <p className="text-sm text-red-400">{pattern.anomaly_reason}</p>
                        <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
                          <span>Scores: {pattern.scores_given}</span>
                          <span>Avg: {pattern.avg_score.toFixed(1)}</span>
                          <span>Range: {pattern.min_score.toFixed(0)} - {pattern.max_score.toFixed(0)}</span>
                          <span>Std Dev: {pattern.std_dev.toFixed(2)}</span>
                        </div>
                      </div>
                      {onReviewAnomaly && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                          onClick={() => onReviewAnomaly(pattern)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>

                    {/* Score visualization */}
                    <div className="mt-3 pt-3 border-t border-red-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 w-12">Score:</span>
                        <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              pattern.all_max_scores
                                ? 'bg-green-500'
                                : pattern.all_min_scores
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                            )}
                            style={{ width: `${pattern.avg_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-400 w-12 text-right">
                          {pattern.avg_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500">
                <CheckIcon className="w-12 h-12 mx-auto mb-3 text-green-500/50" />
                <p>No scoring anomalies detected</p>
                <p className="text-xs mt-1">All judges are scoring within normal patterns</p>
              </div>
            )}
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            {trackDistributions.length > 0 ? (
              <div className="space-y-4">
                {trackDistributions.map((dist) => (
                  <div key={dist.track_id} className="space-y-3">
                    <button
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-stone-800/50 border border-stone-700 hover:border-stone-600 transition-colors"
                      onClick={() => toggleTrack(dist.track_id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-stone-100">{dist.track_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {dist.total_scores} scores
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-400">
                          Avg: {dist.avg_score.toFixed(1)} | Std: {dist.std_dev.toFixed(1)}
                        </span>
                        {expandedTracks.has(dist.track_id) ? (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>

                    {expandedTracks.has(dist.track_id) && (
                      <div className="p-4 rounded-lg bg-stone-800/30 border border-stone-700 space-y-4">
                        {/* Score Distribution Histogram */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-stone-400">Score Distribution</div>
                          <div className="space-y-2">
                            {dist.score_buckets.map((bucket) => (
                              <div key={bucket.range} className="flex items-center gap-3">
                                <span className="text-xs text-stone-500 w-12">{bucket.range}</span>
                                <div className="flex-1 h-4 bg-stone-800 rounded overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded"
                                    style={{ width: `${bucket.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-stone-400 w-16 text-right">
                                  {bucket.count} ({bucket.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Outliers */}
                        {dist.outliers.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-stone-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              Outliers ({'>'}2 std dev from mean)
                            </div>
                            <div className="grid gap-2">
                              {dist.outliers.slice(0, 5).map((outlier) => (
                                <div
                                  key={outlier.submission_id}
                                  className={cn(
                                    'flex items-center justify-between p-2 rounded text-sm',
                                    outlier.deviation_from_mean > 0
                                      ? 'bg-green-500/10 border border-green-500/20'
                                      : 'bg-red-500/10 border border-red-500/20'
                                  )}
                                >
                                  <span className="text-stone-100">{outlier.app_name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      'text-xs',
                                      outlier.deviation_from_mean > 0 ? 'text-green-400' : 'text-red-400'
                                    )}>
                                      {outlier.avg_score.toFixed(1)}
                                    </span>
                                    {outlier.deviation_from_mean > 0 ? (
                                      <TrendingUp className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3 text-red-400" />
                                    )}
                                    <span className="text-xs text-stone-500">
                                      {outlier.deviation_from_mean > 0 ? '+' : ''}
                                      {outlier.deviation_from_mean.toFixed(1)} std
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No scoring data available yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Simple check icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
