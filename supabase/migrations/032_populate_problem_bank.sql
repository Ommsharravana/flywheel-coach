-- Populate problem_bank from existing cycles
-- The extract_problem_from_cycle function exists but was never called
-- This migration populates the problem bank with all validated problems from cycles

DO $$
DECLARE
  v_cycle RECORD;
  v_count INT := 0;
BEGIN
  -- Loop through all cycles that have problem data and are at least at step 3 (context discovered)
  FOR v_cycle IN
    SELECT c.id
    FROM cycles c
    WHERE c.current_step >= 3  -- At least past problem discovery
      AND EXISTS (
        SELECT 1 FROM problems p
        WHERE p.cycle_id = c.id
          AND p.refined_statement IS NOT NULL
          AND p.refined_statement != ''
      )
      AND NOT EXISTS (
        SELECT 1 FROM problem_bank pb WHERE pb.original_cycle_id = c.id
      )
    ORDER BY c.created_at
  LOOP
    BEGIN
      -- Try to extract problem from this cycle
      PERFORM extract_problem_from_cycle(v_cycle.id);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Skip cycles that fail (missing data, etc)
      RAISE NOTICE 'Skipped cycle %: %', v_cycle.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Populated % problems into problem_bank', v_count;
END $$;

-- Note: Removed fallback INSERT that referenced non-existent column
-- The DO block above handles all cycles with extract_problem_from_cycle function
