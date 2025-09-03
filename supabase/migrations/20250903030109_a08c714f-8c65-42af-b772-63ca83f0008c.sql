-- Ensure users have companies to create projects
-- First, check if companies exist and create a default one if needed

-- Insert a default company if none exists
INSERT INTO companies (id, name, address, settings)
SELECT 
  gen_random_uuid(),
  'Default Company',
  '123 Main Street',
  '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM companies);

-- Update profiles that don't have a company_id to reference the first company
UPDATE profiles 
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;

-- Create proper RLS policy for companies
DROP POLICY IF EXISTS "Users can view their company" ON companies;

CREATE POLICY "users_can_view_company"
ON companies
FOR SELECT
USING (
  id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Also allow users to see companies they're associated with through projects
CREATE POLICY "users_can_view_project_companies"
ON companies
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT p.company_id 
    FROM projects p
    JOIN project_users pu ON p.id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- Ensure architect role restriction for project creation is working
DROP POLICY IF EXISTS "Architects can create projects" ON projects;

CREATE POLICY "architects_can_create_projects"
ON projects
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'architect'
  )
);

-- Fix any missing profile role constraint
UPDATE profiles 
SET role = 'architect'
WHERE role IS NULL;