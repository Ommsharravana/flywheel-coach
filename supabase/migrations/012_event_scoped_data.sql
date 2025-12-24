-- Event-Scoped Data Migration
-- Makes problem_bank and leaderboards event-specific
-- Run this after 011_event_admins.sql

-- ============================================
-- ADD EVENT_ID TO PROBLEM_BANK
-- ============================================

-- Add event_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problem_bank' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE problem_bank ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_problem_bank_event ON problem_bank(event_id);

-- Migrate existing problems: Link to Appathon 2.0 based on source_event
UPDATE problem_bank
SET event_id = (SELECT id FROM events WHERE slug = 'appathon-2' LIMIT 1)
WHERE event_id IS NULL
AND (source_event LIKE '%Appathon%' OR source_event LIKE '%appathon%' OR source_event IS NULL);

-- ============================================
-- ADD EVENT_ID TO CYCLES
-- ============================================

-- Add event_id column to cycles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cycles' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE cycles ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cycles_event ON cycles(event_id);

-- Migrate existing cycles: Link to user's active_event_id or Appathon 2.0
UPDATE cycles c
SET event_id = COALESCE(
  (SELECT active_event_id FROM users u WHERE u.id = c.user_id),
  (SELECT id FROM events WHERE slug = 'appathon-2' LIMIT 1)
)
WHERE c.event_id IS NULL;

-- ============================================
-- EVENT-SCOPED LEADERBOARD VIEW
-- ============================================

-- Drop old view if exists
DROP VIEW IF EXISTS event_leaderboard;

-- Create event-scoped leaderboard
CREATE OR REPLACE VIEW event_leaderboard AS
SELECT
  e.id as event_id,
  e.slug as event_slug,
  e.name as event_name,
  i.id as institution_id,
  i.name as institution_name,
  i.short_name as institution_short_name,

  -- Cycle metrics
  COUNT(DISTINCT c.id) as total_cycles,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_step >= 7) as completed_cycles,

  -- Problem metrics
  COUNT(DISTINCT pb.id) as problems_saved,
  COUNT(DISTINCT pb.id) FILTER (WHERE pb.validation_status IN ('desperate_user_confirmed', 'market_validated')) as problems_validated,

  -- Submission metrics (for Appathon-like events)
  COUNT(DISTINCT asub.id) as submissions,
  COUNT(DISTINCT asub.id) FILTER (WHERE asub.status = 'submitted') as submitted_count,

  -- Scoring
  COALESCE(AVG(c.impact_score), 0) as avg_impact_score,

  -- Ranking
  RANK() OVER (
    PARTITION BY e.id
    ORDER BY COUNT(DISTINCT pb.id) DESC, COUNT(DISTINCT c.id) FILTER (WHERE c.current_step >= 7) DESC
  ) as rank

FROM events e
CROSS JOIN institutions i
LEFT JOIN users u ON u.institution_id = i.id AND u.active_event_id = e.id
LEFT JOIN cycles c ON c.user_id = u.id AND c.event_id = e.id
LEFT JOIN problem_bank pb ON pb.institution_id = i.id AND pb.event_id = e.id
LEFT JOIN appathon_submissions asub ON asub.cycle_id = c.id

GROUP BY e.id, e.slug, e.name, i.id, i.name, i.short_name

-- Only show institutions with activity
HAVING COUNT(DISTINCT c.id) > 0 OR COUNT(DISTINCT pb.id) > 0

ORDER BY e.id, rank;

GRANT SELECT ON event_leaderboard TO authenticated;

-- ============================================
-- PUBLIC EVENT LEADERBOARD FUNCTION
-- ============================================

-- Get leaderboard for a specific event (public, no auth required)
CREATE OR REPLACE FUNCTION get_event_leaderboard(target_event_slug TEXT)
RETURNS TABLE (
  institution_id UUID,
  institution_name TEXT,
  institution_short_name TEXT,
  total_cycles BIGINT,
  completed_cycles BIGINT,
  problems_saved BIGINT,
  problems_validated BIGINT,
  avg_impact_score NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.institution_id,
    el.institution_name,
    el.institution_short_name,
    el.total_cycles,
    el.completed_cycles,
    el.problems_saved,
    el.problems_validated,
    el.avg_impact_score,
    el.rank
  FROM event_leaderboard el
  WHERE el.event_slug = target_event_slug
  ORDER BY el.rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EVENT STATISTICS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_event_stats(target_event_slug TEXT)
RETURNS TABLE (
  total_participants BIGINT,
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
     WHERE e.slug = target_event_slug) as total_participants,

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
-- UPDATE PROBLEM_BANK RLS FOR EVENT SCOPING
-- ============================================

-- Event admins can manage problems for their events
DROP POLICY IF EXISTS "Event admins can view event problems" ON problem_bank;
CREATE POLICY "Event admins can view event problems"
  ON problem_bank FOR SELECT
  USING (
    is_superadmin()
    OR is_event_admin(event_id)
    OR status = 'open' -- Public can view open problems
  );

DROP POLICY IF EXISTS "Event admins can update event problems" ON problem_bank;
CREATE POLICY "Event admins can update event problems"
  ON problem_bank FOR UPDATE
  USING (
    is_superadmin()
    OR is_event_admin(event_id)
    OR submitted_by = auth.uid()
  );

-- ============================================
-- EVENT INSTITUTION STATS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_event_institution_stats(target_event_id UUID)
RETURNS TABLE (
  institution_id UUID,
  institution_name TEXT,
  participant_count BIGINT,
  cycle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id as institution_id,
    i.name as institution_name,
    COUNT(DISTINCT u.id) as participant_count,
    COUNT(DISTINCT c.id) as cycle_count
  FROM institutions i
  LEFT JOIN users u ON u.institution_id = i.id AND u.active_event_id = target_event_id
  LEFT JOIN cycles c ON c.user_id = u.id AND c.event_id = target_event_id
  GROUP BY i.id, i.name
  HAVING COUNT(DISTINCT u.id) > 0 OR COUNT(DISTINCT c.id) > 0
  ORDER BY COUNT(DISTINCT c.id) DESC, COUNT(DISTINCT u.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
