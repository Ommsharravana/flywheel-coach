-- PREVIEW QUERY: Cycle Name Essence Extraction
-- Run this FIRST to see OLD vs NEW names before applying changes
-- This query does NOT modify any data

-- Create the extraction function temporarily
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
  cleaned := REGEXP_REPLACE(cleaned, '^(There is a problem with\s*|There is an issue with\s*)', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^(The main problem is\s*|One of the problems is\s*)', '', 'i');

  -- Remove institution prefixes
  cleaned := REGEXP_REPLACE(cleaned, '^(At JKKN,?\s*|In JKKN,?\s*|At the college,?\s*|In our college,?\s*)', '', 'i');

  -- Remove year prefixes
  cleaned := REGEXP_REPLACE(cleaned, '^(1st|2nd|3rd|4th|first|second|third|fourth)(\s*(year|yr))?(\s*(and|&)\s*(1st|2nd|3rd|4th|first|second|third|fourth)(\s*(year|yr))?)*\s*(college\s*)?', '', 'i');

  -- Simplify actor names
  cleaned := REGEXP_REPLACE(cleaned, '\bcollege students\b', 'students', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\bsenior learners?\b', 'seniors', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\byoung children\b', 'kids', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\bsmall children\b', 'kids', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\bchildren\b', 'kids', 'gi');
  cleaned := REGEXP_REPLACE(cleaned, '\bfaculty members\b', 'teachers', 'gi');

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

  -- Clean trailing punctuation
  essence := REGEXP_REPLACE(essence, '[,;:\.\s]+$', '');

  IF LENGTH(essence) < 5 THEN
    RETURN NULL;
  END IF;

  RETURN essence;
END;
$$;

-- Preview query with side-by-side comparison
WITH source_data AS (
  SELECT
    c.id as cycle_id,
    c.name as current_name,
    c.status,
    c.created_at,
    p.refined_statement,
    p.selected_question,
    u.name as user_name
  FROM cycles c
  LEFT JOIN problems p ON p.cycle_id = c.id
  LEFT JOIN users u ON u.id = c.user_id
),
proposed_names AS (
  SELECT
    cycle_id,
    current_name,
    status,
    created_at,
    refined_statement,
    COALESCE(
      pg_temp.extract_problem_essence(refined_statement),
      pg_temp.extract_problem_essence(selected_question),
      CASE
        WHEN user_name IS NOT NULL THEN user_name || '''s Cycle'
        ELSE 'Unnamed Cycle'
      END
    ) as new_name
  FROM source_data
)
SELECT
  status,
  '| ' || COALESCE(LEFT(current_name, 55), 'NULL') ||
    CASE WHEN LENGTH(COALESCE(current_name, '')) > 55 THEN '...' ELSE '' END ||
    ' | ' as old_name,
  '| ' || new_name || ' |' as new_name,
  LENGTH(new_name) as chars,
  CASE
    WHEN LENGTH(COALESCE(current_name, '')) > 50 THEN 'LONG->SHORT'
    WHEN current_name IS NULL THEN 'NULL->NAMED'
    WHEN current_name = 'New Cycle' THEN 'GENERIC->NAMED'
    ELSE 'UPDATED'
  END as change_type,
  LEFT(COALESCE(refined_statement, ''), 60) ||
    CASE WHEN LENGTH(COALESCE(refined_statement, '')) > 60 THEN '...' ELSE '' END as source_text
FROM proposed_names
WHERE current_name IS DISTINCT FROM new_name
   OR current_name IS NULL
   OR LENGTH(COALESCE(current_name, '')) > 50
ORDER BY
  CASE status
    WHEN 'active' THEN 1
    WHEN 'completed' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- Summary stats
SELECT
  COUNT(*) as total_cycles,
  COUNT(*) FILTER (WHERE LENGTH(COALESCE(name, '')) > 50) as names_over_50_chars,
  COUNT(*) FILTER (WHERE name IS NULL) as null_names,
  COUNT(*) FILTER (WHERE name = 'New Cycle') as generic_names,
  AVG(LENGTH(COALESCE(name, '')))::INT as avg_name_length
FROM cycles;
