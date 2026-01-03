-- ============================================
-- JUDGING TRIAL MODE
-- Allows admins to enable trial/dry-run mode for testing
-- ============================================

-- Add trial mode to event config via a helper function
-- This updates the JSONB config to include judgingConfig

-- Function to get judging trial mode status
CREATE OR REPLACE FUNCTION get_judging_trial_mode(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (config->'judgingConfig'->>'trialMode')::boolean
     FROM events WHERE id = p_event_id),
    FALSE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to set judging trial mode (admin only)
CREATE OR REPLACE FUNCTION set_judging_trial_mode(p_event_id UUID, p_enabled BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_config JSONB;
  v_judging_config JSONB;
BEGIN
  -- Check if user is admin
  IF NOT (is_superadmin() OR is_event_admin(p_event_id)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can modify trial mode';
  END IF;

  -- Get current config
  SELECT config INTO v_current_config FROM events WHERE id = p_event_id;

  -- Build judging config
  v_judging_config := COALESCE(v_current_config->'judgingConfig', '{}'::jsonb);
  v_judging_config := v_judging_config || jsonb_build_object('trialMode', p_enabled);

  -- Update event config
  UPDATE events
  SET config = v_current_config || jsonb_build_object('judgingConfig', v_judging_config),
      updated_at = NOW()
  WHERE id = p_event_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_judging_trial_mode(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_judging_trial_mode(UUID, BOOLEAN) TO authenticated;

-- ============================================
-- ASSIGN JUDGE TO TRACK (ADMIN FUNCTION)
-- ============================================

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
  track_id UUID
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
  SELECT id INTO v_track_id FROM judging_tracks
  WHERE event_id = p_event_id AND theme = p_track_theme;
  IF v_track_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('Track not found: ' || p_track_theme)::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Check if already assigned
  SELECT id INTO v_existing_id FROM track_judges
  WHERE track_id = v_track_id AND user_id = v_user_id;
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

GRANT EXECUTE ON FUNCTION assign_judge_to_track(TEXT, TEXT, UUID, BOOLEAN) TO authenticated;

-- ============================================
-- REMOVE JUDGE FROM TRACK (ADMIN FUNCTION)
-- ============================================

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

  -- Find track by theme
  SELECT id INTO v_track_id FROM judging_tracks
  WHERE event_id = p_event_id AND theme = p_track_theme;
  IF v_track_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ('Track not found: ' || p_track_theme)::TEXT;
    RETURN;
  END IF;

  -- Delete assignment
  DELETE FROM track_judges WHERE track_id = v_track_id AND user_id = v_user_id;

  RETURN QUERY SELECT TRUE, 'Judge removed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION remove_judge_from_track(TEXT, TEXT, UUID) TO authenticated;

-- ============================================
-- GET ALL JUDGES FOR EVENT (ADMIN VIEW)
-- ============================================

CREATE OR REPLACE FUNCTION get_event_judges(p_event_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  track_id UUID,
  track_name TEXT,
  track_theme TEXT,
  is_lead BOOLEAN,
  assigned_at TIMESTAMPTZ
) AS $$
  SELECT
    u.id as user_id,
    u.email as user_email,
    u.name as user_name,
    jt.id as track_id,
    jt.name as track_name,
    jt.theme as track_theme,
    tj.is_lead,
    tj.assigned_at
  FROM track_judges tj
  JOIN users u ON u.id = tj.user_id
  JOIN judging_tracks jt ON jt.id = tj.track_id
  WHERE jt.event_id = p_event_id
  ORDER BY jt.demo_order, tj.is_lead DESC, u.name;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_event_judges(UUID) TO authenticated;
