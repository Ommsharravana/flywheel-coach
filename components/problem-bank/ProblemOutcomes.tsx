'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  AlertTriangle,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  DollarSign,
  Lightbulb,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { OUTCOME_TYPES, type OutcomeType, type ProblemOutcome } from '@/lib/types/problem-bank';

interface ProblemOutcomesProps {
  problemId: string;
  onOutcomeAdded?: () => void;
}

export function ProblemOutcomes({ problemId, onOutcomeAdded }: ProblemOutcomesProps) {
  const [outcomes, setOutcomes] = useState<ProblemOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedOutcome, setExpandedOutcome] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    outcome_type: 'ongoing' as OutcomeType,
    outcome_description: '',
    time_to_solution_days: '',
    iterations_count: '1',
    users_impacted: '0',
    time_saved_hours: '0',
    satisfaction_score: '',
    what_worked: '',
    what_didnt_work: '',
    key_insights: '',
    recommendations: '',
  });

  useEffect(() => {
    fetchOutcomes();
  }, [problemId]);

  const fetchOutcomes = async () => {
    try {
      const response = await fetch(`/api/problems/${problemId}/outcomes`);
      if (!response.ok) throw new Error('Failed to fetch outcomes');
      const data = await response.json();
      setOutcomes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outcomes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problemId}/outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome_type: formData.outcome_type,
          outcome_description: formData.outcome_description || null,
          time_to_solution_days: formData.time_to_solution_days ? parseInt(formData.time_to_solution_days) : null,
          iterations_count: parseInt(formData.iterations_count) || 1,
          users_impacted: parseInt(formData.users_impacted) || 0,
          time_saved_hours: parseFloat(formData.time_saved_hours) || 0,
          satisfaction_score: formData.satisfaction_score ? parseFloat(formData.satisfaction_score) : null,
          what_worked: formData.what_worked || null,
          what_didnt_work: formData.what_didnt_work || null,
          key_insights: formData.key_insights ? formData.key_insights.split('\n').filter(Boolean) : [],
          recommendations: formData.recommendations ? formData.recommendations.split('\n').filter(Boolean) : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record outcome');
      }

      await fetchOutcomes();
      setShowForm(false);
      resetForm();
      onOutcomeAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outcome');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      outcome_type: 'ongoing',
      outcome_description: '',
      time_to_solution_days: '',
      iterations_count: '1',
      users_impacted: '0',
      time_saved_hours: '0',
      satisfaction_score: '',
      what_worked: '',
      what_didnt_work: '',
      key_insights: '',
      recommendations: '',
    });
  };

  const getOutcomeIcon = (type: OutcomeType) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'partial': return TrendingUp;
      case 'pivot': return RefreshCw;
      case 'abandoned': return XCircle;
      case 'ongoing': return Clock;
      default: return Trophy;
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
            <Trophy className="h-5 w-5 text-amber-400" />
            Problem Outcomes
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950"
          >
            <Plus className="h-4 w-4 mr-1" />
            Record Outcome
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-stone-800/50 rounded-lg border border-stone-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Outcome Type</Label>
                <Select
                  value={formData.outcome_type}
                  onValueChange={(v) => setFormData({ ...formData, outcome_type: v as OutcomeType })}
                >
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OUTCOME_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Days to Solution</Label>
                <Input
                  type="number"
                  value={formData.time_to_solution_days}
                  onChange={(e) => setFormData({ ...formData, time_to_solution_days: e.target.value })}
                  placeholder="e.g., 14"
                  className="bg-stone-800 border-stone-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Outcome Description</Label>
              <Textarea
                value={formData.outcome_description}
                onChange={(e) => setFormData({ ...formData, outcome_description: e.target.value })}
                placeholder="Describe what happened..."
                className="bg-stone-800 border-stone-700"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Users Impacted</Label>
                <Input
                  type="number"
                  value={formData.users_impacted}
                  onChange={(e) => setFormData({ ...formData, users_impacted: e.target.value })}
                  className="bg-stone-800 border-stone-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Hours Saved</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.time_saved_hours}
                  onChange={(e) => setFormData({ ...formData, time_saved_hours: e.target.value })}
                  className="bg-stone-800 border-stone-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Satisfaction (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={formData.satisfaction_score}
                  onChange={(e) => setFormData({ ...formData, satisfaction_score: e.target.value })}
                  className="bg-stone-800 border-stone-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>What Worked</Label>
                <Textarea
                  value={formData.what_worked}
                  onChange={(e) => setFormData({ ...formData, what_worked: e.target.value })}
                  placeholder="What went well..."
                  className="bg-stone-800 border-stone-700"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>What Didn&apos;t Work</Label>
                <Textarea
                  value={formData.what_didnt_work}
                  onChange={(e) => setFormData({ ...formData, what_didnt_work: e.target.value })}
                  placeholder="What could be improved..."
                  className="bg-stone-800 border-stone-700"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Key Insights (one per line)</Label>
              <Textarea
                value={formData.key_insights}
                onChange={(e) => setFormData({ ...formData, key_insights: e.target.value })}
                placeholder="Enter each insight on a new line..."
                className="bg-stone-800 border-stone-700"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Record Outcome'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="border-stone-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {outcomes.length === 0 ? (
          <div className="text-center py-6">
            <Trophy className="h-8 w-8 text-stone-600 mx-auto mb-2" />
            <p className="text-stone-400 text-sm">No outcomes recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outcomes.map((outcome) => {
              const Icon = getOutcomeIcon(outcome.outcome_type);
              const typeInfo = OUTCOME_TYPES[outcome.outcome_type];
              const isExpanded = expandedOutcome === outcome.id;

              return (
                <div
                  key={outcome.id}
                  className="p-3 bg-stone-800/50 rounded-lg border border-stone-700"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedOutcome(isExpanded ? null : outcome.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${typeInfo.color}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${typeInfo.color} bg-stone-700`}>
                            {typeInfo.label}
                          </Badge>
                          {outcome.time_to_solution_days && (
                            <span className="text-xs text-stone-500">
                              {outcome.time_to_solution_days} days
                            </span>
                          )}
                        </div>
                        {outcome.outcome_description && (
                          <p className="text-sm text-stone-300 mt-1 line-clamp-2">
                            {outcome.outcome_description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-500" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-700 space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-stone-400">Users:</span>
                          <span className="text-stone-200">{outcome.users_impacted}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-green-400" />
                          <span className="text-stone-400">Hours Saved:</span>
                          <span className="text-stone-200">{outcome.time_saved_hours}</span>
                        </div>
                        {outcome.satisfaction_score && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-yellow-400" />
                            <span className="text-stone-400">Satisfaction:</span>
                            <span className="text-stone-200">{outcome.satisfaction_score}/10</span>
                          </div>
                        )}
                      </div>

                      {(outcome.what_worked || outcome.what_didnt_work) && (
                        <div className="grid grid-cols-2 gap-4">
                          {outcome.what_worked && (
                            <div>
                              <p className="text-xs text-green-400 mb-1">What Worked</p>
                              <p className="text-sm text-stone-300">{outcome.what_worked}</p>
                            </div>
                          )}
                          {outcome.what_didnt_work && (
                            <div>
                              <p className="text-xs text-red-400 mb-1">What Didn&apos;t Work</p>
                              <p className="text-sm text-stone-300">{outcome.what_didnt_work}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {outcome.key_insights && outcome.key_insights.length > 0 && (
                        <div>
                          <p className="text-xs text-amber-400 mb-1 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            Key Insights
                          </p>
                          <ul className="text-sm text-stone-300 list-disc list-inside">
                            {outcome.key_insights.map((insight, i) => (
                              <li key={i}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-stone-500">
                        Recorded {new Date(outcome.recorded_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
