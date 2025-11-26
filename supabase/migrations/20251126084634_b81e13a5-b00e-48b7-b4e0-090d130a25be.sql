-- ====================================================================
-- SECURITY FIX: Prevent privilege escalation via profiles.role column
-- ====================================================================
-- Issue: Users can potentially update their own role column in profiles table
-- via direct database calls, bypassing UI restrictions
-- Solution: Add trigger to block any role updates after account creation

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

CREATE TRIGGER profiles_prevent_role_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_role_update();

COMMENT ON FUNCTION prevent_profile_role_update() IS 
'Security function: Prevents users from escalating privileges by modifying their role column after account creation';

COMMENT ON TRIGGER profiles_prevent_role_update ON profiles IS
'Security trigger: Blocks privilege escalation attempts via role column modification';