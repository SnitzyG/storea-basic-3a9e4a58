-- Add UPDATE policy for activity_log table to allow users to update metadata for dismissal
CREATE POLICY "Users can update activity metadata for dismissal" 
ON activity_log 
FOR UPDATE 
USING (
  -- Users can update activities if they're in the same project OR if it's a general activity (no project)
  (project_id IS NULL) OR 
  (EXISTS (
    SELECT 1 
    FROM project_users 
    WHERE project_users.project_id = activity_log.project_id 
    AND project_users.user_id = auth.uid()
  ))
);