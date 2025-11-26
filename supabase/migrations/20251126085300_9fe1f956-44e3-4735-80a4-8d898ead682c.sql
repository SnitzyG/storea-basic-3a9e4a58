-- ====================================================================
-- SECURITY FIX: Ensure privilege escalation prevention trigger exists
-- ====================================================================
-- This trigger prevents users from modifying their role after account creation

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS profiles_prevent_role_update ON profiles;
DROP FUNCTION IF EXISTS prevent_profile_role_update();

-- Create the security function
CREATE OR REPLACE FUNCTION prevent_profile_role_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow role to be set during INSERT (signup)
  -- Block any UPDATE attempts to change the role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Role cannot be modified after account creation. Contact an administrator for role changes.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER profiles_prevent_role_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_role_update();

-- Add helpful comments
COMMENT ON FUNCTION prevent_profile_role_update() IS 
'Security function: Prevents users from escalating privileges by modifying their role column after account creation';

COMMENT ON TRIGGER profiles_prevent_role_update ON profiles IS
'Security trigger: Blocks privilege escalation attempts via role column modification';