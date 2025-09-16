-- Drop the existing INSERT policies for projects table
DROP POLICY IF EXISTS "architects_can_create_projects" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;

-- Create a single, combined INSERT policy that checks both conditions
CREATE POLICY "architects_can_create_projects" ON projects 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'architect'
  )
);