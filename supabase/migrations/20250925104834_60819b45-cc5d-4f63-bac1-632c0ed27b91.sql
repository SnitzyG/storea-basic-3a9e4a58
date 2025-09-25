-- Add architectural_stage column to projects table
ALTER TABLE projects ADD COLUMN architectural_stage text DEFAULT 'Concept';

-- Create a check constraint for valid architectural stages
ALTER TABLE projects ADD CONSTRAINT valid_architectural_stage 
CHECK (architectural_stage IN ('Concept', 'Schematic Design', 'Design Development', 'Tender', 'Construction Documentation', 'Contract Admin', 'Site Services'));