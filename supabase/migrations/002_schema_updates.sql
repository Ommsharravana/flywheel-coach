-- Flywheel Coach Schema Updates
-- Run this after 001_initial_schema.sql

-- ============================================
-- ADD MISSING COLUMNS TO PROBLEMS
-- ============================================

ALTER TABLE problems ADD COLUMN IF NOT EXISTS statement TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';

-- ============================================
-- ADD MISSING COLUMNS TO CONTEXTS
-- ============================================

ALTER TABLE contexts ADD COLUMN IF NOT EXISTS who TEXT;
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS when_occurs TEXT;
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS where_occurs TEXT;
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS how_painful TEXT;
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS current_solution TEXT;

-- ============================================
-- ADD MISSING COLUMNS TO VALUE_ASSESSMENTS
-- ============================================

ALTER TABLE value_assessments ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}';
ALTER TABLE value_assessments ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}';

-- ============================================
-- ADD MISSING COLUMNS TO WORKFLOW_CLASSIFICATIONS
-- ============================================

ALTER TABLE workflow_classifications ADD COLUMN IF NOT EXISTS features TEXT[];

-- ============================================
-- ADD MISSING COLUMNS TO PROMPTS
-- ============================================

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS edited_prompt TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS copied_at TIMESTAMPTZ;

-- ============================================
-- CREATE IMPACTS TABLE (renamed from impact_assessments for app compatibility)
-- ============================================

CREATE TABLE IF NOT EXISTS impacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  users_reached INT,
  time_saved_minutes INT,
  satisfaction_score INT CHECK (satisfaction_score BETWEEN 1 AND 10),
  feedback TEXT,
  lessons_learned TEXT,
  new_problems TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on impacts
ALTER TABLE impacts ENABLE ROW LEVEL SECURITY;

-- Impacts policies
CREATE POLICY "Users can view own impacts"
  ON impacts FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own impacts"
  ON impacts FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own impacts"
  ON impacts FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own impacts"
  ON impacts FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- ============================================
-- ADD DELETE POLICIES FOR RESTART FUNCTIONALITY
-- ============================================

-- Problems delete policy
CREATE POLICY "Users can delete own problems"
  ON problems FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Contexts delete policy
CREATE POLICY "Users can delete own contexts"
  ON contexts FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Interviews delete policy
CREATE POLICY "Users can delete own interviews"
  ON interviews FOR DELETE
  USING (context_id IN (
    SELECT c.id FROM contexts c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

-- Value assessments delete policy
CREATE POLICY "Users can delete own value assessments"
  ON value_assessments FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Workflow classifications delete policy
CREATE POLICY "Users can delete own workflow classifications"
  ON workflow_classifications FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Prompts delete policy
CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Builds delete policy
CREATE POLICY "Users can delete own builds"
  ON builds FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Conversations delete policy
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Messages delete policy
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

-- ============================================
-- INDEX FOR IMPACTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_impacts_cycle ON impacts(cycle_id);

-- ============================================
-- UPDATED_AT TRIGGER FOR IMPACTS
-- ============================================

CREATE TRIGGER update_impacts_updated_at
  BEFORE UPDATE ON impacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
