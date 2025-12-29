-- Add senior_learner column to appathon_submissions
-- This stores the mandatory Senior Learner team member as JSONB
--
-- The AppathonSubmission component (line 338) saves senior_learner field
-- but this column was missing from the original schema (migration 008)

ALTER TABLE appathon_submissions
ADD COLUMN IF NOT EXISTS senior_learner JSONB;

-- Add comment for clarity
COMMENT ON COLUMN appathon_submissions.senior_learner IS 'Mandatory Senior Learner mentor for the team (stored as UserResult object with id, name, email, institution_id)';
