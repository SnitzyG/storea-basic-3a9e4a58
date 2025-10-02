-- Add RLS policies for tenders table to allow creation and viewing
-- Enable RLS on tenders table (if not already enabled)
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create tenders in their projects" ON tenders;
DROP POLICY IF EXISTS "Users can view tenders for their projects" ON tenders;
DROP POLICY IF EXISTS "Users can update their own tenders" ON tenders;
DROP POLICY IF EXISTS "Users can delete their own tenders" ON tenders;

-- Policy: Allow users to create tenders in projects they are members of
CREATE POLICY "Users can create tenders in their projects"
ON tenders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = tenders.project_id
    AND project_users.user_id = auth.uid()
  )
  AND auth.uid() = issued_by
);

-- Policy: Allow users to view tenders for projects they are members of
CREATE POLICY "Users can view tenders for their projects"
ON tenders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = tenders.project_id
    AND project_users.user_id = auth.uid()
  )
);

-- Policy: Allow tender creators to update their own tenders
CREATE POLICY "Users can update their own tenders"
ON tenders
FOR UPDATE
TO authenticated
USING (auth.uid() = issued_by)
WITH CHECK (auth.uid() = issued_by);

-- Policy: Allow tender creators to delete their own tenders
CREATE POLICY "Users can delete their own tenders"
ON tenders
FOR DELETE
TO authenticated
USING (auth.uid() = issued_by);