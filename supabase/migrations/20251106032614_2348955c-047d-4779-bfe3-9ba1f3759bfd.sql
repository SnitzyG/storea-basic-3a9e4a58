-- Create or get company for RG Architects
DO $$
DECLARE
  company_uuid uuid;
BEGIN
  -- Check if company exists
  SELECT id INTO company_uuid FROM companies WHERE LOWER(name) = 'rg architects';
  
  -- Create company if it doesn't exist
  IF company_uuid IS NULL THEN
    INSERT INTO companies (name, created_at, updated_at)
    VALUES ('RG Architects', now(), now())
    RETURNING id INTO company_uuid;
  END IF;
  
  -- Create profile for the user
  INSERT INTO profiles (user_id, name, role, company_id, approved, approved_at)
  VALUES (
    'f007aeee-64e1-47d5-b870-c12e3ff2ec0c',
    'Richard Goodwin',
    'architect',
    company_uuid,
    true,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    approved = EXCLUDED.approved,
    approved_at = EXCLUDED.approved_at;
END $$;