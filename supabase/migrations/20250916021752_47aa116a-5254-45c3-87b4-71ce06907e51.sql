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

-- Function to migrate existing documents to new system
CREATE OR REPLACE FUNCTION public.migrate_existing_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_record RECORD;
  group_id UUID;
  revision_id UUID;
  category_fixed TEXT;
BEGIN
  -- Migrate each existing document
  FOR doc_record IN 
    SELECT * FROM documents 
    WHERE NOT is_superseded
    ORDER BY created_at
  LOOP
    -- Fix category mapping
    category_fixed := CASE 
      WHEN doc_record.file_type_category IN ('Architectural', 'Structural', 'Permit') 
        THEN doc_record.file_type_category
      ELSE 'Uncategorized'
    END;

    -- Create document group
    INSERT INTO document_groups (
      project_id,
      document_number,
      title,
      category,
      created_at,
      updated_at,
      created_by,
      status,
      visibility_scope,
      is_locked,
      locked_by,
      locked_at
    ) VALUES (
      doc_record.project_id,
      doc_record.document_number,
      COALESCE(doc_record.title, doc_record.name),
      category_fixed,
      doc_record.created_at,
      doc_record.updated_at,
      doc_record.uploaded_by,
      doc_record.status,
      COALESCE(doc_record.visibility_scope, 'project'),
      COALESCE(doc_record.is_locked, false),
      doc_record.locked_by,
      doc_record.locked_at
    ) RETURNING id INTO group_id;

    -- Create current revision
    INSERT INTO document_revisions (
      document_group_id,
      revision_number,
      file_name,
      file_path,
      file_type,
      file_size,
      file_extension,
      uploaded_by,
      is_current,
      created_at
    ) VALUES (
      group_id,
      COALESCE(doc_record.version, 1),
      doc_record.name,
      doc_record.file_path,
      doc_record.file_type,
      doc_record.file_size,
      doc_record.file_extension,
      doc_record.uploaded_by,
      true,
      doc_record.created_at
    ) RETURNING id INTO revision_id;

    -- Update group with current revision
    UPDATE document_groups 
    SET current_revision_id = revision_id
    WHERE id = group_id;

    -- Migrate existing versions if any
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
      is_current,
      is_archived,
      created_at
    )
    SELECT 
      group_id,
      dv.version_number,
      doc_record.name,
      dv.file_path,
      doc_record.file_type,
      0, -- file_size not available in old versions
      doc_record.file_extension,
      dv.uploaded_by,
      dv.changes_summary,
      false, -- not current
      true,  -- archived
      dv.created_at
    FROM document_versions dv
    WHERE dv.document_id = doc_record.id
    AND dv.version_number != COALESCE(doc_record.version, 1);
  END LOOP;
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS auto_document_group_number ON public.document_groups;
CREATE TRIGGER auto_document_group_number
  BEFORE INSERT ON public.document_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_document_group_number();

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_document_groups_updated_at ON public.document_groups;
CREATE TRIGGER update_document_groups_updated_at
  BEFORE UPDATE ON public.document_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();