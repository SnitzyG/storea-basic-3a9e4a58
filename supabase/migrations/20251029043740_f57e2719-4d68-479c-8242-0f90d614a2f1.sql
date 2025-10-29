-- Add document_content column to tender_package_documents table
ALTER TABLE tender_package_documents
ADD COLUMN IF NOT EXISTS document_content TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tender_package_documents_tender_id 
ON tender_package_documents(tender_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tender_package_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tender_package_documents_updated_at
    BEFORE UPDATE ON tender_package_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_tender_package_documents_updated_at();