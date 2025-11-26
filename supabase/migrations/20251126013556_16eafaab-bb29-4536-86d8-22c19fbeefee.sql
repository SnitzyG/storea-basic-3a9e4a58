-- Function to add STOREA Bot to all existing projects
-- Run this after creating the STOREA Bot account
CREATE OR REPLACE FUNCTION add_storea_bot_to_all_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_user_id uuid;
BEGIN
  -- Find STOREA Bot by email
  SELECT p.user_id INTO bot_user_id
  FROM profiles p
  WHERE p.name = 'STOREA Bot' OR p.name = 'STOREA'
  LIMIT 1;
  
  IF bot_user_id IS NULL THEN
    RAISE EXCEPTION 'STOREA Bot account not found. Please create the account first.';
  END IF;

  -- Add STOREA Bot to all existing projects
  INSERT INTO project_users (project_id, user_id, role, joined_at)
  SELECT 
    p.id,
    bot_user_id,
    'contractor',
    now()
  FROM projects p
  WHERE NOT EXISTS (
    SELECT 1 FROM project_users pu 
    WHERE pu.project_id = p.id 
    AND pu.user_id = bot_user_id
  );
END;
$$;

-- Trigger function to automatically add STOREA Bot to new projects
CREATE OR REPLACE FUNCTION auto_add_storea_bot_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_user_id uuid;
BEGIN
  -- Find STOREA Bot
  SELECT p.user_id INTO bot_user_id
  FROM profiles p
  WHERE p.name = 'STOREA Bot' OR p.name = 'STOREA'
  LIMIT 1;
  
  -- Only add if bot account exists
  IF bot_user_id IS NOT NULL THEN
    INSERT INTO project_users (project_id, user_id, role, joined_at)
    VALUES (NEW.id, bot_user_id, 'contractor', now())
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-add STOREA Bot to new projects
DROP TRIGGER IF EXISTS trigger_auto_add_storea_bot ON projects;
CREATE TRIGGER trigger_auto_add_storea_bot
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_storea_bot_to_project();