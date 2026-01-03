'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Medal,
  Award,
  Lock,
  Sparkles,
  Clock,
  Loader2,
  ChevronRight,
  PartyPopper,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Winner {
  submission_id: string;
  submission_number: string;
  app_name: string;
  team_name: string | null;
  track_id: string;
  track_name: string;
  track_theme: string;
  rank: number;
  final_score: number;
  judge_score: number;
  audience_score: number;
  bonus_percentage: number;
}

interface TrackWinners {
  track_id: string;
  track_name: string;
  track_theme: string;
  winners: Winner[];
}

interface RevealState {
  is_revealed: boolean;
  reveal_time: string | null;
  tracks: TrackWinners[];
  overall_winner: Winner | null;
}

export default function GrandFinalePage() {
  const [state, setState] = useState<RevealState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedTracks, setRevealedTracks] = useState<Set<string>>(new Set());
  const [showOverall, setShowOverall] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch('/api/results');
      const data = await response.json();
      setState(data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    // Poll every 10 seconds for reveal status
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  // Countdown effect when reveal is imminent
  useEffect(() => {
    if (state?.reveal_time && !state.is_revealed) {
      const checkCountdown = () => {
        const revealDate = new Date(state.reveal_time!);
        const now = new Date();
        const diff = Math.floor((revealDate.getTime() - now.getTime()) / 1000);

        if (diff > 0 && diff <= 60) {
          setCountdown(diff);
        } else if (diff <= 0) {
          setCountdown(null);
          fetchResults();
        } else {
          setCountdown(null);
        }
      };

      checkCountdown();
      const timer = setInterval(checkCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [state?.reveal_time, state?.is_revealed, fetchResults]);

  // Auto-reveal tracks with animation delay
  useEffect(() => {
    if (state?.is_revealed && state.tracks.length > 0 && revealedTracks.size === 0) {
      // Sequentially reveal tracks
      state.tracks.forEach((track, index) => {
        setTimeout(() => {
          setRevealedTracks((prev) => new Set([...prev, track.track_id]));
        }, index * 2000); // 2 seconds between each track
      });

      // Reveal overall winner last
      setTimeout(() => {
        setShowOverall(true);
      }, state.tracks.length * 2000 + 1000);
    }
  }, [state?.is_revealed, state?.tracks, revealedTracks.size]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-7 h-7 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankGradient = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 via-yellow-600/10 to-transparent';
    if (rank === 2) return 'from-gray-400/20 via-gray-500/10 to-transparent';
    if (rank === 3) return 'from-amber-600/20 via-amber-700/10 to-transparent';
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
          <p className="text-stone-400">Loading results...</p>
        </div>
      </div>
    );
  }

  // Pre-reveal state
  if (!state?.is_revealed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="glass-card border-amber-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
            <CardContent className="relative p-8 text-center space-y-6">
              {/* Countdown */}
              {countdown !== null && countdown > 0 ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500"
                  >
                    <span className="text-4xl font-bold text-amber-400 font-mono">{countdown}</span>
                  </motion.div>
                  <h1 className="text-2xl font-display font-bold text-stone-100">
                    Results Revealing In...
                  </h1>
                  <p className="text-stone-400">
                    Get ready for the winners!
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-800/50 border-2 border-stone-600"
                  >
                    <Lock className="w-10 h-10 text-stone-400" />
                  </motion.div>
                  <h1 className="text-2xl font-display font-bold text-stone-100">
                    Results Coming Soon
                  </h1>
                  <p className="text-stone-400">
                    Winners will be revealed during the Grand Finale ceremony at 4:00 PM.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Stay tuned!</span>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Link href="/vote">
                  <Button variant="outline" className="border-amber-500/30 text-amber-400">
                    View Voting Page
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Results revealed state
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 py-8 px-4">
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30"
        >
          <PartyPopper className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400 font-medium">Appathon 2.0 Winners</span>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
          Grand Finale Results
        </h1>

        <p className="text-stone-400 max-w-2xl mx-auto">
          Congratulations to all participants! Here are the winners of Appathon 2.0 across all tracks.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Track Winners */}
        <AnimatePresence>
          {state.tracks.map((track, trackIndex) => (
            <motion.div
              key={track.track_id}
              initial={{ opacity: 0, x: -100 }}
              animate={revealedTracks.has(track.track_id) ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-card overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-purple-500/5" />
                <CardContent className="relative p-6">
                  {/* Track Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-2">
                        {track.track_theme}
                      </Badge>
                      <h2 className="text-xl font-bold text-stone-100">{track.track_name}</h2>
                    </div>
                    <Trophy className="w-8 h-8 text-amber-400" />
                  </div>

                  {/* Winners Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {track.winners.slice(0, 3).map((winner, idx) => (
                      <motion.div
                        key={winner.submission_id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={revealedTracks.has(track.track_id) ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                        transition={{ delay: 0.3 + idx * 0.2 }}
                        className={cn(
                          'p-4 rounded-xl border bg-gradient-to-br',
                          getRankGradient(winner.rank),
                          winner.rank === 1 && 'border-yellow-500/50',
                          winner.rank === 2 && 'border-gray-400/50',
                          winner.rank === 3 && 'border-amber-600/50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          {getRankIcon(winner.rank)}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-stone-100">
                              {winner.final_score.toFixed(1)}
                            </div>
                            <div className="text-xs text-stone-500">Final Score</div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-stone-100 mb-1">
                          {winner.app_name}
                        </h3>
                        <p className="text-sm text-stone-400">
                          {winner.team_name || `#${winner.submission_number}`}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-stone-500">
                          <span>Judge: {winner.judge_score.toFixed(1)}</span>
                          <span>•</span>
                          <span>Audience: {winner.audience_score.toFixed(1)}</span>
                          {winner.bonus_percentage > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">+{winner.bonus_percentage.toFixed(0)}%</span>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Overall Winner */}
        <AnimatePresence>
          {showOverall && state.overall_winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <Card className="border-2 border-yellow-500/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-purple-500/10" />
                <CardContent className="relative p-8 text-center">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 border-4 border-yellow-500 mb-6"
                  >
                    <Trophy className="w-10 h-10 text-yellow-400" />
                  </motion.div>

                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mb-4">
                    🏆 Grand Champion
                  </Badge>

                  <h2 className="text-3xl font-display font-bold text-yellow-400 mb-2">
                    {state.overall_winner.app_name}
                  </h2>
                  <p className="text-stone-400 mb-4">
                    {state.overall_winner.team_name || `Team #${state.overall_winner.submission_number}`}
                  </p>

                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-stone-100">
                        {state.overall_winner.final_score.toFixed(2)}
                      </div>
                      <div className="text-stone-500">Final Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-stone-300">
                        {state.overall_winner.track_theme}
                      </div>
                      <div className="text-stone-500">Category</div>
                    </div>
                  </div>

                  <motion.div
                    className="mt-6 flex justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                      >
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
