-- Migration: Extract Essence Names from Problem Statements
-- Goal: Transform long problem statements into punchy 50-char headlines
-- Pattern: Focus on PAIN/FRUSTRATION (what hurts) in headline style
--
-- Examples:
--   BAD:  "The Problem: These children are consuming 2+ hours of horror-themed content daily..."
--   GOOD: "Kids losing sleep to horror content"
--
--   BAD:  "1st year and 2nd year college students at JKKN struggle during exam preparation..."
--   GOOD: "Students struggling with exam prep"
--
-- Run this ONCE manually via Supabase SQL Editor
-- PREVIEW FIRST before running the actual UPDATE

-- ============================================
-- STEP 1: Create helper function for extracting essence
-- ============================================

CREATE OR REPLACE FUNCTION extract_problem_essence(raw_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned TEXT;
  essence TEXT;
BEGIN
  IF raw_text IS NULL OR LENGTH(TRIM(raw_text)) < 5 THEN
    RETURN NULL;
  END IF;

  cleaned := TRIM(raw_text);

  -- LAYER 1: Remove common verbose prefixes (case-insensitive)
  cleaned := REGEXP_REPLACE(cleaned,
    '^(The Problem[:\s]*|Problem[:\s]*|Issue[:\s]*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(The problem is that\s*|The issue is that\s*|The challenge is that\s*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(Users are frustrated by\s*|People are frustrated by\s*|We are frustrated by\s*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(I want to\s*|We need to\s*|We want to\s*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(Currently,?\s*|Right now,?\s*|At present,?\s*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(There is a problem with\s*|There is an issue with\s*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(The main problem is\s*|One of the problems is\s*)',
    '', 'i');

  -- LAYER 2: Remove location/institution prefixes
  cleaned := REGEXP_REPLACE(cleaned,
    '^(At JKKN,?\s*|In JKKN,?\s*|At the college,?\s*|In our college,?\s*)',
    '', 'i');
  cleaned := REGEXP_REPLACE(cleaned,
    '^(In our institution,?\s*|At our institution,?\s*)',
    '', 'i');

  -- LAYER 3: Remove year/grade prefixes but keep the subject
  -- "1st year and 2nd year college students" -> "Students"
  cleaned := REGEXP_REPLACE(cleaned,
    '^(1st|2nd|3rd|4th|first|second|third|fourth)(\s*(year|yr))?(\s*(and|&)\s*(1st|2nd|3rd|4th|first|second|third|fourth)(\s*(year|yr))?)*\s*(college\s*)?',
    '', 'i');

  -- LAYER 4: Simplify actor names
  -- "college students" -> "Students"
  -- "senior learners" -> "Seniors"
  cleaned := REGEXP_REPLACE(cleaned,
    '\bcollege students\b',
    'students', 'gi');
  cleaned := REGEXP_REPLACE(cleaned,
    '\bsenior learners?\b',
    'seniors', 'gi');
  cleaned := REGEXP_REPLACE(cleaned,
    '\byoung children\b',
    'kids', 'gi');
  cleaned := REGEXP_REPLACE(cleaned,
    '\bsmall children\b',
    'kids', 'gi');
  cleaned := REGEXP_REPLACE(cleaned,
    '\bchildren\b',
    'kids', 'gi');
  cleaned := REGEXP_REPLACE(cleaned,
    '\bfaculty members\b',
    'teachers', 'gi');

  -- LAYER 5: Capitalize first letter
  cleaned := INITCAP(SUBSTRING(TRIM(cleaned) FROM 1 FOR 1)) ||
             SUBSTRING(TRIM(cleaned) FROM 2);

  -- LAYER 6: Truncate at word boundary before 50 chars
  IF LENGTH(cleaned) <= 50 THEN
    essence := cleaned;
  ELSE
    -- Find the last space before position 50
    essence := cleaned;
    -- Get first 50 chars and find last space
    IF POSITION(' ' IN LEFT(cleaned, 50)) > 0 THEN
      -- Find last space within 50 chars
      essence := LEFT(cleaned,
        50 - LENGTH(REGEXP_REPLACE(LEFT(cleaned, 50), '^.* ', ''))
      );
      -- Remove trailing space if any
      essence := RTRIM(essence);
    ELSE
      -- No space found, just truncate
      essence := LEFT(cleaned, 47) || '...';
    END IF;
  END IF;

  -- LAYER 7: Clean up punctuation at end
  essence := REGEXP_REPLACE(essence, '[,;:\.\s]+$', '');

  -- LAYER 8: Ensure minimum meaningful length
  IF LENGTH(essence) < 5 THEN
    RETURN NULL;
  END IF;

  RETURN essence;
END;
$$;

-- ============================================
-- STEP 2: Create temp table with proposed names
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS cycle_name_proposals AS
WITH source_data AS (
  -- Get cycles with their problem data
  SELECT
    c.id as cycle_id,
    c.user_id,
    c.name as current_name,
    c.created_at,
    p.refined_statement,
    p.selected_question,
    u.name as user_name
  FROM cycles c
  LEFT JOIN problems p ON p.cycle_id = c.id
  LEFT JOIN users u ON u.id = c.user_id
),
extracted_names AS (
  -- Apply extraction function
  SELECT
    cycle_id,
    user_id,
    current_name,
    created_at,
    refined_statement,
    selected_question,
    user_name,
    COALESCE(
      extract_problem_essence(refined_statement),
      extract_problem_essence(selected_question),
      CASE
        WHEN user_name IS NOT NULL THEN user_name || '''s Cycle'
        ELSE 'Unnamed Cycle'
      END
    ) as proposed_name
  FROM source_data
),
numbered_for_duplicates AS (
  -- Handle duplicates by adding numbers
  SELECT
    cycle_id,
    user_id,
    current_name,
    created_at,
    refined_statement,
    proposed_name,
    ROW_NUMBER() OVER (PARTITION BY LOWER(proposed_name) ORDER BY created_at) as dup_num,
    COUNT(*) OVER (PARTITION BY LOWER(proposed_name)) as total_dups
  FROM extracted_names
)
SELECT
  cycle_id,
  current_name as old_name,
  CASE
    WHEN total_dups = 1 THEN proposed_name
    ELSE LEFT(proposed_name, 44) || ' (' || dup_num || ')'
  END as new_name,
  refined_statement as source_text,
  LENGTH(CASE
    WHEN total_dups = 1 THEN proposed_name
    ELSE LEFT(proposed_name, 44) || ' (' || dup_num || ')'
  END) as new_name_length
FROM numbered_for_duplicates;

-- ============================================
-- STEP 3: PREVIEW QUERY (run this first!)
-- ============================================
-- Shows OLD name vs NEW name for all affected cycles
-- UNCOMMENT AND RUN THIS BEFORE THE UPDATE:

/*
SELECT
  cycle_id,
  LEFT(old_name, 60) || CASE WHEN LENGTH(old_name) > 60 THEN '...' ELSE '' END as old_name_preview,
  new_name,
  new_name_length,
  LEFT(source_text, 80) || CASE WHEN LENGTH(COALESCE(source_text, '')) > 80 THEN '...' ELSE '' END as source_preview
FROM cycle_name_proposals
WHERE old_name IS DISTINCT FROM new_name
ORDER BY new_name_length DESC
LIMIT 20;
*/

-- ============================================
-- STEP 4: Apply the updates (RUN AFTER PREVIEW)
-- ============================================
-- ONLY UNCOMMENT AFTER REVIEWING PREVIEW!

/*
UPDATE cycles c
SET
  name = cnp.new_name,
  updated_at = NOW()
FROM cycle_name_proposals cnp
WHERE c.id = cnp.cycle_id
  AND c.name IS DISTINCT FROM cnp.new_name;

-- Report count
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % cycle names', updated_count;
END $$;
*/

-- ============================================
-- STEP 5: Cleanup
-- ============================================
-- DROP TABLE IF EXISTS cycle_name_proposals;
-- DROP FUNCTION IF EXISTS extract_problem_essence(TEXT);
