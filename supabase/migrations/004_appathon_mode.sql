-- Appathon 2.0 Mode
-- Adds toggleable Appathon mode for competition-specific features
-- Can be removed after January 2026

-- Add appathon_mode column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS appathon_mode BOOLEAN DEFAULT FALSE;

-- Track when Appathon mode was last toggled (for analytics)
ALTER TABLE users ADD COLUMN IF NOT EXISTS appathon_mode_toggled_at TIMESTAMPTZ;

-- Optional: Index for quick filtering of Appathon participants
CREATE INDEX IF NOT EXISTS idx_users_appathon_mode ON users(appathon_mode) WHERE appathon_mode = TRUE;

COMMENT ON COLUMN users.appathon_mode IS 'Enables Appathon 2.0 specific features (Dec 2025 - Jan 2026)';
