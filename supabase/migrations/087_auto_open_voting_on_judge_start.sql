-- ============================================
-- AUTO-OPEN VOTING WHEN JUDGE STARTS SCORING
-- Triggers voting window when first judge starts scoring a submission
-- ============================================

-- Function to auto-start voting window when judge begins scoring
CREATE OR REPLACE FUNCTION auto_open_voting_window()
RETURNS TRIGGER AS $$
DECLARE
  v_track_id UUID;
  v_current_status TEXT;
  v_presenting_started_at TIMESTAMPTZ;
BEGIN
  -- Get the track assignment for this submission
  SELECT sta.track_id, sta.status, sta.presenting_started_at
  INTO v_track_id, v_current_status, v_presenting_started_at
  FROM submission_track_assignments sta
  WHERE sta.submission_id = NEW.submission_id
  LIMIT 1;

  -- If no track assignment found, do nothing
  IF v_track_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only auto-start if not already presenting and presenting_started_at is NULL
  -- This means the first judge to score opens the voting window
  IF v_current_status = 'pending' OR (v_current_status = 'presenting' AND v_presenting_started_at IS NULL) THEN
    -- First, complete any other currently presenting submission in this track
    UPDATE submission_track_assignments
    SET status = 'completed',
        updated_at = NOW()
    WHERE track_id = v_track_id
      AND status = 'presenting'
      AND submission_id != NEW.submission_id;

    -- Now start presenting this submission and open voting window
    UPDATE submission_track_assignments
    SET status = 'presenting',
        presenting_started_at = NOW(),
        updated_at = NOW()
    WHERE submission_id = NEW.submission_id
      AND track_id = v_track_id
      AND (presenting_started_at IS NULL);

    RAISE NOTICE 'Voting window opened for submission %', NEW.submission_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_open_voting_on_judge_score ON judge_scores;

-- Create trigger on judge_scores INSERT
-- This fires when a judge starts scoring (record is created)
CREATE TRIGGER auto_open_voting_on_judge_score
  AFTER INSERT ON judge_scores
  FOR EACH ROW
  EXECUTE FUNCTION auto_open_voting_window();

-- ============================================
-- FUNCTION: Get voting window with dramatic countdown data
-- Returns all info needed for dramatic UI display
-- ============================================

CREATE OR REPLACE FUNCTION get_voting_window_details(p_submission_id UUID)
RETURNS TABLE (
  is_open BOOLEAN,
  status TEXT,
  window_started_at TIMESTAMPTZ,
  window_ends_at TIMESTAMPTZ,
  seconds_remaining INTEGER,
  total_window_seconds INTEGER,
  percentage_remaining NUMERIC,
  urgency_level TEXT,  -- 'calm', 'warning', 'urgent', 'critical'
  reason TEXT
) AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_track_status TEXT;
  v_seconds_remaining INTEGER;
  v_window_duration INTEGER := 300; -- 5 minutes
  v_ends_at TIMESTAMPTZ;
  v_percentage NUMERIC;
  v_urgency TEXT;
BEGIN
  -- Get presentation status and timing
  SELECT sta.presenting_started_at, sta.status
  INTO v_started_at, v_track_status
  FROM submission_track_assignments sta
  WHERE sta.submission_id = p_submission_id;

  -- Not assigned to any track
  IF v_track_status IS NULL THEN
    RETURN QUERY SELECT
      FALSE, 'not_assigned'::TEXT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
      NULL::INTEGER, v_window_duration, NULL::NUMERIC,
      'calm'::TEXT, 'Submission not assigned to a track'::TEXT;
    RETURN;
  END IF;

  -- Waiting to start (pending)
  IF v_track_status = 'pending' THEN
    RETURN QUERY SELECT
      FALSE, 'pending'::TEXT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
      NULL::INTEGER, v_window_duration, NULL::NUMERIC,
      'calm'::TEXT, 'Voting opens when demo starts'::TEXT;
    RETURN;
  END IF;

  -- Already completed or skipped
  IF v_track_status IN ('completed', 'skipped') THEN
    RETURN QUERY SELECT
      FALSE, v_track_status, v_started_at,
      CASE WHEN v_started_at IS NOT NULL THEN v_started_at + INTERVAL '5 minutes' ELSE NULL END,
      0::INTEGER, v_window_duration, 0::NUMERIC,
      'calm'::TEXT, 'Voting window has closed'::TEXT;
    RETURN;
  END IF;

  -- Currently presenting - calculate timing
  IF v_track_status = 'presenting' THEN
    -- Fallback if no start time recorded
    IF v_started_at IS NULL THEN
      RETURN QUERY SELECT
        TRUE, 'presenting'::TEXT, NOW(), NOW() + INTERVAL '5 minutes',
        v_window_duration, v_window_duration, 100::NUMERIC,
        'calm'::TEXT, 'Voting is open (timer starting now)'::TEXT;
      RETURN;
    END IF;

    v_ends_at := v_started_at + INTERVAL '5 minutes';
    v_seconds_remaining := GREATEST(0, EXTRACT(EPOCH FROM (v_ends_at - NOW()))::INTEGER);
    v_percentage := ROUND((v_seconds_remaining::NUMERIC / v_window_duration) * 100, 1);

    -- Determine urgency level
    IF v_seconds_remaining > 180 THEN
      v_urgency := 'calm';      -- More than 3 minutes: calm
    ELSIF v_seconds_remaining > 120 THEN
      v_urgency := 'warning';   -- 2-3 minutes: gentle warning
    ELSIF v_seconds_remaining > 60 THEN
      v_urgency := 'urgent';    -- 1-2 minutes: urgent
    ELSE
      v_urgency := 'critical';  -- Under 1 minute: critical
    END IF;

    IF v_seconds_remaining > 0 THEN
      RETURN QUERY SELECT
        TRUE, 'presenting'::TEXT, v_started_at, v_ends_at,
        v_seconds_remaining, v_window_duration, v_percentage,
        v_urgency, 'Voting is open - vote now!'::TEXT;
    ELSE
      RETURN QUERY SELECT
        FALSE, 'expired'::TEXT, v_started_at, v_ends_at,
        0::INTEGER, v_window_duration, 0::NUMERIC,
        'calm'::TEXT, 'Voting window has expired'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Unknown status
  RETURN QUERY SELECT
    FALSE, 'unknown'::TEXT, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ,
    NULL::INTEGER, v_window_duration, NULL::NUMERIC,
    'calm'::TEXT, ('Unknown status: ' || v_track_status)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_voting_window_details(UUID) TO authenticated;

-- ============================================
-- ENABLE REALTIME FOR VOTING WINDOW CHANGES
-- ============================================

-- Make sure presenting_started_at changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE submission_track_assignments;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_sta_presenting_started
  ON submission_track_assignments(presenting_started_at)
  WHERE status = 'presenting';

COMMENT ON FUNCTION auto_open_voting_window() IS
  'Automatically opens voting window when first judge starts scoring a submission';

COMMENT ON FUNCTION get_voting_window_details(UUID) IS
  'Returns detailed voting window status with countdown and urgency for dramatic UI';
