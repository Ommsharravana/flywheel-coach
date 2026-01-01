-- Fix: BUG-104 - Duplicate problem statements on Problem Bank page
-- Root Cause: Multiple problem records exist per cycle (data corruption)
--             Some cycles have up to 47 duplicate problem entries!
-- Fix:
--   1. Delete duplicate problem records, keeping only the most recent
--   2. Update RPC function to use DISTINCT ON as a safeguard

-- Step 1: Delete duplicate problems, keeping only the most recent one per cycle
-- This uses a CTE to identify duplicates and delete all but the newest
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY cycle_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) as rn
  FROM problems
  WHERE cycle_id IS NOT NULL
)
DELETE FROM problems
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Update RPC function to use DISTINCT ON as a safeguard
-- This ensures only one row per cycle even if duplicates somehow get created

DROP FUNCTION IF EXISTS get_eligible_cycles_admin(UUID, BOOLEAN);

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

  -- Only superadmin, event_admin, and institution_admin can access
  IF calling_user_role NOT IN ('superadmin', 'event_admin', 'institution_admin') THEN
    RETURN;
  END IF;

  -- Superadmin sees all cycles
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT DISTINCT ON (c.id)
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
    ORDER BY c.id, p.updated_at DESC NULLS LAST;

  -- Event admin sees cycles from users in their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT DISTINCT ON (c.id)
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
    ORDER BY c.id, p.updated_at DESC NULLS LAST;

  -- Institution admin sees only their institution's cycles
  ELSE
    RETURN QUERY
    SELECT DISTINCT ON (c.id)
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
      AND u.institution_id = (
        SELECT inst.institution_id
        FROM public.users inst
        WHERE inst.id = effective_user_id
      )
    ORDER BY c.id, p.updated_at DESC NULLS LAST;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_eligible_cycles_admin(UUID, BOOLEAN) TO authenticated;
