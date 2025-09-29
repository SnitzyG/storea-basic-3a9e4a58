-- First, drop ALL existing RLS policies that might reference role columns
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on all tables to avoid dependency issues
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END$$;

-- Create a temporary enum with the previous role values
CREATE TYPE public.user_role_prev AS ENUM ('architect','homeowner','builder','contractor');

-- Migrate columns that use user_role to the temporary enum with value mapping
-- profiles.role
ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role_prev
  USING (
    CASE role::text
      WHEN 'client' THEN 'homeowner'
      WHEN 'lead_consultant' THEN 'architect'
      WHEN 'lead_contractor' THEN 'builder'
      ELSE role::text
    END
  )::public.user_role_prev;

-- project_users.role
ALTER TABLE public.project_users
  ALTER COLUMN role TYPE public.user_role_prev
  USING (
    CASE role::text
      WHEN 'client' THEN 'homeowner'
      WHEN 'lead_consultant' THEN 'architect'
      WHEN 'lead_contractor' THEN 'builder'
      ELSE role::text
    END
  )::public.user_role_prev;

-- Update invitations table stored text values to old role names
UPDATE public.invitations
SET role = CASE role
  WHEN 'client' THEN 'homeowner'
  WHEN 'lead_consultant' THEN 'architect'
  WHEN 'lead_contractor' THEN 'builder'
  ELSE role
END;

-- Remove the old enum and rename the temporary one to user_role
DROP TYPE public.user_role;
ALTER TYPE public.user_role_prev RENAME TO user_role;

-- Update all functions that reference user_role
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
    INSERT INTO public.profiles (user_id, name, role, company_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'contractor'),
      user_company_id
    );
  END IF;
  RETURN NEW;
END;
$$;