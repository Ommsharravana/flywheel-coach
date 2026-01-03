'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  VotingInterface,
  WaitingScreen,
  NoTrackAssignment,
} from '@/components/vote';
import {
  useUserTrack,
  useCurrentPresentation,
  useUserVote,
  useTrackQueue,
} from '@/lib/vote/hooks';
import type { AudienceVote } from '@/lib/vote/types';

interface VoteClientProps {
  userId: string;
  userName: string | null;
}

export function VoteClient({ userId, userName }: VoteClientProps) {
  const [lastVote, setLastVote] = useState<AudienceVote | null>(null);

  // Get user's track assignment
  const {
    trackInfo,
    loading: trackLoading,
    error: trackError
  } = useUserTrack(userId);

  // Get currently presenting submission in the track
  const {
    presenting,
    loading: presentingLoading,
    refetch: refetchPresentation
  } = useCurrentPresentation(trackInfo?.track_id || null);

  // Get queue for the track
  const { queue } = useTrackQueue(trackInfo?.track_id || null);

  // Get user's existing vote for current submission
  const {
    vote: existingVote,
    loading: voteLoading,
    setVote
  } = useUserVote(presenting?.id || null, userId);

  // Check if user is the presenter
  const isOwnSubmission = presenting?.user_id === userId;

  // Loading state
  const isLoading = trackLoading || presentingLoading || voteLoading;

  // Handle vote submission
  const handleVoteSubmitted = (vote: AudienceVote) => {
    setVote(vote);
    setLastVote(vote);
  };

  // Reset lastVote when presentation changes
  useEffect(() => {
    if (presenting?.id !== lastVote?.submission_id) {
      setLastVote(null);
    }
  }, [presenting?.id, lastVote?.submission_id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingHeader />
        <LoadingSkeleton />
      </div>
    );
  }

  // No track assignment
  if (trackError || !trackInfo) {
    return (
      <div className="space-y-6">
        <PageHeader userName={userName} />
        <NoTrackAssignment
          reason={trackError === 'No track assignment found' ? 'no-submission' : 'no-track'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with track info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
            Audience Voting
          </h1>
          <div className="flex items-center gap-2 mt-1 text-stone-400">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="font-medium">{trackInfo.track_name}</span>
            {trackInfo.room_location && (
              <>
                <span className="text-stone-600">|</span>
                <span>{trackInfo.room_location}</span>
              </>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPresentation()}
          className="w-fit"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Main content */}
      {presenting ? (
        <VotingInterface
          submission={presenting}
          voterId={userId}
          existingVote={existingVote}
          isOwnSubmission={isOwnSubmission}
          onVoteSubmitted={handleVoteSubmitted}
        />
      ) : (
        <WaitingScreen
          trackInfo={trackInfo}
          queue={queue}
        />
      )}

      {/* Attribution */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-stone-600"
      >
        Voting as {userName || 'Anonymous'} | Your votes are confidential
      </motion.p>
    </div>
  );
}

function PageHeader({ userName }: { userName: string | null }) {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
        Audience Voting
      </h1>
      <p className="text-stone-400 mt-1">
        Welcome, {userName || 'Builder'}
      </p>
    </div>
  );
}

function LoadingHeader() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-48 bg-stone-800 rounded-lg animate-pulse" />
      <div className="h-5 w-32 bg-stone-800/50 rounded animate-pulse" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="h-12 bg-stone-800 rounded-lg animate-pulse" />
      <div className="space-y-3">
        <div className="h-6 bg-stone-800/50 rounded animate-pulse" />
        <div className="h-4 bg-stone-800/30 rounded animate-pulse w-3/4" />
      </div>
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-14 h-14 bg-stone-800/30 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
