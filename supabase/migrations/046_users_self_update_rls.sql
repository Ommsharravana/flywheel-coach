-- Migration: Add RLS policy for users to update their own profile
-- Purpose: Allow authenticated users to update their own row in users table
-- This fixes the role change functionality in Settings page

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Note: This allows users to update ALL columns on their own row.
-- The role column is constrained by CHECK constraint to valid values only.
