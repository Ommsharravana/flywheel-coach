'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  CheckCircle,
  Circle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { RevealState } from '@/lib/admin/demo-day/reveal-state';
import type { LeaderboardEntry } from '@/lib/admin/demo-day/types';

interface TrackInfo {
  id: string;
  name: string;
  theme: string;
}

export default function RevealControlPage() {
  const [revealState, setRevealState] = useState<RevealState | null>(null);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [currentWinners, setCurrentWinners] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch reveal state
  const fetchState = async () => {
    try {
      const response = await fetch('/api/admin/demo-day/reveal');
      if (response.ok) {
        const { state, tracks: trackList, winners } = await response.json();
        setRevealState(state);
        setTracks(trackList || []);
        setCurrentWinners(winners || []);
      }
    } catch (error) {
      console.error('Error fetching state:', error);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/demo-day/reveal/advance', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error('Error advancing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async () => {
    try {
      const response = await fetch('/api/admin/demo-day/reveal/pause', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the reveal? This cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/demo-day/reveal/reset', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  const handleInitialize = async () => {
    if (!confirm('Initialize reveal state? This will set up the track order.')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/demo-day/reveal/initialize', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error('Error initializing:', error);
    }
  };

  if (!revealState) {
    return (
      <div className="min-h-screen bg-stone-950 p-8">
        <Card className="max-w-2xl mx-auto p-8 bg-stone-900 border-stone-800">
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold text-white">
              Reveal Control Panel
            </h1>
            <p className="text-stone-400">
              Reveal state not initialized
            </p>
            <Button
              onClick={handleInitialize}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Initialize Reveal
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentTrackIndex = revealState.current_track_index;
  const currentTrack = tracks[currentTrackIndex];
  const isComplete = currentTrackIndex >= tracks.length;

  const getNextAction = () => {
    if (revealState.current_place === null) {
      return 'Reveal 3rd Place';
    } else if (revealState.current_place === 3) {
      return 'Reveal 2nd Place';
    } else if (revealState.current_place === 2) {
      return 'Reveal 1st Place';
    } else if (revealState.current_place === 1) {
      return 'Next Track';
    }
    return 'Continue';
  };

  return (
    <div className="min-h-screen bg-stone-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-stone-900 border-stone-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                Reveal Control Panel
              </h1>
              <p className="text-stone-400 text-sm mt-1">
                Control the Grand Finale reveal sequence
              </p>
            </div>
            <a
              href="/reveal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Public View
            </a>
          </div>
        </Card>

        {/* Current Status */}
        {!isComplete && (
          <Card className="p-6 bg-stone-900 border-stone-800">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Current Track
                </h2>
                <div className="flex items-center justify-between p-4 rounded-lg bg-stone-800">
                  <div>
                    <div className="text-xl font-bold text-amber-400">
                      {currentTrack?.name}
                    </div>
                    <div className="text-sm text-stone-500">
                      {currentTrack?.theme}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-stone-400">
                      Track {currentTrackIndex + 1} of {tracks.length}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-stone-400 mb-2">
                  Reveal Progress
                </h3>
                <div className="flex gap-3">
                  {[3, 2, 1].map((place) => (
                    <div
                      key={place}
                      className={`
                        flex-1 p-3 rounded-lg border-2
                        ${
                          revealState.current_place !== null &&
                          revealState.current_place <= place
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-stone-800 border-stone-700'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'} Place
                        </span>
                        {revealState.current_place !== null &&
                        revealState.current_place <= place ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Controls */}
        <Card className="p-6 bg-stone-900 border-stone-800">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Controls</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Main Action Button */}
              <Button
                onClick={handleAdvance}
                disabled={loading || isComplete || revealState.is_paused}
                className="h-24 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isComplete ? (
                  'Complete'
                ) : (
                  <>
                    <ChevronRight className="w-6 h-6 mr-2" />
                    {getNextAction()}
                  </>
                )}
              </Button>

              {/* Pause/Resume */}
              <Button
                onClick={handleTogglePause}
                disabled={isComplete}
                variant="outline"
                className="h-24 text-lg border-2 border-stone-700 hover:bg-stone-800"
              >
                {revealState.is_paused ? (
                  <>
                    <Play className="w-6 h-6 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-6 h-6 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            </div>

            {/* Emergency Reset */}
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-2 border-red-900 text-red-400 hover:bg-red-950"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Emergency Reset
            </Button>
          </div>
        </Card>

        {/* Track Queue */}
        <Card className="p-6 bg-stone-900 border-stone-800">
          <h2 className="text-lg font-semibold text-white mb-4">Track Queue</h2>
          <div className="space-y-2">
            {tracks.map((track, index) => {
              const isRevealed = revealState.revealed_tracks.includes(track.id);
              const isCurrent = index === currentTrackIndex;

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    p-4 rounded-lg border-2
                    ${isCurrent ? 'bg-amber-500/20 border-amber-500' : ''}
                    ${isRevealed ? 'bg-emerald-500/10 border-emerald-500/30' : ''}
                    ${!isCurrent && !isRevealed ? 'bg-stone-800 border-stone-700' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {index + 1}. {track.name}
                      </div>
                      <div className="text-sm text-stone-500">{track.theme}</div>
                    </div>
                    <div>
                      {isRevealed && (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      )}
                      {isCurrent && !isRevealed && (
                        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Current Winners Preview */}
        {currentWinners.length > 0 && !isComplete && (
          <Card className="p-6 bg-stone-900 border-stone-800">
            <h2 className="text-lg font-semibold text-white mb-4">
              Current Track Winners
            </h2>
            <div className="space-y-2">
              {currentWinners.slice(0, 3).map((winner, index) => (
                <div
                  key={winner.submission_id}
                  className="p-3 rounded-lg bg-stone-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-amber-500 text-black' : ''}
                        ${index === 1 ? 'bg-slate-400 text-black' : ''}
                        ${index === 2 ? 'bg-orange-600 text-white' : ''}
                      `}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {winner.app_name}
                      </div>
                      <div className="text-xs text-stone-500">
                        #{winner.submission_number}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {winner.final_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-stone-500">Final Score</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Completion Message */}
        {isComplete && (
          <Card className="p-8 bg-gradient-to-br from-emerald-500/20 to-stone-900 border-emerald-500">
            <div className="text-center space-y-4">
              <Trophy className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">
                All Tracks Revealed!
              </h2>
              <p className="text-stone-300">
                Grand Finale complete. Congratulations to all winners!
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
