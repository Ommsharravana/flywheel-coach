'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Mail,
  Phone,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  InboxIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { PROBLEM_THEMES } from '@/lib/types/problem-bank';

interface PendingSubmission {
  id: string;
  title: string;
  problem_statement: string;
  theme: string | null;
  severity_rating: number | null;
  who_affected: string | null;
  when_occurs: string | null;
  where_occurs: string | null;
  current_workaround: string | null;
  industry_partner_name: string | null;
  industry_partner_email: string | null;
  industry_partner_company: string | null;
  industry_partner_phone: string | null;
  budget_amount: number | null;
  budget_currency: string;
  created_at: string;
}

export default function ReviewQueuePage() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/problems/review');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch submissions');
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleReview = async (problemId: string, action: 'approve' | 'reject') => {
    setProcessingId(problemId);
    try {
      const response = await fetch('/api/problems/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          action,
          notes: reviewNotes[problemId] || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process review');
      }

      // Remove from list
      setSubmissions(prev => prev.filter(s => s.id !== problemId));
      setReviewNotes(prev => {
        const updated = { ...prev };
        delete updated[problemId];
        return updated;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process review');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">
            Industry Problem Review Queue
          </h1>
          <p className="text-stone-400">Review and approve industry partner problem submissions</p>
        </div>
        <Card className="bg-red-900/30 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">
            Industry Problem Review Queue
          </h1>
          <p className="text-stone-400">
            Review and approve industry partner problem submissions
          </p>
        </div>
        <Link href="/admin/problem-bank">
          <Button variant="outline" className="border-stone-700 text-stone-300">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Problem Bank
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <InboxIcon className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-stone-100">{submissions.length}</div>
              <p className="text-sm text-stone-500">Pending Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {submissions.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-100 mb-2">
              All Caught Up!
            </h3>
            <p className="text-stone-400 max-w-md mx-auto">
              No industry problem submissions pending review. New submissions from industry partners
              will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const isExpanded = expandedId === submission.id;
            const isProcessing = processingId === submission.id;
            const themeInfo = submission.theme
              ? PROBLEM_THEMES[submission.theme as keyof typeof PROBLEM_THEMES]
              : null;

            return (
              <Card
                key={submission.id}
                className="bg-stone-900/50 border-stone-800 overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Pending Review
                        </Badge>
                        {themeInfo && (
                          <Badge variant="outline" className={`${themeInfo.color} border-current/30`}>
                            {themeInfo.emoji} {themeInfo.label}
                          </Badge>
                        )}
                        {submission.budget_amount && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {submission.budget_amount.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-stone-100">{submission.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {submission.industry_partner_company}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                      className="text-stone-400"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Problem Statement - Always visible */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-stone-400 mb-1">Problem Statement</h4>
                    <p className={`text-stone-200 ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {submission.problem_statement}
                    </p>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-stone-800">
                      {/* Partner Info */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium text-stone-400 mb-2">Partner Contact</h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-stone-200">{submission.industry_partner_name}</p>
                            <p className="flex items-center gap-2 text-stone-400">
                              <Mail className="h-3 w-3" />
                              {submission.industry_partner_email}
                            </p>
                            {submission.industry_partner_phone && (
                              <p className="flex items-center gap-2 text-stone-400">
                                <Phone className="h-3 w-3" />
                                {submission.industry_partner_phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Context Info */}
                        <div>
                          <h4 className="text-sm font-medium text-stone-400 mb-2">Problem Context</h4>
                          <div className="space-y-1 text-sm text-stone-300">
                            {submission.who_affected && <p><strong>Who:</strong> {submission.who_affected}</p>}
                            {submission.when_occurs && <p><strong>When:</strong> {submission.when_occurs}</p>}
                            {submission.where_occurs && <p><strong>Where:</strong> {submission.where_occurs}</p>}
                            {submission.severity_rating && (
                              <p><strong>Urgency:</strong> {submission.severity_rating}/10</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Current Workaround */}
                      {submission.current_workaround && (
                        <div>
                          <h4 className="text-sm font-medium text-stone-400 mb-1">Current Workaround</h4>
                          <p className="text-sm text-stone-300">{submission.current_workaround}</p>
                        </div>
                      )}

                      {/* Review Notes */}
                      <div>
                        <h4 className="text-sm font-medium text-stone-400 mb-2">Review Notes (Optional)</h4>
                        <Textarea
                          value={reviewNotes[submission.id] || ''}
                          onChange={(e) =>
                            setReviewNotes(prev => ({ ...prev, [submission.id]: e.target.value }))
                          }
                          placeholder="Add notes about this review..."
                          className="bg-stone-800 border-stone-700 min-h-[80px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-stone-800">
                    <Button
                      onClick={() => handleReview(submission.id, 'approve')}
                      disabled={isProcessing}
                      className="bg-green-600 text-white hover:bg-green-500"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(submission.id, 'reject')}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    {!isExpanded && (
                      <Button
                        variant="ghost"
                        onClick={() => setExpandedId(submission.id)}
                        className="text-stone-400 ml-auto"
                      >
                        Show Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
