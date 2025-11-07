-- Fix RLS policies to allow issuers to manage their own draft tenders

-- Drop the restrictive policy
DROP POLICY IF EXISTS "auth can view open or approved tenders" ON public.tenders;

-- Create new policy that allows:
-- 1. Viewing open tenders (anyone authenticated)
-- 2. Viewing own tenders (issuer, regardless of status)
-- 3. Viewing tenders with approved access
CREATE POLICY "users can view relevant tenders"
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

-- Allow issuers to update their own tenders
DROP POLICY IF EXISTS "issuers can update own tenders" ON public.tenders;

CREATE POLICY "issuers can update own tenders"
ON public.tenders
FOR UPDATE
TO authenticated
USING (issued_by = auth.uid())
WITH CHECK (issued_by = auth.uid());

-- Allow issuers to insert tenders
DROP POLICY IF EXISTS "users can create tenders" ON public.tenders;

CREATE POLICY "users can create tenders"
ON public.tenders
FOR INSERT
TO authenticated
WITH CHECK (issued_by = auth.uid());