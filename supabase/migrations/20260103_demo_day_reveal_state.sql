-- Demo Day Reveal State Table
-- Tracks the current state of the grand finale reveal

CREATE TABLE IF NOT EXISTS demo_day_reveal_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  current_track_index INTEGER NOT NULL DEFAULT 0,
  current_place INTEGER CHECK (current_place IS NULL OR current_place IN (1, 2, 3)),
  is_revealing BOOLEAN NOT NULL DEFAULT false,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  tracks_order TEXT[] NOT NULL,
  revealed_tracks TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_demo_day_reveal_state_event_id ON demo_day_reveal_state(event_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_demo_day_reveal_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demo_day_reveal_state_updated_at
  BEFORE UPDATE ON demo_day_reveal_state
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_day_reveal_state_updated_at();

-- Grant access to authenticated users (admin only via RLS)
ALTER TABLE demo_day_reveal_state ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY demo_day_reveal_state_admin_all ON demo_day_reveal_state
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'event_admin')
    )
  );

-- Policy: Everyone can read (for public reveal page)
CREATE POLICY demo_day_reveal_state_public_read ON demo_day_reveal_state
  FOR SELECT
  USING (true);

COMMENT ON TABLE demo_day_reveal_state IS 'Tracks the state of the Demo Day grand finale reveal';
COMMENT ON COLUMN demo_day_reveal_state.current_track_index IS 'Index of the currently revealing track in tracks_order array';
COMMENT ON COLUMN demo_day_reveal_state.current_place IS 'Current place being revealed: 3 (third), 2 (second), 1 (first), or NULL (not started)';
COMMENT ON COLUMN demo_day_reveal_state.is_revealing IS 'Whether we are actively in a reveal sequence';
COMMENT ON COLUMN demo_day_reveal_state.is_paused IS 'Whether the reveal is paused';
COMMENT ON COLUMN demo_day_reveal_state.tracks_order IS 'Array of track IDs in the order they will be revealed';
COMMENT ON COLUMN demo_day_reveal_state.revealed_tracks IS 'Array of track IDs that have been fully revealed';
