-- Add document_content column to tender_package_documents table
ALTER TABLE tender_package_documents
ADD COLUMN IF NOT EXISTS document_content TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tender_package_documents_tender_id 
ON tender_package_documents(tender_id);