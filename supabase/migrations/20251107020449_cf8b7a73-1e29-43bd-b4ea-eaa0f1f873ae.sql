-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view tenders for their projects" ON public.tenders;

-- Create new permissive SELECT policy for projects
CREATE POLICY "Users can view their projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view projects they're members of
    (EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = projects.id
      AND project_users.user_id = auth.uid()
    ))
    -- Users can view projects they created
    OR (created_by = auth.uid())
    -- NEW: Users can look up any project by project_id for join requests
    OR (project_id IS NOT NULL)
  );

-- Create new permissive SELECT policy for tenders
CREATE POLICY "Users can view tenders"
  ON public.tenders
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view tenders for projects they're members of
    (EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = tenders.project_id
      AND project_users.user_id = auth.uid()
    ))
    -- NEW: Users can look up any tender by tender_id for access requests
    OR (tender_id IS NOT NULL)
  );