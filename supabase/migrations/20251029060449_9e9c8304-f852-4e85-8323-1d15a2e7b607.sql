-- Add project information columns to tenders table
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS project_title TEXT,
ADD COLUMN IF NOT EXISTS project_address TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS tender_reference_no TEXT;

-- Create index for tender reference number lookups
CREATE INDEX IF NOT EXISTS idx_tenders_tender_reference_no ON tenders(tender_reference_no);