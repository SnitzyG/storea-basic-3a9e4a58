-- Update STOREA Bot functions to use email lookup instead of name
-- This makes the bot identification more reliable and configurable

-- Function to add STOREA Bot to all existing projects
-- Now searches by email through auth.users for reliability
CREATE OR REPLACE FUNCTION add_storea_bot_to_all_projects(bot_email text DEFAULT 'storeabot@gmail.com')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_user_id uuid;
BEGIN
  -- Find STOREA Bot by email through auth.users
  SELECT p.user_id INTO bot_user_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE LOWER(u.email) = LOWER(bot_email)
  LIMIT 1;
  
  IF bot_user_id IS NULL THEN
    RAISE EXCEPTION 'STOREA Bot account with email "%" not found. Please create the account first.', bot_email;
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
-- Uses email lookup for reliability
CREATE OR REPLACE FUNCTION auto_add_storea_bot_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_user_id uuid;
  bot_email text := 'storeabot@gmail.com'; -- Configure bot email here
BEGIN
  -- Find STOREA Bot by email
  SELECT p.user_id INTO bot_user_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE LOWER(u.email) = LOWER(bot_email)
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