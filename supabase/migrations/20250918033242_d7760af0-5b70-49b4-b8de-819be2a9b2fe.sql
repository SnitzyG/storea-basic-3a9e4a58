-- Update handle_new_user function to auto-create and link companies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_company_id uuid;
  company_name text;
BEGIN
  -- Only create profile if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Extract company name from signup metadata
    company_name := NEW.raw_user_meta_data->>'company';
    
    -- If company name provided, create or find existing company
    IF company_name IS NOT NULL AND trim(company_name) != '' THEN
      -- First try to find existing company with same name (case insensitive)
      SELECT id INTO user_company_id 
      FROM companies 
      WHERE LOWER(name) = LOWER(trim(company_name))
      LIMIT 1;
      
      -- If no existing company found, create new one
      IF user_company_id IS NULL THEN
        INSERT INTO companies (name, created_at, updated_at)
        VALUES (trim(company_name), now(), now())
        RETURNING id INTO user_company_id;
      END IF;
    END IF;
    
    -- Create user profile with company link
    INSERT INTO public.profiles (user_id, name, role, company_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'contractor'),
      user_company_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;