-- Add CC (carbon copy) field to RFIs table
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS cc_list jsonb DEFAULT '[]'::jsonb;

-- Add comment to document the new field
COMMENT ON COLUMN rfis.cc_list IS 'Array of user IDs to be copied on the RFI';