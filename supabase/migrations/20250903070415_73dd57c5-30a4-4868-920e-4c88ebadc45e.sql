-- Add email field to projects table for homeowner identification
ALTER TABLE public.projects 
ADD COLUMN homeowner_email text;