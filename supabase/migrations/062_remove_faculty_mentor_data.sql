-- Migration: Remove faculty mentor data from appathon_submissions
-- This removes the deprecated faculty_mentor field as senior learners now serve as team mentors

-- Set all faculty_mentor values to null (cleanup existing data)
UPDATE appathon_submissions
SET faculty_mentor = NULL
WHERE faculty_mentor IS NOT NULL;

-- Log the change for audit purposes
DO $$
BEGIN
  RAISE NOTICE 'Faculty mentor data cleanup complete. Senior learners (1-3 per team) now serve as team mentors.';
END $$;
