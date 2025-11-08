-- Drop the problematic RLS policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users with approved access can view tenders" ON tenders;

-- Drop any circular policies on tender_access if they exist
DROP POLICY IF EXISTS "Users can view their own tender access requests" ON tender_access;

-- Recreate the tender_access policy without recursion
CREATE POLICY "Users can view their own tender access requests"
ON tender_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow project team members and tender issuers to view tender access requests
CREATE POLICY "Project members can view tender access requests"
ON tender_access
FOR SELECT
TO authenticated
USING (
  tender_id IN (
    SELECT t.id 
    FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);