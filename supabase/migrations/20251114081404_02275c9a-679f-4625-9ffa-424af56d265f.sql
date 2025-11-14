-- Drop the table completely if it exists (this will cascade to all dependent objects)
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- Grant admin role to richard@storea.com.au
SELECT public.grant_admin_by_email('richard@storea.com.au');

-- Add new columns to activity_log if they don't exist  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activity_log' AND column_name='ip_address') THEN
    ALTER TABLE activity_log ADD COLUMN ip_address inet;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activity_log' AND column_name='user_agent') THEN
    ALTER TABLE activity_log ADD COLUMN user_agent text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activity_log' AND column_name='session_id') THEN
    ALTER TABLE activity_log ADD COLUMN session_id uuid;
  END IF;
END $$;

-- Create user_sessions table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL UNIQUE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  ip_address inet,
  user_agent text,
  device_info jsonb DEFAULT '{}'::jsonb,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- Create or replace log_activity function
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_project_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS void
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

-- Create triggers (drop first if they exist to avoid duplicates)
DROP TRIGGER IF EXISTS tr_log_document_activity ON documents;
DROP TRIGGER IF EXISTS tr_log_document_revision_activity ON document_revisions;
DROP TRIGGER IF EXISTS tr_log_message_activity ON messages;
DROP TRIGGER IF EXISTS tr_log_thread_activity ON message_threads;
DROP TRIGGER IF EXISTS tr_log_rfi_activity ON rfis;
DROP TRIGGER IF EXISTS tr_log_tender_activity ON tenders;
DROP TRIGGER IF EXISTS tr_log_tender_bid_activity ON tender_bids;
DROP TRIGGER IF EXISTS tr_log_project_activity ON projects;
DROP TRIGGER IF EXISTS tr_log_project_user_activity ON project_users;

CREATE TRIGGER tr_log_document_activity
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_document_activity();

CREATE TRIGGER tr_log_document_revision_activity
  AFTER INSERT ON document_revisions
  FOR EACH ROW EXECUTE FUNCTION log_document_revision_activity();

CREATE TRIGGER tr_log_message_activity
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION log_message_activity();

CREATE TRIGGER tr_log_thread_activity
  AFTER INSERT ON message_threads
  FOR EACH ROW EXECUTE FUNCTION log_thread_activity();

CREATE TRIGGER tr_log_rfi_activity
  AFTER INSERT OR UPDATE ON rfis
  FOR EACH ROW EXECUTE FUNCTION log_rfi_activity();

CREATE TRIGGER tr_log_tender_activity
  AFTER INSERT OR UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION log_tender_activity();

CREATE TRIGGER tr_log_tender_bid_activity
  AFTER INSERT OR UPDATE ON tender_bids
  FOR EACH ROW EXECUTE FUNCTION log_tender_bid_activity();

CREATE TRIGGER tr_log_project_activity
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_project_activity();

CREATE TRIGGER tr_log_project_user_activity
  AFTER INSERT OR DELETE ON project_users
  FOR EACH ROW EXECUTE FUNCTION log_project_user_activity();