-- Add latitude and longitude fields to projects table for geocoded addresses
ALTER TABLE projects 
ADD COLUMN latitude numeric,
ADD COLUMN longitude numeric,
ADD COLUMN geocoded_at timestamp with time zone;