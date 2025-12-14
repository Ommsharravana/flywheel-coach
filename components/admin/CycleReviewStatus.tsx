'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, Check, AlertTriangle, Clock, Flag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CycleReview {
  id: string;
  cycle_id: string;
  status: 'pending' | 'in_review' | 'approved' | 'needs_revision' | 'flagged';
  reviewed_by: string | null;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CycleReviewStatusProps {
  cycleId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  pending: { label: 'Pending', color: 'bg-stone-500/20 text-stone-400', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-blue-500/20 text-blue-400', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400', icon: Check },
  needs_revision: { label: 'Needs Revision', color: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
  flagged: { label: 'Flagged', color: 'bg-red-500/20 text-red-400', icon: Flag },
};

export function CycleReviewStatus({ cycleId }: CycleReviewStatusProps) {
  const [review, setReview] = useState<CycleReview | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch review on mount
  useEffect(() => {
    fetchReview();
  }, [cycleId]);

  async function fetchReview() {
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/review`);
      if (!res.ok) {
        throw new Error('Failed to fetch review');
      }
      const data = await res.json();
      if (data.review) {
        setReview(data.review);
        setStatus(data.review.status);
        setNotes(data.review.notes || '');
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save review');
      }

      const data = await res.json();
      setReview(data.review);
      toast.success('Review status updated');
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save review');
    } finally {
      setSaving(false);
    }
  }

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-amber-400" />
          Review Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-stone-500">Loading...</div>
        ) : (
          <>
            {/* Current Status Display */}
            {review && (
              <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={config.color}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  {review.reviewed_at && (
                    <span className="text-xs text-stone-500">
                      {format(new Date(review.reviewed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  )}
                </div>
                {review.reviewer && (
                  <p className="text-xs text-stone-500">
                    by {review.reviewer.name || review.reviewer.email}
                  </p>
                )}
              </div>
            )}

            {/* Update Status Form */}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-stone-400 mb-1 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="pending">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-stone-400" />
                        Pending
                      </span>
                    </SelectItem>
                    <SelectItem value="in_review">
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-400" />
                        In Review
                      </span>
                    </SelectItem>
                    <SelectItem value="approved">
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-400" />
                        Approved
                      </span>
                    </SelectItem>
                    <SelectItem value="needs_revision">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Needs Revision
                      </span>
                    </SelectItem>
                    <SelectItem value="flagged">
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-400" />
                        Flagged
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-stone-400 mb-1 block">Notes (optional)</label>
                <Textarea
                  placeholder="Add review notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-stone-800 border-stone-700 text-stone-100 resize-none"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                <ClipboardCheck className="h-4 w-4" />
                {saving ? 'Saving...' : 'Update Review Status'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
