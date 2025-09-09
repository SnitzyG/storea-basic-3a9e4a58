-- Standardize and enforce user_id relationships across key tables

-- 1) Ensure profiles.user_id is unique and primary ref for app-level joins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='profiles_user_id_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_user_id_unique_idx ON public.profiles(user_id);
  END IF;
END $$;

-- 2) Project users -> profiles FK (drop any conflicting old constraint names)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid
    WHERE t.relname='project_users' AND c.conname='fk_project_users_user_id'
  ) THEN
    ALTER TABLE public.project_users DROP CONSTRAINT fk_project_users_user_id;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid
    WHERE t.relname='project_users' AND c.conname='project_users_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.project_users
      ADD CONSTRAINT project_users_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON public.project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON public.project_users(user_id);

-- 3) Messages and threads already reference ids; ensure realtime identity
ALTER TABLE public.project_users REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;


