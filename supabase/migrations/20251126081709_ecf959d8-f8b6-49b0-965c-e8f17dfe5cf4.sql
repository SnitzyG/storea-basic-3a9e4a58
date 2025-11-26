-- Fix activity_log INSERT policy
CREATE POLICY "Users can create activity logs"
ON activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add contractor_prequalifications RLS policies

-- 1. Contractors can view their own prequalifications
CREATE POLICY "Contractors can view own prequalifications"
ON contractor_prequalifications
FOR SELECT
USING (auth.uid() = contractor_id);

-- 2. Project members (architects/builders) can view prequalifications for their projects
CREATE POLICY "Project members can view prequalifications"
ON contractor_prequalifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = contractor_prequalifications.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
);

-- 3. Contractors can create prequalifications for projects they have access to
CREATE POLICY "Contractors can create prequalifications"
ON contractor_prequalifications
FOR INSERT
WITH CHECK (
  auth.uid() = contractor_id
  AND EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = contractor_prequalifications.project_id
    AND project_users.user_id = auth.uid()
  )
);

-- 4. Contractors can update their own pending prequalifications
CREATE POLICY "Contractors can update own pending prequalifications"
ON contractor_prequalifications
FOR UPDATE
USING (
  auth.uid() = contractor_id
  AND status = 'pending'
);

-- 5. Project architects/builders can review (update) prequalifications
CREATE POLICY "Project leads can review prequalifications"
ON contractor_prequalifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = contractor_prequalifications.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
);

-- 6. Project creators can delete prequalifications
CREATE POLICY "Project creators can delete prequalifications"
ON contractor_prequalifications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = contractor_prequalifications.project_id
    AND projects.created_by = auth.uid()
  )
);