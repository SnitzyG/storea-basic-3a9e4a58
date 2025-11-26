-- Fix infinite recursion in tenders and tender_access RLS policies
-- Problem: tenders policies query tender_access, and tender_access policies query tenders

-- Step 1: Drop ALL existing policies on tenders and tender_access
DROP POLICY IF EXISTS "Comprehensive tender view policy" ON tenders;
DROP POLICY IF EXISTS "Authenticated users can view tenders they have access to" ON tenders;
DROP POLICY IF EXISTS "Users can create tenders in their projects" ON tenders;
DROP POLICY IF EXISTS "Users can update their own tenders" ON tenders;
DROP POLICY IF EXISTS "Users can delete their own tenders" ON tenders;

DROP POLICY IF EXISTS "Project members can view tender access requests" ON tender_access;
DROP POLICY IF EXISTS "Tender issuers can view requests for their tenders" ON tender_access;
DROP POLICY IF EXISTS "Tender issuers can update requests" ON tender_access;
DROP POLICY IF EXISTS "issuers_grant_tender_access" ON tender_access;
DROP POLICY IF EXISTS "issuers_revoke_tender_access" ON tender_access;
DROP POLICY IF EXISTS "issuers_update_tender_access" ON tender_access;
DROP POLICY IF EXISTS "view_relevant_tender_access" ON tender_access;
DROP POLICY IF EXISTS "Users can create tender access requests" ON tender_access;
DROP POLICY IF EXISTS "Users can view their own requests" ON tender_access;
DROP POLICY IF EXISTS "Users can view their own tender access requests" ON tender_access;

-- Step 2: Create helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION user_has_tender_access(_user_id uuid, _tender_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tender_access
    WHERE tender_id = _tender_id
      AND user_id = _user_id
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION is_tender_issuer(_user_id uuid, _tender_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenders
    WHERE id = _tender_id
    AND issued_by = _user_id
  );
$$;

-- Step 3: Create new simplified tenders policies
CREATE POLICY "tenders_select_policy"
ON tenders
FOR SELECT
TO authenticated
USING (
  issued_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_users pu
    WHERE pu.project_id = tenders.project_id
    AND pu.user_id = auth.uid()
  )
  OR user_has_tender_access(auth.uid(), id)
);

CREATE POLICY "tenders_insert_policy"
ON tenders
FOR INSERT
TO authenticated
WITH CHECK (
  issued_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = tenders.project_id
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "tenders_update_policy"
ON tenders
FOR UPDATE
TO authenticated
USING (issued_by = auth.uid())
WITH CHECK (issued_by = auth.uid());

CREATE POLICY "tenders_delete_policy"
ON tenders
FOR DELETE
TO authenticated
USING (issued_by = auth.uid());

-- Step 4: Create new simplified tender_access policies
CREATE POLICY "tender_access_select_own"
ON tender_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_tender_issuer(auth.uid(), tender_id));

CREATE POLICY "tender_access_insert"
ON tender_access
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "tender_access_update_issuer"
ON tender_access
FOR UPDATE
TO authenticated
USING (is_tender_issuer(auth.uid(), tender_id))
WITH CHECK (is_tender_issuer(auth.uid(), tender_id));

CREATE POLICY "tender_access_delete_issuer"
ON tender_access
FOR DELETE
TO authenticated
USING (is_tender_issuer(auth.uid(), tender_id));