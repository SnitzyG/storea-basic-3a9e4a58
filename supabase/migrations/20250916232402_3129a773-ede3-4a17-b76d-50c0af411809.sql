-- Add company and role fields to project_join_requests table
ALTER TABLE project_join_requests 
ADD COLUMN company TEXT,
ADD COLUMN role TEXT;