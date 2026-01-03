'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  FlaskConical,
  UserPlus,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { DemoDayState } from '@/lib/admin/demo-day/types';
import {
  getTrialModeStatus,
  setTrialMode,
  getEventJudges,
  getJudgingTracks,
  assignJudge,
  removeJudge,
  type JudgeInfo,
  type TrackInfo,
} from '@/lib/judge/admin-actions';

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

  // Trial mode state
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialModeLoading, setTrialModeLoading] = useState(false);

  // Judge management state
  const [judges, setJudges] = useState<JudgeInfo[]>([]);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newJudgeTrack, setNewJudgeTrack] = useState('');
  const [judgeActionLoading, setJudgeActionLoading] = useState(false);
  const [judgeMessage, setJudgeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch trial mode status and judges on mount
  useEffect(() => {
    async function fetchData() {
      const [trialResult, judgesResult, tracksResult] = await Promise.all([
        getTrialModeStatus(),
        getEventJudges(),
        getJudgingTracks(),
      ]);
      setIsTrialMode(trialResult.isTrialMode);
      setJudges(judgesResult.judges);
      setTracks(tracksResult.tracks);
      if (tracksResult.tracks.length > 0 && !newJudgeTrack) {
        setNewJudgeTrack(tracksResult.tracks[0].theme);
      }
    }
    fetchData();
  }, []);

  const handleTrialModeToggle = async () => {
    setTrialModeLoading(true);
    try {
      const result = await setTrialMode(!isTrialMode);
      if (result.success) {
        setIsTrialMode(!isTrialMode);
      }
    } finally {
      setTrialModeLoading(false);
    }
  };

  const handleAssignJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeEmail.trim() || !newJudgeTrack) return;

    setJudgeActionLoading(true);
    setJudgeMessage(null);
    try {
      const result = await assignJudge(newJudgeEmail.trim(), newJudgeTrack);
      if (result.success) {
        setJudgeMessage({ type: 'success', text: result.message || 'Judge assigned!' });
        setNewJudgeEmail('');
        // Refresh judges list
        const judgesResult = await getEventJudges();
        setJudges(judgesResult.judges);
      } else {
        setJudgeMessage({ type: 'error', text: result.error || 'Failed to assign judge' });
      }
    } finally {
      setJudgeActionLoading(false);
    }
  };

  const handleRemoveJudge = async (email: string, trackTheme: string) => {
    setJudgeActionLoading(true);
    try {
      const result = await removeJudge(email, trackTheme);
      if (result.success) {
        // Refresh judges list
        const judgesResult = await getEventJudges();
        setJudges(judgesResult.judges);
      }
    } finally {
      setJudgeActionLoading(false);
    }
  };

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

      {/* Trial Mode & Global Actions */}
      <Card className={isTrialMode ? 'border-purple-500/50 bg-purple-500/10' : 'glass-card'}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <FlaskConical className={`w-5 h-5 ${isTrialMode ? 'text-purple-400' : 'text-amber-400'}`} />
            Trial Mode & Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-800/50 border border-stone-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTrialMode ? 'bg-purple-500/20' : 'bg-stone-600/20'}`}>
                <FlaskConical className={`w-5 h-5 ${isTrialMode ? 'text-purple-400' : 'text-stone-400'}`} />
              </div>
              <div>
                <div className="font-medium text-stone-100">Trial Mode</div>
                <div className="text-sm text-stone-400">
                  {isTrialMode ? 'Enabled - Judge panel is visible for testing' : 'Disabled - Panel reveals on Demo Day'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {trialModeLoading && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
              <Switch
                checked={isTrialMode}
                onCheckedChange={handleTrialModeToggle}
                disabled={trialModeLoading}
              />
            </div>
          </div>

          {/* Global Actions */}
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

      {/* Judge Management */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-400" />
            Judge Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Judge Form */}
          <form onSubmit={handleAssignJudge} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="judge-email" className="sr-only">Email</Label>
              <Input
                id="judge-email"
                type="email"
                placeholder="Judge email address"
                value={newJudgeEmail}
                onChange={(e) => setNewJudgeEmail(e.target.value)}
                className="bg-stone-800 border-stone-700"
              />
            </div>
            <div className="w-48">
              <Label htmlFor="judge-track" className="sr-only">Track</Label>
              <select
                id="judge-track"
                value={newJudgeTrack}
                onChange={(e) => setNewJudgeTrack(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-stone-800 border border-stone-700 text-stone-100"
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.theme}>
                    {track.theme}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              disabled={judgeActionLoading || !newJudgeEmail.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {judgeActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span className="ml-2">Assign</span>
            </Button>
          </form>

          {/* Message */}
          {judgeMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              judgeMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {judgeMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {judgeMessage.text}
            </div>
          )}

          {/* Current Judges */}
          {judges.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-stone-400">Assigned Judges ({judges.length})</div>
              <div className="grid gap-2">
                {judges.map((judge) => (
                  <div
                    key={`${judge.user_id}-${judge.track_id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50 border border-stone-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-sm text-stone-300">
                        {judge.user_name?.[0] || judge.user_email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-stone-100">
                          {judge.user_name || judge.user_email}
                          {judge.is_lead && <span className="ml-2 text-xs text-amber-400">(Lead)</span>}
                        </div>
                        <div className="text-xs text-stone-500">{judge.track_theme}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveJudge(judge.user_email, judge.track_theme)}
                      className="text-stone-400 hover:text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-stone-500">
              No judges assigned yet. Add judges above.
            </div>
          )}
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
