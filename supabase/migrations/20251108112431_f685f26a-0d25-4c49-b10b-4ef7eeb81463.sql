-- Fix: Allow builders to query open tenders by tender_id to request access
-- This updates the SELECT policy to allow anyone to see open tenders
-- (not just project members)

DROP POLICY IF EXISTS "Comprehensive tender view policy" ON tenders;

CREATE POLICY "Comprehensive tender view policy"
ON tenders
FOR SELECT
TO authenticated
USING (
  -- Users who issued the tender can always see it (all statuses including draft)
  issued_by = auth.uid()
  OR
  -- ANY authenticated user can see open tenders (allows builders to find and request access)
  status = 'open'
  OR
  -- Users with approved tender access can see that specific tender (any status)
  public.check_tender_access(auth.uid(), id)
);