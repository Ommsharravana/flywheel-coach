-- Fix: Total cycles showing 1000 instead of actual count
-- Root cause: RPC returns max 1000 rows, stats were calculated client-side from array.length
-- Solution: Create dedicated stats function that returns counts directly (aggregates bypass row limit)

CREATE OR REPLACE FUNCTION get_cycle_stats_admin(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_cycles BIGINT,
  active_cycles BIGINT,
  completed_cycles BIGINT,
  abandoned_cycles BIGINT,
  step_1_count BIGINT,
  step_2_count BIGINT,
  step_3_count BIGINT,
  step_4_count BIGINT,
  step_5_count BIGINT,
  step_6_count BIGINT,
  step_7_count BIGINT,
  step_8_count BIGINT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN QUERY SELECT
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT,
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT,
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all cycles stats
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      COUNT(*)::BIGINT as total_cycles,
      COUNT(*) FILTER (WHERE c.status = 'active')::BIGINT as active_cycles,
      COUNT(*) FILTER (WHERE c.status = 'completed')::BIGINT as completed_cycles,
      COUNT(*) FILTER (WHERE c.status = 'abandoned')::BIGINT as abandoned_cycles,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 1)::BIGINT as step_1_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 2)::BIGINT as step_2_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 3)::BIGINT as step_3_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 4)::BIGINT as step_4_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 5)::BIGINT as step_5_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 6)::BIGINT as step_6_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 7)::BIGINT as step_7_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 8)::BIGINT as step_8_count
    FROM public.cycles c;

  -- Event admin sees stats from their events only
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT
      COUNT(*)::BIGINT as total_cycles,
      COUNT(*) FILTER (WHERE c.status = 'active')::BIGINT as active_cycles,
      COUNT(*) FILTER (WHERE c.status = 'completed')::BIGINT as completed_cycles,
      COUNT(*) FILTER (WHERE c.status = 'abandoned')::BIGINT as abandoned_cycles,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 1)::BIGINT as step_1_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 2)::BIGINT as step_2_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 3)::BIGINT as step_3_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 4)::BIGINT as step_4_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 5)::BIGINT as step_5_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 6)::BIGINT as step_6_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 7)::BIGINT as step_7_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 8)::BIGINT as step_8_count
    FROM public.cycles c
    WHERE c.event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    );

  -- Institution admin sees stats from their institution's users
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT
      COUNT(*)::BIGINT as total_cycles,
      COUNT(*) FILTER (WHERE c.status = 'active')::BIGINT as active_cycles,
      COUNT(*) FILTER (WHERE c.status = 'completed')::BIGINT as completed_cycles,
      COUNT(*) FILTER (WHERE c.status = 'abandoned')::BIGINT as abandoned_cycles,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 1)::BIGINT as step_1_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 2)::BIGINT as step_2_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 3)::BIGINT as step_3_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 4)::BIGINT as step_4_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 5)::BIGINT as step_5_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 6)::BIGINT as step_6_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 7)::BIGINT as step_7_count,
      COUNT(*) FILTER (WHERE c.status = 'active' AND c.current_step = 8)::BIGINT as step_8_count
    FROM public.cycles c
    LEFT JOIN public.users u ON u.id = c.user_id
    WHERE u.institution_id = calling_user_institution;

  -- Others see zeros
  ELSE
    RETURN QUERY SELECT
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT,
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT,
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_cycle_stats_admin(UUID) TO authenticated;
