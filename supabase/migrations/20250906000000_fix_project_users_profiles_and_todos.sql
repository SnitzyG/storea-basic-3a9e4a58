-- Link project_users to profiles for Supabase relationship joins and enable teammate visibility
DO $$ BEGIN
  -- Add foreign key from project_users.user_id to profiles.user_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid AND t.relname = 'project_users'
    WHERE c.conname = 'fk_project_users_profiles_user_id'
  ) THEN
    ALTER TABLE public.project_users
    ADD CONSTRAINT fk_project_users_profiles_user_id
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Permit users to view profiles of teammates in the same projects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view teammate profiles in shared projects'
  ) THEN
    CREATE POLICY "Users can view teammate profiles in shared projects" ON public.profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM public.project_users pu_self
          JOIN public.project_users pu_other
            ON pu_self.project_id = pu_other.project_id
          WHERE pu_self.user_id = auth.uid()
            AND pu_other.user_id = profiles.user_id
        )
        OR profiles.user_id = auth.uid()
      );
  END IF;
END $$;

-- Enhance todos with editable fields
DO $$ BEGIN
  -- title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN title TEXT;
  END IF;

  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN description TEXT;
  END IF;

  -- collaborators as text[]
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'collaborators'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN collaborators TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- priority column (enum priority_level) if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN priority public.priority_level NOT NULL DEFAULT 'medium';
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);


