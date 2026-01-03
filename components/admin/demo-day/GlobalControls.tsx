'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  RadioTower,
  PauseCircle,
  Lock,
  Trophy,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { DemoDayState } from '@/lib/admin/demo-day/types';

interface GlobalControlsProps {
  state: DemoDayState;
  onCloseAllTracks: () => Promise<void>;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function GlobalControls({
  state,
  onCloseAllTracks,
  onRefresh,
  isRefreshing,
}: GlobalControlsProps) {
  const [confirmDialog, setConfirmDialog] = useState<'close-all' | 'reveal' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCloseAll = async () => {
    setActionLoading(true);
    try {
      await onCloseAllTracks();
    } finally {
      setActionLoading(false);
      setConfirmDialog(null);
    }
  };

  const activeTracks = state.tracks.filter(t => t.is_active).length;
  const totalTracks = state.tracks.length;

  return (
    <div className="space-y-4">
      {/* Live Status Banner */}
      <Card className={state.is_live ? 'border-green-500/50 bg-green-500/10' : 'glass-card'}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {state.is_live ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <RadioTower className="w-5 h-5 text-green-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-400">DEMO DAY LIVE</div>
                    <div className="text-sm text-stone-400">
                      {activeTracks} of {totalTracks} tracks active
                    </div>
                  </div>
                </>
              ) : state.results_revealed ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-400">RESULTS REVEALED</div>
                    <div className="text-sm text-stone-400">
                      All tracks have been closed
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-stone-500/20 flex items-center justify-center">
                    <PauseCircle className="w-5 h-5 text-stone-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-stone-400">NOT STARTED</div>
                    <div className="text-sm text-stone-500">
                      Waiting for demos to begin
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border-stone-700"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Actions */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Global Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/20 h-auto py-4"
              onClick={() => setConfirmDialog('close-all')}
              disabled={!state.is_live}
            >
              <div className="flex flex-col items-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Close All Tracks</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20 h-auto py-4"
              onClick={() => setConfirmDialog('reveal')}
              disabled={state.is_live || state.results_revealed}
            >
              <div className="flex flex-col items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span>Reveal Results</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={confirmDialog === 'close-all'}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <AlertDialogContent className="bg-stone-900 border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-100">Close All Tracks?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              This will close all {activeTracks} active tracks and lock all scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCloseAll}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Close All Tracks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDialog === 'reveal'}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <AlertDialogContent className="bg-stone-900 border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-stone-100">Reveal Results?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              This will make all scores and rankings publicly visible. Make sure all judging is complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-stone-800 border-stone-700 text-stone-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-amber-600 hover:bg-amber-700">
              Reveal Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
