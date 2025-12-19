-- Events System Migration
-- Replaces appathon_mode with flexible events system
-- Run this after 004_fix_appathon_columns.sql

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  banner_color TEXT DEFAULT 'amber', -- amber, emerald, violet, rose, sky
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- ============================================
-- ADD active_event_id TO USERS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'active_event_id'
  ) THEN
    ALTER TABLE users ADD COLUMN active_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_active_event ON users(active_event_id);

-- ============================================
-- RLS FOR EVENTS
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Everyone can view active events
DROP POLICY IF EXISTS "Anyone can view active events" ON events;
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (is_active = true);

-- Superadmins can view all events (including inactive)
DROP POLICY IF EXISTS "Superadmins can view all events" ON events;
CREATE POLICY "Superadmins can view all events"
  ON events FOR SELECT
  USING (is_superadmin());

-- Superadmins can insert events
DROP POLICY IF EXISTS "Superadmins can insert events" ON events;
CREATE POLICY "Superadmins can insert events"
  ON events FOR INSERT
  WITH CHECK (is_superadmin());

-- Superadmins can update events
DROP POLICY IF EXISTS "Superadmins can update events" ON events;
CREATE POLICY "Superadmins can update events"
  ON events FOR UPDATE
  USING (is_superadmin());

-- Superadmins can delete events
DROP POLICY IF EXISTS "Superadmins can delete events" ON events;
CREATE POLICY "Superadmins can delete events"
  ON events FOR DELETE
  USING (is_superadmin());

-- ============================================
-- UPDATED_AT TRIGGER FOR EVENTS
-- ============================================

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED APPATHON 2.0 AS FIRST EVENT
-- ============================================

-- Insert Appathon 2.0 event if it doesn't exist
INSERT INTO events (slug, name, description, start_date, end_date, is_active, config, banner_color)
SELECT
  'appathon-2',
  'Appathon 2.0',
  'JKKN Bioconvergence Innovation Challenge - Build solutions that matter in 10 days',
  '2025-12-20 00:00:00+05:30',
  '2026-01-03 23:59:59+05:30',
  true,
  '{
    "type": "appathon",
    "themes": ["Healthcare + AI", "Education + AI", "Agriculture + AI", "Environment + AI", "Community + AI", "MyJKKN Data Apps"],
    "judgingCriteria": [
      {"name": "Problem Impact", "weight": 25},
      {"name": "Solution Innovation", "weight": 20},
      {"name": "Working Prototype", "weight": 25},
      {"name": "User Validation", "weight": 15},
      {"name": "Presentation Quality", "weight": 10},
      {"name": "Bioconvergence Alignment", "weight": 5}
    ],
    "bonusCriteria": [
      {"name": "Cross-disciplinary team", "bonus": 5},
      {"name": "Cross-institutional", "bonus": 5},
      {"name": "First-year participation", "bonus": 3},
      {"name": "User testimonials", "bonus": 2}
    ],
    "roadmap": {
      "days1_2": "Problem & Planning",
      "days3_5": "Core Features",
      "days6_7": "User Testing",
      "days8_9": "Iteration & Polish",
      "day10": "Final Prep"
    }
  }'::jsonb,
  'amber'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'appathon-2');

-- ============================================
-- MIGRATE EXISTING APPATHON_MODE USERS
-- ============================================

-- Update users who had appathon_mode=true to join the Appathon 2.0 event
UPDATE users
SET active_event_id = (SELECT id FROM events WHERE slug = 'appathon-2' LIMIT 1)
WHERE appathon_mode = true
  AND active_event_id IS NULL;

-- ============================================
-- EVENT PARTICIPANTS VIEW
-- ============================================

CREATE OR REPLACE VIEW event_participants AS
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

-- Grant access to the view
GRANT SELECT ON event_participants TO authenticated;
