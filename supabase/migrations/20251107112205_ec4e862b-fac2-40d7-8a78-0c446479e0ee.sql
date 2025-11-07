-- Fix tender_package_documents RLS policy to include approved builders
DROP POLICY IF EXISTS "view_tender_package_docs" ON public.tender_package_documents;

CREATE POLICY "view_tender_package_docs"
ON public.tender_package_documents
FOR SELECT
TO authenticated
USING (
  -- Tender issuers can see their own tender documents
  tender_id IN (
    SELECT id FROM public.tenders WHERE issued_by = auth.uid()
  )
  OR
  -- Open tenders are viewable
  tender_id IN (
    SELECT id FROM public.tenders WHERE status = 'open'::tender_status
  )
  OR
  -- Approved builders can see documents
  tender_id IN (
    SELECT tender_id FROM public.tender_access 
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);