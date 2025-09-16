-- URL-safe project invitation token generator without gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_project_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  raw_token text;
BEGIN
  -- Create a deterministic-length, URL-safe token using hex-encoded SHA-256
  -- Combines UUID, timestamp, and random() for entropy
  raw_token := encode(
    digest(
      gen_random_uuid()::text || clock_timestamp()::text || random()::text,
      'sha256'
    ),
    'hex'
  );

  RETURN 'proj_' || raw_token;
END;
$function$;