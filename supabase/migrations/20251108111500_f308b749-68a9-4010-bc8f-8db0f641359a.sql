-- Step 1: Create Security Definer Function to Prevent Recursion
CREATE OR REPLACE FUNCTION public.check_tender_access(
  _user_id uuid,
  _tender_id uuid
)
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

-- Step 2: Drop ALL existing RLS policies on tenders table to start fresh
DROP POLICY IF EXISTS "Users can view tenders" ON tenders;
DROP POLICY IF EXISTS "view_own_or_open_tenders" ON tenders;
DROP POLICY IF EXISTS "Users can view approved tenders" ON tenders;
DROP POLICY IF EXISTS "Users with approved tender access can view" ON tenders;
DROP POLICY IF EXISTS "Users with approved access can view tenders" ON tenders;
DROP POLICY IF EXISTS "Users can create tenders in their projects" ON tenders;
DROP POLICY IF EXISTS "create_own_tenders" ON tenders;
DROP POLICY IF EXISTS "Users can update their own tenders" ON tenders;
DROP POLICY IF EXISTS "update_own_tenders" ON tenders;
DROP POLICY IF EXISTS "Users can delete their own tenders" ON tenders;
DROP POLICY IF EXISTS "delete_own_tenders" ON tenders;

-- Step 3: Create Single Comprehensive SELECT Policy
CREATE POLICY "Comprehensive tender view policy"
ON tenders
FOR SELECT
TO authenticated
USING (
  -- Users who issued the tender can always see it (all statuses including draft)
  issued_by = auth.uid()
  OR
  -- Project members can see open tenders
  (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM project_users
      WHERE project_id = tenders.project_id
        AND user_id = auth.uid()
    )
  )
  OR
  -- Users with approved tender access can see that specific tender
  public.check_tender_access(auth.uid(), id)
);

-- Step 4: Create Single Comprehensive INSERT Policy
CREATE POLICY "Users can create tenders in their projects"
ON tenders
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be issuing the tender themselves
  issued_by = auth.uid()
  AND
  -- User must be a member of the project
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_id = tenders.project_id
      AND user_id = auth.uid()
  )
);

-- Step 5: Create Single Comprehensive UPDATE Policy
CREATE POLICY "Users can update their own tenders"
ON tenders
FOR UPDATE
TO authenticated
USING (
  -- Only the user who issued the tender can update it
  issued_by = auth.uid()
)
WITH CHECK (
  -- Ensure issued_by doesn't change
  issued_by = auth.uid()
);

-- Step 6: Create Single Comprehensive DELETE Policy
CREATE POLICY "Users can delete their own tenders"
ON tenders
FOR DELETE
TO authenticated
USING (
  -- Only the user who issued the tender can delete it
  issued_by = auth.uid()
);