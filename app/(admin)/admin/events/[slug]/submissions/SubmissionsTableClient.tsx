'use client';

import { useState, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Send,
  CheckCircle2,
  Award,
  XCircle,
  Clock,
  ExternalLink,
  Building2,
  Star,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  team_name: string;
  app_name: string;
  category: string | null;
  status: string;
  submission_number: string | null;
  institution_name: string | null;
  institution_short_name: string | null;
  score: number | null;
  submitted_at: string | null;
  created_at: string;
  applicant_name: string | null;
  live_url: string | null;
}

interface SubmissionsTableClientProps {
  initialSubmissions: Submission[];
  eventSlug: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-stone-400 border-stone-600', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-400 border-blue-500/30', icon: Send },
  under_review: { label: 'Under Review', color: 'text-amber-400 border-amber-500/30', icon: FileText },
  shortlisted: { label: 'Shortlisted', color: 'text-purple-400 border-purple-500/30', icon: CheckCircle2 },
  winner: { label: 'Winner', color: 'text-green-400 border-green-500/30', icon: Award },
  rejected: { label: 'Rejected', color: 'text-red-400 border-red-500/30', icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  healthcare: 'Healthcare',
  education: 'Education',
  operations: 'Operations',
  productivity: 'Productivity',
  other: 'Other',
};

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'winner', label: 'Winner' },
  { value: 'rejected', label: 'Rejected' },
];

interface PendingStatusChange {
  submissionId: string;
  teamName: string;
  newStatus: string;
  oldStatus: string;
}

export function SubmissionsTableClient({
  initialSubmissions,
  eventSlug,
}: SubmissionsTableClientProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [, setEditingScoreId] = useState<string | null>(null);
  const [pendingScores, setPendingScores] = useState<Record<string, string>>({});
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);

  // Sync local state when initialSubmissions changes (e.g., pagination)
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const updateSubmission = useCallback(async (
    submissionId: string,
    updates: { status?: string; score?: number | null }
  ) => {
    setSavingIds(prev => new Set(prev).add(submissionId));

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update');
      }

      await response.json();

      // Update local state
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, ...updates } : s)
      );

      // Refresh server data
      router.refresh();
    } catch (error) {
      console.error('Update failed:', error);
      // Optionally show toast notification here
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  }, [router]);

  const handleStatusChange = useCallback((submissionId: string, newStatus: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Show confirmation dialog
    setPendingStatusChange({
      submissionId,
      teamName: submission.team_name || 'Unnamed Team',
      newStatus,
      oldStatus: submission.status,
    });
  }, [submissions]);

  const confirmStatusChange = useCallback(() => {
    if (!pendingStatusChange) return;
    updateSubmission(pendingStatusChange.submissionId, { status: pendingStatusChange.newStatus });
    setPendingStatusChange(null);
  }, [pendingStatusChange, updateSubmission]);

  const cancelStatusChange = useCallback(() => {
    setPendingStatusChange(null);
  }, []);

  const handleScoreBlur = useCallback((submissionId: string) => {
    const scoreStr = pendingScores[submissionId];
    if (scoreStr === undefined) {
      setEditingScoreId(null);
      return;
    }

    const score = scoreStr === '' ? null : parseFloat(scoreStr);

    // Validate score
    if (score !== null && (isNaN(score) || score < 0 || score > 5)) {
      // Invalid score, reset
      setPendingScores(prev => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
      setEditingScoreId(null);
      return;
    }

    // Find the submission to check if score actually changed
    const submission = submissions.find(s => s.id === submissionId);
    if (submission && submission.score !== score) {
      updateSubmission(submissionId, { score });
    }

    setPendingScores(prev => {
      const next = { ...prev };
      delete next[submissionId];
      return next;
    });
    setEditingScoreId(null);
  }, [pendingScores, submissions, updateSubmission]);

  const handleScoreChange = useCallback((submissionId: string, value: string) => {
    setPendingScores(prev => ({ ...prev, [submissionId]: value }));
  }, []);

  const quickAction = useCallback((submissionId: string, status: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Show confirmation dialog
    setPendingStatusChange({
      submissionId,
      teamName: submission.team_name || 'Unnamed Team',
      newStatus: status,
      oldStatus: submission.status,
    });
  }, [submissions]);

  const isSaving = useCallback((id: string) => savingIds.has(id), [savingIds]);

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500">
        No submissions yet
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto -mx-4 px-4">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="border-stone-700">
            <TableHead className="text-stone-400">#</TableHead>
            <TableHead className="text-stone-400">Team / App</TableHead>
            <TableHead className="text-stone-400">Category</TableHead>
            <TableHead className="text-stone-400">Institution</TableHead>
            <TableHead className="text-stone-400">Status</TableHead>
            <TableHead className="text-stone-400">Score</TableHead>
            <TableHead className="text-stone-400">Submitted</TableHead>
            <TableHead className="text-stone-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            const statusConfig = STATUS_CONFIG[submission.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;
            const saving = isSaving(submission.id);
            const displayScore = pendingScores[submission.id] ?? (submission.score?.toString() ?? '');

            return (
              <TableRow key={submission.id} className="border-stone-700">
                <TableCell className="font-mono text-xs text-stone-500">
                  {submission.submission_number || '—'}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-stone-100">{submission.team_name || 'Unnamed Team'}</div>
                    <div className="text-xs text-stone-500">{submission.app_name || 'No app name'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {submission.category ? (
                    <Badge variant="outline" className="text-stone-300 border-stone-600">
                      {CATEGORY_LABELS[submission.category] || submission.category}
                    </Badge>
                  ) : (
                    <span className="text-stone-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {submission.institution_short_name ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-stone-500" />
                      <span className="text-stone-300">{submission.institution_short_name}</span>
                    </div>
                  ) : (
                    <span className="text-stone-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={submission.status}
                    onValueChange={(value) => handleStatusChange(submission.id, value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-[120px] h-7 bg-stone-800 border-stone-700 text-xs">
                      {saving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <SelectValue>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`h-3 w-3 ${statusConfig.color.split(' ')[0]}`} />
                            <span>{statusConfig.label}</span>
                          </div>
                        </SelectValue>
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-stone-800 border-stone-700">
                      {STATUS_OPTIONS.map(opt => {
                        const config = STATUS_CONFIG[opt.value];
                        const Icon = config.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="text-stone-200">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-3 w-3 ${config.color.split(' ')[0]}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={displayScore}
                      onChange={(e) => handleScoreChange(submission.id, e.target.value)}
                      onFocus={() => setEditingScoreId(submission.id)}
                      onBlur={() => handleScoreBlur(submission.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      disabled={saving}
                      className="w-14 h-6 text-xs bg-stone-800 border-stone-700 text-stone-200 text-center px-1"
                      placeholder="—"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-stone-400 text-sm">
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleDateString()
                    : <span className="text-stone-600">Not submitted</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Quick Actions */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => quickAction(submission.id, 'shortlisted')}
                          disabled={saving || submission.status === 'shortlisted'}
                          className={`h-7 w-7 p-0 ${submission.status === 'shortlisted' ? 'opacity-50' : 'hover:bg-purple-500/10'}`}
                        >
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Shortlist</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => quickAction(submission.id, 'winner')}
                          disabled={saving || submission.status === 'winner'}
                          className={`h-7 w-7 p-0 ${submission.status === 'winner' ? 'opacity-50' : 'hover:bg-green-500/10'}`}
                        >
                          <Award className="h-4 w-4 text-green-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark Winner</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => quickAction(submission.id, 'rejected')}
                          disabled={saving || submission.status === 'rejected'}
                          className={`h-7 w-7 p-0 ${submission.status === 'rejected' ? 'opacity-50' : 'hover:bg-red-500/10'}`}
                        >
                          <XCircle className="h-4 w-4 text-red-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject</TooltipContent>
                    </Tooltip>

                    {/* External Link */}
                    {submission.live_url && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={submission.live_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>View Live App</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Review Button */}
                    <Link href={`/admin/events/${eventSlug}/submissions/${submission.id}`}>
                      <Button variant="outline" size="sm" className="h-7 border-stone-700 text-xs">
                        Review
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!pendingStatusChange} onOpenChange={(open) => !open && cancelStatusChange()}>
        <AlertDialogContent className="bg-stone-900 border-stone-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-100">Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              {pendingStatusChange && (
                <>
                  Change <span className="font-semibold text-stone-200">{pendingStatusChange.teamName}</span> from{' '}
                  <span className={`font-medium ${STATUS_CONFIG[pendingStatusChange.oldStatus]?.color.split(' ')[0] || ''}`}>
                    {STATUS_CONFIG[pendingStatusChange.oldStatus]?.label || pendingStatusChange.oldStatus}
                  </span>{' '}
                  to{' '}
                  <span className={`font-medium ${STATUS_CONFIG[pendingStatusChange.newStatus]?.color.split(' ')[0] || ''}`}>
                    {STATUS_CONFIG[pendingStatusChange.newStatus]?.label || pendingStatusChange.newStatus}
                  </span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-stone-700 text-stone-300 hover:bg-stone-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={
                pendingStatusChange?.newStatus === 'rejected'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : pendingStatusChange?.newStatus === 'winner'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : pendingStatusChange?.newStatus === 'shortlisted'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
