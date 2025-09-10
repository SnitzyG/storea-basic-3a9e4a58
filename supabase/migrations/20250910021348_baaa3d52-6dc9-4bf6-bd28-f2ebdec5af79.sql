-- Add new fields for document upload metadata
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS custom_document_number text,
ADD COLUMN IF NOT EXISTS status_category text DEFAULT 'For Information',
ADD COLUMN IF NOT EXISTS file_type_category text DEFAULT 'Architectural';

-- Update existing documents to have default values
UPDATE documents 
SET status_category = 'For Information', 
    file_type_category = 'Architectural' 
WHERE status_category IS NULL OR file_type_category IS NULL;