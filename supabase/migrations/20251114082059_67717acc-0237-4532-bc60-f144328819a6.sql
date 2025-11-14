-- Phase 2: Fix Database Relationships & Enable Real-time (Final)

-- 1. Add foreign key constraint from activity_log to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_user_id_fkey'
  ) THEN
    ALTER TABLE activity_log 
    ADD CONSTRAINT activity_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Update admin_alerts RLS to allow system to create alerts
DROP POLICY IF EXISTS "System can create admin alerts" ON admin_alerts;
CREATE POLICY "System can create admin alerts"
ON admin_alerts FOR INSERT
WITH CHECK (true);

-- 3. Enable REPLICA IDENTITY FULL for real-time
ALTER TABLE activity_log REPLICA IDENTITY FULL;
ALTER TABLE user_sessions REPLICA IDENTITY FULL;
ALTER TABLE admin_alerts REPLICA IDENTITY FULL;

-- 4. Add tables to supabase_realtime publication (safe to run multiple times)
DO $$
BEGIN
  -- Add activity_log
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
  END IF;

  -- Add user_sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
  END IF;

  -- Add admin_alerts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'admin_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_alerts;
  END IF;
END $$;

-- 5. Create function to generate admin alerts
CREATE OR REPLACE FUNCTION generate_admin_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overdue_rfis INTEGER;
  pending_users INTEGER;
  inactive_projects INTEGER;
  failed_logins INTEGER;
BEGIN
  -- Check for overdue RFIs
  SELECT COUNT(*) INTO overdue_rfis
  FROM rfis
  WHERE status != 'closed'
  AND required_date < now()
  AND required_date > now() - INTERVAL '7 days';

  IF overdue_rfis > 0 THEN
    INSERT INTO admin_alerts (severity, alert_type, title, message, metadata)
    VALUES (
      'error',
      'rfi_overdue',
      'Overdue RFIs',
      format('%s RFIs are overdue', overdue_rfis),
      jsonb_build_object('count', overdue_rfis)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for pending user approvals
  SELECT COUNT(*) INTO pending_users
  FROM profiles
  WHERE approved = false;

  IF pending_users > 0 THEN
    INSERT INTO admin_alerts (severity, alert_type, title, message, metadata)
    VALUES (
      'warn',
      'pending_approvals',
      'Pending User Approvals',
      format('%s users waiting for approval', pending_users),
      jsonb_build_object('count', pending_users)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for inactive projects
  SELECT COUNT(*) INTO inactive_projects
  FROM projects
  WHERE updated_at < now() - INTERVAL '30 days';

  IF inactive_projects > 0 THEN
    INSERT INTO admin_alerts (severity, alert_type, title, message, metadata)
    VALUES (
      'info',
      'inactive_projects',
      'Inactive Projects',
      format('%s projects have not been updated in 30 days', inactive_projects),
      jsonb_build_object('count', inactive_projects)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for failed login attempts in last hour
  SELECT COUNT(*) INTO failed_logins
  FROM activity_log
  WHERE action = 'login_failed'
  AND created_at > now() - INTERVAL '1 hour';

  IF failed_logins > 5 THEN
    INSERT INTO admin_alerts (severity, alert_type, title, message, metadata)
    VALUES (
      'error',
      'security_alert',
      'High Failed Login Attempts',
      format('%s failed login attempts in the last hour', failed_logins),
      jsonb_build_object('count', failed_logins)
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;