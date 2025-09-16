-- RLS improvements: allow project members to see their full team and team profiles

-- 1) Ensure project members can view all project_users rows for their projects
DROP POLICY IF EXISTS "Project members can view team members for their projects" ON public.project_users;
CREATE POLICY "Project members can view team members for their projects"
ON public.project_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.project_users pu
    WHERE pu.project_id = project_users.project_id
      AND pu.user_id = auth.uid()
  )
);

-- 2) Allow project teammates to view each other's profiles (read-only)
DROP POLICY IF EXISTS "Project teammates can view each other's profiles" ON public.profiles;
CREATE POLICY "Project teammates can view each other's profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.project_users me
    JOIN public.project_users teammate
      ON teammate.project_id = me.project_id
    WHERE me.user_id = auth.uid()
      AND teammate.user_id = profiles.user_id
  )
);
