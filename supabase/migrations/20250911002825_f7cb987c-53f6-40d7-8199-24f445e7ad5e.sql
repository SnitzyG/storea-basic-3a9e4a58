-- Update documents table to support new requirements
-- 1. Remove auto-generation trigger for document_number
DROP TRIGGER IF EXISTS auto_generate_document_number_trigger ON documents;

-- 2. Update status enum to only include the required options
DO $$ BEGIN
    -- Create new enum type first
    CREATE TYPE document_status_new AS ENUM ('For Tender', 'For Information', 'For Construction');
    
    -- Update the table to use the new enum
    ALTER TABLE documents 
    ALTER COLUMN status TYPE document_status_new 
    USING CASE 
        WHEN status = 'draft' THEN 'For Information'::document_status_new
        WHEN status = 'under_review' THEN 'For Information'::document_status_new
        WHEN status = 'approved' THEN 'For Information'::document_status_new
        WHEN status = 'rejected' THEN 'For Information'::document_status_new
        ELSE 'For Information'::document_status_new
    END;
    
    -- Drop old enum and rename new one
    DROP TYPE IF EXISTS document_status;
    ALTER TYPE document_status_new RENAME TO document_status;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add file_type_category field and set default
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_type_category text DEFAULT 'Architectural';

-- 4. Update the title field to be required (remove nullable)
UPDATE documents SET title = name WHERE title IS NULL OR title = '';

-- 5. Ensure document_number is always user-assigned (remove default generation)
ALTER TABLE documents ALTER COLUMN document_number DROP DEFAULT;

-- Update existing documents with proper status values
UPDATE documents 
SET status = 'For Information'::document_status 
WHERE status::text NOT IN ('For Tender', 'For Information', 'For Construction');