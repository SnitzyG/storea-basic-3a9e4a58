-- Add new fields to projects table
ALTER TABLE public.projects 
ADD COLUMN estimated_start_date DATE,
ADD COLUMN estimated_finish_date DATE,
ADD COLUMN homeowner_name TEXT,
ADD COLUMN homeowner_phone TEXT;

-- Add a check constraint to ensure start date is before finish date
ALTER TABLE public.projects 
ADD CONSTRAINT check_project_dates 
CHECK (estimated_start_date IS NULL OR estimated_finish_date IS NULL OR estimated_start_date <= estimated_finish_date);