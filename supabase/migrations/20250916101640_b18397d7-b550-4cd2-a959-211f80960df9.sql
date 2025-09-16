-- Redefine token generator to avoid pgcrypto dependency
CREATE OR REPLACE FUNCTION public.generate_project_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  token text;
  attempt int := 0;
BEGIN
  -- Generate URL-safe, hex-based token using only built-in functions (no extensions)
  -- Ensure uniqueness by checking against projects table up to a few attempts
  LOOP
    attempt := attempt + 1;
    token := 'proj_' || md5(random()::text || now()::text || txid_current()::text || attempt::text);

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.projects WHERE invitation_token = token
    ) OR attempt >= 5;
  END LOOP;

  RETURN token;
END;
$function$;