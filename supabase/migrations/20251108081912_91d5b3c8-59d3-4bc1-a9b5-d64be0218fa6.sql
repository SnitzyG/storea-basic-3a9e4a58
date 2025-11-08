-- Add builder_margin column to tender_bids table
ALTER TABLE tender_bids 
ADD COLUMN IF NOT EXISTS builder_margin numeric DEFAULT 0;

COMMENT ON COLUMN tender_bids.builder_margin IS 'Builder margin percentage applied to the bid';

-- Update RLS policy for tender_line_items to allow bidders to create line items
DROP POLICY IF EXISTS "Bidders can create line items for their bids" ON tender_line_items;

CREATE POLICY "Bidders can create line items for their bids"
ON tender_line_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenders t
    WHERE t.id = tender_line_items.tender_id
    AND (
      t.status = 'open'
      OR t.issued_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tender_access ta
        WHERE ta.tender_id = t.id
        AND ta.user_id = auth.uid()
        AND ta.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM project_users pu
        JOIN projects p ON p.id = pu.project_id
        WHERE p.id = t.project_id
        AND pu.user_id = auth.uid()
      )
    )
  )
);