-- Add new fields to tenders table for comprehensive tender management
ALTER TABLE tenders
ADD COLUMN IF NOT EXISTS tender_specification_path TEXT,
ADD COLUMN IF NOT EXISTS scope_of_works_path TEXT,
ADD COLUMN IF NOT EXISTS construction_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS builder_company_name TEXT,
ADD COLUMN IF NOT EXISTS builder_address TEXT,
ADD COLUMN IF NOT EXISTS builder_phone TEXT,
ADD COLUMN IF NOT EXISTS builder_contact_person TEXT,
ADD COLUMN IF NOT EXISTS builder_email TEXT,
ADD COLUMN IF NOT EXISTS is_ready_for_tender BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_start_date DATE;

-- Rename message column (if description exists, keep it for backwards compatibility)
-- The description field will now serve as "Message"

-- Create storage bucket for tender specifications
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tender-specifications',
  'tender-specifications',
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for scope of works
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scope-of-works',
  'scope-of-works',
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for tender-specifications bucket
CREATE POLICY "Project members can view tender specifications"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tender-specifications' AND
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.tender_specification_path = storage.objects.name
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Tender creators can upload specifications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tender-specifications' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Tender creators can delete their specifications"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tender-specifications' AND
  auth.uid() IS NOT NULL
);

-- RLS policies for scope-of-works bucket
CREATE POLICY "Project members can view scope of works"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scope-of-works' AND
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.scope_of_works_path = storage.objects.name
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Tender creators can upload scope of works"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scope-of-works' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Tender creators can delete their scope of works"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scope-of-works' AND
  auth.uid() IS NOT NULL
);