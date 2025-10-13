-- Add tender_type and improve status field for tenders
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS tender_type TEXT DEFAULT 'open' CHECK (tender_type IN ('open', 'selective', 'negotiated'));

-- Add comment to clarify status values
COMMENT ON COLUMN tenders.status IS 'Status: draft, published, open, closed, awarded, cancelled';

-- Update existing tenders to have 'draft' status if null
UPDATE tenders SET status = 'draft' WHERE status IS NULL;

-- Add published_at timestamp to track when tender goes live
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;