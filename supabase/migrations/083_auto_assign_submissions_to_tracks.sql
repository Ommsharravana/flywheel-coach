-- ============================================
-- AUTO-ASSIGN SUBMISSIONS TO JUDGING TRACKS
-- Maps submission categories to judging track themes
-- ============================================

-- Create category-to-theme mapping table
CREATE TABLE IF NOT EXISTS category_theme_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  submission_category TEXT NOT NULL,
  track_theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, submission_category)
);

-- Insert mappings for Appathon 2.0
-- Event ID: 003089a3-8b28-4844-9714-b94f9b838462
-- NOTE: Agriculture + AI and Environment + AI tracks exist but have no matching categories
-- They will need manual assignment for submissions that don't fit other categories
INSERT INTO category_theme_mapping (event_id, submission_category, track_theme) VALUES
  ('003089a3-8b28-4844-9714-b94f9b838462', 'healthcare', 'Healthcare + AI'),
  ('003089a3-8b28-4844-9714-b94f9b838462', 'education', 'Education + AI'),
  ('003089a3-8b28-4844-9714-b94f9b838462', 'operations', 'MyJKKN Data Apps'),
  ('003089a3-8b28-4844-9714-b94f9b838462', 'productivity', 'Community + AI'),
  ('003089a3-8b28-4844-9714-b94f9b838462', 'other', 'Community + AI')
ON CONFLICT (event_id, submission_category) DO UPDATE SET track_theme = EXCLUDED.track_theme;

-- Function to auto-assign a single submission to its track
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

  -- Get track theme from mapping
  SELECT track_theme INTO v_track_theme
  FROM category_theme_mapping
  WHERE event_id = p_event_id AND submission_category = v_category;

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

-- Function to auto-assign ALL submitted submissions to tracks
CREATE OR REPLACE FUNCTION auto_assign_all_submissions(
  p_event_id UUID DEFAULT '003089a3-8b28-4844-9714-b94f9b838462'::UUID
)
RETURNS TABLE (
  total_processed INTEGER,
  successful INTEGER,
  already_assigned INTEGER,
  failed INTEGER,
  failures JSONB
) AS $$
DECLARE
  v_submission RECORD;
  v_result RECORD;
  v_total INTEGER := 0;
  v_success INTEGER := 0;
  v_already INTEGER := 0;
  v_failed INTEGER := 0;
  v_failures JSONB := '[]'::JSONB;
BEGIN
  FOR v_submission IN
    SELECT id, category, submission_number, app_name
    FROM appathon_submissions
    WHERE event_id = p_event_id
      AND status IN ('submitted', 'shortlisted', 'under_review')
    ORDER BY submitted_at
  LOOP
    v_total := v_total + 1;

    SELECT * INTO v_result
    FROM assign_submission_to_track(v_submission.id, p_event_id);

    IF v_result.success THEN
      IF v_result.message = 'Already assigned' THEN
        v_already := v_already + 1;
      ELSE
        v_success := v_success + 1;
      END IF;
    ELSE
      v_failed := v_failed + 1;
      v_failures := v_failures || jsonb_build_object(
        'submission_id', v_submission.id,
        'submission_number', v_submission.submission_number,
        'category', v_submission.category,
        'error', v_result.message
      );
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_total, v_success, v_already, v_failed, v_failures;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION assign_submission_to_track(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_assign_all_submissions(UUID) TO authenticated;

-- ============================================
-- RUN AUTO-ASSIGNMENT (Comment out if you want to run manually)
-- ============================================

-- Uncomment below line to auto-assign all submissions on migration:
-- SELECT * FROM auto_assign_all_submissions();

-- ============================================
-- HELPER VIEW: Track Assignment Summary
-- ============================================

CREATE OR REPLACE VIEW track_assignment_summary AS
SELECT
  jt.id as track_id,
  jt.name as track_name,
  jt.theme,
  COUNT(sta.id) as assigned_count,
  COUNT(sta.id) FILTER (WHERE sta.status = 'pending') as pending_count,
  COUNT(sta.id) FILTER (WHERE sta.status = 'presenting') as presenting_count,
  COUNT(sta.id) FILTER (WHERE sta.status = 'completed') as completed_count,
  COUNT(sta.id) FILTER (WHERE sta.status = 'skipped') as skipped_count
FROM judging_tracks jt
LEFT JOIN submission_track_assignments sta ON sta.track_id = jt.id
WHERE jt.event_id = '003089a3-8b28-4844-9714-b94f9b838462'
GROUP BY jt.id, jt.name, jt.theme
ORDER BY jt.demo_order;

GRANT SELECT ON track_assignment_summary TO authenticated;
