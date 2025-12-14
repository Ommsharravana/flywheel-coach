-- Flywheel Coach Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  institution TEXT DEFAULT 'JKKN',
  department TEXT,
  year_of_study INT,
  role TEXT DEFAULT 'learner' CHECK (role IN ('learner', 'facilitator', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cycles (One per flywheel journey)
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_step INT DEFAULT 1 CHECK (current_step BETWEEN 1 AND 8),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  impact_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 1: PROBLEM DISCOVERY
-- ============================================

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  -- 5 Questions answers
  q_takes_too_long TEXT,
  q_repetitive TEXT,
  q_lookup_repeatedly TEXT,
  q_complaints TEXT,
  q_would_pay TEXT,

  -- Refined output
  selected_question TEXT,
  refined_statement TEXT,
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'occasional')),

  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: CONTEXT DISCOVERY
-- ============================================

CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  -- Who has it
  primary_users TEXT,
  secondary_users TEXT,
  estimated_count INT,

  -- When does it happen
  frequency TEXT,
  specific_trigger TEXT,
  duration TEXT,

  -- How painful
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  impact_if_unsolved TEXT,

  -- Current workaround
  current_workaround TEXT,
  time_on_workaround TEXT,
  workaround_satisfaction INT CHECK (workaround_satisfaction BETWEEN 1 AND 10),

  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews conducted during context discovery
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
  interviewee_name TEXT,
  interviewee_role TEXT,
  key_quote TEXT,
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  referrals TEXT[], -- Array of suggested names
  conducted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: VALUE DISCOVERY
-- ============================================

CREATE TABLE value_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  -- Desperate User Test
  multiple_have_it BOOLEAN,
  multiple_have_it_evidence TEXT,
  complained_before BOOLEAN,
  complained_before_evidence TEXT,
  doing_something BOOLEAN,
  doing_something_evidence TEXT,
  light_up_at_solution BOOLEAN,
  light_up_evidence TEXT,
  ask_when_can_use BOOLEAN,
  ask_when_evidence TEXT,

  -- Calculated
  desperate_user_score INT CHECK (desperate_user_score BETWEEN 0 AND 5),
  quadrant TEXT CHECK (quadrant IN ('quick-win', 'strategic', 'selective', 'skip')),
  decision TEXT CHECK (decision IN ('proceed', 'iterate', 'pivot', 'stop')),
  reasoning TEXT,

  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: WORKFLOW CLASSIFICATION
-- ============================================

CREATE TABLE workflow_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  workflow_type TEXT CHECK (workflow_type IN (
    'AUDIT', 'GENERATION', 'TRANSFORMATION', 'CLASSIFICATION',
    'EXTRACTION', 'SYNTHESIS', 'PREDICTION', 'RECOMMENDATION',
    'MONITORING', 'ORCHESTRATION'
  )),
  classification_path JSONB, -- How they got to this answer
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),

  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: PROMPT GENERATION
-- ============================================

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  generated_prompt TEXT,
  user_edited_prompt TEXT,
  final_prompt TEXT,

  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 6: BUILDING
-- ============================================

CREATE TABLE builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  lovable_project_url TEXT,
  deployed_url TEXT,
  screenshot_urls TEXT[],
  notes TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7-8: IMPACT DISCOVERY
-- ============================================

CREATE TABLE impact_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,

  -- Adoption
  total_users INT,
  potential_users INT,
  adoption_rate DECIMAL(5,2),

  -- Retention
  weekly_active_users INT,
  returning_users INT,
  retention_rate DECIMAL(5,2),

  -- Pain reduction
  pain_before INT,
  pain_after INT,
  time_before TEXT,
  time_after TEXT,

  -- Organic growth
  referral_users INT,
  referral_rate DECIMAL(5,2),
  nps_score INT CHECK (nps_score BETWEEN 1 AND 10),

  -- Calculated
  impact_score INT CHECK (impact_score BETWEEN 0 AND 100),

  -- What's next
  new_problems_discovered TEXT[],

  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI COACHING
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE,
  step INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMIFICATION
-- ============================================

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill progress tracking
CREATE TABLE skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_area TEXT NOT NULL, -- 'problem_discovery', 'context_discovery', etc.
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_cycles_user ON cycles(user_id);
CREATE INDEX idx_cycles_status ON cycles(status);
CREATE INDEX idx_problems_cycle ON problems(cycle_id);
CREATE INDEX idx_contexts_cycle ON contexts(cycle_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_badges_user ON badges(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Cycles policies
CREATE POLICY "Users can view own cycles"
  ON cycles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cycles"
  ON cycles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cycles"
  ON cycles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cycles"
  ON cycles FOR DELETE
  USING (user_id = auth.uid());

-- Problems policies
CREATE POLICY "Users can view own problems"
  ON problems FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own problems"
  ON problems FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own problems"
  ON problems FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Contexts policies
CREATE POLICY "Users can view own contexts"
  ON contexts FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own contexts"
  ON contexts FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own contexts"
  ON contexts FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Interviews policies
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  USING (context_id IN (
    SELECT c.id FROM contexts c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT
  WITH CHECK (context_id IN (
    SELECT c.id FROM contexts c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  USING (context_id IN (
    SELECT c.id FROM contexts c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

-- Value assessments policies
CREATE POLICY "Users can view own value assessments"
  ON value_assessments FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own value assessments"
  ON value_assessments FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own value assessments"
  ON value_assessments FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Workflow classifications policies
CREATE POLICY "Users can view own workflow classifications"
  ON workflow_classifications FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own workflow classifications"
  ON workflow_classifications FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own workflow classifications"
  ON workflow_classifications FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Prompts policies
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Builds policies
CREATE POLICY "Users can view own builds"
  ON builds FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own builds"
  ON builds FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own builds"
  ON builds FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Impact assessments policies
CREATE POLICY "Users can view own impact assessments"
  ON impact_assessments FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own impact assessments"
  ON impact_assessments FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own impact assessments"
  ON impact_assessments FOR UPDATE
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid()));

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN cycles cy ON c.cycle_id = cy.id
    WHERE cy.user_id = auth.uid()
  ));

-- Badges policies
CREATE POLICY "Users can view own badges"
  ON badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own badges"
  ON badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Skill progress policies
CREATE POLICY "Users can view own skill progress"
  ON skill_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own skill progress"
  ON skill_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own skill progress"
  ON skill_progress FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cycles_updated_at
  BEFORE UPDATE ON cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contexts_updated_at
  BEFORE UPDATE ON contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_value_assessments_updated_at
  BEFORE UPDATE ON value_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_classifications_updated_at
  BEFORE UPDATE ON workflow_classifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builds_updated_at
  BEFORE UPDATE ON builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impact_assessments_updated_at
  BEFORE UPDATE ON impact_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
