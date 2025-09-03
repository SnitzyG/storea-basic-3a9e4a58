-- Fix RLS infinite recursion by removing problematic policies and creating clean ones

-- Drop ALL existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view project memberships for their projects" ON project_users;
DROP POLICY IF EXISTS "project_users_select_as_creator" ON project_users;
DROP POLICY IF EXISTS "projects_select_as_member" ON projects;

-- Create a security definer function to check project membership
-- This avoids recursion by using a function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = $1 
    AND project_users.user_id = $2
  );
$$;

-- Create a security definer function to check if user created the project
CREATE OR REPLACE FUNCTION public.is_project_creator(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = $1 
    AND projects.created_by = $2
  );
$$;

-- Recreate project_users policies using the helper functions
CREATE POLICY "project_users_select_safe"
ON project_users
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.is_project_creator(project_id, auth.uid())
);

-- Update projects policies to use the helper function
CREATE POLICY "projects_select_member_safe"
ON projects
FOR SELECT
USING (
  created_by = auth.uid() OR
  public.is_project_member(id, auth.uid())
);

-- Fix storage policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- Create proper storage policies
CREATE POLICY "documents_select_policy"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    -- Users can access documents in projects they're members of
    EXISTS (
      SELECT 1 FROM documents d
      JOIN project_users pu ON d.project_id = pu.project_id
      WHERE pu.user_id = auth.uid()
      AND objects.name LIKE d.file_path || '%'
    )
    OR
    -- Or documents they uploaded
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "documents_insert_policy"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "documents_update_policy"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_delete_policy"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);