-- Fix search path for trigger function to pass security linter
CREATE OR REPLACE FUNCTION public.set_project_invitation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $trigger$
BEGIN
  IF NEW.invitation_token IS NULL THEN
    NEW.invitation_token := public.generate_project_invitation_token();
  END IF;
  RETURN NEW;
END;
$trigger$;