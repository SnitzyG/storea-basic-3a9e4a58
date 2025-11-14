-- =====================================================
-- COMPREHENSIVE ACTIVITY TRACKING SYSTEM (Fixed)
-- =====================================================

-- 1. Grant admin role to richard@storea.com.au
SELECT public.grant_admin_by_email('richard@storea.com.au');

-- 2. Enhance activity_log table with session tracking
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS session_id UUID;

-- 3. Enhance user_sessions table
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_created ON activity_log(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_project_created ON activity_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_session ON activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);

-- 5. Create unified activity logging function
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_project_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO activity_log (
    user_id,
    entity_type,
    entity_id,
    action,
    description,
    metadata,
    project_id,
    ip_address,
    user_agent,
    session_id,
    created_at
  ) VALUES (
    p_user_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_description,
    p_metadata,
    p_project_id,
    p_ip_address,
    p_user_agent,
    p_session_id,
    NOW()
  );
END;
$$;

-- 6. Document activity triggers
CREATE OR REPLACE FUNCTION log_document_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.uploaded_by,
      'document',
      NEW.id,
      'created',
      'Document uploaded: ' || NEW.name,
      jsonb_build_object(
        'file_type', NEW.file_type,
        'file_size', NEW.file_size,
        'visibility', NEW.visibility_scope
      ),
      NEW.project_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'document',
      NEW.id,
      'updated',
      'Document updated: ' || NEW.name,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_visibility', OLD.visibility_scope,
        'new_visibility', NEW.visibility_scope
      ),
      NEW.project_id
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'document',
      OLD.id,
      'deleted',
      'Document deleted: ' || OLD.name,
      jsonb_build_object('file_type', OLD.file_type),
      OLD.project_id
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS document_activity_trigger ON documents;
CREATE TRIGGER document_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_document_activity();

-- 7. Document revision activity trigger
CREATE OR REPLACE FUNCTION log_document_revision_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT dg.project_id INTO v_project_id
  FROM document_groups dg
  WHERE dg.id = NEW.document_group_id;
  
  PERFORM log_activity(
    NEW.uploaded_by,
    'document_revision',
    NEW.id,
    'superseded',
    'Document superseded: Revision ' || NEW.revision_number,
    jsonb_build_object(
      'revision_number', NEW.revision_number,
      'changes_summary', NEW.changes_summary
    ),
    v_project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_revision_activity_trigger ON document_revisions;
CREATE TRIGGER document_revision_activity_trigger
AFTER INSERT ON document_revisions
FOR EACH ROW EXECUTE FUNCTION log_document_revision_activity();

-- 8. Message activity triggers
CREATE OR REPLACE FUNCTION log_message_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT mt.project_id INTO v_project_id
  FROM message_threads mt
  WHERE mt.id = NEW.thread_id;
  
  PERFORM log_activity(
    NEW.sender_id,
    'message',
    NEW.id,
    'sent',
    'Message sent in thread',
    jsonb_build_object('has_attachments', (NEW.attachments IS NOT NULL)),
    v_project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_activity_trigger ON messages;
CREATE TRIGGER message_activity_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION log_message_activity();

-- 9. Message thread activity triggers
CREATE OR REPLACE FUNCTION log_thread_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_activity(
    NEW.created_by,
    'message_thread',
    NEW.id,
    'created',
    'Message thread created: ' || NEW.subject,
    jsonb_build_object('participants_count', jsonb_array_length(NEW.participants)),
    NEW.project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS thread_activity_trigger ON message_threads;
CREATE TRIGGER thread_activity_trigger
AFTER INSERT ON message_threads
FOR EACH ROW EXECUTE FUNCTION log_thread_activity();

-- 10. RFI activity triggers
CREATE OR REPLACE FUNCTION log_rfi_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.raised_by,
      'rfi',
      NEW.id,
      'created',
      'RFI created: ' || NEW.rfi_number || ' - ' || NEW.subject,
      jsonb_build_object(
        'rfi_type', NEW.rfi_type,
        'priority', NEW.priority,
        'category', NEW.category
      ),
      NEW.project_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity(
      auth.uid(),
      'rfi',
      NEW.id,
      'status_changed',
      'RFI status changed: ' || NEW.rfi_number,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rfi_activity_trigger ON rfis;
CREATE TRIGGER rfi_activity_trigger
AFTER INSERT OR UPDATE ON rfis
FOR EACH ROW EXECUTE FUNCTION log_rfi_activity();

-- 11. Tender activity triggers
CREATE OR REPLACE FUNCTION log_tender_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.issued_by,
      'tender',
      NEW.id,
      'created',
      'Tender created: ' || NEW.title,
      jsonb_build_object(
        'tender_type', NEW.tender_type,
        'status', NEW.status
      ),
      NEW.project_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity(
      auth.uid(),
      'tender',
      NEW.id,
      'status_changed',
      'Tender status changed: ' || NEW.title,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tender_activity_trigger ON tenders;
CREATE TRIGGER tender_activity_trigger
AFTER INSERT OR UPDATE ON tenders
FOR EACH ROW EXECUTE FUNCTION log_tender_activity();

-- 12. Tender bid activity triggers
CREATE OR REPLACE FUNCTION log_tender_bid_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_tender_title TEXT;
BEGIN
  SELECT t.project_id, t.title INTO v_project_id, v_tender_title
  FROM tenders t
  WHERE t.id = NEW.tender_id;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.submitted_by,
      'tender_bid',
      NEW.id,
      'submitted',
      'Bid submitted for tender: ' || v_tender_title,
      jsonb_build_object('bid_amount', NEW.total_amount),
      v_project_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity(
      auth.uid(),
      'tender_bid',
      NEW.id,
      'status_changed',
      'Bid status changed: ' || v_tender_title,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      v_project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tender_bid_activity_trigger ON tender_bids;
CREATE TRIGGER tender_bid_activity_trigger
AFTER INSERT OR UPDATE ON tender_bids
FOR EACH ROW EXECUTE FUNCTION log_tender_bid_activity();

-- 13. Project activity triggers
CREATE OR REPLACE FUNCTION log_project_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.created_by,
      'project',
      NEW.id,
      'created',
      'Project created: ' || NEW.name,
      jsonb_build_object(
        'project_type', NEW.project_type,
        'status', NEW.status
      ),
      NEW.id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'project',
      NEW.id,
      'updated',
      'Project updated: ' || NEW.name,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_stage', OLD.current_stage,
        'new_stage', NEW.current_stage
      ),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_activity_trigger ON projects;
CREATE TRIGGER project_activity_trigger
AFTER INSERT OR UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION log_project_activity();

-- 14. Project team activity triggers
CREATE OR REPLACE FUNCTION log_project_user_activity() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_project_name TEXT;
BEGIN
  SELECT p.name, pr.name INTO v_user_name, v_project_name
  FROM profiles p, projects pr
  WHERE p.user_id = COALESCE(NEW.user_id, OLD.user_id)
  AND pr.id = COALESCE(NEW.project_id, OLD.project_id);
  
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      COALESCE(NEW.invited_by, NEW.user_id),
      'project_team',
      NEW.id,
      'member_added',
      'Team member added: ' || COALESCE(v_user_name, 'Unknown') || ' to ' || v_project_name,
      jsonb_build_object('role', NEW.role, 'user_id', NEW.user_id),
      NEW.project_id
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'project_team',
      OLD.id,
      'member_removed',
      'Team member removed: ' || COALESCE(v_user_name, 'Unknown') || ' from ' || v_project_name,
      jsonb_build_object('role', OLD.role, 'user_id', OLD.user_id),
      OLD.project_id
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS project_user_activity_trigger ON project_users;
CREATE TRIGGER project_user_activity_trigger
AFTER INSERT OR DELETE ON project_users
FOR EACH ROW EXECUTE FUNCTION log_project_user_activity();