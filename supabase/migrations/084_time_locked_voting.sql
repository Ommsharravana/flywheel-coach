-- ============================================
-- TIME-LOCKED AUDIENCE VOTING
-- Voting window opens when presenting starts, closes after 5 minutes
-- ============================================

-- Add presenting_started_at to track when voting window opens
ALTER TABLE submission_track_assignments
ADD COLUMN IF NOT EXISTS presenting_started_at TIMESTAMPTZ;

-- Voting window duration (5 minutes)
-- Can be configured in judging_events if needed in future

-- Function to check if voting is open for a submission
CREATE OR REPLACE FUNCTION is_voting_open(p_submission_id UUID)
RETURNS TABLE (
  is_open BOOLEAN,
  window_started_at TIMESTAMPTZ,
  seconds_remaining INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_status TEXT;
  v_seconds_remaining INTEGER;
  v_window_duration INTEGER := 300; -- 5 minutes in seconds
BEGIN
  -- Get the presentation start time and status
  SELECT sta.presenting_started_at, sta.status
  INTO v_started_at, v_status
  FROM submission_track_assignments sta
  WHERE sta.submission_id = p_submission_id;

  -- Not found
  IF v_status IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, NULL::INTEGER, 'Submission not assigned to a track'::TEXT;
    RETURN;
  END IF;

  -- Not yet presenting
  IF v_status = 'pending' THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, NULL::INTEGER, 'Presentation has not started yet'::TEXT;
    RETURN;
  END IF;

  -- Already completed or skipped
  IF v_status IN ('completed', 'skipped') THEN
    RETURN QUERY SELECT FALSE, v_started_at, 0::INTEGER, 'Voting window has closed'::TEXT;
    RETURN;
  END IF;

  -- Currently presenting - check time window
  IF v_status = 'presenting' THEN
    -- If no start time recorded, voting is open indefinitely (fallback)
    IF v_started_at IS NULL THEN
      RETURN QUERY SELECT TRUE, NOW(), v_window_duration, 'Voting is open (no timer)'::TEXT;
      RETURN;
    END IF;

    -- Calculate remaining seconds
    v_seconds_remaining := v_window_duration - EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER;

    IF v_seconds_remaining > 0 THEN
      RETURN QUERY SELECT TRUE, v_started_at, v_seconds_remaining, 'Voting is open'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, v_started_at, 0::INTEGER, 'Voting window has expired'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Unknown status
  RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, NULL::INTEGER, ('Unknown status: ' || v_status)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start presenting (sets the voting window start)
CREATE OR REPLACE FUNCTION start_presenting(
  p_submission_id UUID,
  p_track_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  voting_window_ends_at TIMESTAMPTZ
) AS $$
DECLARE
  v_current_status TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get current status
  SELECT sta.status INTO v_current_status
  FROM submission_track_assignments sta
  WHERE sta.submission_id = p_submission_id AND sta.track_id = p_track_id;

  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Submission not assigned to this track'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF v_current_status = 'presenting' THEN
    RETURN QUERY SELECT TRUE, 'Already presenting'::TEXT, v_now + INTERVAL '5 minutes';
    RETURN;
  END IF;

  IF v_current_status IN ('completed', 'skipped') THEN
    RETURN QUERY SELECT FALSE, 'Presentation already finished'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Mark any currently presenting submission as completed
  UPDATE submission_track_assignments
  SET status = 'completed', updated_at = v_now
  WHERE track_id = p_track_id AND status = 'presenting';

  -- Start this presentation
  UPDATE submission_track_assignments
  SET status = 'presenting',
      presenting_started_at = v_now,
      updated_at = v_now
  WHERE submission_id = p_submission_id AND track_id = p_track_id;

  RETURN QUERY SELECT TRUE, 'Presentation started'::TEXT, v_now + INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get voting window status for a track
CREATE OR REPLACE FUNCTION get_track_voting_status(p_track_id UUID)
RETURNS TABLE (
  submission_id UUID,
  app_name TEXT,
  is_voting_open BOOLEAN,
  seconds_remaining INTEGER,
  presenting_started_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sta.submission_id,
    s.app_name,
    CASE
      WHEN sta.status = 'presenting' AND sta.presenting_started_at IS NOT NULL
           AND EXTRACT(EPOCH FROM (NOW() - sta.presenting_started_at)) < 300
      THEN TRUE
      WHEN sta.status = 'presenting' AND sta.presenting_started_at IS NULL
      THEN TRUE
      ELSE FALSE
    END as is_voting_open,
    CASE
      WHEN sta.status = 'presenting' AND sta.presenting_started_at IS NOT NULL
      THEN GREATEST(0, 300 - EXTRACT(EPOCH FROM (NOW() - sta.presenting_started_at))::INTEGER)
      WHEN sta.status = 'presenting'
      THEN 300
      ELSE 0
    END as seconds_remaining,
    sta.presenting_started_at
  FROM submission_track_assignments sta
  JOIN appathon_submissions s ON s.id = sta.submission_id
  WHERE sta.track_id = p_track_id AND sta.status = 'presenting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_voting_open(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_presenting(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_track_voting_status(UUID) TO authenticated;

-- Update the audience_votes RLS to enforce logged-in users only
DROP POLICY IF EXISTS "Users can vote for presenting submissions" ON audience_votes;

CREATE POLICY "Logged-in users can vote within time window"
ON audience_votes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be logged in (voter_id cannot be null for this policy)
  voter_id = auth.uid()
  -- Voting must be open (within 5-minute window)
  AND EXISTS (
    SELECT 1 FROM is_voting_open(submission_id) WHERE is_open = TRUE
  )
);

-- Policy to allow users to view their own votes
DROP POLICY IF EXISTS "Users can view their own votes" ON audience_votes;

CREATE POLICY "Users can view their own votes"
ON audience_votes
FOR SELECT
TO authenticated
USING (voter_id = auth.uid());

-- Policy to allow updates to existing votes (within window)
DROP POLICY IF EXISTS "Users can update their vote within window" ON audience_votes;

CREATE POLICY "Users can update their vote within window"
ON audience_votes
FOR UPDATE
TO authenticated
USING (voter_id = auth.uid())
WITH CHECK (
  voter_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM is_voting_open(submission_id) WHERE is_open = TRUE
  )
);
