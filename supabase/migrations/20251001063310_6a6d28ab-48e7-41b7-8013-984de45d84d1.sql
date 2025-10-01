-- Create a SECURITY DEFINER helper to check architect role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_project_architect(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_users
    WHERE project_id = $1 AND user_id = $2 AND role = 'architect'
  );
$$;

-- Recreate project_users policies to avoid self-referential queries
DROP POLICY IF EXISTS "Users can view project members" ON public.project_users;
DROP POLICY IF EXISTS "Project creators and architects can add members" ON public.project_users;
DROP POLICY IF EXISTS "Project creators and architects can update members" ON public.project_users;
DROP POLICY IF EXISTS "Project creators and architects can delete members" ON public.project_users;

-- View members if you're a member of the same project
CREATE POLICY "Users can view project members"
ON public.project_users
FOR SELECT
TO authenticated
USING (
  public.is_project_member(project_users.project_id, auth.uid())
);

-- Insert members if you're the project creator or an architect on that project
CREATE POLICY "Project creators and architects can add members"
ON public.project_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_project_creator(project_users.project_id, auth.uid())
  OR public.is_project_architect(project_users.project_id, auth.uid())
);

-- Update members if you're the project creator or an architect on that project
CREATE POLICY "Project creators and architects can update members"
ON public.project_users
FOR UPDATE
TO authenticated
USING (
  public.is_project_creator(project_users.project_id, auth.uid())
  OR public.is_project_architect(project_users.project_id, auth.uid())
);

-- Delete members if you're the project creator or an architect on that project
CREATE POLICY "Project creators and architects can delete members"
ON public.project_users
FOR DELETE
TO authenticated
USING (
  public.is_project_creator(project_users.project_id, auth.uid())
  OR public.is_project_architect(project_users.project_id, auth.uid())
);
