-- Fix: generate_submission_number() trigger parsing bug
-- Bug: SPLIT_PART(submission_number, '-', 3) expects format APPATHON-2-0001
-- Reality: Generation creates APPATHON20-0001 (only 2 parts)
-- Result: SPLIT_PART returns '' and CAST('' AS INTEGER) fails
--
-- Fix: Use regex to extract trailing number, handles any format

CREATE OR REPLACE FUNCTION generate_submission_number()
RETURNS TRIGGER AS $$
DECLARE
  event_slug TEXT;
  next_num INTEGER;
BEGIN
  -- Get event slug
  SELECT slug INTO event_slug FROM events WHERE id = NEW.event_id;

  -- Get next number for this event
  -- FIX: Use regex to extract trailing number (handles any format)
  -- Format: PREFIX-NNNN, extracts NNNN from end
  SELECT COALESCE(MAX(
    (regexp_match(submission_number, '-(\d+)$'))[1]::INTEGER
  ), 0) + 1
  INTO next_num
  FROM appathon_submissions
  WHERE event_id = NEW.event_id AND submission_number IS NOT NULL;

  -- Generate submission number: APPATHON20-0001
  NEW.submission_number := UPPER(REPLACE(event_slug, '-', '')) || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, function update is sufficient
