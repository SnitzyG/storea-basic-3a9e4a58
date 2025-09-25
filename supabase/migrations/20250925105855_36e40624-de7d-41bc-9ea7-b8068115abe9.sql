-- Add architectural_fees column to projects table
ALTER TABLE projects ADD COLUMN architectural_fees numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.architectural_fees IS 'Architectural fees for the project - only visible to architects';