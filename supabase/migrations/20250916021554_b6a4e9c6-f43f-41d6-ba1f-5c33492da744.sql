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

-- Add foreign key constraint for current revision
ALTER TABLE public.document_groups 
ADD CONSTRAINT fk_current_revision 
FOREIGN KEY (current_revision_id) REFERENCES public.document_revisions(id);

-- Enable RLS on new tables
ALTER TABLE public.document_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;

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

-- Functions for revision management
CREATE OR REPLACE FUNCTION public.create_document_supersede(
  group_id UUID,
  new_file_name TEXT,
  new_file_path TEXT,
  new_file_type TEXT,
  new_file_size BIGINT,
  new_file_extension TEXT,
  changes_summary TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_revision_number INTEGER;
  new_revision_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get next revision number
  SELECT COALESCE(MAX(revision_number), 0) + 1 
  INTO next_revision_number
  FROM document_revisions 
  WHERE document_group_id = group_id;

  -- Archive current revision
  UPDATE document_revisions 
  SET is_current = false, is_archived = true
  WHERE document_group_id = group_id AND is_current = true;

  -- Create new revision
  INSERT INTO document_revisions (
    document_group_id,
    revision_number,
    file_name,
    file_path,
    file_type,
    file_size,
    file_extension,
    uploaded_by,
    changes_summary,
    is_current
  ) VALUES (
    group_id,
    next_revision_number,
    new_file_name,
    new_file_path,
    new_file_type,
    new_file_size,
    new_file_extension,
    current_user_id,
    changes_summary,
    true
  ) RETURNING id INTO new_revision_id;

  -- Update document group current revision and updated_at
  UPDATE document_groups 
  SET 
    current_revision_id = new_revision_id,
    updated_at = now()
  WHERE id = group_id;

  -- Log activity
  INSERT INTO activity_log (
    user_id,
    entity_type,
    entity_id,
    action,
    description,
    metadata
  ) VALUES (
    current_user_id,
    'document_group',
    group_id,
    'superseded',
    'Document superseded with revision ' || next_revision_number,
    jsonb_build_object(
      'revision_number', next_revision_number,
      'changes_summary', changes_summary
    )
  );

  RETURN new_revision_id;
END;
$$;

-- Function to auto-generate document number
CREATE OR REPLACE FUNCTION public.generate_document_group_number(project_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_code TEXT;
  doc_count INTEGER;
  doc_number TEXT;
BEGIN
  -- Get project name first 3 chars as code
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) 
  INTO project_code
  FROM projects 
  WHERE id = project_id_param;
  
  -- If no project code found, use 'DOC'
  IF project_code IS NULL OR LENGTH(project_code) = 0 THEN
    project_code := 'DOC';
  END IF;
  
  -- Count existing document groups for this project
  SELECT COUNT(*) + 1 
  INTO doc_count
  FROM document_groups 
  WHERE project_id = project_id_param;
  
  -- Generate document number: PROJECT_CODE-YYYYMMDD-NNNN
  doc_number := project_code || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(doc_count::TEXT, 4, '0');
  
  RETURN doc_number;
END;
$$;

-- Trigger for auto-generating document numbers
CREATE OR REPLACE FUNCTION public.auto_generate_document_group_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only generate if document_number is not provided
  IF NEW.document_number IS NULL THEN
    NEW.document_number := generate_document_group_number(NEW.project_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_document_group_number
  BEFORE INSERT ON public.document_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_document_group_number();

-- Trigger for updating updated_at
CREATE TRIGGER update_document_groups_updated_at
  BEFORE UPDATE ON public.document_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();