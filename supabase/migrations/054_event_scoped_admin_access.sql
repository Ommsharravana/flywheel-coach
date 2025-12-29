-- Migration: Event-Scoped Admin Access
--
-- Reverting from global access to event-scoped access for event_admin role.
--
-- Architecture decisions (from user interview):
-- 1. User Visibility: Only participants in admin's event(s)
-- 2. Problem Bank: Global bank → Admin curates "recommended" subset
-- 3. Participant Choice: Can pick ANY problem (recommended highlighted)
-- 4. Cross-Event Data: View-only access to participant's other cycles
-- 5. Multi-Event Admin: Event switcher UI (handled in frontend)
-- 6. Access Expiry: Superadmin manually archives
-- 7. Event Boundary: Institution-agnostic (anyone can join any event)
--
-- APPLIED: 2024-12-29 (via SQL Editor, with status='open' fix)

-- =============================================================================
-- NEW TABLE: event_problems (curation junction table)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.event_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problem_bank(id) ON DELETE CASCADE,
  is_recommended BOOLEAN DEFAULT true,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(event_id, problem_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_problems_event_id ON public.event_problems(event_id);
CREATE INDEX IF NOT EXISTS idx_event_problems_problem_id ON public.event_problems(problem_id);

-- RLS policies for event_problems
ALTER TABLE public.event_problems ENABLE ROW LEVEL SECURITY;

-- Superadmin can do anything
CREATE POLICY "Superadmin full access on event_problems"
  ON public.event_problems
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Event admins can manage problems for their events
CREATE POLICY "Event admin can manage event_problems"
  ON public.event_problems
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_admins ea
      WHERE ea.user_id = auth.uid() AND ea.event_id = event_problems.event_id
    )
  );

-- Participants can view problems for their active event
CREATE POLICY "Participants can view event_problems"
  ON public.event_problems
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.active_event_id = event_problems.event_id
    )
  );


-- =============================================================================
-- RPC: get_all_users_admin - Event-scoped (only event participants)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_all_users_admin(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  institution_id UUID
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all users
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    ORDER BY u.created_at DESC;

  -- Event admin sees only users participating in their events
  -- (users whose active_event_id matches an event the admin manages)
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT DISTINCT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    WHERE u.active_event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    )
    ORDER BY u.created_at DESC;

  -- Institution admin sees only their institution's users
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    WHERE u.institution_id = calling_user_institution
    ORDER BY u.created_at DESC;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_users_admin(UUID) TO authenticated;


-- =============================================================================
-- RPC: get_all_problems_admin - Event-scoped (curated problems for events)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_all_problems_admin(
  caller_user_id UUID DEFAULT NULL,
  theme_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  validation_status_filter TEXT DEFAULT NULL,
  institution_filter UUID DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  sort_field TEXT DEFAULT 'created_at',
  sort_direction TEXT DEFAULT 'desc',
  page_offset INT DEFAULT 0,
  page_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  problem_statement TEXT,
  theme TEXT,
  status TEXT,
  validation_status TEXT,
  severity_rating INT,
  desperate_user_score INT,
  created_at TIMESTAMPTZ,
  institution_id UUID,
  submitted_by UUID,
  institution_name TEXT,
  institution_short_name TEXT,
  total_count BIGINT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  -- Use explicit caller_user_id if provided, otherwise fall back to auth.uid()
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the calling user's role
  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all problems
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.title,
      p.problem_statement,
      p.theme,
      p.status,
      p.validation_status,
      p.severity_rating,
      p.desperate_user_score,
      p.created_at,
      p.institution_id,
      p.submitted_by,
      i.name as institution_name,
      i.short_name as institution_short_name,
      COUNT(*) OVER() as total_count
    FROM public.problem_bank p
    LEFT JOIN public.institutions i ON i.id = p.institution_id
    WHERE
      (theme_filter IS NULL OR p.theme = theme_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
      AND (validation_status_filter IS NULL OR p.validation_status = validation_status_filter)
      AND (institution_filter IS NULL OR p.institution_id = institution_filter)
      AND (search_term IS NULL OR search_term = '' OR
           p.title ILIKE '%' || search_term || '%' OR
           p.problem_statement ILIKE '%' || search_term || '%')
    ORDER BY
      CASE WHEN sort_field = 'created_at' AND sort_direction = 'desc' THEN p.created_at END DESC,
      CASE WHEN sort_field = 'created_at' AND sort_direction = 'asc' THEN p.created_at END ASC,
      CASE WHEN sort_field = 'title' AND sort_direction = 'desc' THEN p.title END DESC,
      CASE WHEN sort_field = 'title' AND sort_direction = 'asc' THEN p.title END ASC,
      CASE WHEN sort_field = 'severity_rating' AND sort_direction = 'desc' THEN p.severity_rating END DESC NULLS LAST,
      CASE WHEN sort_field = 'severity_rating' AND sort_direction = 'asc' THEN p.severity_rating END ASC NULLS LAST,
      p.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;

  -- Event admin sees problems curated for their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.title,
      p.problem_statement,
      p.theme,
      p.status,
      p.validation_status,
      p.severity_rating,
      p.desperate_user_score,
      p.created_at,
      p.institution_id,
      p.submitted_by,
      i.name as institution_name,
      i.short_name as institution_short_name,
      COUNT(*) OVER() as total_count
    FROM public.problem_bank p
    LEFT JOIN public.institutions i ON i.id = p.institution_id
    WHERE p.id IN (
      SELECT ep.problem_id
      FROM public.event_problems ep
      WHERE ep.event_id IN (
        SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
      )
    )
      AND (theme_filter IS NULL OR p.theme = theme_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
      AND (validation_status_filter IS NULL OR p.validation_status = validation_status_filter)
      AND (institution_filter IS NULL OR p.institution_id = institution_filter)
      AND (search_term IS NULL OR search_term = '' OR
           p.title ILIKE '%' || search_term || '%' OR
           p.problem_statement ILIKE '%' || search_term || '%')
    ORDER BY
      CASE WHEN sort_field = 'created_at' AND sort_direction = 'desc' THEN p.created_at END DESC,
      CASE WHEN sort_field = 'created_at' AND sort_direction = 'asc' THEN p.created_at END ASC,
      CASE WHEN sort_field = 'title' AND sort_direction = 'desc' THEN p.title END DESC,
      CASE WHEN sort_field = 'title' AND sort_direction = 'asc' THEN p.title END ASC,
      CASE WHEN sort_field = 'severity_rating' AND sort_direction = 'desc' THEN p.severity_rating END DESC NULLS LAST,
      CASE WHEN sort_field = 'severity_rating' AND sort_direction = 'asc' THEN p.severity_rating END ASC NULLS LAST,
      p.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;

  -- Institution admin sees only their institution's problems
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT
      p.id,
      p.title,
      p.problem_statement,
      p.theme,
      p.status,
      p.validation_status,
      p.severity_rating,
      p.desperate_user_score,
      p.created_at,
      p.institution_id,
      p.submitted_by,
      i.name as institution_name,
      i.short_name as institution_short_name,
      COUNT(*) OVER() as total_count
    FROM public.problem_bank p
    LEFT JOIN public.institutions i ON i.id = p.institution_id
    WHERE p.institution_id = calling_user_institution
      AND (theme_filter IS NULL OR p.theme = theme_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
      AND (validation_status_filter IS NULL OR p.validation_status = validation_status_filter)
      AND (search_term IS NULL OR search_term = '' OR
           p.title ILIKE '%' || search_term || '%' OR
           p.problem_statement ILIKE '%' || search_term || '%')
    ORDER BY
      CASE WHEN sort_field = 'created_at' AND sort_direction = 'desc' THEN p.created_at END DESC,
      CASE WHEN sort_field = 'created_at' AND sort_direction = 'asc' THEN p.created_at END ASC,
      CASE WHEN sort_field = 'title' AND sort_direction = 'desc' THEN p.title END DESC,
      CASE WHEN sort_field = 'title' AND sort_direction = 'asc' THEN p.title END ASC,
      CASE WHEN sort_field = 'severity_rating' AND sort_direction = 'desc' THEN p.severity_rating END DESC NULLS LAST,
      CASE WHEN sort_field = 'severity_rating' AND sort_direction = 'asc' THEN p.severity_rating END ASC NULLS LAST,
      p.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;

  -- Others see nothing
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_problems_admin(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INT, INT) TO authenticated;


-- =============================================================================
-- RPC: get_eligible_cycles_admin - Event-scoped (cycles from event participants)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_eligible_cycles_admin(
  caller_user_id UUID DEFAULT NULL,
  page_offset INT DEFAULT 0,
  page_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  problem_id UUID,
  problem_title TEXT,
  stage TEXT,
  step_answers JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_graduated BOOLEAN,
  is_finalist BOOLEAN,
  event_id UUID,
  event_name TEXT,
  total_count BIGINT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;
BEGIN
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all cycles
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.user_id,
      u.email as user_email,
      u.name as user_name,
      c.problem_id,
      pb.title as problem_title,
      c.stage,
      c.step_answers,
      c.created_at,
      c.updated_at,
      (c.stage = 'graduated') as is_graduated,
      pb.is_finalist,
      c.event_id,
      e.name as event_name,
      COUNT(*) OVER() as total_count
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    LEFT JOIN public.problem_bank pb ON pb.id = c.problem_id
    LEFT JOIN public.events e ON e.id = c.event_id
    ORDER BY c.updated_at DESC
    LIMIT page_limit
    OFFSET page_offset;

  -- Event admin sees cycles from users participating in their events
  -- Shows ALL cycles for those users (full history with context)
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT
      c.id,
      c.user_id,
      u.email as user_email,
      u.name as user_name,
      c.problem_id,
      pb.title as problem_title,
      c.stage,
      c.step_answers,
      c.created_at,
      c.updated_at,
      (c.stage = 'graduated') as is_graduated,
      pb.is_finalist,
      c.event_id,
      e.name as event_name,
      COUNT(*) OVER() as total_count
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    LEFT JOIN public.problem_bank pb ON pb.id = c.problem_id
    LEFT JOIN public.events e ON e.id = c.event_id
    WHERE u.active_event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    )
    ORDER BY c.updated_at DESC
    LIMIT page_limit
    OFFSET page_offset;

  -- Institution admin sees cycles from their institution
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    RETURN QUERY
    SELECT
      c.id,
      c.user_id,
      u.email as user_email,
      u.name as user_name,
      c.problem_id,
      pb.title as problem_title,
      c.stage,
      c.step_answers,
      c.created_at,
      c.updated_at,
      (c.stage = 'graduated') as is_graduated,
      pb.is_finalist,
      c.event_id,
      e.name as event_name,
      COUNT(*) OVER() as total_count
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    LEFT JOIN public.problem_bank pb ON pb.id = c.problem_id
    LEFT JOIN public.events e ON e.id = c.event_id
    WHERE u.institution_id = calling_user_institution
    ORDER BY c.updated_at DESC
    LIMIT page_limit
    OFFSET page_offset;

  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_eligible_cycles_admin(UUID, INT, INT) TO authenticated;


-- =============================================================================
-- RPC: get_admin_stats - Event-scoped (stats for admin's events)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_admin_stats(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  stat_name TEXT,
  stat_value BIGINT
) AS $$
DECLARE
  calling_user_role TEXT;
  calling_user_institution UUID;
  effective_user_id UUID;

  total_users BIGINT;
  total_problems BIGINT;
  total_cycles BIGINT;
  graduated_cycles BIGINT;
  active_cycles BIGINT;
BEGIN
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT u.role, u.institution_id INTO calling_user_role, calling_user_institution
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees global stats
  IF calling_user_role = 'superadmin' THEN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO total_problems FROM public.problem_bank;
    SELECT COUNT(*) INTO total_cycles FROM public.cycles;
    SELECT COUNT(*) INTO graduated_cycles FROM public.cycles WHERE stage = 'graduated';
    SELECT COUNT(*) INTO active_cycles FROM public.cycles WHERE stage != 'graduated';

  -- Event admin sees stats for their events
  ELSIF calling_user_role = 'event_admin' THEN
    -- Users participating in admin's events
    SELECT COUNT(DISTINCT u.id) INTO total_users
    FROM public.users u
    WHERE u.active_event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    );

    -- Problems curated for admin's events
    SELECT COUNT(DISTINCT ep.problem_id) INTO total_problems
    FROM public.event_problems ep
    WHERE ep.event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    );

    -- Cycles from users in admin's events
    SELECT COUNT(*) INTO total_cycles
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    WHERE u.active_event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    );

    SELECT COUNT(*) INTO graduated_cycles
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    WHERE u.active_event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    ) AND c.stage = 'graduated';

    SELECT COUNT(*) INTO active_cycles
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    WHERE u.active_event_id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    ) AND c.stage != 'graduated';

  -- Institution admin sees institution stats
  ELSIF calling_user_role = 'institution_admin' AND calling_user_institution IS NOT NULL THEN
    SELECT COUNT(*) INTO total_users FROM public.users WHERE institution_id = calling_user_institution;
    SELECT COUNT(*) INTO total_problems FROM public.problem_bank WHERE institution_id = calling_user_institution;
    SELECT COUNT(*) INTO total_cycles
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    WHERE u.institution_id = calling_user_institution;
    SELECT COUNT(*) INTO graduated_cycles
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    WHERE u.institution_id = calling_user_institution AND c.stage = 'graduated';
    SELECT COUNT(*) INTO active_cycles
    FROM public.cycles c
    JOIN public.users u ON u.id = c.user_id
    WHERE u.institution_id = calling_user_institution AND c.stage != 'graduated';
  ELSE
    RETURN;
  END IF;

  RETURN QUERY SELECT 'total_users'::TEXT, total_users;
  RETURN QUERY SELECT 'total_problems'::TEXT, total_problems;
  RETURN QUERY SELECT 'total_cycles'::TEXT, total_cycles;
  RETURN QUERY SELECT 'graduated_cycles'::TEXT, graduated_cycles;
  RETURN QUERY SELECT 'active_cycles'::TEXT, active_cycles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_stats(UUID) TO authenticated;


-- =============================================================================
-- NEW RPC: get_admin_events - Get events that admin can manage
-- =============================================================================

CREATE OR REPLACE FUNCTION get_admin_events(caller_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN,
  participant_count BIGINT
) AS $$
DECLARE
  calling_user_role TEXT;
  effective_user_id UUID;
BEGIN
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT u.role INTO calling_user_role
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Superadmin sees all events
  IF calling_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT
      e.id,
      e.name,
      e.description,
      e.start_date,
      e.end_date,
      e.is_active,
      (SELECT COUNT(*) FROM public.users u WHERE u.active_event_id = e.id) as participant_count
    FROM public.events e
    ORDER BY e.start_date DESC;

  -- Event admin sees only their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT
      e.id,
      e.name,
      e.description,
      e.start_date,
      e.end_date,
      e.is_active,
      (SELECT COUNT(*) FROM public.users u WHERE u.active_event_id = e.id) as participant_count
    FROM public.events e
    WHERE e.id IN (
      SELECT ea.event_id FROM public.event_admins ea WHERE ea.user_id = effective_user_id
    )
    ORDER BY e.start_date DESC;

  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_events(UUID) TO authenticated;


-- =============================================================================
-- NEW RPC: get_global_problems_for_curation - For event admin to browse global bank
-- =============================================================================

CREATE OR REPLACE FUNCTION get_global_problems_for_curation(
  caller_user_id UUID DEFAULT NULL,
  event_id_filter UUID DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  page_offset INT DEFAULT 0,
  page_limit INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  problem_statement TEXT,
  theme TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  is_curated BOOLEAN,
  is_recommended BOOLEAN,
  total_count BIGINT
) AS $$
DECLARE
  calling_user_role TEXT;
  effective_user_id UUID;
BEGIN
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT u.role INTO calling_user_role
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Only superadmin and event_admin can curate
  IF calling_user_role NOT IN ('superadmin', 'event_admin') THEN
    RETURN;
  END IF;

  -- For event_admin, verify they manage this event
  IF calling_user_role = 'event_admin' AND event_id_filter IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.event_admins ea
      WHERE ea.user_id = effective_user_id AND ea.event_id = event_id_filter
    ) THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.problem_statement,
    p.theme,
    p.status,
    p.created_at,
    (ep.id IS NOT NULL) as is_curated,
    COALESCE(ep.is_recommended, false) as is_recommended,
    COUNT(*) OVER() as total_count
  FROM public.problem_bank p
  LEFT JOIN public.event_problems ep ON ep.problem_id = p.id AND ep.event_id = event_id_filter
  WHERE p.status = 'open'  -- Note: problem_bank uses 'open' status for available problems
    AND (search_term IS NULL OR search_term = '' OR
         p.title ILIKE '%' || search_term || '%' OR
         p.problem_statement ILIKE '%' || search_term || '%')
  ORDER BY
    (ep.id IS NOT NULL) DESC,  -- Curated first
    p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_global_problems_for_curation(UUID, UUID, TEXT, INT, INT) TO authenticated;


-- =============================================================================
-- NEW RPC: curate_problem_for_event - Add/remove problem from event
-- =============================================================================

CREATE OR REPLACE FUNCTION curate_problem_for_event(
  caller_user_id UUID,
  p_event_id UUID,
  p_problem_id UUID,
  p_action TEXT,  -- 'add' or 'remove'
  p_is_recommended BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  calling_user_role TEXT;
  effective_user_id UUID;
BEGIN
  effective_user_id := COALESCE(caller_user_id, auth.uid());

  IF effective_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT u.role INTO calling_user_role
  FROM public.users u
  WHERE u.id = effective_user_id;

  -- Only superadmin and event_admin can curate
  IF calling_user_role NOT IN ('superadmin', 'event_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  -- For event_admin, verify they manage this event
  IF calling_user_role = 'event_admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.event_admins ea
      WHERE ea.user_id = effective_user_id AND ea.event_id = p_event_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You do not manage this event');
    END IF;
  END IF;

  IF p_action = 'add' THEN
    INSERT INTO public.event_problems (event_id, problem_id, is_recommended, added_by)
    VALUES (p_event_id, p_problem_id, p_is_recommended, effective_user_id)
    ON CONFLICT (event_id, problem_id)
    DO UPDATE SET is_recommended = p_is_recommended;

    RETURN jsonb_build_object('success', true, 'action', 'added');

  ELSIF p_action = 'remove' THEN
    DELETE FROM public.event_problems
    WHERE event_id = p_event_id AND problem_id = p_problem_id;

    RETURN jsonb_build_object('success', true, 'action', 'removed');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION curate_problem_for_event(UUID, UUID, UUID, TEXT, BOOLEAN) TO authenticated;
