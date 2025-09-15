-- Create document_shares table for sharing private documents with specific users
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL, -- User who shared the document
  shared_with UUID NOT NULL, -- User who received access
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'download', 'edit'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  UNIQUE(document_id, shared_with)
);

-- Enable RLS on document_shares
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_shares
CREATE POLICY "Users can share their own documents" 
ON public.document_shares 
FOR INSERT 
WITH CHECK (
  auth.uid() = shared_by AND 
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_shares.document_id 
    AND d.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can view shares they created or received" 
ON public.document_shares 
FOR SELECT 
USING (
  auth.uid() = shared_by OR 
  auth.uid() = shared_with
);

CREATE POLICY "Users can delete shares they created" 
ON public.document_shares 
FOR DELETE 
USING (auth.uid() = shared_by);

-- Update documents RLS to include shared documents
DROP POLICY IF EXISTS "Shared documents are accessible to recipients" ON public.documents;
CREATE POLICY "Shared documents are accessible to recipients" 
ON public.documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.document_shares ds
    WHERE ds.document_id = documents.id 
    AND ds.shared_with = auth.uid()
  )
);

-- Create index for better performance on document sharing queries
CREATE INDEX idx_document_shares_document_id ON public.document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with ON public.document_shares(shared_with);
CREATE INDEX idx_document_shares_shared_by ON public.document_shares(shared_by);