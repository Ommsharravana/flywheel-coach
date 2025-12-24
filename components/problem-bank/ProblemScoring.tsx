'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Star,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Rocket,
  Target,
  Lightbulb,
  Gauge,
  TrendingUp,
} from 'lucide-react';

interface ProblemScore {
  id: string;
  severity_score: number | null;
  validation_score: number | null;
  uniqueness_score: number | null;
  feasibility_score: number | null;
  impact_potential_score: number | null;
  composite_score: number | null;
  notes: string | null;
  scored_by: string;
  scored_at: string;
}

interface ProblemScoringProps {
  problemId: string;
  onScoreUpdate?: (score: ProblemScore) => void;
  onAddToPipeline?: () => void;
  isInPipeline?: boolean;
}

const SCORE_DIMENSIONS = [
  {
    key: 'severity_score',
    label: 'Severity',
    icon: AlertTriangle,
    description: 'How painful is this problem?',
    color: 'text-red-400',
  },
  {
    key: 'validation_score',
    label: 'Validation',
    icon: CheckCircle,
    description: 'How well-validated through user research?',
    color: 'text-green-400',
  },
  {
    key: 'uniqueness_score',
    label: 'Uniqueness',
    icon: Lightbulb,
    description: 'How novel/differentiated is this problem?',
    color: 'text-purple-400',
  },
  {
    key: 'feasibility_score',
    label: 'Feasibility',
    icon: Target,
    description: 'How feasible is a solution?',
    color: 'text-blue-400',
  },
  {
    key: 'impact_potential_score',
    label: 'Impact Potential',
    icon: TrendingUp,
    description: 'What is the potential impact?',
    color: 'text-yellow-400',
  },
];

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-stone-500';
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-yellow-400';
  if (score >= 4) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return 'Not scored';
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Moderate';
  if (score >= 3) return 'Low';
  return 'Very Low';
}

export function ProblemScoring({
  problemId,
  onScoreUpdate,
  onAddToPipeline,
  isInPipeline = false,
}: ProblemScoringProps) {
  const [scores, setScores] = useState<ProblemScore | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Edit state
  const [editScores, setEditScores] = useState<Record<string, number>>({
    severity_score: 5,
    validation_score: 5,
    uniqueness_score: 5,
    feasibility_score: 5,
    impact_potential_score: 5,
  });
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchScores();
  }, [problemId]);

  const fetchScores = async () => {
    try {
      const response = await fetch(`/api/problems/${problemId}/score`);
      if (!response.ok) {
        throw new Error('Failed to fetch scores');
      }
      const data = await response.json();
      if (data.scores && data.scores.length > 0) {
        const latestScore = data.scores[0];
        setScores(latestScore);
        setEditScores({
          severity_score: latestScore.severity_score || 5,
          validation_score: latestScore.validation_score || 5,
          uniqueness_score: latestScore.uniqueness_score || 5,
          feasibility_score: latestScore.feasibility_score || 5,
          impact_potential_score: latestScore.impact_potential_score || 5,
        });
        setEditNotes(latestScore.notes || '');
      }
      setAverageScore(data.average_score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problemId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editScores,
          notes: editNotes,
          scored_by: 'manual',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save score');
      }

      const data = await response.json();
      setScores(data.score);
      setEditing(false);
      onScoreUpdate?.(data.score);

      // Refresh to get updated average
      fetchScores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
            <Gauge className="h-5 w-5 text-amber-400" />
            Problem Score
          </CardTitle>
          {scores?.composite_score && (
            <Badge className={`${getScoreColor(scores.composite_score)} bg-stone-800`}>
              <Star className="h-3 w-3 mr-1" />
              {scores.composite_score.toFixed(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {editing ? (
          // Edit Mode
          <div className="space-y-5">
            {SCORE_DIMENSIONS.map((dim) => {
              const Icon = dim.icon;
              const currentValue = editScores[dim.key] || 5;
              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${dim.color}`} />
                      <span className="text-sm font-medium text-stone-200">
                        {dim.label}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(currentValue)}`}>
                      {currentValue}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{dim.description}</p>
                  <Slider
                    value={[currentValue]}
                    onValueChange={(value) =>
                      setEditScores((prev) => ({ ...prev, [dim.key]: value[0] }))
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Low (1)</span>
                    <span>High (10)</span>
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-200">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add scoring notes..."
                className="bg-stone-800 border-stone-700 text-stone-200"
                rows={3}
              />
            </div>

            {/* Composite Score Preview */}
            <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">Composite Score</span>
                <span className={`text-xl font-bold ${getScoreColor(
                  Object.values(editScores).reduce((a, b) => a + b, 0) / 5
                )}`}>
                  {(Object.values(editScores).reduce((a, b) => a + b, 0) / 5).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Score
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="border-stone-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : scores ? (
          // View Mode with scores
          <div className="space-y-4">
            {SCORE_DIMENSIONS.map((dim) => {
              const Icon = dim.icon;
              const value = scores[dim.key as keyof ProblemScore] as number | null;
              return (
                <div key={dim.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${dim.color}`} />
                    <span className="text-sm text-stone-300">{dim.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded-sm ${
                            value && i < value
                              ? i < 4
                                ? 'bg-red-400'
                                : i < 6
                                ? 'bg-orange-400'
                                : i < 8
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                              : 'bg-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(value)}`}>
                      {value || '-'}
                    </span>
                  </div>
                </div>
              );
            })}

            {scores.notes && (
              <div className="pt-3 border-t border-stone-700">
                <p className="text-xs text-stone-500 mb-1">Notes</p>
                <p className="text-sm text-stone-300">{scores.notes}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="w-full border-stone-700"
              >
                Update Score
              </Button>

              {!isInPipeline && onAddToPipeline && scores.composite_score && scores.composite_score >= 6 && (
                <Button
                  onClick={onAddToPipeline}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-stone-950"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Add to NIF Pipeline
                </Button>
              )}
            </div>
          </div>
        ) : (
          // No scores yet
          <div className="text-center py-4">
            <Star className="h-8 w-8 text-stone-600 mx-auto mb-2" />
            <p className="text-stone-400 text-sm mb-4">No scores yet</p>
            <Button
              onClick={() => setEditing(true)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950"
            >
              <Star className="h-4 w-4 mr-2" />
              Score This Problem
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
