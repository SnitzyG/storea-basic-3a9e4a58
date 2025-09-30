-- Add new fields to tenders table for enhanced workflow
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS estimated_start_date DATE,
ADD COLUMN IF NOT EXISTS submission_deadline_time TIME,
ADD COLUMN IF NOT EXISTS tender_specification_path TEXT,
ADD COLUMN IF NOT EXISTS scope_of_works_path TEXT,
ADD COLUMN IF NOT EXISTS construction_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_ready_for_tender BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS builder_details JSONB DEFAULT '{}'::jsonb;