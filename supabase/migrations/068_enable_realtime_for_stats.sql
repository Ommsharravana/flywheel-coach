-- Enable realtime for cycles and problem_bank tables
-- This allows the Problem Bank admin page to receive live updates

-- First, check if the tables exist in the publication and add them if not
-- Using DO block to handle case where tables might already be in the publication

DO $$
BEGIN
  -- Check if cycles table is in the realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'cycles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cycles;
    RAISE NOTICE 'Added cycles table to realtime publication';
  ELSE
    RAISE NOTICE 'cycles table already in realtime publication';
  END IF;

  -- Check if problem_bank table is in the realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'problem_bank'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE problem_bank;
    RAISE NOTICE 'Added problem_bank table to realtime publication';
  ELSE
    RAISE NOTICE 'problem_bank table already in realtime publication';
  END IF;
END $$;

-- Set REPLICA IDENTITY to ensure proper change detection
-- FULL means all columns are included in the change event
ALTER TABLE cycles REPLICA IDENTITY FULL;
ALTER TABLE problem_bank REPLICA IDENTITY FULL;

COMMENT ON TABLE cycles IS 'Flywheel cycles - realtime enabled for Problem Bank stats';
COMMENT ON TABLE problem_bank IS 'Saved problems - realtime enabled for Problem Bank stats';
