-- Make company_id nullable in projects table
ALTER TABLE public.projects 
ALTER COLUMN company_id DROP NOT NULL;