'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Sparkles,
  Check,
  AlertTriangle,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import type {
  TrackSuggestion,
  TrackInfo,
  AIAssignmentResult,
  SubmissionForAssignment,
} from '@/lib/admin/demo-day/ai-assign-types';

type ConfidenceLevel = 'high' | 'medium' | 'low';

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
}

function getConfidenceBadge(confidence: number) {
  const level = getConfidenceLevel(confidence);
  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <Badge variant="outline" className={colors[level]}>
      {confidence}%
    </Badge>
  );
}

interface OverrideState {
  [submissionId: string]: string | null; // track_id or null
}

export default function TrackAssignmentPage() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAssignmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<OverrideState>({});
  const [applying, setApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionForAssignment[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [filterConfidence, setFilterConfidence] = useState<ConfidenceLevel | 'all'>('all');

  // Load initial data
  useEffect(() => {
    loadCurrentState();
  }, []);

  async function loadCurrentState() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/demo-day/ai-assign', {
        method: 'PUT',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSubmissions(data.data.submissions);
      setTracks(data.data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function runAIAnalysis() {
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/demo-day/ai-assign');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResult(data.data);
      setTracks(data.data.track_stats);
      // Pre-select all high-confidence suggestions
      const highConfIds = data.data.suggestions
        .filter((s: TrackSuggestion) => s.confidence >= 80)
        .map((s: TrackSuggestion) => s.submission_id as string);
      setSelectedSubmissions(new Set(highConfIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run AI analysis');
    } finally {
      setAnalyzing(false);
    }
  }

  async function applyAssignments(onlySelected: boolean = true) {
    setApplying(true);
    setError(null);
    try {
      const assignmentsToApply = result?.suggestions
        .filter(s => !onlySelected || selectedSubmissions.has(s.submission_id))
        .map(s => ({
          submission_id: s.submission_id,
          track_id: overrides[s.submission_id] || s.suggested_track_id,
        })) || [];

      const response = await fetch('/api/admin/demo-day/ai-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: assignmentsToApply }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAppliedCount(data.data.applied);
      // Refresh the data
      await loadCurrentState();
      await runAIAnalysis();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply assignments');
    } finally {
      setApplying(false);
    }
  }

  function toggleSubmission(id: string) {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubmissions(newSelected);
  }

  function selectAllInConfidenceRange(level: ConfidenceLevel) {
    if (!result) return;

    const inRange = result.suggestions.filter(s => {
      const l = getConfidenceLevel(s.confidence);
      return l === level;
    });

    const newSelected = new Set(selectedSubmissions);
    const allSelected = inRange.every(s => newSelected.has(s.submission_id));

    if (allSelected) {
      // Deselect all in range
      inRange.forEach(s => newSelected.delete(s.submission_id));
    } else {
      // Select all in range
      inRange.forEach(s => newSelected.add(s.submission_id));
    }

    setSelectedSubmissions(newSelected);
  }

  function toggleTrackExpanded(trackId: string) {
    const newExpanded = new Set(expandedTracks);
    if (newExpanded.has(trackId)) {
      newExpanded.delete(trackId);
    } else {
      newExpanded.add(trackId);
    }
    setExpandedTracks(newExpanded);
  }

  function getSubmissionsForTrack(trackId: string): TrackSuggestion[] {
    if (!result) return [];
    return result.suggestions.filter(s => {
      const effectiveTrackId = overrides[s.submission_id] || s.suggested_track_id;
      return effectiveTrackId === trackId;
    });
  }

  function getFilteredSuggestions(): TrackSuggestion[] {
    if (!result) return [];
    if (filterConfidence === 'all') return result.suggestions;
    return result.suggestions.filter(s => getConfidenceLevel(s.confidence) === filterConfidence);
  }

  const filteredSuggestions = getFilteredSuggestions();
  const needsPanelSplit = tracks.filter(t => t.submission_count > 50);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">AI Track Assignment</h1>
            <p className="text-muted-foreground">
              Analyze submissions and assign to appropriate judging tracks
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadCurrentState}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={runAIAnalysis}
            disabled={analyzing}
            className="gap-2"
          >
            <Sparkles className={`h-4 w-4 ${analyzing ? 'animate-pulse' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{result.total_processed}</div>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {result.high_confidence_count}
              </div>
              <p className="text-sm text-muted-foreground">High Confidence (80%+)</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {result.total_processed - result.high_confidence_count - result.needs_review_count}
              </div>
              <p className="text-sm text-muted-foreground">Medium Confidence</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {result.needs_review_count}
              </div>
              <p className="text-sm text-muted-foreground">Needs Review (&lt;60%)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Track Distribution */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Track Distribution</CardTitle>
            <CardDescription>
              Submissions assigned to each track. Tracks with more than 50 submissions need panel splits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tracks.map(track => {
                const count = getSubmissionsForTrack(track.id).length;
                const needsSplit = count > 50;
                const panelCount = needsSplit ? Math.ceil(count / 50) : 1;
                const percentage = result.total_processed > 0
                  ? (count / result.total_processed) * 100
                  : 0;

                return (
                  <div key={track.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{track.name}</span>
                        <Badge variant="outline">{track.theme}</Badge>
                        {needsSplit && (
                          <Badge variant="destructive" className="text-xs">
                            Needs {panelCount} panels
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count} submissions</span>
                        <span className="text-sm text-muted-foreground">
                          ({percentage.toFixed(1)}%)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTrackExpanded(track.id)}
                        >
                          {expandedTracks.has(track.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />

                    {/* Expanded view showing submissions in this track */}
                    {expandedTracks.has(track.id) && (
                      <div className="mt-2 pl-4 border-l-2 border-gray-200">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Select</TableHead>
                              <TableHead>App Name</TableHead>
                              <TableHead>Confidence</TableHead>
                              <TableHead>Reasoning</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getSubmissionsForTrack(track.id).slice(0, 10).map(s => (
                              <TableRow key={s.submission_id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedSubmissions.has(s.submission_id)}
                                    onCheckedChange={() => toggleSubmission(s.submission_id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {submissions.find(sub => sub.id === s.submission_id)?.app_name || 'Unknown'}
                                </TableCell>
                                <TableCell>{getConfidenceBadge(s.confidence)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                  {s.reasoning}
                                </TableCell>
                              </TableRow>
                            ))}
                            {getSubmissionsForTrack(track.id).length > 10 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  ... and {getSubmissionsForTrack(track.id).length - 10} more
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {result && (
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({result.suggestions.length})</TabsTrigger>
              <TabsTrigger value="high" className="text-green-600">
                High Confidence ({result.high_confidence_count})
              </TabsTrigger>
              <TabsTrigger value="needs-review" className="text-red-600">
                Needs Review ({result.needs_review_count})
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllInConfidenceRange('high')}
              >
                <Check className="h-4 w-4 mr-1" />
                Select All High
              </Button>
              <Button
                onClick={() => applyAssignments(true)}
                disabled={applying || selectedSubmissions.size === 0}
              >
                {applying ? 'Applying...' : `Apply Selected (${selectedSubmissions.size})`}
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            <AssignmentTable
              suggestions={result.suggestions}
              submissions={submissions}
              tracks={tracks}
              selectedSubmissions={selectedSubmissions}
              overrides={overrides}
              onToggle={toggleSubmission}
              onOverride={(id, trackId) => setOverrides(prev => ({ ...prev, [id]: trackId }))}
            />
          </TabsContent>

          <TabsContent value="high">
            <AssignmentTable
              suggestions={result.suggestions.filter(s => s.confidence >= 80)}
              submissions={submissions}
              tracks={tracks}
              selectedSubmissions={selectedSubmissions}
              overrides={overrides}
              onToggle={toggleSubmission}
              onOverride={(id, trackId) => setOverrides(prev => ({ ...prev, [id]: trackId }))}
            />
          </TabsContent>

          <TabsContent value="needs-review">
            <Card>
              <CardHeader>
                <CardTitle>Submissions Needing Manual Review</CardTitle>
                <CardDescription>
                  These submissions have low confidence scores and may need manual track assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssignmentTable
                  suggestions={result.suggestions.filter(s => s.confidence < 60)}
                  submissions={submissions}
                  tracks={tracks}
                  selectedSubmissions={selectedSubmissions}
                  overrides={overrides}
                  onToggle={toggleSubmission}
                  onOverride={(id, trackId) => setOverrides(prev => ({ ...prev, [id]: trackId }))}
                  showDescription
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Applied notification */}
      {appliedCount > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span>Successfully applied {appliedCount} track assignments</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Assignment Table Component
interface AssignmentTableProps {
  suggestions: TrackSuggestion[];
  submissions: SubmissionForAssignment[];
  tracks: TrackInfo[];
  selectedSubmissions: Set<string>;
  overrides: OverrideState;
  onToggle: (id: string) => void;
  onOverride: (submissionId: string, trackId: string) => void;
  showDescription?: boolean;
}

function AssignmentTable({
  suggestions,
  submissions,
  tracks,
  selectedSubmissions,
  overrides,
  onToggle,
  onOverride,
  showDescription = false,
}: AssignmentTableProps) {
  const getSubmission = (id: string) =>
    submissions.find(s => s.id === id);

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>App Name</TableHead>
              <TableHead>Category (Self-Selected)</TableHead>
              {showDescription && <TableHead>Description</TableHead>}
              <TableHead>Suggested Track</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Override</TableHead>
              <TableHead>Reasoning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestions.map(suggestion => {
              const submission = getSubmission(suggestion.submission_id);
              const currentOverride = overrides[suggestion.submission_id];
              const effectiveTrack = currentOverride
                ? tracks.find(t => t.id === currentOverride)?.name
                : suggestion.suggested_track_name;

              return (
                <TableRow key={suggestion.submission_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSubmissions.has(suggestion.submission_id)}
                      onCheckedChange={() => onToggle(suggestion.submission_id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {submission?.app_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {submission?.category || 'None'}
                    </Badge>
                  </TableCell>
                  {showDescription && (
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {submission?.description || 'No description'}
                      </p>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50">
                      {effectiveTrack}
                    </Badge>
                    {currentOverride && (
                      <Badge variant="outline" className="ml-1 text-orange-600">
                        Override
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getConfidenceBadge(suggestion.confidence)}</TableCell>
                  <TableCell>
                    <Select
                      value={currentOverride || ''}
                      onValueChange={(value) => onOverride(suggestion.submission_id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Override..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tracks.map(track => (
                          <SelectItem key={track.id} value={track.id}>
                            {track.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">
                    <p className="truncate" title={suggestion.reasoning}>
                      {suggestion.reasoning}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
