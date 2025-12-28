-- Migration: Add RLS policy for user search
-- Purpose: Allow authenticated users to search other users for team formation
-- This is safer than using service role key

-- Drop existing restrictive policy if it exists and add a more permissive one for search
-- First, check if a policy exists and drop it

-- Allow authenticated users to read basic user info for searching
CREATE POLICY "Authenticated users can search other users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: This makes user data readable by all authenticated users.
-- In production, you might want to restrict this to specific columns using a view.
