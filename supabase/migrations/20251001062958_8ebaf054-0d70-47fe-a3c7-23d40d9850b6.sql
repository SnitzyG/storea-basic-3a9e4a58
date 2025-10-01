-- Add RLS policies for project_users table
-- This table needs policies to allow project creators and architects to manage team members

-- Allow project members to view other members in their projects
CREATE POLICY "Users can view project members"
ON project_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_users pm
    WHERE pm.project_id = project_users.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Allow project creators and architects to add members
CREATE POLICY "Project creators and architects can add members"
ON project_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_users.project_id
    AND (
      p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_users pm
        WHERE pm.project_id = project_users.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'architect'
      )
    )
  )
);

-- Allow project creators and architects to update members
CREATE POLICY "Project creators and architects can update members"
ON project_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_users.project_id
    AND (
      p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_users pm
        WHERE pm.project_id = project_users.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'architect'
      )
    )
  )
);

-- Allow project creators and architects to remove members
CREATE POLICY "Project creators and architects can delete members"
ON project_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_users.project_id
    AND (
      p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_users pm
        WHERE pm.project_id = project_users.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'architect'
      )
    )
  )
);