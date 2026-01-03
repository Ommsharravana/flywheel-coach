'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Play,
  SkipForward,
  ArrowDownToLine,
  CheckCircle2,
  X,
  Loader2,
  Star,
  Users,
  Lock,
  Unlock,
} from 'lucide-react';
import type { TrackSubmission, TrackOverview } from '@/lib/admin/demo-day/types';
import { cn } from '@/lib/utils';

interface TrackDrilldownProps {
  track: TrackOverview;
  submissions: TrackSubmission[];
  isLoading: boolean;
  onAdvancePresenter: (submissionId?: string) => Promise<void>;
  onSkipTeam: (submissionId: string, reason?: string) => Promise<void>;
  onMoveToEnd: (submissionId: string) => Promise<void>;
  onCloseTrack: () => Promise<void>;
  onReopenTrack: () => Promise<void>;
  onRefresh: () => void;
}

export function TrackDrilldown({
  track,
  submissions,
  isLoading,
  onAdvancePresenter,
  onSkipTeam,
  onMoveToEnd,
  onCloseTrack,
  onReopenTrack,
  onRefresh,
}: TrackDrilldownProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'skip' | 'close' | 'reopen' | null;
    submissionId?: string;
    appName?: string;
  }>({ type: null });

  const handleAction = async (action: () => Promise<void>, actionKey: string) => {
    setActionLoading(actionKey);
    try {
      await action();
      onRefresh();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'presenting':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Done</Badge>;
      case 'skipped':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Skipped</Badge>;
      default:
        return <Badge className="bg-stone-500/20 text-stone-400 border-stone-500/30">Pending</Badge>;
    }
  };

  const currentPresenter = submissions.find(s => s.status === 'presenting');
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Track Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-stone-100">{track.name}</CardTitle>
              <p className="text-sm text-stone-400 mt-1">
                {track.completed_count} of {track.total_submissions} demos completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction(onAdvancePresenter, 'advance')}
                disabled={!pendingSubmissions.length || actionLoading === 'advance'}
                className="border-green-500/30 text-green-400 hover:bg-green-500/20"
              >
                {actionLoading === 'advance' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <SkipForward className="w-4 h-4 mr-2" />
                )}
                Next Presenter
              </Button>
              {track.is_active ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog({ type: 'close' })}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Close Track
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog({ type: 'reopen' })}
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Reopen Track
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Presenter Highlight */}
      {currentPresenter && (
        <Card className="border-2 border-green-500/50 bg-green-500/10">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-xs text-green-400 font-medium">NOW PRESENTING</div>
                  <div className="text-xl font-bold text-stone-100">
                    {currentPresenter.app_name}
                  </div>
                  <div className="text-sm text-stone-400">
                    #{currentPresenter.submission_number} - {currentPresenter.user?.name || currentPresenter.user?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-lg font-bold text-stone-100">
                      {currentPresenter.judges_completed}/{currentPresenter.judge_target}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">Judges Scored</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-lg font-bold text-stone-100">
                      {currentPresenter.audience_avg_rating?.toFixed(1) || '-'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    {currentPresenter.audience_vote_count} votes
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Slot</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Builder</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Judges</TableHead>
                  <TableHead className="text-center">Audience</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow
                    key={sub.id}
                    className={cn(
                      sub.status === 'presenting' && 'bg-green-500/10',
                      sub.status === 'skipped' && 'opacity-50'
                    )}
                  >
                    <TableCell className="font-mono text-stone-400">
                      {sub.demo_slot || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-stone-100">{sub.app_name}</div>
                        <div className="text-xs text-stone-500">#{sub.submission_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-stone-400">
                        {sub.user?.name || sub.user?.email || 'Unknown'}
                      </div>
                      {sub.user?.institution && (
                        <div className="text-xs text-stone-500">{sub.user.institution}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(sub.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={cn(
                            'font-medium',
                            sub.judges_completed === sub.judge_target
                              ? 'text-green-400'
                              : 'text-stone-400'
                          )}
                        >
                          {sub.judges_completed}/{sub.judge_target}
                        </span>
                        {sub.judges_completed === sub.judge_target && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-stone-100">
                          {sub.audience_avg_rating?.toFixed(1) || '-'}
                        </span>
                        <span className="text-stone-500 text-xs">
                          ({sub.audience_vote_count})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-stone-100">
                      {sub.final_score?.toFixed(1) || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sub.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(() => onAdvancePresenter(sub.submission_id), `set-${sub.id}`)}
                              disabled={actionLoading === `set-${sub.id}`}
                              title="Set as current presenter"
                            >
                              {actionLoading === `set-${sub.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4 text-green-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(() => onMoveToEnd(sub.submission_id), `move-${sub.id}`)}
                              disabled={actionLoading === `move-${sub.id}`}
                              title="Move to end of queue"
                            >
                              {actionLoading === `move-${sub.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDialog({
                                type: 'skip',
                                submissionId: sub.submission_id,
                                appName: sub.app_name
                              })}
                              title="Skip (no-show)"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </>
                        )}
                        {sub.status === 'presenting' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDialog({
                              type: 'skip',
                              submissionId: sub.submission_id,
                              appName: sub.app_name
                            })}
                            title="Skip current presenter"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={confirmDialog.type === 'skip'}
        onOpenChange={() => setConfirmDialog({ type: null })}
      >
        <AlertDialogContent className="bg-stone-900 border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-100">Skip Team?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              Are you sure you want to skip "{confirmDialog.appName}"? This will mark them as no-show.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (confirmDialog.submissionId) {
                  handleAction(() => onSkipTeam(confirmDialog.submissionId!, 'No-show'), 'skip');
                }
                setConfirmDialog({ type: null });
              }}
            >
              Skip Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDialog.type === 'close'}
        onOpenChange={() => setConfirmDialog({ type: null })}
      >
        <AlertDialogContent className="bg-stone-900 border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-100">Close Track?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              This will close "{track.name}" and lock all scores. Any pending submissions will be marked as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                handleAction(onCloseTrack, 'close');
                setConfirmDialog({ type: null });
              }}
            >
              Close Track
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDialog.type === 'reopen'}
        onOpenChange={() => setConfirmDialog({ type: null })}
      >
        <AlertDialogContent className="bg-stone-900 border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-100">Reopen Track?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              This will reopen "{track.name}" for additional judging.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                handleAction(onReopenTrack, 'reopen');
                setConfirmDialog({ type: null });
              }}
            >
              Reopen Track
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
