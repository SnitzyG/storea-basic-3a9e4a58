-- Add storage policy for tender bid files

-- Allow bidders to upload files to their own bid folder
CREATE POLICY "Bidders can upload to their own bid folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenders'
  AND EXISTS (
    SELECT 1 FROM public.tender_bids tb
    WHERE tb.id::text = (storage.foldername(name))[3]
    AND tb.bidder_id = auth.uid()
  )
);

-- Allow tender issuers and bidders to download bid files
CREATE POLICY "Tender team can access bid files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenders'
  AND (
    -- Bid owner can access
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      WHERE tb.id::text = (storage.foldername(name))[3]
      AND tb.bidder_id = auth.uid()
    )
    OR
    -- Tender issuer can access
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      JOIN public.tenders t ON t.id = tb.tender_id
      WHERE tb.id::text = (storage.foldername(name))[3]
      AND t.issued_by = auth.uid()
    )
    OR
    -- Project team can access
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      JOIN public.tenders t ON t.id = tb.tender_id
      JOIN public.project_users pu ON pu.project_id = t.project_id
      WHERE tb.id::text = (storage.foldername(name))[3]
      AND pu.user_id = auth.uid()
    )
  )
);

-- Allow bidders to delete their own bid files before tender deadline
CREATE POLICY "Bidders can delete their own bid files before deadline"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenders'
  AND EXISTS (
    SELECT 1 FROM public.tender_bids tb
    JOIN public.tenders t ON t.id = tb.tender_id
    WHERE tb.id::text = (storage.foldername(name))[3]
    AND tb.bidder_id = auth.uid()
    AND (t.deadline IS NULL OR t.deadline > NOW())
  )
);