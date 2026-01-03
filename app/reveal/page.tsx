'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import { WinnerCard } from '@/components/reveal/WinnerCard';
import { Confetti } from '@/components/reveal/Confetti';
import type { LeaderboardEntry } from '@/lib/admin/demo-day/types';
import type { RevealState } from '@/lib/admin/demo-day/reveal-state';

export default function RevealPage() {
  const [revealState, setRevealState] = useState<RevealState | null>(null);
  const [trackWinners, setTrackWinners] = useState<LeaderboardEntry[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentTrackName, setCurrentTrackName] = useState('');

  // Poll for reveal state updates
  useEffect(() => {
    const fetchRevealState = async () => {
      try {
        const response = await fetch('/api/admin/demo-day/reveal');
        if (response.ok) {
          const { state, winners, trackName } = await response.json();
          setRevealState(state);
          setTrackWinners(winners || []);
          setCurrentTrackName(trackName || '');
        }
      } catch (error) {
        console.error('Error fetching reveal state:', error);
      }
    };

    fetchRevealState();
    const interval = setInterval(fetchRevealState, 1000); // Poll every second

    return () => clearInterval(interval);
  }, []);

  // Trigger confetti when 1st place is revealed
  useEffect(() => {
    if (revealState?.current_place === 1) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [revealState?.current_place]);

  if (!revealState) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="w-24 h-24 text-amber-500 mx-auto animate-pulse" />
          <h1 className="text-4xl font-bold text-white">
            Grand Finale
          </h1>
          <p className="text-stone-400">
            Waiting for reveal to begin...
          </p>
        </div>
      </div>
    );
  }

  // Check if all tracks are revealed
  const allTracksRevealed = revealState.current_track_index >= revealState.tracks_order.length;

  if (allTracksRevealed) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Confetti active={true} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <Trophy className="w-32 h-32 text-amber-500 mx-auto" />
          <h1 className="text-6xl font-bold text-white">
            Congratulations!
          </h1>
          <p className="text-2xl text-stone-300">
            All winners revealed
          </p>
          <div className="mt-8 text-amber-400 text-xl">
            🎉 Appathon 2.0 - Thank you to all participants! 🎉
          </div>
        </motion.div>
      </div>
    );
  }

  const currentTrackIndex = revealState.current_track_index;
  const totalTracks = revealState.tracks_order.length;
  const isRevealing = revealState.is_revealing;

  return (
    <div className="min-h-screen bg-stone-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-stone-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

      <Confetti active={showConfetti} />

      <div className="relative max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-semibold text-amber-400">
              Appathon 2.0 Grand Finale
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            {currentTrackName}
          </h1>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 text-stone-400">
            <span>Track {currentTrackIndex + 1} of {totalTracks}</span>
            <div className="flex gap-2">
              {Array.from({ length: totalTracks }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-3 h-3 rounded-full
                    ${i < currentTrackIndex ? 'bg-emerald-500' : ''}
                    ${i === currentTrackIndex ? 'bg-amber-500 animate-pulse' : ''}
                    ${i > currentTrackIndex ? 'bg-stone-700' : ''}
                  `}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Winners Display */}
        {!isRevealing && revealState.current_place === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Trophy className="w-24 h-24 text-amber-500 mx-auto mb-6 animate-pulse" />
            <p className="text-2xl text-stone-300">
              Preparing to reveal winners...
            </p>
          </motion.div>
        )}

        {isRevealing && trackWinners.length > 0 && (
          <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 3rd Place */}
            <div className="flex items-end">
              <div className="w-full">
                {trackWinners[2] && (
                  <WinnerCard
                    winner={trackWinners[2]}
                    place={3}
                    revealed={revealState.current_place !== null && revealState.current_place <= 3}
                  />
                )}
              </div>
            </div>

            {/* 1st Place (Center, larger) */}
            <div className="flex items-end -mt-8">
              <div className="w-full">
                {trackWinners[0] && (
                  <WinnerCard
                    winner={trackWinners[0]}
                    place={1}
                    revealed={revealState.current_place === 1}
                  />
                )}
              </div>
            </div>

            {/* 2nd Place */}
            <div className="flex items-end">
              <div className="w-full">
                {trackWinners[1] && (
                  <WinnerCard
                    winner={trackWinners[1]}
                    place={2}
                    revealed={revealState.current_place !== null && revealState.current_place <= 2}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pause Indicator */}
        <AnimatePresence>
          {revealState.is_paused && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2"
            >
              <div className="px-6 py-3 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                <span className="text-yellow-400 font-semibold">
                  ⏸️ Paused
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
