-- Add missing file_size column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size bigint;

-- Add missing columns for better document management
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_extension text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Ensure documents table has proper RLS for deletion (currently missing) - using correct role values
CREATE POLICY "Users can delete their own documents" 
ON documents 
FOR DELETE 
USING (auth.uid() = uploaded_by OR EXISTS (
  SELECT 1 FROM project_users 
  WHERE project_users.project_id = documents.project_id 
  AND project_users.user_id = auth.uid() 
  AND project_users.role IN ('architect', 'contractor')
));