-- Update the handle_new_user() function to require admin approval
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_company_id uuid;
  company_name text;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    company_name := NEW.raw_user_meta_data->>'company';
    IF company_name IS NOT NULL AND trim(company_name) != '' THEN
      SELECT id INTO user_company_id 
      FROM companies 
      WHERE LOWER(name) = LOWER(trim(company_name))
      LIMIT 1;
      IF user_company_id IS NULL THEN
        INSERT INTO companies (name, created_at, updated_at)
        VALUES (trim(company_name), now(), now())
        RETURNING id INTO user_company_id;
      END IF;
    END IF;
    INSERT INTO public.profiles (
      user_id, 
      name, 
      role, 
      company_id,
      approved,
      approved_at,
      approved_by
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'contractor'),
      user_company_id,
      FALSE,
      NULL,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix existing auto-approved users (reset to require approval)
UPDATE public.profiles
SET 
  approved = FALSE,
  approved_at = NULL,
  approved_by = NULL
WHERE approved = TRUE 
  AND approved_by IS NULL
  AND user_id NOT IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  );