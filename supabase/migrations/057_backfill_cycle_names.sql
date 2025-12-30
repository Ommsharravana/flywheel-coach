-- One-time backfill: Rename cycles that have generic names
-- Only affects cycles where name = 'New Cycle' OR name IS NULL
-- Uses problem discovery data to generate meaningful names
--
-- Run this ONCE manually via Supabase SQL Editor

-- Step 1: Create a temp table with proposed new names
CREATE TEMP TABLE cycle_name_updates AS
WITH cycles_to_update AS (
  -- Find cycles needing new names
  SELECT
    c.id as cycle_id,
    c.user_id,
    c.name as current_name,
    p.refined_statement,
    p.selected_question,
    u.name as user_name
  FROM cycles c
  LEFT JOIN problems p ON p.cycle_id = c.id
  LEFT JOIN users u ON u.id = c.user_id
  WHERE c.name = 'New Cycle' OR c.name IS NULL
),
cleaned_names AS (
  -- Generate clean names from problem statements
  SELECT
    cycle_id,
    user_id,
    current_name,
    refined_statement,
    selected_question,
    user_name,
    CASE
      -- Try refined_statement first
      WHEN refined_statement IS NOT NULL AND LENGTH(TRIM(refined_statement)) > 5 THEN
        -- Remove common prefixes and clean up
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                TRIM(refined_statement),
                '^(I want to|We need to|The problem is|Users are frustrated by|The issue is)\s*',
                '',
                'i'
              ),
              '^(.)',  -- Capitalize first letter
              UPPER(SUBSTRING(TRIM(refined_statement) FROM 1 FOR 1))
            ),
            '[,;:]$',  -- Remove trailing punctuation
            ''
          ),
          '\s+',  -- Normalize whitespace
          ' '
        )
      -- Fall back to selected_question
      WHEN selected_question IS NOT NULL AND LENGTH(TRIM(selected_question)) > 5 THEN
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                TRIM(selected_question),
                '^(I want to|We need to|The problem is|Users are frustrated by|The issue is)\s*',
                '',
                'i'
              ),
              '^(.)',
              UPPER(SUBSTRING(TRIM(selected_question) FROM 1 FOR 1))
            ),
            '[,;:]$',
            ''
          ),
          '\s+',
          ' '
        )
      -- Fall back to user name
      WHEN user_name IS NOT NULL AND LENGTH(TRIM(user_name)) > 0 THEN
        TRIM(user_name) || '''s Cycle'
      ELSE
        'Unnamed Cycle'
    END as raw_name
  FROM cycles_to_update
),
truncated_names AS (
  -- Truncate to ~50 chars at word boundary
  SELECT
    cycle_id,
    user_id,
    current_name,
    raw_name,
    CASE
      WHEN LENGTH(raw_name) <= 50 THEN raw_name
      ELSE
        -- Find last space before position 50
        LEFT(raw_name,
          GREATEST(
            30,
            COALESCE(
              LENGTH(raw_name) - LENGTH(REGEXP_REPLACE(LEFT(raw_name, 50), '.* ', '')),
              50
            )
          )
        )
    END as base_name
  FROM cleaned_names
),
-- Add suffix numbers for duplicates
numbered_names AS (
  SELECT
    tn.cycle_id,
    tn.base_name,
    ROW_NUMBER() OVER (PARTITION BY LOWER(tn.base_name) ORDER BY tn.cycle_id) as duplicate_num,
    COUNT(*) OVER (PARTITION BY LOWER(tn.base_name)) as total_duplicates
  FROM truncated_names tn
)
SELECT
  cycle_id,
  CASE
    WHEN total_duplicates = 1 THEN base_name
    ELSE base_name || ' (' || duplicate_num || ')'
  END as new_name
FROM numbered_names;

-- Step 2: Preview the changes (uncomment to test before running)
-- SELECT
--   c.id,
--   c.name as old_name,
--   u.new_name,
--   p.refined_statement
-- FROM cycle_name_updates u
-- JOIN cycles c ON c.id = u.cycle_id
-- LEFT JOIN problems p ON p.cycle_id = c.id
-- ORDER BY c.created_at DESC;

-- Step 3: Apply the updates
UPDATE cycles c
SET
  name = u.new_name,
  updated_at = NOW()
FROM cycle_name_updates u
WHERE c.id = u.cycle_id
  AND (c.name = 'New Cycle' OR c.name IS NULL);

-- Step 4: Report what was updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfill complete: % cycles renamed', updated_count;
END $$;

-- Clean up
DROP TABLE IF EXISTS cycle_name_updates;
