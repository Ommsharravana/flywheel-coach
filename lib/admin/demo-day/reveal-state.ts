// Reveal state management for Demo Day finale
import { SupabaseClient } from '@supabase/supabase-js';

export interface RevealState {
  id: string;
  event_id: string;
  current_track_index: number;
  current_place: 1 | 2 | 3 | null; // null = not started, 3 = revealing 3rd, 2 = revealing 2nd, 1 = revealing 1st
  is_revealing: boolean;
  is_paused: boolean;
  tracks_order: string[]; // Array of track IDs in reveal order
  revealed_tracks: string[]; // Track IDs that have been fully revealed
  updated_at: string;
}

const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';

// Get current reveal state
export async function getRevealState(
  supabase: SupabaseClient
): Promise<RevealState | null> {
  const { data, error } = await supabase
    .from('demo_day_reveal_state')
    .select('*')
    .eq('event_id', APPATHON_EVENT_ID)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No state exists yet
      return null;
    }
    console.error('Error fetching reveal state:', error);
    throw new Error('Failed to fetch reveal state');
  }

  return data as RevealState;
}

// Initialize reveal state (call once at start of Demo Day)
export async function initializeRevealState(
  supabase: SupabaseClient,
  tracksOrder: string[]
): Promise<RevealState> {
  const initialState = {
    event_id: APPATHON_EVENT_ID,
    current_track_index: 0,
    current_place: null,
    is_revealing: false,
    is_paused: false,
    tracks_order: tracksOrder,
    revealed_tracks: [],
  };

  const { data, error } = await supabase
    .from('demo_day_reveal_state')
    .upsert(initialState, { onConflict: 'event_id' })
    .select()
    .single();

  if (error) {
    console.error('Error initializing reveal state:', error);
    throw new Error('Failed to initialize reveal state');
  }

  return data as RevealState;
}

// Advance to next reveal step (3rd → 2nd → 1st → next track)
export async function advanceReveal(
  supabase: SupabaseClient
): Promise<RevealState> {
  const currentState = await getRevealState(supabase);
  if (!currentState) {
    throw new Error('Reveal state not initialized');
  }

  const newState = { ...currentState };

  if (currentState.current_place === null) {
    // Start revealing 3rd place
    newState.current_place = 3;
    newState.is_revealing = true;
  } else if (currentState.current_place === 3) {
    // Move to 2nd place
    newState.current_place = 2;
  } else if (currentState.current_place === 2) {
    // Move to 1st place
    newState.current_place = 1;
  } else if (currentState.current_place === 1) {
    // Current track complete, move to next track
    const currentTrackId = currentState.tracks_order[currentState.current_track_index];
    newState.revealed_tracks = [...currentState.revealed_tracks, currentTrackId];
    newState.current_track_index = currentState.current_track_index + 1;
    newState.current_place = null;
    newState.is_revealing = false;

    // Check if all tracks are complete
    if (newState.current_track_index >= currentState.tracks_order.length) {
      newState.is_revealing = false;
      // All done!
    }
  }

  const { data, error } = await supabase
    .from('demo_day_reveal_state')
    .update({
      current_track_index: newState.current_track_index,
      current_place: newState.current_place,
      is_revealing: newState.is_revealing,
      revealed_tracks: newState.revealed_tracks,
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', APPATHON_EVENT_ID)
    .select()
    .single();

  if (error) {
    console.error('Error advancing reveal:', error);
    throw new Error('Failed to advance reveal');
  }

  return data as RevealState;
}

// Pause/resume reveal
export async function togglePause(
  supabase: SupabaseClient
): Promise<RevealState> {
  const currentState = await getRevealState(supabase);
  if (!currentState) {
    throw new Error('Reveal state not initialized');
  }

  const { data, error } = await supabase
    .from('demo_day_reveal_state')
    .update({
      is_paused: !currentState.is_paused,
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', APPATHON_EVENT_ID)
    .select()
    .single();

  if (error) {
    console.error('Error toggling pause:', error);
    throw new Error('Failed to toggle pause');
  }

  return data as RevealState;
}

// Reset reveal state (emergency)
export async function resetReveal(
  supabase: SupabaseClient
): Promise<RevealState> {
  const currentState = await getRevealState(supabase);
  if (!currentState) {
    throw new Error('Reveal state not initialized');
  }

  const { data, error } = await supabase
    .from('demo_day_reveal_state')
    .update({
      current_track_index: 0,
      current_place: null,
      is_revealing: false,
      is_paused: false,
      revealed_tracks: [],
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', APPATHON_EVENT_ID)
    .select()
    .single();

  if (error) {
    console.error('Error resetting reveal:', error);
    throw new Error('Failed to reset reveal');
  }

  return data as RevealState;
}
