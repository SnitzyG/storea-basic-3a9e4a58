-- Add missing columns to tenders table
ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS requirements jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS begin_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;