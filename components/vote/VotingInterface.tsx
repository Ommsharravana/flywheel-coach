'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating, StarDisplay } from './StarRating';
import { ReactionSelector } from './ReactionSelector';
import { PresentingTeamCard } from './PresentingTeamCard';
import { submitVote, getVotingWindowStatus } from '@/lib/vote/services';
import type { PresentingSubmission, AudienceVote, Reaction, VotingWindowStatus } from '@/lib/vote/types';

interface VotingInterfaceProps {
  submission: PresentingSubmission;
  voterId: string;
  existingVote: AudienceVote | null;
  isOwnSubmission: boolean;
  onVoteSubmitted?: (vote: AudienceVote) => void;
}

export function VotingInterface({
  submission,
  voterId,
  existingVote,
  isOwnSubmission,
  onVoteSubmitted,
}: VotingInterfaceProps) {
  const [rating, setRating] = useState(existingVote?.rating || 0);
  const [reaction, setReaction] = useState<Reaction | null>(existingVote?.reaction || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(existingVote !== null);
  const [error, setError] = useState<string | null>(null);
  const [votingWindow, setVotingWindow] = useState<VotingWindowStatus | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Fetch voting window status
  useEffect(() => {
    const fetchStatus = async () => {
      const status = await getVotingWindowStatus(submission.id);
      setVotingWindow(status);
      if (status.seconds_remaining !== null) {
        setSecondsLeft(status.seconds_remaining);
      }
    };
    fetchStatus();
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [submission.id]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isVotingClosed = votingWindow !== null && !votingWindow.is_open && !hasSubmitted;

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || isOwnSubmission) return;

    setIsSubmitting(true);
    setError(null);

    const result = await submitVote(submission.id, voterId, rating, reaction || undefined);

    setIsSubmitting(false);

    if (result.success) {
      setHasSubmitted(true);
      onVoteSubmitted?.({
        id: '', // Will be filled by server
        submission_id: submission.id,
        voter_id: voterId,
        rating,
        reaction,
        voted_at: new Date().toISOString(),
      });
    } else {
      setError(result.error || 'Failed to submit vote');
    }
  }, [rating, reaction, submission.id, voterId, isOwnSubmission, onVoteSubmitted]);

  return (
    <div className="space-y-6">
      {/* Presenting team info */}
      <PresentingTeamCard
        submission={submission}
        isOwnSubmission={isOwnSubmission}
      />

      {/* Voting UI */}
      {!isOwnSubmission && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          {/* Voting Timer */}
          {secondsLeft !== null && secondsLeft > 0 && !hasSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
                secondsLeft <= 60
                  ? 'bg-red-500/20 border border-red-500/30'
                  : secondsLeft <= 120
                  ? 'bg-orange-500/20 border border-orange-500/30'
                  : 'bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Clock className={`w-5 h-5 ${secondsLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
              <div className="text-center">
                <div className={`text-2xl font-bold font-mono ${secondsLeft <= 60 ? 'text-red-400' : 'text-amber-400'}`}>
                  {formatTime(secondsLeft)}
                </div>
                <div className="text-xs text-stone-400">
                  {secondsLeft <= 60 ? 'Hurry! Vote before time runs out' : 'Time remaining to vote'}
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Voting Closed State */}
            {isVotingClosed ? (
              <motion.div
                key="closed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-500/20 border-2 border-stone-500"
                >
                  <Lock className="w-8 h-8 text-stone-400" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-stone-300">
                  Voting Window Closed
                </h3>
                <p className="text-stone-400">
                  {votingWindow?.reason || 'The voting window for this presentation has ended.'}
                </p>
              </motion.div>
            ) : hasSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500"
                >
                  <Check className="w-8 h-8 text-green-400" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-stone-100">
                  Vote Submitted!
                </h3>
                <p className="text-stone-400">
                  Thank you for your feedback. Next team coming up...
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-stone-500">Your rating:</span>
                  <StarDisplay rating={rating} size="md" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="voting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Star rating section */}
                <div className="text-center space-y-4">
                  <h3 className="font-display text-lg font-semibold text-stone-200">
                    How would you rate this app?
                  </h3>
                  <StarRating
                    value={rating}
                    onChange={setRating}
                    disabled={isSubmitting}
                  />
                  {rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-amber-400 font-medium"
                    >
                      {rating === 5 ? 'Outstanding!' :
                       rating === 4 ? 'Great work!' :
                       rating === 3 ? 'Good effort!' :
                       rating === 2 ? 'Needs improvement' :
                       'Keep working on it'}
                    </motion.p>
                  )}
                </div>

                {/* Reaction selector */}
                <div className="space-y-4">
                  <h4 className="text-center text-sm text-stone-400">
                    Add a reaction (optional)
                  </h4>
                  <ReactionSelector
                    selected={reaction}
                    onChange={setReaction}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Error display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30
                                 rounded-lg px-4 py-3 text-rose-300"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600
                             hover:from-amber-400 hover:to-orange-500
                             text-stone-950 font-semibold text-lg py-6
                             disabled:opacity-50 disabled:cursor-not-allowed
                             shadow-lg shadow-orange-500/25
                             transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Submit Vote</>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
