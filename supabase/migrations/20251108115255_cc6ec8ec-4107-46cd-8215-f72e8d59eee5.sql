-- Enable RLS on tender_bids if not already enabled
ALTER TABLE tender_bids ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Bidders can view their own bids" ON tender_bids;
DROP POLICY IF EXISTS "Tender issuers can view all bids for their tenders" ON tender_bids;
DROP POLICY IF EXISTS "Bidders can create bids" ON tender_bids;
DROP POLICY IF EXISTS "Bidders can update their own bids" ON tender_bids;
DROP POLICY IF EXISTS "Project team can view bids for their tenders" ON tender_bids;

-- Allow bidders to view their own bids
CREATE POLICY "Bidders can view their own bids"
ON tender_bids
FOR SELECT
USING (auth.uid() = bidder_id);

-- Allow tender issuers (architects) to view all bids for tenders they issued
CREATE POLICY "Tender issuers can view all bids for their tenders"
ON tender_bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenders
    WHERE tenders.id = tender_bids.tender_id
    AND tenders.issued_by = auth.uid()
  )
);

-- Allow project team members to view bids for tenders in their projects
CREATE POLICY "Project team can view bids for their tenders"
ON tender_bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenders
    JOIN project_users ON tenders.project_id = project_users.project_id
    WHERE tenders.id = tender_bids.tender_id
    AND project_users.user_id = auth.uid()
  )
);

-- Allow users to create bids for tenders they have access to
CREATE POLICY "Bidders can create bids"
ON tender_bids
FOR INSERT
WITH CHECK (
  auth.uid() = bidder_id
  AND (
    -- User has approved access to the tender
    EXISTS (
      SELECT 1 FROM tender_access
      WHERE tender_access.tender_id = tender_bids.tender_id
      AND tender_access.user_id = auth.uid()
      AND tender_access.status = 'approved'
    )
    OR
    -- Or user is part of the project team
    EXISTS (
      SELECT 1 FROM tenders
      JOIN project_users ON tenders.project_id = project_users.project_id
      WHERE tenders.id = tender_bids.tender_id
      AND project_users.user_id = auth.uid()
    )
  )
);

-- Allow bidders to update their own bids (before submission or in draft status)
CREATE POLICY "Bidders can update their own bids"
ON tender_bids
FOR UPDATE
USING (auth.uid() = bidder_id)
WITH CHECK (auth.uid() = bidder_id);