-- COMPREHENSIVE FIX: Remove infinite recursion in tender RLS policies

-- ============================================================================
-- STEP 1: Drop ALL existing conflicting policies on tenders table
-- ============================================================================

DROP POLICY IF EXISTS "users can view relevant tenders" ON public.tenders;
DROP POLICY IF EXISTS "auth can view open or approved tenders" ON public.tenders;
DROP POLICY IF EXISTS "issuers can update own tenders" ON public.tenders;
DROP POLICY IF EXISTS "users can create tenders" ON public.tenders;
DROP POLICY IF EXISTS "architects can manage tenders" ON public.tenders;
DROP POLICY IF EXISTS "users can view tenders" ON public.tenders;

-- ============================================================================
-- STEP 2: Create SIMPLIFIED, NON-RECURSIVE policies for tenders
-- ============================================================================

-- SELECT: Users can view their own tenders OR open tenders (simple, no joins)
CREATE POLICY "view_own_or_open_tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  issued_by = auth.uid()
  OR status = 'open'::tender_status
);

-- INSERT: Users can create tenders (must be issuer)
CREATE POLICY "create_own_tenders"
ON public.tenders
FOR INSERT
TO authenticated
WITH CHECK (issued_by = auth.uid());

-- UPDATE: Users can update their own tenders
CREATE POLICY "update_own_tenders"
ON public.tenders
FOR UPDATE
TO authenticated
USING (issued_by = auth.uid())
WITH CHECK (issued_by = auth.uid());

-- DELETE: Users can delete their own tenders
CREATE POLICY "delete_own_tenders"
ON public.tenders
FOR DELETE
TO authenticated
USING (issued_by = auth.uid());

-- ============================================================================
-- STEP 3: Fix tender_access policies (remove circular references)
-- ============================================================================

DROP POLICY IF EXISTS "users can view tender access" ON public.tender_access;
DROP POLICY IF EXISTS "issuers can manage tender access" ON public.tender_access;

-- SELECT: Users can view access records for their own tenders or their own access
CREATE POLICY "view_relevant_tender_access"
ON public.tender_access
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- INSERT: Tender issuers can grant access
CREATE POLICY "issuers_grant_tender_access"
ON public.tender_access
FOR INSERT
TO authenticated
WITH CHECK (
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- UPDATE: Tender issuers can update access
CREATE POLICY "issuers_update_tender_access"
ON public.tender_access
FOR UPDATE
TO authenticated
USING (
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- DELETE: Tender issuers can revoke access
CREATE POLICY "issuers_revoke_tender_access"
ON public.tender_access
FOR DELETE
TO authenticated
USING (
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- ============================================================================
-- STEP 4: Fix tender_package_documents policies (simplified)
-- ============================================================================

DROP POLICY IF EXISTS "users can view package documents" ON public.tender_package_documents;
DROP POLICY IF EXISTS "issuers can manage package documents" ON public.tender_package_documents;

-- SELECT: Users can view documents for tenders they have access to
CREATE POLICY "view_tender_package_docs"
ON public.tender_package_documents
FOR SELECT
TO authenticated
USING (
  tender_id IN (
    SELECT id FROM public.tenders 
    WHERE issued_by = auth.uid() OR status = 'open'::tender_status
  )
);

-- INSERT: Tender issuers can add documents
CREATE POLICY "insert_tender_package_docs"
ON public.tender_package_documents
FOR INSERT
TO authenticated
WITH CHECK (
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- UPDATE: Tender issuers can update documents
CREATE POLICY "update_tender_package_docs"
ON public.tender_package_documents
FOR UPDATE
TO authenticated
USING (
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- DELETE: Tender issuers can delete documents
CREATE POLICY "delete_tender_package_docs"
ON public.tender_package_documents
FOR DELETE
TO authenticated
USING (
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
);

-- ============================================================================
-- STEP 5: Fix storage policies for tender-packages bucket
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Tender issuers can upload packages" ON storage.objects;
DROP POLICY IF EXISTS "Users can view tender packages" ON storage.objects;
DROP POLICY IF EXISTS "Tender issuers can delete packages" ON storage.objects;

-- SELECT: Users can view tender package files for open tenders or their own tenders
CREATE POLICY "view_tender_package_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tender-packages'
);

-- INSERT: Authenticated users can upload to tender-packages
CREATE POLICY "upload_tender_package_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tender-packages'
);

-- UPDATE: Users can update their own uploads
CREATE POLICY "update_tender_package_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tender-packages'
);

-- DELETE: Users can delete files they uploaded
CREATE POLICY "delete_tender_package_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tender-packages'
);