-- Get eligible cycles for Problem Bank with admin permissions
-- Bypasses RLS infinite recursion issue with users table

CREATE OR REPLACE FUNCTION get_eligible_cycles_admin(
  caller_user_id UUID DEFAULT NULL,
  show_all BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  status TEXT,
  current_step INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  event_id UUID,
  user_name TEXT,
  user_email TEXT,
  institution_id UUID,
  institution_name TEXT,
  institution_short_name TEXT,
  -- Problem fields
  problem_id UUID,
  refined_statement TEXT,
  selected_question TEXT,
  q_takes_too_long TEXT,
  q_repetitive TEXT,
  q_lookup_repeatedly TEXT,
  q_complaints TEXT,
  q_would_pay TEXT
) AS $$
DECLARE
  calling_user_role TEXT;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role INTO calling_user_role
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Only superadmin and institution_admin can access
  IF calling_user_role NOT IN ('superadmin', 'institution_admin') THEN
    RETURN;
  END IF;

  -- Superadmin sees all cycles
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.name,
      c.status,
      c.current_step,
      c.created_at,
      c.updated_at,
      c.user_id,
      c.event_id,
      u.name as user_name,
      u.email as user_email,
      u.institution_id,
      i.name as institution_name,
      i.short_name as institution_short_name,
      p.id as problem_id,
      p.refined_statement,
      p.selected_question,
      p.q_takes_too_long,
      p.q_repetitive,
      p.q_lookup_repeatedly,
      p.q_complaints,
      p.q_would_pay
    FROM public.cycles c
    LEFT JOIN public.users u ON u.id = c.user_id
    LEFT JOIN public.institutions i ON i.id = u.institution_id
    LEFT JOIN public.problems p ON p.cycle_id = c.id
    WHERE (show_all = TRUE OR c.current_step >= 7)
    ORDER BY c.updated_at DESC;

  -- Institution admin sees only their event's cycles
  ELSE
    RETURN QUERY
    SELECT
      c.id,
      c.name,
      c.status,
      c.current_step,
      c.created_at,
      c.updated_at,
      c.user_id,
      c.event_id,
      u.name as user_name,
      u.email as user_email,
      u.institution_id,
      i.name as institution_name,
      i.short_name as institution_short_name,
      p.id as problem_id,
      p.refined_statement,
      p.selected_question,
      p.q_takes_too_long,
      p.q_repetitive,
      p.q_lookup_repeatedly,
      p.q_complaints,
      p.q_would_pay
    FROM public.cycles c
    LEFT JOIN public.users u ON u.id = c.user_id
    LEFT JOIN public.institutions i ON i.id = u.institution_id
    LEFT JOIN public.problems p ON p.cycle_id = c.id
    WHERE (show_all = TRUE OR c.current_step >= 7)
      AND c.event_id IN (
        SELECT ea.event_id
        FROM public.event_admins ea
        WHERE ea.user_id = effective_user_id
      )
    ORDER BY c.updated_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_eligible_cycles_admin(UUID, BOOLEAN) TO authenticated;
