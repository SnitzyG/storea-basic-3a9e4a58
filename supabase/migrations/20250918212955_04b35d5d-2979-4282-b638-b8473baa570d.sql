-- Update the default visibility scope for documents to be private
ALTER TABLE public.documents 
ALTER COLUMN visibility_scope SET DEFAULT 'private';

-- Update the document_groups table to also default to private
ALTER TABLE public.document_groups 
ALTER COLUMN visibility_scope SET DEFAULT 'private';

-- Add comment to clarify the new privacy-first approach
COMMENT ON COLUMN public.documents.visibility_scope IS 'Document visibility: private (only creator and shared users), project (all project members), or public (everyone)';
COMMENT ON COLUMN public.document_groups.visibility_scope IS 'Document group visibility: private (only creator and shared users), project (all project members), or public (everyone)';