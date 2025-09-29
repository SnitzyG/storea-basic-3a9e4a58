-- Continue with remaining RLS policies

-- document_status_options policies
CREATE POLICY "Architects can manage status options" ON public.document_status_options
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_status_options.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = 'architect'::public.user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_status_options.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = 'architect'::public.user_role
  )
);

CREATE POLICY "Users can view status options for their projects" ON public.document_status_options
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_status_options.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- document_transmittals policies
CREATE POLICY "Users can create transmittals for documents in their projects" ON public.document_transmittals
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.id = document_transmittals.document_id
      AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view transmittals for documents in their projects" ON public.document_transmittals
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.id = document_transmittals.document_id
      AND pu.user_id = auth.uid()
  )
);

-- document_types policies
CREATE POLICY "Architects can manage document types" ON public.document_types
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_types.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = 'architect'::public.user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_types.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = 'architect'::public.user_role
  )
);

CREATE POLICY "Users can view document types for their projects" ON public.document_types
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_types.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- document_versions policies
CREATE POLICY "Users can create document versions" ON public.document_versions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view document versions for their projects" ON public.document_versions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.id = document_versions.document_id
      AND pu.user_id = auth.uid()
  )
);

-- documents policies
CREATE POLICY "Users can upload documents to their projects" ON public.documents
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = documents.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Uploaders can view their private documents" ON public.documents
FOR SELECT TO authenticated USING (
  visibility_scope = 'private' AND uploaded_by = auth.uid()
);

CREATE POLICY "Project members can view non-private documents" ON public.documents
FOR SELECT TO authenticated USING (
  visibility_scope <> 'private' AND EXISTS (
    SELECT 1 FROM project_users pu
    WHERE pu.project_id = documents.project_id
      AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Shared documents are accessible to recipients" ON public.documents
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM document_shares ds
    WHERE ds.document_id = documents.id
      AND ds.shared_with = auth.uid()
  )
);

CREATE POLICY "Users can update their own documents" ON public.documents
FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own documents" ON public.documents
FOR DELETE TO authenticated USING (
  auth.uid() = uploaded_by OR EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = documents.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  )
);