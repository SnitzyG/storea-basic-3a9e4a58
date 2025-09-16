-- Enable required extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- URL-safe token generator using pgcrypto (base64 -> URL-safe)
CREATE OR REPLACE FUNCTION public.generate_project_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN 'proj_' || replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
END;
$function$;

-- Trigger function to auto-populate invitation_token on new projects
CREATE OR REPLACE FUNCTION public.set_project_invitation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $trigger$
BEGIN
  IF NEW.invitation_token IS NULL THEN
    NEW.invitation_token := public.generate_project_invitation_token();
  END IF;
  RETURN NEW;
END;
$trigger$;

-- Ensure column exists and is unique
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- Add/ensure unique constraint separately to avoid duplicate name conflicts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'projects_invitation_token_key'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_invitation_token_key UNIQUE (invitation_token);
  END IF;
END $$;

-- Create trigger (recreate safely)
DROP TRIGGER IF EXISTS trg_set_project_invitation_token ON public.projects;
CREATE TRIGGER trg_set_project_invitation_token
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_project_invitation_token();