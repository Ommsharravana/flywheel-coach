-- ============================================
-- FIX: Column reference "track_id" is ambiguous
-- The RETURNS TABLE has track_id which conflicts with table column references
-- ============================================

-- Fix assign_judge_to_track function
CREATE OR REPLACE FUNCTION assign_judge_to_track(
  p_user_email TEXT,
  p_track_theme TEXT,
  p_event_id UUID,
  p_is_lead BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  judge_id UUID,
  assigned_track_id UUID  -- Renamed to avoid ambiguity
) AS $$
DECLARE
  v_user_id UUID;
  v_track_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT (is_superadmin() OR is_event_admin(p_event_id)) THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Only admins can assign judges'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Find user by email
  SELECT id INTO v_user_id FROM users WHERE email = p_user_email;
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('User not found: ' || p_user_email)::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Find track by theme
  SELECT jt.id INTO v_track_id FROM judging_tracks jt
  WHERE jt.event_id = p_event_id AND jt.theme = p_track_theme;
  IF v_track_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('Track not found: ' || p_track_theme)::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Check if already assigned (qualify column reference)
  SELECT tj.id INTO v_existing_id FROM track_judges tj
  WHERE tj.track_id = v_track_id AND tj.user_id = v_user_id;
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, 'Already assigned'::TEXT, v_user_id, v_track_id;
    RETURN;
  END IF;

  -- Insert assignment
  INSERT INTO track_judges (track_id, user_id, is_lead)
  VALUES (v_track_id, v_user_id, p_is_lead);

  RETURN QUERY SELECT TRUE, 'Judge assigned successfully'::TEXT, v_user_id, v_track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix remove_judge_from_track function
CREATE OR REPLACE FUNCTION remove_judge_from_track(
  p_user_email TEXT,
  p_track_theme TEXT,
  p_event_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_track_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT (is_superadmin() OR is_event_admin(p_event_id)) THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: Only admins can remove judges'::TEXT;
    RETURN;
  END IF;

  -- Find user by email
  SELECT id INTO v_user_id FROM users WHERE email = p_user_email;
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('User not found: ' || p_user_email)::TEXT;
    RETURN;
  END IF;

  -- Find track by theme (qualify column reference)
  SELECT jt.id INTO v_track_id FROM judging_tracks jt
  WHERE jt.event_id = p_event_id AND jt.theme = p_track_theme;
  IF v_track_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('Track not found: ' || p_track_theme)::TEXT;
    RETURN;
  END IF;

  -- Delete assignment (qualify column references)
  DELETE FROM track_judges tj WHERE tj.track_id = v_track_id AND tj.user_id = v_user_id;

  RETURN QUERY SELECT TRUE, 'Judge removed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
