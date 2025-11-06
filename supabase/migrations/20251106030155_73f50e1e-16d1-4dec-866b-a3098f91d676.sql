-- Helper to grant admin role by email securely (runs with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  inserted_count int;
BEGIN
  -- Find the user in auth.users by email
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(target_email)) LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user found with email %', target_email;
  END IF;

  -- Grant admin role (idempotent)
  INSERT INTO public.user_roles(user_id, role)
  VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Optionally mark profile approved so the account can access immediately
  UPDATE public.profiles
  SET approved = TRUE, approved_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN inserted_count > 0 THEN 'Admin role granted' ELSE 'User already admin' END,
    'user_id', uid
  );
END;
$$;

-- Helper to revoke admin role by email securely (for safety/rollback)
CREATE OR REPLACE FUNCTION public.revoke_admin_by_email(target_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  removed int := 0;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(target_email)) LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user found with email %', target_email;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = uid AND role = 'admin';
  GET DIAGNOSTICS removed = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN removed > 0 THEN 'Admin role revoked' ELSE 'User was not admin' END,
    'user_id', uid
  );
END;
$$;