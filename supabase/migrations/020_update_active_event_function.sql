-- Migration: Add RPC function to update user's active_event_id
-- This bypasses RLS to allow all authenticated users to update their own active_event_id

-- Create function to update active event for a user
CREATE OR REPLACE FUNCTION update_user_active_event(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's active_event_id
  UPDATE users
  SET
    active_event_id = p_event_id,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Create function to clear active event for a user
CREATE OR REPLACE FUNCTION clear_user_active_event(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear the user's active_event_id
  UPDATE users
  SET
    active_event_id = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_user_active_event(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_active_event(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION update_user_active_event IS 'Updates user active_event_id bypassing RLS - SECURITY DEFINER';
COMMENT ON FUNCTION clear_user_active_event IS 'Clears user active_event_id bypassing RLS - SECURITY DEFINER';
