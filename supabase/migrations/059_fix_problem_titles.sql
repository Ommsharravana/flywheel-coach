-- Migration: Fix Problem Titles from refined_statement
-- Goal: Problem Bank shows "New Flywheel Cycle" because problems.title was never set
-- Solution: Extract 50-char essence from refined_statement (same as cycle names)

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

-- Step 2: Preview what will change
SELECT
  p.id,
  p.title as current_title,
  pg_temp.extract_problem_essence(p.refined_statement) as new_title,
  LEFT(p.refined_statement, 60) as source_text
FROM problems p
WHERE p.title = 'New Flywheel Cycle'
   OR p.title IS NULL
   OR LENGTH(COALESCE(p.title, '')) > 50
ORDER BY p.created_at DESC
LIMIT 20;

-- Step 3: Update problem titles using CTE
WITH new_titles AS (
  SELECT
    p.id as problem_id,
    COALESCE(
      pg_temp.extract_problem_essence(p.refined_statement),
      pg_temp.extract_problem_essence(p.selected_question),
      'Untitled Problem'
    ) as new_title
  FROM problems p
  WHERE p.title = 'New Flywheel Cycle'
     OR p.title IS NULL
     OR LENGTH(COALESCE(p.title, '')) > 50
)
UPDATE problems
SET title = new_titles.new_title, updated_at = NOW()
FROM new_titles
WHERE problems.id = new_titles.problem_id;

-- Step 4: Verify results
SELECT
  COUNT(*) as total_problems,
  COUNT(*) FILTER (WHERE title = 'New Flywheel Cycle') as still_generic,
  COUNT(*) FILTER (WHERE title IS NULL) as null_titles,
  COUNT(*) FILTER (WHERE LENGTH(title) <= 50) as titles_50_or_less,
  MAX(LENGTH(title)) as longest_title
FROM problems;
