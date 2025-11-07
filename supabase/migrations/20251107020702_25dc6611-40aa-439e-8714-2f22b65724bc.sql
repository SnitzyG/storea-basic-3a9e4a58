-- Add INSERT policy for project_join_requests
CREATE POLICY "Users can create their own join requests"
  ON public.project_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);