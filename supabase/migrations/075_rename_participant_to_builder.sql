-- Migration: Rename 'participant' to 'builder' throughout the system
--
-- JKKN Philosophy: Everyone who joins is a builder - no passive roles
-- This migration aligns database terminology with JKKN's builder-first identity
--
-- Changes:
-- 1. Rename event_participants view to event_builders
-- 2. Rename RPC functions to use builder terminology
-- 3. Update return column names from participant_count to builder_count

-- ============================================
-- STEP 1: DROP OLD VIEW, CREATE NEW VIEW
-- ============================================

DROP VIEW IF EXISTS event_participants;

CREATE OR REPLACE VIEW event_builders AS
SELECT
  e.id as event_id,
  e.slug as event_slug,
  e.name as event_name,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.role as user_role,
  u.updated_at as joined_at
FROM events e
JOIN users u ON u.active_event_id = e.id
ORDER BY e.slug, u.name;

GRANT SELECT ON event_builders TO authenticated;

-- ============================================
-- STEP 2: UPDATE RPC FUNCTIONS
-- ============================================

-- Drop old functions
DROP FUNCTION IF EXISTS get_event_participant_count(UUID);
DROP FUNCTION IF EXISTS get_all_event_participant_counts();

-- Create new builder count function for single event
CREATE OR REPLACE FUNCTION get_event_builder_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM users
  WHERE active_event_id = p_event_id;

  RETURN v_count;
END;
$$;

-- Create new builder counts function for all active events
CREATE OR REPLACE FUNCTION get_all_event_builder_counts()
RETURNS TABLE(
  event_id UUID,
  builder_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as event_id,
    COUNT(u.id)::INTEGER as builder_count
  FROM events e
  LEFT JOIN users u ON u.active_event_id = e.id
  WHERE e.is_active = true
  GROUP BY e.id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_builder_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_event_builder_counts() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_event_builder_count IS 'Gets builder count for a single event - SECURITY DEFINER bypasses RLS';
COMMENT ON FUNCTION get_all_event_builder_counts IS 'Gets builder counts for all active events - SECURITY DEFINER bypasses RLS';

-- ============================================
-- STEP 3: UPDATE get_event_stats FUNCTION
-- ============================================

-- Must DROP first since return column names changed (total_participants → total_builders)
DROP FUNCTION IF EXISTS get_event_stats(TEXT);

CREATE OR REPLACE FUNCTION get_event_stats(target_event_slug TEXT)
RETURNS TABLE (
  total_builders BIGINT,
  total_cycles BIGINT,
  completed_cycles BIGINT,
  total_problems BIGINT,
  validated_problems BIGINT,
  total_submissions BIGINT,
  institutions_active BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT u.id) FROM users u
     JOIN events e ON u.active_event_id = e.id
     WHERE e.slug = target_event_slug) as total_builders,

    (SELECT COUNT(*) FROM cycles c
     JOIN events e ON c.event_id = e.id
     WHERE e.slug = target_event_slug) as total_cycles,

    (SELECT COUNT(*) FROM cycles c
     JOIN events e ON c.event_id = e.id
     WHERE e.slug = target_event_slug AND c.current_step >= 7) as completed_cycles,

    (SELECT COUNT(*) FROM problem_bank pb
     JOIN events e ON pb.event_id = e.id
     WHERE e.slug = target_event_slug) as total_problems,

    (SELECT COUNT(*) FROM problem_bank pb
     JOIN events e ON pb.event_id = e.id
     WHERE e.slug = target_event_slug
     AND pb.validation_status IN ('desperate_user_confirmed', 'market_validated')) as validated_problems,

    (SELECT COUNT(*) FROM appathon_submissions asub
     JOIN cycles c ON asub.cycle_id = c.id
     JOIN events e ON c.event_id = e.id
     WHERE e.slug = target_event_slug) as total_submissions,

    (SELECT COUNT(DISTINCT u.institution_id) FROM users u
     JOIN events e ON u.active_event_id = e.id
     WHERE e.slug = target_event_slug) as institutions_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: UPDATE get_event_institution_stats FUNCTION
-- ============================================

-- Must DROP first since return column names changed (participant_count → builder_count)
DROP FUNCTION IF EXISTS get_event_institution_stats(UUID);

CREATE OR REPLACE FUNCTION get_event_institution_stats(target_event_id UUID)
RETURNS TABLE (
  institution_id UUID,
  institution_name TEXT,
  builder_count BIGINT,
  cycle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id as institution_id,
    i.name as institution_name,
    COUNT(DISTINCT u.id) as builder_count,
    COUNT(DISTINCT c.id) as cycle_count
  FROM institutions i
  LEFT JOIN users u ON u.institution_id = i.id AND u.active_event_id = target_event_id
  LEFT JOIN cycles c ON c.user_id = u.id AND c.event_id = target_event_id
  GROUP BY i.id, i.name
  HAVING COUNT(DISTINCT u.id) > 0 OR COUNT(DISTINCT c.id) > 0
  ORDER BY COUNT(DISTINCT c.id) DESC, COUNT(DISTINCT u.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: ADD VIEW COMMENT
-- ============================================

COMMENT ON VIEW event_builders IS 'Shows all builders (people who joined) for each event. JKKN terminology: everyone who joins is a builder.';
