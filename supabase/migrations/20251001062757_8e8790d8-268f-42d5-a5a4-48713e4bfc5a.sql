-- Enable RLS on projects table if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;

-- Allow authenticated users to insert projects
-- They will be added to project_users after creation
CREATE POLICY "Users can insert projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to view projects they're members of
CREATE POLICY "Users can view their projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = projects.id
    AND project_users.user_id = auth.uid()
  )
  OR created_by = auth.uid()
);

-- Allow project creators and architects to update projects
CREATE POLICY "Users can update their projects"
ON projects
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = projects.id
    AND project_users.user_id = auth.uid()
    AND project_users.role = 'architect'
  )
);

-- Allow project creators to delete projects
CREATE POLICY "Users can delete their projects"
ON projects
FOR DELETE
TO authenticated
USING (created_by = auth.uid());