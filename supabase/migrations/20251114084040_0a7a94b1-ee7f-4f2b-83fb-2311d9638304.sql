-- Phase 3: Admin Activity Tracking Table

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin activity
CREATE POLICY "Admins can view all admin activity" 
  ON admin_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert admin activity
CREATE POLICY "System can insert admin activity"
  ON admin_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_admin_activity_log_admin_id 
  ON admin_activity_log(admin_id);

CREATE INDEX idx_admin_activity_log_created 
  ON admin_activity_log(created_at DESC);

CREATE INDEX idx_admin_activity_log_action 
  ON admin_activity_log(action);

CREATE INDEX idx_admin_activity_log_resource 
  ON admin_activity_log(resource_type, resource_id) 
  WHERE resource_type IS NOT NULL;

-- Enable realtime
ALTER TABLE admin_activity_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_activity_log;