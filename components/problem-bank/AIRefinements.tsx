'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  AlertTriangle,
  Loader2,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  REFINEMENT_TYPES,
  REFINEMENT_BASED_ON,
  type RefinementType,
  type RefinementBasedOn,
  type AIRefinement,
} from '@/lib/types/problem-bank';

interface AIRefinementsProps {
  problemId: string;
  currentStatement: string;
  onStatementUpdated?: (newStatement: string) => void;
}

export function AIRefinements({
  problemId,
  currentStatement,
  onStatementUpdated,
}: AIRefinementsProps) {
  const [refinements, setRefinements] = useState<AIRefinement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRefinement, setExpandedRefinement] = useState<string | null>(null);

  // Generation options
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);
  const [generateType, setGenerateType] = useState<RefinementType>('clarity');
  const [generateBasedOn, setGenerateBasedOn] = useState<RefinementBasedOn>('outcome_patterns');

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedStatement, setEditedStatement] = useState('');

  useEffect(() => {
    fetchRefinements();
  }, [problemId]);

  const fetchRefinements = async () => {
    try {
      const response = await fetch(`/api/problems/${problemId}/refinements`);
      if (!response.ok) throw new Error('Failed to fetch refinements');
      const data = await response.json();
      setRefinements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refinements');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problemId}/refinements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refinement_type: generateType,
          based_on: generateBasedOn,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate refinement');
      }

      await fetchRefinements();
      setShowGenerateOptions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate refinement');
    } finally {
      setGenerating(false);
    }
  };

  const handleRespond = async (refinementId: string, action: 'accept' | 'reject' | 'modify') => {
    setResponding(refinementId);
    setError(null);

    try {
      const body: { action: string; modified_statement?: string } = { action };
      if (action === 'modify' && editedStatement) {
        body.modified_statement = editedStatement;
      }

      const response = await fetch(`/api/problems/${problemId}/refinements/${refinementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to respond to refinement');
      }

      const data = await response.json();
      await fetchRefinements();
      setEditingId(null);
      setEditedStatement('');

      if (action === 'accept' || action === 'modify') {
        onStatementUpdated?.(data.refinement.suggested_statement);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to refinement');
    } finally {
      setResponding(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-400">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>;
      case 'modified':
        return <Badge className="bg-blue-500/20 text-blue-400">Modified</Badge>;
      default:
        return <Badge className="bg-stone-500/20 text-stone-400">{status}</Badge>;
    }
  };

  const pendingRefinements = refinements.filter((r) => r.status === 'pending');

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
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Refinements
            {pendingRefinements.length > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400 ml-2">
                {pendingRefinements.length} pending
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowGenerateOptions(!showGenerateOptions)}
            disabled={generating}
            className="bg-purple-500 hover:bg-purple-400 text-white"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" />
                Generate
              </>
            )}
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

        {showGenerateOptions && (
          <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 space-y-4">
            <h4 className="text-sm font-medium text-purple-300">Generate New Refinement</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-stone-400">Refinement Type</label>
                <Select value={generateType} onValueChange={(v) => setGenerateType(v as RefinementType)}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REFINEMENT_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-stone-400">Based On</label>
                <Select value={generateBasedOn} onValueChange={(v) => setGenerateBasedOn(v as RefinementBasedOn)}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REFINEMENT_BASED_ON).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-stone-400">
              {REFINEMENT_TYPES[generateType]?.description}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 bg-purple-500 hover:bg-purple-400 text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Suggestion
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGenerateOptions(false)}
                className="border-stone-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Current statement for reference */}
        <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700">
          <p className="text-xs text-stone-500 mb-1">Current Problem Statement</p>
          <p className="text-sm text-stone-300">{currentStatement}</p>
        </div>

        {refinements.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-stone-600 mx-auto mb-2" />
            <p className="text-stone-400 text-sm">No AI refinements yet</p>
            <p className="text-stone-500 text-xs mt-1">
              Generate suggestions to improve this problem statement
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {refinements.map((refinement) => {
              const typeInfo = REFINEMENT_TYPES[refinement.refinement_type];
              const isExpanded = expandedRefinement === refinement.id;
              const isEditing = editingId === refinement.id;
              const isResponding = responding === refinement.id;

              return (
                <div
                  key={refinement.id}
                  className={`p-3 rounded-lg border ${
                    refinement.status === 'pending'
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-stone-800/50 border-stone-700'
                  }`}
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedRefinement(isExpanded ? null : refinement.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${typeInfo?.color || 'text-stone-400'} bg-stone-700`}>
                          {typeInfo?.label || refinement.refinement_type}
                        </Badge>
                        {getStatusBadge(refinement.status)}
                        {refinement.confidence_score && (
                          <span className="text-xs text-stone-500">
                            {Math.round(refinement.confidence_score * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-300 line-clamp-2">
                        {refinement.suggested_statement}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-stone-500 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-500 ml-2" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-700 space-y-3">
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Original</p>
                        <p className="text-sm text-stone-400 italic">{refinement.original_statement}</p>
                      </div>

                      <div>
                        <p className="text-xs text-stone-500 mb-1">Suggested</p>
                        {isEditing ? (
                          <Textarea
                            value={editedStatement}
                            onChange={(e) => setEditedStatement(e.target.value)}
                            className="bg-stone-800 border-stone-700 text-stone-200"
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm text-stone-200">{refinement.suggested_statement}</p>
                        )}
                      </div>

                      {refinement.refinement_reason && (
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Reason</p>
                          <p className="text-sm text-stone-300">{refinement.refinement_reason}</p>
                        </div>
                      )}

                      {refinement.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleRespond(refinement.id, 'modify')}
                                disabled={isResponding || !editedStatement}
                                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white"
                              >
                                {isResponding ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Save Modified
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditedStatement('');
                                }}
                                className="border-stone-700"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleRespond(refinement.id, 'accept')}
                                disabled={isResponding}
                                className="flex-1 bg-green-500 hover:bg-green-400 text-white"
                              >
                                {isResponding ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(refinement.id);
                                  setEditedStatement(refinement.suggested_statement);
                                }}
                                disabled={isResponding}
                                className="border-stone-700"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Modify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRespond(refinement.id, 'reject')}
                                disabled={isResponding}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-stone-500">
                        Generated {new Date(refinement.created_at).toLocaleDateString()}
                        {refinement.responded_at && (
                          <> · Responded {new Date(refinement.responded_at).toLocaleDateString()}</>
                        )}
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
