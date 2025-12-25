-- Robust superadmin fix migration
-- This ensures director@jkkn.ac.in is superadmin regardless of current state

-- Create a function that runs with elevated privileges to set superadmin
CREATE OR REPLACE FUNCTION ensure_superadmin(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  auth_user_id UUID;
  existing_user_id UUID;
  result TEXT;
BEGIN
  -- Step 1: Get auth user ID
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RETURN 'AUTH_USER_NOT_FOUND: No user with email ' || target_email || ' in auth.users';
  END IF;

  -- Step 2: Check if profile exists by auth ID
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE id = auth_user_id;

  IF existing_user_id IS NOT NULL THEN
    -- Profile exists with correct ID, just update role
    UPDATE public.users
    SET role = 'superadmin', updated_at = NOW()
    WHERE id = auth_user_id;
    result := 'UPDATED: Set role=superadmin for user with id ' || auth_user_id::TEXT;
  ELSE
    -- Check if profile exists by email (ID mismatch case)
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE email = target_email;

    IF existing_user_id IS NOT NULL THEN
      -- Profile exists but with different ID - this is the problem!
      -- Update the ID to match auth.users
      UPDATE public.users
      SET id = auth_user_id, role = 'superadmin', updated_at = NOW()
      WHERE email = target_email;
      result := 'FIXED_ID_MISMATCH: Updated id from ' || existing_user_id::TEXT || ' to ' || auth_user_id::TEXT || ' and set role=superadmin';
    ELSE
      -- No profile at all, create one
      INSERT INTO public.users (id, email, role, name)
      VALUES (auth_user_id, target_email, 'superadmin', 'Director JKKN');
      result := 'CREATED: New profile with id ' || auth_user_id::TEXT || ' and role=superadmin';
    END IF;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix for director@jkkn.ac.in
DO $$
DECLARE
  fix_result TEXT;
BEGIN
  SELECT ensure_superadmin('director@jkkn.ac.in') INTO fix_result;
  RAISE NOTICE 'Superadmin fix result: %', fix_result;
END $$;

-- Also create a trigger to auto-fix ID mismatches on login
CREATE OR REPLACE FUNCTION sync_user_profile_on_login()
RETURNS TRIGGER AS $$
BEGIN
  -- If user profile doesn't exist with this auth ID, check by email
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Check if profile exists by email
    IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
      -- Fix the ID mismatch
      UPDATE public.users
      SET id = NEW.id, updated_at = NOW()
      WHERE email = NEW.email;
    ELSE
      -- Create new profile
      INSERT INTO public.users (id, email, name)
      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the old trigger with the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile_on_login();
