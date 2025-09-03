-- Fix the recursive policy on project_users table
DROP POLICY IF EXISTS "Users can view project memberships for their projects" ON project_users;

-- Create separate policies for project_users that avoid recursion
CREATE POLICY "Users can view their own project memberships"
ON project_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Project creators can view all project memberships"
ON project_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

-- Now we need to enable INSERT/UPDATE/DELETE operations that were missing
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
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Project creators can remove members"
ON project_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

-- Fix projects table to allow updates and deletes
CREATE POLICY "Project creators can update their projects"
ON projects
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Project creators can delete their projects"
ON projects
FOR DELETE
USING (created_by = auth.uid());