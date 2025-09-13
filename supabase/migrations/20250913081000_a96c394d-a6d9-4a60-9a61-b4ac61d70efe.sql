-- Enforce privacy for documents: project members cannot see private documents unless they are the uploader
-- Drop existing broad SELECT policy
DROP POLICY IF EXISTS "Users can view documents for their projects" ON public.documents;

-- Policy: Project members can view non-private documents
CREATE POLICY "Project members can view non-private documents"
ON public.documents
FOR SELECT
USING (
  visibility_scope <> 'private'
  AND EXISTS (
    SELECT 1 FROM public.project_users pu
    WHERE pu.project_id = documents.project_id
      AND pu.user_id = auth.uid()
  )
);

-- Policy: Uploaders can view their private documents
CREATE POLICY "Uploaders can view their private documents"
ON public.documents
FOR SELECT
USING (
  visibility_scope = 'private' AND uploaded_by = auth.uid()
);
