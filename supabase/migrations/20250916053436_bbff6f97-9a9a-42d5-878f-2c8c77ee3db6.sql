-- RLS improvements: allow project members to see their full team and team profiles

-- 1) Allow any member of a project to view all project_users rows for that project
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'project_users' 
      AND policyname = 'Project members can view team members for their projects'
  ) THEN
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
  END IF;
END $$;

-- 2) Allow project teammates to view each other profiles (read-only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Project teammates can view each other\'s profiles'
  ) THEN
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
  END IF;
END $$;