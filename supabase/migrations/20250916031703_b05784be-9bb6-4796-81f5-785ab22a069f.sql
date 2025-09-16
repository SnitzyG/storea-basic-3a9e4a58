-- Ensure 'documents' storage bucket exists and basic RLS policies are in place
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false);
  END IF;
END $$;

-- Storage policies for 'documents' bucket
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_can_read_documents_bucket' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY authenticated_can_read_documents_bucket ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'documents');
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_can_insert_documents_bucket' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY authenticated_can_insert_documents_bucket ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_can_update_documents_bucket' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY authenticated_can_update_documents_bucket ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'documents');
  END IF;

  -- DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_can_delete_documents_bucket' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY authenticated_can_delete_documents_bucket ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;