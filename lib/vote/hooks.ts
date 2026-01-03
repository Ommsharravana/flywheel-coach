'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PresentingSubmission, UserTrackInfo, AudienceVote } from './types';
import { getCurrentlyPresenting, getUserTrackInfo, getUserVote, getTrackQueue } from './services';

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
 */
export function useCurrentPresentation(trackId: string | null) {
  const [presenting, setPresenting] = useState<PresentingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
