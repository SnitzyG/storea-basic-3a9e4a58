-- Enable authenticated users to view open tenders or tenders they have approved access to
CREATE POLICY "auth can view open or approved tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (
  status = 'open'::tender_status
  OR issued_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.tender_access ta
    WHERE ta.tender_id = tenders.id
      AND ta.user_id = auth.uid()
      AND ta.status = 'approved'
  )
);

-- Enable authenticated users to view package documents for open/approved tenders
CREATE POLICY "auth can view package docs for open/approved tenders"
ON public.tender_package_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenders t
    WHERE t.id = tender_package_documents.tender_id
      AND (
        t.status = 'open'::tender_status
        OR t.issued_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.tender_access ta
          WHERE ta.tender_id = t.id
            AND ta.user_id = auth.uid()
            AND ta.status = 'approved'
        )
      )
  )
);

-- Enable authenticated users to view line items for open/approved tenders
CREATE POLICY "auth can view line items for open/approved tenders"
ON public.tender_line_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenders t
    WHERE t.id = tender_line_items.tender_id
      AND (
        t.status = 'open'::tender_status
        OR t.issued_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.tender_access ta
          WHERE ta.tender_id = t.id
            AND ta.user_id = auth.uid()
            AND ta.status = 'approved'
        )
      )
  )
);

-- Allow bidder or issuer to view bids
CREATE POLICY "bidder or issuer can view bids"
ON public.tender_bids
FOR SELECT
TO authenticated
USING (
  bidder_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.tenders t
    WHERE t.id = tender_bids.tender_id
      AND t.issued_by = auth.uid()
  )
);

-- Allow builders to submit bids to open tenders
CREATE POLICY "builders can submit bids to open tenders"
ON public.tender_bids
FOR INSERT
TO authenticated
WITH CHECK (
  bidder_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tenders t
    WHERE t.id = tender_bids.tender_id
      AND t.status = 'open'::tender_status
  )
);

-- Allow bidder to update their own bid
CREATE POLICY "bidder can update own bid"
ON public.tender_bids
FOR UPDATE
TO authenticated
USING (bidder_id = auth.uid())
WITH CHECK (bidder_id = auth.uid());

-- Allow viewing bid line items (bidder or issuer)
CREATE POLICY "view bid line items (bidder or issuer)"
ON public.tender_bid_line_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tender_bids b
    JOIN public.tenders t ON t.id = b.tender_id
    WHERE b.id = tender_bid_line_items.bid_id
      AND (
        b.bidder_id = auth.uid()
        OR t.issued_by = auth.uid()
      )
  )
);

-- Allow inserting bid line items (bidder only)
CREATE POLICY "insert bid line items (bidder only)"
ON public.tender_bid_line_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tender_bids b
    JOIN public.tenders t ON t.id = b.tender_id
    WHERE b.id = tender_bid_line_items.bid_id
      AND b.bidder_id = auth.uid()
      AND t.status = 'open'::tender_status
  )
);

-- Allow updating bid line items (bidder only)
CREATE POLICY "update bid line items (bidder only)"
ON public.tender_bid_line_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tender_bids b
    WHERE b.id = tender_bid_line_items.bid_id
      AND b.bidder_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tender_bids b
    WHERE b.id = tender_bid_line_items.bid_id
      AND b.bidder_id = auth.uid()
  )
);