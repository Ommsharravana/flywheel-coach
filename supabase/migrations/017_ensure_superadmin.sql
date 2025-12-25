-- Ensure superadmin user exists with correct role
-- This migration ensures director@jkkn.ac.in has superadmin role

-- First, ensure the user profile exists and has superadmin role
-- Using a DO block for conditional logic
DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  -- Get the auth user ID for director@jkkn.ac.in
  SELECT id, email INTO auth_user_id, auth_user_email
  FROM auth.users
  WHERE email = 'director@jkkn.ac.in'
  LIMIT 1;

  IF auth_user_id IS NOT NULL THEN
    -- Insert or update the user profile with superadmin role
    INSERT INTO public.users (id, email, role, name)
    VALUES (auth_user_id, auth_user_email, 'superadmin', 'Director JKKN')
    ON CONFLICT (id) DO UPDATE SET
      role = 'superadmin',
      updated_at = NOW();

    RAISE NOTICE 'Superadmin role set for user %', auth_user_email;
  ELSE
    RAISE NOTICE 'User director@jkkn.ac.in not found in auth.users - will be created on first login';
  END IF;
END $$;

-- Also create a trigger to automatically set superadmin role for this email on new user creation
CREATE OR REPLACE FUNCTION auto_set_superadmin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'director@jkkn.ac.in' THEN
    NEW.role := 'superadmin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_superadmin_on_insert ON public.users;
CREATE TRIGGER set_superadmin_on_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_superadmin_role();
