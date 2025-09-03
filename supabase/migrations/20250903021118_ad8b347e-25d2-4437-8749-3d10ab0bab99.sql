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