-- Add lock and unlock functionality for document groups
-- Update document groups to support locking/unlocking
UPDATE document_groups 
SET is_locked = COALESCE(is_locked, false)
WHERE is_locked IS NULL;

-- Add function to lock/unlock document groups
CREATE OR REPLACE FUNCTION public.toggle_document_lock(
  group_id uuid, 
  should_lock boolean
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  group_record record;
  result jsonb;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get document group
  SELECT * INTO group_record
  FROM document_groups
  WHERE id = group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document group not found';
  END IF;

  -- Update lock status
  IF should_lock THEN
    UPDATE document_groups 
    SET 
      is_locked = true,
      locked_by = current_user_id,
      locked_at = now()
    WHERE id = group_id;
    
    result := jsonb_build_object(
      'success', true,
      'locked', true,
      'locked_by', current_user_id,
      'locked_at', now()
    );
  ELSE
    UPDATE document_groups 
    SET 
      is_locked = false,
      locked_by = null,
      locked_at = null
    WHERE id = group_id;
    
    result := jsonb_build_object(
      'success', true,
      'locked', false
    );
  END IF;

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
    CASE WHEN should_lock THEN 'locked' ELSE 'unlocked' END,
    'Document ' || CASE WHEN should_lock THEN 'locked' ELSE 'unlocked' END,
    jsonb_build_object('locked', should_lock)
  );

  RETURN result;
END;
$$;

-- Add function to update document group metadata
CREATE OR REPLACE FUNCTION public.update_document_group_metadata(
  group_id uuid,
  new_title text DEFAULT NULL,
  new_category text DEFAULT NULL,
  new_status text DEFAULT NULL,
  new_visibility_scope text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  result jsonb;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if document is locked
  IF EXISTS (
    SELECT 1 FROM document_groups 
    WHERE id = group_id 
    AND is_locked = true 
    AND locked_by != current_user_id
  ) THEN
    RAISE EXCEPTION 'Document is locked by another user';
  END IF;

  -- Update only provided fields
  UPDATE document_groups 
  SET 
    title = COALESCE(new_title, title),
    category = COALESCE(new_category, category),
    status = COALESCE(new_status, status),
    visibility_scope = COALESCE(new_visibility_scope, visibility_scope),
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
    'updated',
    'Document metadata updated',
    jsonb_build_object(
      'title', new_title,
      'category', new_category,
      'status', new_status,
      'visibility_scope', new_visibility_scope
    )
  );

  result := jsonb_build_object('success', true);
  RETURN result;
END;
$$;