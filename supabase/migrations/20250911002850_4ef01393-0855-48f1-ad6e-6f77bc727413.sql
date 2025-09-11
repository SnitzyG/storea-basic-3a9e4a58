-- Update documents table to support new requirements
-- 1. Remove auto-generation trigger for document_number
DROP TRIGGER IF EXISTS auto_generate_document_number_trigger ON documents;

-- 2. Update status enum to only include the required options
-- First remove the default constraint 
ALTER TABLE documents ALTER COLUMN status DROP DEFAULT;

-- Create new enum type
CREATE TYPE document_status_new AS ENUM ('For Tender', 'For Information', 'For Construction');

-- Update the table to use the new enum
ALTER TABLE documents 
ALTER COLUMN status TYPE document_status_new 
USING CASE 
    WHEN status::text = 'draft' THEN 'For Information'::document_status_new
    WHEN status::text = 'under_review' THEN 'For Information'::document_status_new
    WHEN status::text = 'approved' THEN 'For Information'::document_status_new
    WHEN status::text = 'rejected' THEN 'For Information'::document_status_new
    ELSE 'For Information'::document_status_new
END;

-- Drop old enum and rename new one
DROP TYPE IF EXISTS document_status;
ALTER TYPE document_status_new RENAME TO document_status;

-- Set new default
ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'For Information'::document_status;

-- 3. Add file_type_category field and set default
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_type_category text DEFAULT 'Architectural';

-- 4. Update the title field to be required (remove nullable)
UPDATE documents SET title = name WHERE title IS NULL OR title = '';

-- 5. Ensure document_number is always user-assigned (remove default generation)
ALTER TABLE documents ALTER COLUMN document_number DROP DEFAULT;