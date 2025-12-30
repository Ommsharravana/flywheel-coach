-- Migration: Fix Cycle Names to 50-char Essence
-- ALREADY RUN on 2024-12-30 - Updated 1116 cycles
--
-- Goal: Transform long problem statements into punchy 50-char headlines
-- Pattern: Focus on PAIN/FRUSTRATION (what hurts) in headline style
--
-- Examples:
--   BAD:  "The Problem: These children are consuming 2+ hours of horror-themed content daily..."
--   GOOD: "Kids losing sleep to horror content"
--
--   BAD:  "1st year and 2nd year college students at JKKN struggle during exam preparation..."
--   GOOD: "Students struggling with exam prep"

-- ============================================
-- THE FIX (CTE approach - PostgreSQL compatible)
-- ============================================

-- Step 1: Create temporary extraction function
CREATE OR REPLACE FUNCTION pg_temp.extract_problem_essence(raw_text TEXT)
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

  -- Remove verbose prefixes
  cleaned := REGEXP_REPLACE(cleaned, '^(The Problem[:\s]*|Problem[:\s]*|Issue[:\s]*)', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^(The problem is that\s*|The issue is that\s*|The challenge is that\s*)', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^(Users are frustrated by\s*|People are frustrated by\s*)', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^(I want to\s*|We need to\s*|We want to\s*)', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^(Currently,?\s*|Right now,?\s*|At present,?\s*)', '', 'i');

  -- Remove institution prefixes
  cleaned := REGEXP_REPLACE(cleaned, '^(At JKKN,?\s*|In JKKN,?\s*|At the college,?\s*)', '', 'i');

  -- Simplify actor names
  cleaned := REGEXP_REPLACE(cleaned, '\bcollege students\b', 'students', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\bsenior learners?\b', 'seniors', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\bchildren\b', 'kids', 'gi');

  -- Capitalize first letter
  cleaned := INITCAP(SUBSTRING(TRIM(cleaned) FROM 1 FOR 1)) || SUBSTRING(TRIM(cleaned) FROM 2);

  -- Truncate at word boundary before 50 chars
  IF LENGTH(cleaned) <= 50 THEN
    essence := cleaned;
  ELSE
    IF POSITION(' ' IN LEFT(cleaned, 50)) > 0 THEN
      essence := LEFT(cleaned, 50 - LENGTH(REGEXP_REPLACE(LEFT(cleaned, 50), '^.* ', '')));
      essence := RTRIM(essence);
    ELSE
      essence := LEFT(cleaned, 47) || '...';
    END IF;
  END IF;

  essence := REGEXP_REPLACE(essence, '[,;:\.\s]+$', '');

  IF LENGTH(essence) < 5 THEN
    RETURN NULL;
  END IF;

  RETURN essence;
END;
$$;

-- Step 2: Update using CTE (CORRECT PostgreSQL syntax)
-- Note: PostgreSQL UPDATE...FROM doesn't allow aliasing the target table
WITH new_names AS (
  SELECT
    c.id as cycle_id,
    COALESCE(
      pg_temp.extract_problem_essence(p.refined_statement),
      pg_temp.extract_problem_essence(p.selected_question),
      CASE
        WHEN u.name IS NOT NULL THEN u.name || '''s Cycle'
        ELSE 'Unnamed Cycle'
      END
    ) as new_name
  FROM cycles c
  LEFT JOIN problems p ON p.cycle_id = c.id
  LEFT JOIN users u ON u.id = c.user_id
  WHERE LENGTH(COALESCE(c.name, '')) > 50
     OR c.name = 'New Cycle'
     OR c.name IS NULL
)
UPDATE cycles
SET name = new_names.new_name, updated_at = NOW()
FROM new_names
WHERE cycles.id = new_names.cycle_id;

-- Step 3: Verify results
SELECT
  COUNT(*) as total_cycles,
  COUNT(*) FILTER (WHERE LENGTH(name) <= 50) as names_50_or_less,
  COUNT(*) FILTER (WHERE LENGTH(name) > 50) as names_over_50,
  MAX(LENGTH(name)) as longest_name,
  AVG(LENGTH(name))::INT as avg_length
FROM cycles;
