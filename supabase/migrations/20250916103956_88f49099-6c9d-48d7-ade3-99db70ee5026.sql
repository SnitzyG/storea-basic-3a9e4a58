-- Ensure project invitation tokens are auto-generated and immutable
-- 1) Trigger to auto-set invitation_token on insert
DROP TRIGGER IF EXISTS trg_set_project_invitation_token ON public.projects;
CREATE TRIGGER trg_set_project_invitation_token
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_project_invitation_token();

-- 2) Prevent updates to invitation_token after creation
CREATE OR REPLACE FUNCTION public.prevent_invitation_token_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invitation_token IS DISTINCT FROM OLD.invitation_token THEN
    RAISE EXCEPTION 'invitation_token is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_invitation_token_update ON public.projects;
CREATE TRIGGER trg_prevent_invitation_token_update
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.prevent_invitation_token_update();

-- 3) Backfill missing tokens for existing projects
UPDATE public.projects
SET invitation_token = public.generate_project_invitation_token()
WHERE invitation_token IS NULL;