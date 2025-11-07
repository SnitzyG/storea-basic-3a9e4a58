-- Create security definer function to check tender access without recursion
CREATE OR REPLACE FUNCTION public.user_has_tender_access(_user_id uuid, _tender_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tender_access
    WHERE tender_id = _tender_id
      AND user_id = _user_id
      AND status = 'approved'
  );
$$;

-- Drop the old policy and create a new one that checks tender_access
DROP POLICY IF EXISTS "Users can view approved tenders" ON tenders;

CREATE POLICY "Users can view approved tenders" ON tenders
  FOR SELECT USING (
    issued_by = auth.uid() 
    OR status = 'open'
    OR public.user_has_tender_access(auth.uid(), id)
  );