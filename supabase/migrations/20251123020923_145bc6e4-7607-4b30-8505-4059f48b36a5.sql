-- Fix system tables with unrestricted INSERT policies
-- Replace WITH CHECK (true) with secure RPC functions

-- 1. Drop insecure policies
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can create activity logs" ON activity_log;
DROP POLICY IF EXISTS "System can create document events" ON document_events;

-- 2. Create secure notification function
CREATE OR REPLACE FUNCTION create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text,
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate notification type
  IF _type NOT IN ('info', 'warning', 'error', 'success') THEN
    RAISE EXCEPTION 'Invalid notification type: %', _type;
  END IF;
  
  -- Validate title and message length
  IF length(_title) > 200 OR length(_message) > 1000 THEN
    RAISE EXCEPTION 'Title or message too long';
  END IF;
  
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (_user_id, _title, _message, _type, _data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- 3. Create secure activity log function
CREATE OR REPLACE FUNCTION log_activity(
  _entity_type text,
  _entity_id uuid,
  _action text,
  _description text,
  _project_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify project access if project_id provided
  IF _project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM project_users
      WHERE project_id = _project_id
      AND user_id = current_user_id
    ) THEN
      RAISE EXCEPTION 'User not authorized for this project';
    END IF;
  END IF;
  
  INSERT INTO activity_log (
    user_id, entity_type, entity_id, action, 
    description, project_id, metadata
  )
  VALUES (
    current_user_id, _entity_type, _entity_id, _action,
    _description, _project_id, _metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 4. Create secure document events function
CREATE OR REPLACE FUNCTION log_document_event(
  _document_id uuid,
  _event_type text,
  _event_description text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify document access
  IF NOT EXISTS (
    SELECT 1 FROM documents d
    JOIN project_users pu ON d.project_id = pu.project_id
    WHERE d.id = _document_id AND pu.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User not authorized to access this document';
  END IF;
  
  INSERT INTO document_events (document_id, event_type, event_description, user_id, metadata)
  VALUES (_document_id, _event_type, _event_description, current_user_id, _metadata)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- 5. Secure tender and project data - require authentication
DROP POLICY IF EXISTS "Public can view open tenders" ON tenders;
DROP POLICY IF EXISTS "Anyone can view open tenders" ON tenders;
DROP POLICY IF EXISTS "view_own_or_open_tenders" ON tenders;

CREATE POLICY "Authenticated users can view tenders they have access to"
ON tenders FOR SELECT
TO authenticated
USING (
  -- User is project member
  EXISTS (
    SELECT 1 FROM project_users pu
    WHERE pu.project_id = tenders.project_id
    AND pu.user_id = auth.uid()
  )
  OR
  -- User has approved tender access
  EXISTS (
    SELECT 1 FROM tender_access ta
    WHERE ta.tender_id = tenders.id
    AND ta.user_id = auth.uid()
    AND ta.status = 'approved'
  )
  OR
  -- User is the issuer
  issued_by = auth.uid()
);

-- Secure projects data
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Public can view projects" ON projects;

CREATE POLICY "Authenticated users can view their projects"
ON projects FOR SELECT
TO authenticated
USING (
  -- User is project member
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_id = projects.id
    AND user_id = auth.uid()
  )
  OR
  -- User created the project
  created_by = auth.uid()
);