-- Add SELECT policies for project_join_requests
-- Users can view their own join requests
CREATE POLICY "Users can view their own join requests"
  ON public.project_join_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

-- Project creators can view join requests for their projects
CREATE POLICY "Project creators can view join requests for their projects"
  ON public.project_join_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_join_requests.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Project creators can approve/reject join requests
CREATE POLICY "Project creators can update join requests"
  ON public.project_join_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_join_requests.project_id
      AND projects.created_by = auth.uid()
    )
  );