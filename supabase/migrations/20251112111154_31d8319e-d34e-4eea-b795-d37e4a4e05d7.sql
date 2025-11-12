
-- Allow users to view companies of architects who issued tenders they have access to
CREATE POLICY "users_can_view_tender_issuer_companies"
ON companies
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT p.company_id
    FROM profiles p
    INNER JOIN tenders t ON t.issued_by = p.user_id
    INNER JOIN tender_access ta ON ta.tender_id = t.id
    WHERE ta.user_id = auth.uid()
    AND ta.status = 'approved'
    AND p.company_id IS NOT NULL
  )
);
