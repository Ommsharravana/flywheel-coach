-- Fix the unique constraint on appathon_submissions
-- The original constraint (cycle_id, event_id) only allows ONE submission globally per cycle+event
-- It should allow one submission PER USER per cycle+event
--
-- This was causing "Failed to save draft" errors because:
-- 1. RLS prevents users from seeing other users' submissions
-- 2. User thinks they're inserting (no existing submission visible)
-- 3. But INSERT fails due to unique constraint violation (another user already submitted)

-- Drop the incorrect constraint
DROP INDEX IF EXISTS idx_submissions_cycle_event;

-- Create the correct constraint: one submission per user per cycle per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_cycle_event
ON appathon_submissions(user_id, cycle_id, event_id);

-- Add a comment for clarity
COMMENT ON INDEX idx_submissions_user_cycle_event IS 'One submission per user per cycle per event';
