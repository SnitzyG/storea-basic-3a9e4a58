-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  visibility_scope TEXT DEFAULT 'project',
  status document_status NOT NULL DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_status enum
CREATE TYPE public.document_status AS ENUM ('draft', 'under_review', 'approved', 'rejected');

-- Create document_approvals table
CREATE TABLE public.document_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comments TEXT,
  approved_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_versions table for version history
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  changes_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their projects" 
ON public.documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM project_users 
  WHERE project_users.project_id = documents.project_id 
  AND project_users.user_id = auth.uid()
));

CREATE POLICY "Users can upload documents to their projects" 
ON public.documents 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM project_users 
  WHERE project_users.project_id = documents.project_id 
  AND project_users.user_id = auth.uid()
) AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

-- RLS Policies for document_approvals
CREATE POLICY "Users can view document approvals for their projects" 
ON public.document_approvals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM documents d 
  JOIN project_users pu ON d.project_id = pu.project_id 
  WHERE d.id = document_approvals.document_id 
  AND pu.user_id = auth.uid()
));

CREATE POLICY "Users can approve documents" 
ON public.document_approvals 
FOR INSERT 
WITH CHECK (auth.uid() = approver_id);

CREATE POLICY "Users can update their own approvals" 
ON public.document_approvals 
FOR UPDATE 
USING (auth.uid() = approver_id);

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions for their projects" 
ON public.document_versions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM documents d 
  JOIN project_users pu ON d.project_id = pu.project_id 
  WHERE d.id = document_versions.document_id 
  AND pu.user_id = auth.uid()
));

CREATE POLICY "Users can create document versions" 
ON public.document_versions 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND EXISTS (
  SELECT 1 FROM documents d 
  JOIN project_users pu ON d.project_id = pu.project_id 
  WHERE d.file_path = name 
  AND pu.user_id = auth.uid()
));

CREATE POLICY "Users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND EXISTS (
  SELECT 1 FROM documents d 
  WHERE d.file_path = name 
  AND d.uploaded_by = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();