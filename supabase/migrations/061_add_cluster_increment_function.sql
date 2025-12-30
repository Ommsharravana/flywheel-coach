-- Function to increment cluster problem count
CREATE OR REPLACE FUNCTION increment_cluster_count(cluster_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE problem_clusters
  SET problem_count = problem_count + 1,
      updated_at = NOW()
  WHERE id = cluster_uuid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_cluster_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_cluster_count(UUID) TO service_role;

-- Also add added_by column to problem_cluster_members if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problem_cluster_members' AND column_name = 'added_by'
  ) THEN
    ALTER TABLE problem_cluster_members ADD COLUMN added_by TEXT DEFAULT 'manual';
  END IF;
END $$;
