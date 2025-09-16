-- Fix infinite recursion in project_users SELECT policy
-- Replace recursive policy with safe function-based check
DO $$
BEGIN
  -- Drop the recursive policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'project_users' 
      AND policyname = 'Project members can view team members for their projects'
  ) THEN
    EXECUTE 'DROP POLICY "Project members can view team members for their projects" ON public.project_users';
  END IF;
END $$;

-- Create a non-recursive SELECT policy using the existing is_project_member() helper
CREATE POLICY IF NOT EXISTS "Project members can view team members for their projects"
ON public.project_users
FOR SELECT
USING (
  is_project_member(project_id, auth.uid())
);
