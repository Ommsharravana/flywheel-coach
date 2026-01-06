import { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import type {
  SubmissionForAssignment,
  TrackSuggestion,
  TrackInfo,
  AIAssignmentResult,
  TrackTheme,
} from './ai-assign-types';
import { TRACK_THEMES } from './ai-assign-types';

const APPATHON_EVENT_ID = '003089a3-8b28-4844-9714-b94f9b838462';
const MAX_SUBMISSIONS_PER_PANEL = 50;

/**
 * Get all submissions that need track assignment
 */
export async function getSubmissionsForAssignment(
  supabase: SupabaseClient
): Promise<SubmissionForAssignment[]> {
  // Get all approved submissions for the event
  const { data: submissions, error } = await supabase
    .from('appathon_submissions')
    .select(`
      id,
      submission_number,
      app_name,
      category,
      problem_statement,
      user_id,
      users!appathon_submissions_user_id_fkey (
        name,
        institution
      ),
      submission_track_assignments (
        track_id,
        judging_tracks (
          id,
          name
        )
      )
    `)
    .eq('event_id', APPATHON_EVENT_ID)
    .eq('status', 'submitted');

  if (error) {
    console.error('Error fetching submissions:', error);
    throw new Error('Failed to fetch submissions');
  }

  return (submissions || []).map((sub) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSub = sub as any;
    const assignment = typedSub.submission_track_assignments?.[0];

    return {
      id: typedSub.id,
      submission_number: typedSub.submission_number,
      app_name: typedSub.app_name,
      category: typedSub.category,
      description: typedSub.problem_statement,
      user_name: typedSub.users?.name || null,
      institution: typedSub.users?.institution || null,
      current_track_id: assignment?.track_id || null,
      current_track_name: assignment?.judging_tracks?.name || null,
    };
  });
}

/**
 * Get all judging tracks for the event
 */
export async function getJudgingTracks(
  supabase: SupabaseClient
): Promise<TrackInfo[]> {
  const { data: tracks, error: tracksError } = await supabase
    .from('judging_tracks')
    .select('id, name, theme')
    .eq('event_id', APPATHON_EVENT_ID)
    .order('demo_order');

  if (tracksError) {
    console.error('Error fetching tracks:', tracksError);
    throw new Error('Failed to fetch tracks');
  }

  // Get submission counts per track
  const { data: assignments } = await supabase
    .from('submission_track_assignments')
    .select('track_id')
    .in('track_id', (tracks || []).map(t => t.id));

  const countMap = new Map<string, number>();
  (assignments || []).forEach(a => {
    countMap.set(a.track_id, (countMap.get(a.track_id) || 0) + 1);
  });

  return (tracks || []).map(track => ({
    id: track.id,
    name: track.name,
    theme: track.theme,
    submission_count: countMap.get(track.id) || 0,
  }));
}

/**
 * Use Claude AI to analyze and suggest track assignments
 */
export async function analyzeSubmissionsWithAI(
  submissions: SubmissionForAssignment[],
  tracks: TrackInfo[]
): Promise<TrackSuggestion[]> {
  const anthropic = new Anthropic();
  const suggestions: TrackSuggestion[] = [];

  // Process in batches of 20 to avoid token limits
  const BATCH_SIZE = 20;

  for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
    const batch = submissions.slice(i, i + BATCH_SIZE);

    const submissionText = batch.map((sub, idx) =>
      `${idx + 1}. ID: ${sub.id}
   App Name: ${sub.app_name}
   Self-Selected Category: ${sub.category || 'None'}
   Description: ${sub.description || 'No description provided'}
`
    ).join('\n');

    const trackText = tracks.map(t =>
      `- ${t.name} (theme: ${t.theme}): ${TRACK_THEMES[t.theme as TrackTheme]?.keywords.join(', ') || 'general'}`
    ).join('\n');

    const prompt = `You are an expert at categorizing app submissions for a hackathon. Analyze each submission and assign it to the most appropriate track.

Available Tracks:
${trackText}

Submissions to Analyze:
${submissionText}

For each submission, respond with a JSON array containing objects with these fields:
- submission_id: the ID from the submission
- suggested_theme: one of [healthcare, education, agriculture, environment, community, myjkkn]
- confidence: a number 0-100 representing how confident you are in this assignment
- reasoning: a brief explanation (max 50 words) of why this track was chosen

Consider:
1. The app name and description keywords
2. The self-selected category (but it may be wrong)
3. The target users implied by the description
4. If unclear, default to 'community' as it's the broadest category

Respond ONLY with a valid JSON array, no other text.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') continue;

      // Parse the JSON response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const results = JSON.parse(jsonMatch[0]) as Array<{
        submission_id: string;
        suggested_theme: TrackTheme;
        confidence: number;
        reasoning: string;
      }>;

      // Map results to track suggestions
      for (const result of results) {
        const submission = batch.find(s => s.id === result.submission_id);
        if (!submission) continue;

        const suggestedTrack = tracks.find(t => t.theme === result.suggested_theme);
        if (!suggestedTrack) continue;

        suggestions.push({
          submission_id: result.submission_id,
          suggested_track_id: suggestedTrack.id,
          suggested_track_name: suggestedTrack.name,
          suggested_theme: result.suggested_theme,
          confidence: Math.min(100, Math.max(0, result.confidence)),
          reasoning: result.reasoning,
          current_track_id: submission.current_track_id,
          needs_change: submission.current_track_id !== suggestedTrack.id,
        });
      }
    } catch (error) {
      console.error('Error calling Claude API:', error);
      // Fall back to keyword-based assignment for this batch
      for (const sub of batch) {
        const suggestion = assignByKeywords(sub, tracks);
        suggestions.push(suggestion);
      }
    }
  }

  return suggestions;
}

/**
 * Fallback: Assign track based on keyword matching
 */
function assignByKeywords(
  submission: SubmissionForAssignment,
  tracks: TrackInfo[]
): TrackSuggestion {
  const text = `${submission.app_name} ${submission.category || ''} ${submission.description || ''}`.toLowerCase();

  let bestMatch: { theme: TrackTheme; score: number } = { theme: 'community', score: 0 };

  for (const [theme, config] of Object.entries(TRACK_THEMES)) {
    const score = config.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (score > bestMatch.score) {
      bestMatch = { theme: theme as TrackTheme, score };
    }
  }

  const suggestedTrack = tracks.find(t => t.theme === bestMatch.theme) || tracks[0];
  const confidence = bestMatch.score > 0 ? Math.min(80, bestMatch.score * 20) : 40;

  return {
    submission_id: submission.id,
    suggested_track_id: suggestedTrack.id,
    suggested_track_name: suggestedTrack.name,
    suggested_theme: bestMatch.theme,
    confidence,
    reasoning: bestMatch.score > 0
      ? `Matched ${bestMatch.score} keywords for ${bestMatch.theme}`
      : 'No strong keyword matches, defaulting to community',
    current_track_id: submission.current_track_id,
    needs_change: submission.current_track_id !== suggestedTrack.id,
  };
}

/**
 * Run AI analysis and return complete result
 */
export async function runAITrackAssignment(
  supabase: SupabaseClient
): Promise<AIAssignmentResult> {
  const submissions = await getSubmissionsForAssignment(supabase);
  const tracks = await getJudgingTracks(supabase);

  const suggestions = await analyzeSubmissionsWithAI(submissions, tracks);

  // Calculate stats
  const highConfidenceCount = suggestions.filter(s => s.confidence >= 80).length;
  const needsReviewCount = suggestions.filter(s => s.confidence < 60).length;

  // Update track stats with suggested counts
  const suggestedCounts = new Map<string, number>();
  suggestions.forEach(s => {
    suggestedCounts.set(s.suggested_track_id, (suggestedCounts.get(s.suggested_track_id) || 0) + 1);
  });

  const trackStats = tracks.map(t => ({
    ...t,
    submission_count: suggestedCounts.get(t.id) || 0,
  }));

  return {
    suggestions,
    track_stats: trackStats,
    total_processed: suggestions.length,
    high_confidence_count: highConfidenceCount,
    needs_review_count: needsReviewCount,
  };
}

/**
 * Apply track assignments to the database
 */
export async function applyTrackAssignments(
  supabase: SupabaseClient,
  assignments: Array<{ submission_id: string; track_id: string }>
): Promise<{ success: boolean; applied: number; errors: string[] }> {
  const errors: string[] = [];
  let applied = 0;

  for (const assignment of assignments) {
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('submission_track_assignments')
      .select('id')
      .eq('submission_id', assignment.submission_id)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('submission_track_assignments')
        .update({
          track_id: assignment.track_id,
          status: 'pending',
        })
        .eq('submission_id', assignment.submission_id);

      if (error) {
        errors.push(`Failed to update ${assignment.submission_id}: ${error.message}`);
      } else {
        applied++;
      }
    } else {
      // Get the next demo slot for this track
      // Use maybeSingle() instead of single() - single() throws when 0 rows exist
      const { data: lastSlot } = await supabase
        .from('submission_track_assignments')
        .select('demo_slot')
        .eq('track_id', assignment.track_id)
        .order('demo_slot', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSlot = (lastSlot?.demo_slot || 0) + 1;

      // Insert new
      const { error } = await supabase
        .from('submission_track_assignments')
        .insert({
          submission_id: assignment.submission_id,
          track_id: assignment.track_id,
          demo_slot: nextSlot,
          status: 'pending',
        });

      if (error) {
        errors.push(`Failed to insert ${assignment.submission_id}: ${error.message}`);
      } else {
        applied++;
      }
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

/**
 * Calculate panel splits for tracks with more than MAX_SUBMISSIONS_PER_PANEL
 */
export function calculatePanelSplits(trackStats: TrackInfo[]): Map<string, number> {
  const splits = new Map<string, number>();

  for (const track of trackStats) {
    if (track.submission_count > MAX_SUBMISSIONS_PER_PANEL) {
      const panelCount = Math.ceil(track.submission_count / MAX_SUBMISSIONS_PER_PANEL);
      splits.set(track.id, panelCount);
    }
  }

  return splits;
}
