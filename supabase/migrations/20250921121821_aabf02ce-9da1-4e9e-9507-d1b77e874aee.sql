-- Add project_reference_number column to projects table
ALTER TABLE public.projects 
ADD COLUMN project_reference_number TEXT;