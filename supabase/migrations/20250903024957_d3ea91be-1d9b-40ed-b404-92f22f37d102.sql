-- Fix infinite recursion in project_users RLS policies
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view projects they are members of" ON project_users;
DROP POLICY IF EXISTS "Users can join projects they are invited to" ON project_users;
DROP POLICY IF EXISTS "Project creators can manage project users" ON project_users;
DROP POLICY IF EXISTS "Users can view their own project memberships" ON project_users;

-- Create safe RLS policies that avoid recursion
CREATE POLICY "Users can view their own project memberships"
ON project_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Project creators can invite users"
ON project_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Project creators can manage memberships"
ON project_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

-- Also fix projects table RLS to avoid recursion
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create safe project policies
CREATE POLICY "Users can view projects they created"
ON projects
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can view projects they are members of"
ON projects
FOR SELECT
USING (
  id IN (
    SELECT project_id 
    FROM project_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create projects"
ON projects
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project creators can manage their projects"
ON projects
FOR ALL
USING (created_by = auth.uid());