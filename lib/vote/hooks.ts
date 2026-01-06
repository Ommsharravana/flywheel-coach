'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PresentingSubmission, UserTrackInfo, AudienceVote, DetailedVotingWindow } from './types';
import { getCurrentlyPresenting, getUserTrackInfo, getUserVote, getTrackQueue, getDetailedVotingWindow } from './services';

// ============================================
// REAL-TIME HOOKS FOR VOTING
// ============================================

/**
 * Hook to get and subscribe to user's track info
 */
export function useUserTrack(userId: string | null) {
  const [trackInfo, setTrackInfo] = useState<UserTrackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchTrackInfo() {
      if (!userId) return;
      try {
        const info = await getUserTrackInfo(userId);
        setTrackInfo(info);
        setError(info ? null : 'No track assignment found');
      } catch (err) {
        setError('Failed to load track info');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrackInfo();
  }, [userId]);

  return { trackInfo, loading, error };
}

/**
 * Hook to get and subscribe to currently presenting submission
 * Includes aggressive polling fallback when waiting for presentations to ensure
 * UI updates even if real-time subscription fails to trigger
 */
export function useCurrentPresentation(trackId: string | null) {
  const [presenting, setPresenting] = useState<PresentingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refetch = useCallback(async () => {
    if (!trackId) return;

    try {
      const current = await getCurrentlyPresenting(trackId);
      setPresenting(current);
      setError(null);
    } catch (err) {
      console.error('Error fetching presentation:', err);
      setError('Failed to load presentation');
    }
  }, [trackId]);

  useEffect(() => {
    if (!trackId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Initial fetch
    async function fetchPresentation() {
      if (!trackId) return;
      try {
        const current = await getCurrentlyPresenting(trackId);
        setPresenting(current);
      } catch (err) {
        setError('Failed to load presentation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPresentation();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`track-${trackId}-presentations`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submission_track_assignments',
          filter: `track_id=eq.${trackId}`,
        },
        async () => {
          // Refetch when presentation status changes
          if (trackId) {
            const current = await getCurrentlyPresenting(trackId);
            setPresenting(current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId]);

  // Polling fallback: When no presentation is active, poll aggressively (every 2s)
  // This ensures the UI updates even if real-time subscription fails
  useEffect(() => {
    // Only poll when we're waiting for a presentation (not currently showing one)
    if (!trackId || presenting !== null) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Poll every 2 seconds while waiting for presentation to start
    pollIntervalRef.current = setInterval(async () => {
      try {
        const current = await getCurrentlyPresenting(trackId);
        if (current) {
          setPresenting(current);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [trackId, presenting]);

  return { presenting, loading, error, refetch };
}

/**
 * Hook to get user's vote for a submission
 */
export function useUserVote(submissionId: string | null, voterId: string | null) {
  const [vote, setVote] = useState<AudienceVote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId || !voterId) {
      setLoading(false);
      return;
    }

    async function fetchVote() {
      if (!submissionId || !voterId) return;
      try {
        const userVote = await getUserVote(submissionId, voterId);
        setVote(userVote);
      } catch (err) {
        console.error('Error fetching vote:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVote();
  }, [submissionId, voterId]);

  return { vote, loading, setVote };
}

/**
 * Hook to get track presentation queue
 */
export function useTrackQueue(trackId: string | null) {
  const [queue, setQueue] = useState<PresentingSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchQueue() {
      if (!trackId) return;
      try {
        const trackQueue = await getTrackQueue(trackId);
        setQueue(trackQueue);
      } catch (err) {
        console.error('Error fetching queue:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchQueue();

    // Subscribe to changes
    const channel = supabase
      .channel(`track-${trackId}-queue`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submission_track_assignments',
          filter: `track_id=eq.${trackId}`,
        },
        async () => {
          if (!trackId) return;
          const trackQueue = await getTrackQueue(trackId);
          setQueue(trackQueue);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId]);

  return { queue, loading };
}

/**
 * Hook to get real-time voting window status with dramatic countdown
 */
export function useVotingWindow(submissionId: string | null) {
  const [window, setWindow] = useState<DetailedVotingWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch voting window status
  const fetchWindow = useCallback(async () => {
    if (!submissionId) return;

    try {
      const status = await getDetailedVotingWindow(submissionId);
      setWindow(status);
      if (status.secondsRemaining !== null) {
        setSecondsLeft(status.secondsRemaining);
      }
    } catch (err) {
      console.error('Error fetching voting window:', err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Initial fetch
    fetchWindow();

    // Poll every 5 seconds to stay in sync with server
    const pollInterval = setInterval(fetchWindow, 5000);

    // Subscribe to submission_track_assignments changes for this submission
    const channel = supabase
      .channel(`voting-window-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submission_track_assignments',
          filter: `submission_id=eq.${submissionId}`,
        },
        async () => {
          // Refetch when status changes (e.g., presenting_started_at is set)
          await fetchWindow();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [submissionId, fetchWindow]);

  // Client-side countdown timer (updates every second)
  const shouldRunTimer = secondsLeft !== null && secondsLeft > 0;

  useEffect(() => {
    if (!shouldRunTimer) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [shouldRunTimer]);

  // Derive urgency level from countdown
  const getUrgencyLevel = useCallback((seconds: number | null): DetailedVotingWindow['urgencyLevel'] => {
    if (seconds === null) return 'calm';
    if (seconds > 180) return 'calm';
    if (seconds > 120) return 'warning';
    if (seconds > 60) return 'urgent';
    return 'critical';
  }, []);

  // Calculate percentage remaining
  const percentageRemaining = secondsLeft !== null && window?.totalWindowSeconds
    ? Math.round((secondsLeft / window.totalWindowSeconds) * 100)
    : null;

  return {
    window,
    loading,
    secondsLeft,
    percentageRemaining,
    urgencyLevel: getUrgencyLevel(secondsLeft),
    isOpen: window?.isOpen ?? false,
    isPending: window?.status === 'pending',
    isExpired: window?.status === 'expired' || (secondsLeft !== null && secondsLeft <= 0),
    reason: window?.reason ?? '',
    refetch: fetchWindow,
  };
}
