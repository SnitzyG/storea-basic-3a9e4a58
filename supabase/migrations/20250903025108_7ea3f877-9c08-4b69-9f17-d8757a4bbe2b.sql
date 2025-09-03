-- Drop ALL existing policies first to start clean
DROP POLICY IF EXISTS "Users can view their own project memberships" ON project_users;
DROP POLICY IF EXISTS "Project creators can view all project memberships" ON project_users;
DROP POLICY IF EXISTS "Project creators can invite users" ON project_users;
DROP POLICY IF EXISTS "Project creators can manage memberships" ON project_users;
DROP POLICY IF EXISTS "Project creators can remove members" ON project_users;
DROP POLICY IF EXISTS "Users can view projects they created" ON projects;
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Project creators can manage their projects" ON projects;
DROP POLICY IF EXISTS "Project creators can update their projects" ON projects;
DROP POLICY IF EXISTS "Project creators can delete their projects" ON projects;
DROP POLICY IF EXISTS "Architects can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects they're invited to" ON projects;

-- Now create clean, non-recursive policies for project_users
CREATE POLICY "project_users_select_own"
ON project_users
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "project_users_select_as_creator"
ON project_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "project_users_insert"
ON project_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "project_users_update"
ON project_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "project_users_delete"
ON project_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

-- Create clean policies for projects
CREATE POLICY "projects_select_as_creator"
ON projects
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "projects_select_as_member"
ON projects
FOR SELECT
USING (
  id IN (
    SELECT project_id 
    FROM project_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert"
ON projects
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "projects_update"
ON projects
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "projects_delete"
ON projects
FOR DELETE
USING (created_by = auth.uid());