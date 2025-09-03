-- Complete RLS policies for all remaining tables

-- RLS Policies for tenders
CREATE POLICY "Users can view tenders for their projects" ON public.tenders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = tenders.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Architects can create tenders" ON public.tenders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'architect'
    ) AND EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = tenders.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Architects can update tenders" ON public.tenders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'architect'
    ) AND EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = tenders.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

-- RLS Policies for tender_participants
CREATE POLICY "Users can view tender participants for their projects" ON public.tender_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      JOIN public.project_users pu ON t.project_id = pu.project_id
      WHERE t.id = tender_participants.tender_id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can participate in tenders" ON public.tender_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their projects" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = documents.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their projects" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = documents.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = uploaded_by);

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions for their projects" ON public.document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.project_users pu ON d.project_id = pu.project_id
      WHERE d.id = document_versions.document_id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create document versions" ON public.document_versions
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for document_approvals
CREATE POLICY "Users can view document approvals for their projects" ON public.document_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.project_users pu ON d.project_id = pu.project_id
      WHERE d.id = document_approvals.document_id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can approve documents" ON public.document_approvals
  FOR INSERT WITH CHECK (auth.uid() = approver_id);

CREATE POLICY "Users can update their own approvals" ON public.document_approvals
  FOR UPDATE USING (auth.uid() = approver_id);

-- RLS Policies for message_threads
CREATE POLICY "Users can view message threads for their projects" ON public.message_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = message_threads.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create message threads in their projects" ON public.message_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = message_threads.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their projects" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = messages.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their projects" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = messages.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

-- RLS Policies for message_participants
CREATE POLICY "Users can view message participants for their projects" ON public.message_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.project_users pu ON m.project_id = pu.project_id
      WHERE m.id = message_participants.message_id 
      AND pu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read" ON public.message_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their read status" ON public.message_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rfis
CREATE POLICY "Users can view RFIs for their projects" ON public.rfis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = rfis.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create RFIs in their projects" ON public.rfis
  FOR INSERT WITH CHECK (
    auth.uid() = raised_by AND EXISTS (
      SELECT 1 FROM public.project_users 
      WHERE project_users.project_id = rfis.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update RFIs they created or are assigned to" ON public.rfis
  FOR UPDATE USING (
    auth.uid() = raised_by OR auth.uid() = assigned_to
  );