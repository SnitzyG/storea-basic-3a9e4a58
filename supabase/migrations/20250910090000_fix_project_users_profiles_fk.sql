-- Fix relationship between project_users and profiles
-- Drop incorrect FK to auth.users and add FK to profiles(user_id)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'project_users' AND c.conname = 'fk_project_users_user_id'
  ) THEN
    ALTER TABLE public.project_users DROP CONSTRAINT fk_project_users_user_id;
  END IF;
END $$;

-- Ensure profiles.user_id is unique (it already is in schema, but safeguard here)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'profiles_user_id_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_user_id_unique_idx ON public.profiles(user_id);
  END IF;
END $$;

ALTER TABLE public.project_users 
  ADD CONSTRAINT project_users_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON public.project_users(user_id);
CREATE INDEX IF NOT EXISTS idx_project_users_project_id_user_id ON public.project_users(project_id, user_id);

-- Enable realtime on both tables for reliable change payloads
ALTER TABLE public.project_users REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;


