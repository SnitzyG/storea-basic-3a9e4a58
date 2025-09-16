-- Add additional_homeowners field to projects table to store multiple homeowners
ALTER TABLE projects 
ADD COLUMN additional_homeowners JSONB DEFAULT '[]'::jsonb;