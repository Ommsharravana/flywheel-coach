-- ============================================
-- FIX CASE SENSITIVITY IN CATEGORY MATCHING
-- Category comparison should be case-insensitive
-- ============================================

-- Update the assign_submission_to_track function to use case-insensitive matching
CREATE OR REPLACE FUNCTION assign_submission_to_track(
  p_submission_id UUID,
  p_event_id UUID DEFAULT '003089a3-8b28-4844-9714-b94f9b838462'::UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  track_id UUID,
  demo_slot INTEGER
) AS $$
DECLARE
  v_category TEXT;
  v_track_theme TEXT;
  v_track_id UUID;
  v_next_slot INTEGER;
  v_existing_id UUID;
BEGIN
  -- Get submission category
  SELECT category INTO v_category
  FROM appathon_submissions
  WHERE id = p_submission_id;

  IF v_category IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Submission not found'::TEXT, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;

  -- Get track theme from mapping (CASE-INSENSITIVE comparison)
  SELECT track_theme INTO v_track_theme
  FROM category_theme_mapping
  WHERE event_id = p_event_id AND LOWER(submission_category) = LOWER(v_category);

  IF v_track_theme IS NULL THEN
    RETURN QUERY SELECT FALSE, ('No track mapping for category: ' || v_category)::TEXT, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;

  -- Find the track by theme
  SELECT id INTO v_track_id
  FROM judging_tracks
  WHERE event_id = p_event_id AND theme = v_track_theme;

  IF v_track_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('Track not found for theme: ' || v_track_theme)::TEXT, NULL::UUID, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check if already assigned
  SELECT id INTO v_existing_id
  FROM submission_track_assignments
  WHERE submission_id = p_submission_id AND track_id = v_track_id;

  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, 'Already assigned'::TEXT, v_track_id, NULL::INTEGER;
    RETURN;
  END IF;

  -- Get next demo slot for this track
  SELECT COALESCE(MAX(demo_slot), 0) + 1 INTO v_next_slot
  FROM submission_track_assignments
  WHERE track_id = v_track_id;

  -- Insert the assignment
  INSERT INTO submission_track_assignments (submission_id, track_id, demo_slot, status)
  VALUES (p_submission_id, v_track_id, v_next_slot, 'pending');

  RETURN QUERY SELECT TRUE, 'Assigned successfully'::TEXT, v_track_id, v_next_slot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION assign_submission_to_track(UUID, UUID) TO authenticated;
