-- Continue with remaining RLS policies for the original 4-role system

-- companies policies
CREATE POLICY "users_can_view_company" ON public.companies
FOR SELECT TO authenticated USING (
  id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "users_can_view_project_companies" ON public.companies
FOR SELECT TO authenticated USING (
  id IN (
    SELECT DISTINCT p.company_id
    FROM projects p
    JOIN project_users pu ON p.id = pu.project_id
    WHERE pu.user_id = auth.uid()
  )
);

-- contractor_prequalifications policies (no existing policies)

-- document_approvals policies
CREATE POLICY "Users can approve documents" ON public.document_approvals
FOR INSERT TO authenticated WITH CHECK (auth.uid() = approver_id);

CREATE POLICY "Users can update their own approvals" ON public.document_approvals
FOR UPDATE TO authenticated USING (auth.uid() = approver_id);

CREATE POLICY "Users can view document approvals for their projects" ON public.document_approvals
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.id = document_approvals.document_id
      AND pu.user_id = auth.uid()
  )
);

-- document_events policies
CREATE POLICY "System can create document events" ON public.document_events
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view events for documents in their projects" ON public.document_events
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.id = document_events.document_id
      AND pu.user_id = auth.uid()
  )
);

-- document_groups policies
CREATE POLICY "Users can create document groups in their projects" ON public.document_groups
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_groups.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view document groups for their projects" ON public.document_groups
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = document_groups.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update document groups they created" ON public.document_groups
FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete document groups they created" ON public.document_groups
FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- document_revisions policies
CREATE POLICY "Users can create revisions for their project documents" ON public.document_revisions
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM document_groups dg
    JOIN project_users pu ON dg.project_id = pu.project_id
    WHERE dg.id = document_revisions.document_group_id
      AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view revisions for their project documents" ON public.document_revisions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM document_groups dg
    JOIN project_users pu ON dg.project_id = pu.project_id
    WHERE dg.id = document_revisions.document_group_id
      AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update revisions they uploaded" ON public.document_revisions
FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);

-- document_shares policies
CREATE POLICY "Users can share their own documents" ON public.document_shares
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = shared_by AND EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_shares.document_id
      AND d.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can view shares they created or received" ON public.document_shares
FOR SELECT TO authenticated USING (
  auth.uid() = shared_by OR auth.uid() = shared_with
);

CREATE POLICY "Users can delete shares they created" ON public.document_shares
FOR DELETE TO authenticated USING (auth.uid() = shared_by);