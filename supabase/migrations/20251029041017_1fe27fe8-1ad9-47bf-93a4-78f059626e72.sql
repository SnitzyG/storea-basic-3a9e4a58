-- Create storage bucket for tender package documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('tender-packages', 'tender-packages', false)
ON CONFLICT (id) DO NOTHING;

-- Create table to track tender package documents
CREATE TABLE IF NOT EXISTS public.tender_package_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID REFERENCES public.tenders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tender_package_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tender_package_documents
CREATE POLICY "Users can view tender package documents for their projects"
ON public.tender_package_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenders t
    JOIN public.project_users pu ON pu.project_id = t.project_id
    WHERE t.id = tender_package_documents.tender_id
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload tender package documents for their projects"
ON public.tender_package_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenders t
    JOIN public.project_users pu ON pu.project_id = t.project_id
    WHERE t.id = tender_package_documents.tender_id
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own uploaded documents"
ON public.tender_package_documents
FOR DELETE
USING (uploaded_by = auth.uid());

-- Storage RLS Policies for tender-packages bucket
CREATE POLICY "Users can view tender package files for their projects"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'tender-packages' AND
  EXISTS (
    SELECT 1 FROM public.tender_package_documents tpd
    JOIN public.tenders t ON t.id = tpd.tender_id
    JOIN public.project_users pu ON pu.project_id = t.project_id
    WHERE tpd.file_path = storage.objects.name
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload tender package files for their projects"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tender-packages' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tender-packages' AND
  auth.uid() = owner
);