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
      // Defer setState to avoid synchronous call in effect body
      const showTimer = setTimeout(() => setShowConfetti(true), 0);
      const hideTimer = setTimeout(() => setShowConfetti(false), 4000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [revealState?.current_place]);

  if (!revealState) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/10 via-transparent to-[#ffde59]/5" />
        <div className="relative text-center space-y-4">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#ffde59]/20 border-2 border-[#ffde59]/50">
            <Trophy className="w-16 h-16 text-[#ffde59] animate-pulse" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white">
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/10 via-transparent to-[#ffde59]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ffde59]/10 via-transparent to-transparent" />
        <Confetti active={true} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative text-center space-y-6"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Trophy className="w-32 h-32 text-[#ffde59] mx-auto drop-shadow-[0_0_30px_rgba(255,222,89,0.5)]" />
          </motion.div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold text-white">
            Congratulations!
          </h1>
          <p className="text-xl sm:text-2xl text-stone-300">
            All winners revealed
          </p>
          <div className="mt-8 px-6 py-3 rounded-full bg-[#0b6d41]/20 border border-[#0b6d41]/40 inline-block">
            <span className="text-[#ffde59] text-xl font-semibold">
              Appathon 2.0 - Thank you to all participants!
            </span>
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/10 via-transparent to-[#ffde59]/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ffde59]/10 via-transparent to-transparent" />

      <Confetti active={showConfetti} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#0b6d41]/20 border border-[#0b6d41]/40 mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffde59]" />
            <span className="text-sm sm:text-lg font-semibold text-[#ffde59]">
              Appathon 2.0 Grand Finale
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
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
                    w-3 h-3 rounded-full transition-all duration-300
                    ${i < currentTrackIndex ? 'bg-[#0b6d41]' : ''}
                    ${i === currentTrackIndex ? 'bg-[#ffde59] animate-pulse shadow-[0_0_10px_rgba(255,222,89,0.5)]' : ''}
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
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Trophy className="w-24 h-24 text-[#ffde59] mx-auto mb-6 drop-shadow-[0_0_20px_rgba(255,222,89,0.4)]" />
            </motion.div>
            <p className="text-2xl text-stone-300">
              Preparing to reveal winners...
            </p>
          </motion.div>
        )}

        {isRevealing && trackWinners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
            {/* 3rd Place - Show third on mobile, first on desktop */}
            <div className="flex items-end order-3 sm:order-1">
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

            {/* 1st Place (Center, larger) - Show first on mobile */}
            <div className="flex items-end sm:-mt-8 order-1 sm:order-2">
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

            {/* 2nd Place - Show second on mobile */}
            <div className="flex items-end order-2 sm:order-3">
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
              <div className="px-6 py-3 rounded-full bg-[#ffde59]/20 border border-[#ffde59]/40 shadow-[0_0_20px_rgba(255,222,89,0.2)]">
                <span className="text-[#ffde59] font-semibold">
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
