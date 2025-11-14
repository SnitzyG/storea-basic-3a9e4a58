-- Fix logging triggers to skip when auth.uid() is NULL (prevents activity_log violations during service role operations)

-- Update log_document_activity function
CREATE OR REPLACE FUNCTION public.log_document_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user (service role operations)
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'document',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Document uploaded: ' || NEW.name
      WHEN TG_OP = 'UPDATE' THEN 'Document updated: ' || NEW.name
      WHEN TG_OP = 'DELETE' THEN 'Document deleted: ' || OLD.name
    END,
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_document_revision_activity function
CREATE OR REPLACE FUNCTION public.log_document_revision_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'document_revision',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New revision created: Rev ' || NEW.revision_number
      WHEN TG_OP = 'UPDATE' THEN 'Revision updated: Rev ' || NEW.revision_number
    END,
    (SELECT project_id FROM document_groups WHERE id = COALESCE(NEW.document_group_id, OLD.document_group_id))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_message_activity function
CREATE OR REPLACE FUNCTION public.log_message_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'message',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Message sent'
      WHEN TG_OP = 'DELETE' THEN 'Message deleted'
    END,
    (SELECT project_id FROM message_threads WHERE id = COALESCE(NEW.thread_id, OLD.thread_id))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_thread_activity function
CREATE OR REPLACE FUNCTION public.log_thread_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'message_thread',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Thread created: ' || NEW.title
      WHEN TG_OP = 'UPDATE' THEN 'Thread updated: ' || NEW.title
      WHEN TG_OP = 'DELETE' THEN 'Thread deleted: ' || OLD.title
    END,
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_rfi_activity function
CREATE OR REPLACE FUNCTION public.log_rfi_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'rfi',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'RFI created: ' || NEW.subject
      WHEN TG_OP = 'UPDATE' THEN 'RFI updated: ' || NEW.subject
      WHEN TG_OP = 'DELETE' THEN 'RFI deleted: ' || OLD.subject
    END,
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_tender_activity function
CREATE OR REPLACE FUNCTION public.log_tender_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'tender',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Tender created: ' || NEW.title
      WHEN TG_OP = 'UPDATE' THEN 'Tender updated: ' || NEW.title
      WHEN TG_OP = 'DELETE' THEN 'Tender deleted: ' || OLD.title
    END,
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_tender_bid_activity function
CREATE OR REPLACE FUNCTION public.log_tender_bid_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'tender_bid',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Bid submitted'
      WHEN TG_OP = 'UPDATE' THEN 'Bid updated'
      WHEN TG_OP = 'DELETE' THEN 'Bid deleted'
    END,
    (SELECT project_id FROM tenders WHERE id = COALESCE(NEW.tender_id, OLD.tender_id))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_project_activity function
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'project',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Project created: ' || NEW.name
      WHEN TG_OP = 'UPDATE' THEN 'Project updated: ' || NEW.name
      WHEN TG_OP = 'DELETE' THEN 'Project deleted: ' || OLD.name
    END,
    COALESCE(NEW.id, OLD.id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_project_user_activity function
CREATE OR REPLACE FUNCTION public.log_project_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip logging if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, project_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'project_user',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'User added to project'
      WHEN TG_OP = 'UPDATE' THEN 'User role updated in project'
      WHEN TG_OP = 'DELETE' THEN 'User removed from project'
    END,
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;