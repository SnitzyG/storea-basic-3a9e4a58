-- Check if document_groups and document_revisions tables exist
DO $$
BEGIN
  -- Only create tables if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_groups') THEN
    
    -- Create document groups table (logical documents)
    CREATE TABLE public.document_groups (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL,
      document_number TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Architectural',
      current_revision_id UUID,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      created_by UUID NOT NULL,
      status TEXT NOT NULL DEFAULT 'For Information',
      visibility_scope TEXT NOT NULL DEFAULT 'project',
      is_locked BOOLEAN DEFAULT false,
      locked_by UUID,
      locked_at TIMESTAMP WITH TIME ZONE
    );

    -- Enable RLS
    ALTER TABLE public.document_groups ENABLE ROW LEVEL SECURITY;

    -- RLS policies for document_groups
    CREATE POLICY "Users can view document groups for their projects" 
    ON public.document_groups 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_users.project_id = document_groups.project_id 
        AND project_users.user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can create document groups in their projects" 
    ON public.document_groups 
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_users.project_id = document_groups.project_id 
        AND project_users.user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can update document groups they created" 
    ON public.document_groups 
    FOR UPDATE 
    USING (auth.uid() = created_by);

    CREATE POLICY "Users can delete document groups they created" 
    ON public.document_groups 
    FOR DELETE 
    USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_revisions') THEN
    
    -- Create document revisions table (individual file versions)
    CREATE TABLE public.document_revisions (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      document_group_id UUID NOT NULL REFERENCES public.document_groups(id) ON DELETE CASCADE,
      revision_number INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size BIGINT,
      file_extension TEXT,
      uploaded_by UUID NOT NULL,
      changes_summary TEXT,
      is_current BOOLEAN NOT NULL DEFAULT false,
      is_archived BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(document_group_id, revision_number)
    );

    -- Enable RLS
    ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;

    -- RLS policies for document_revisions
    CREATE POLICY "Users can view revisions for their project documents" 
    ON public.document_revisions 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM document_groups dg
        JOIN project_users pu ON dg.project_id = pu.project_id
        WHERE dg.id = document_revisions.document_group_id 
        AND pu.user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can create revisions for their project documents" 
    ON public.document_revisions 
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM document_groups dg
        JOIN project_users pu ON dg.project_id = pu.project_id
        WHERE dg.id = document_revisions.document_group_id 
        AND pu.user_id = auth.uid()
      )
    );

    CREATE POLICY "Users can update revisions they uploaded" 
    ON public.document_revisions 
    FOR UPDATE 
    USING (auth.uid() = uploaded_by);

    -- Add foreign key constraint for current revision after both tables exist
    ALTER TABLE public.document_groups 
    ADD CONSTRAINT fk_current_revision 
    FOREIGN KEY (current_revision_id) REFERENCES public.document_revisions(id);
  END IF;
END;
$$;