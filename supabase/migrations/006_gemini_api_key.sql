-- Add Gemini API key column to users table for BYOS (Bring Your Own Subscription)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Add comment for clarity
COMMENT ON COLUMN users.gemini_api_key IS 'User-provided Gemini API key for personalized prompt generation';
