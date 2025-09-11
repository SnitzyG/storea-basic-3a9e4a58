-- Check if we need additional database improvements for team management
-- The project_users table already exists, but let's add some indexes and ensure proper structure

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON project_users(user_id);
CREATE INDEX IF NOT EXISTS idx_project_users_role ON project_users(role);

-- Ensure profiles table has all needed fields for team display
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS online_status boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Add function to update last seen timestamp
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET last_seen = now(), online_status = true 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$function$;

-- Create trigger to update last seen when user is active
DROP TRIGGER IF EXISTS on_auth_user_last_seen ON auth.users;
CREATE TRIGGER on_auth_user_last_seen
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_last_seen();