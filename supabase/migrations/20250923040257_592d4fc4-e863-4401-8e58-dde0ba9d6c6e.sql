-- Add company website field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_website text;