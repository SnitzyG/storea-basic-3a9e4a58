-- Create documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for documents storage bucket
CREATE POLICY "Users can view documents in their projects" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.file_path = name 
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents to their projects" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their uploaded documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    WHERE d.file_path = name 
    AND d.uploaded_by = auth.uid()
  )
);