-- Fix event_admin access to Users and Problems pages
-- Event admins should see:
-- 1. Users who have cycles in their events
-- 2. Problems from their events

-- =============================================================================
-- FIX: get_all_users_admin - add event_admin support
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

  -- Event admin sees users who have cycles in their events
  ELSIF calling_user_role = 'event_admin' THEN
    RETURN QUERY
    SELECT DISTINCT u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.institution_id
    FROM public.users u
    WHERE u.id IN (
      SELECT DISTINCT c.user_id
      FROM public.cycles c
      WHERE c.event_id IN (
        SELECT ea.event_id
        FROM public.event_admins ea
        WHERE ea.user_id = effective_user_id
      )
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
-- FIX: get_all_problems_admin - add event_admin support
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

  -- Event admin sees problems from their events
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
    WHERE p.event_id IN (
      SELECT ea.event_id
      FROM public.event_admins ea
      WHERE ea.user_id = effective_user_id
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
