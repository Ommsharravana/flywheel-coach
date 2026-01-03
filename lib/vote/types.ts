// ============================================
// AUDIENCE VOTING TYPES
// ============================================

export type Reaction = 'love' | 'innovative' | 'useful' | 'polished' | 'impactful';

export interface PresentingSubmission {
  id: string;
  submission_number: string;
  app_name: string;
  category: string;
  description: string | null;
  app_url: string | null;
  user_id: string;
  user_name: string | null;
  track_id: string;
  track_name: string;
  demo_slot: number | null;
  status: 'pending' | 'presenting' | 'completed' | 'skipped';
}

export interface AudienceVote {
  id: string;
  submission_id: string;
  voter_id: string | null;
  rating: number;
  reaction: Reaction | null;
  voted_at: string;
}

export interface UserTrackInfo {
  track_id: string;
  track_name: string;
  theme: string;
  room_location: string | null;
  submission_id: string | null; // User's own submission in this track
}

export interface VoteStats {
  submission_id: string;
  total_votes: number;
  average_rating: number;
  reactions: Record<Reaction, number>;
}

export const REACTIONS: { id: Reaction; emoji: string; label: string }[] = [
  { id: 'love', emoji: '💖', label: 'Love it!' },
  { id: 'innovative', emoji: '💡', label: 'Innovative' },
  { id: 'useful', emoji: '🎯', label: 'Useful' },
  { id: 'polished', emoji: '✨', label: 'Polished' },
  { id: 'impactful', emoji: '🌍', label: 'Impactful' },
];
