'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutGrid, Trophy } from 'lucide-react';
import Link from 'next/link';
import {
  TrackCard,
  TrackDrilldown,
  LeaderboardView,
  GlobalControls,
  DemoDayStats,
  AIAssistant,
} from '@/components/admin/demo-day';
import type {
  DemoDayState,
  TrackSubmission,
  LeaderboardEntry,
  TrackOverview,
} from '@/lib/admin/demo-day/types';

export default function DemoDayPage() {
  const [state, setState] = useState<DemoDayState | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [trackSubmissions, setTrackSubmissions] = useState<TrackSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tracks' | 'leaderboard'>('tracks');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const fetchState = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/demo-day');
      const data = await response.json();
      if (data.data) {
        setState(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch state:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchTrackSubmissions = useCallback(async (trackId: string) => {
    setIsTrackLoading(true);
    try {
      const response = await fetch(`/api/admin/demo-day/tracks/${trackId}`);
      const data = await response.json();
      if (data.data) {
        setTrackSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch track submissions:', error);
    } finally {
      setIsTrackLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/demo-day/leaderboard');
      const data = await response.json();
      if (data.data) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchLeaderboard();
  }, [fetchState, fetchLeaderboard]);

  useEffect(() => {
    if (selectedTrack) {
      fetchTrackSubmissions(selectedTrack);
    }
  }, [selectedTrack, fetchTrackSubmissions]);

  // Auto-refresh every 30 seconds when live
  useEffect(() => {
    if (state?.is_live) {
      const interval = setInterval(() => {
        fetchState();
        if (selectedTrack) {
          fetchTrackSubmissions(selectedTrack);
        }
        fetchLeaderboard();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [state?.is_live, selectedTrack, fetchState, fetchTrackSubmissions, fetchLeaderboard]);

  const handleRefresh = () => {
    fetchState(true);
    if (selectedTrack) {
      fetchTrackSubmissions(selectedTrack);
    }
    fetchLeaderboard();
  };

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrack(trackId);
  };

  const handleBackToOverview = () => {
    setSelectedTrack(null);
  };

  const handleAdvancePresenter = async (submissionId?: string) => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/advance-presenter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, submission_id: submissionId }),
    });
  };

  const handleSkipTeam = async (submissionId: string, reason?: string) => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/skip-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, submission_id: submissionId, reason }),
    });
  };

  const handleMoveToEnd = async (submissionId: string) => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/move-to-end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, submission_id: submissionId }),
    });
  };

  const handleCloseTrack = async () => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/close-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack }),
    });
    handleRefresh();
  };

  const handleReopenTrack = async () => {
    if (!selectedTrack) return;
    await fetch('/api/admin/demo-day/close-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: selectedTrack, action: 'reopen' }),
    });
    handleRefresh();
  };

  const handleCloseAllTracks = async () => {
    if (!state) return;
    for (const track of state.tracks.filter(t => t.is_active)) {
      await fetch('/api/admin/demo-day/close-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: track.id }),
      });
    }
    handleRefresh();
  };

  const handleExport = async (trackId?: string) => {
    setIsExporting(true);
    try {
      const url = trackId
        ? `/api/admin/demo-day/export-results?track_id=${trackId}`
        : '/api/admin/demo-day/export-results';
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `appathon-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedTrackData = state?.tracks.find(t => t.id === selectedTrack);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-stone-400">Failed to load Demo Day data</p>
          <Button onClick={() => fetchState()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedTrack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToOverview}
              className="text-stone-400 hover:text-stone-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          ) : (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="text-stone-400 hover:text-stone-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Demo Day Command Center
        </h1>
        <div className="w-32" /> {/* Spacer for alignment */}
      </div>

      {/* Global Controls & Stats */}
      {!selectedTrack && (
        <>
          <GlobalControls
            state={state}
            onCloseAllTracks={handleCloseAllTracks}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          <AIAssistant state={state} onRefresh={handleRefresh} />
          <DemoDayStats state={state} />
        </>
      )}

      {/* Main Content */}
      {selectedTrack && selectedTrackData ? (
        <TrackDrilldown
          track={selectedTrackData}
          submissions={trackSubmissions}
          isLoading={isTrackLoading}
          onAdvancePresenter={handleAdvancePresenter}
          onSkipTeam={handleSkipTeam}
          onMoveToEnd={handleMoveToEnd}
          onCloseTrack={handleCloseTrack}
          onReopenTrack={handleReopenTrack}
          onRefresh={() => {
            fetchTrackSubmissions(selectedTrack);
            fetchState();
          }}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="bg-stone-800/50 border border-stone-700">
            <TabsTrigger
              value="tracks"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Tracks Overview
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onSelect={handleSelectTrack}
                  isSelected={selectedTrack === track.id}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardView
              entries={leaderboard}
              tracks={state.tracks}
              isLoading={false}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
