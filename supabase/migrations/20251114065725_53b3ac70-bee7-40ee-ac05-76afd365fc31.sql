-- Add missing columns to telemetry tables for comprehensive monitoring

-- Error tracking enhancements
ALTER TABLE telemetry_errors 
ADD COLUMN IF NOT EXISTS issue_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS issue_group_id UUID,
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production',
ADD COLUMN IF NOT EXISTS release_version TEXT,
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by UUID,
ADD COLUMN IF NOT EXISTS user_affected UUID,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';

-- Performance tracking enhancements
ALTER TABLE telemetry_performance
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production',
ADD COLUMN IF NOT EXISTS release_version TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS endpoint TEXT,
ADD COLUMN IF NOT EXISTS operation_type TEXT;

-- Events enhancements
ALTER TABLE telemetry_events
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production',
ADD COLUMN IF NOT EXISTS release_version TEXT;

-- Create breadcrumbs table
CREATE TABLE IF NOT EXISTS error_breadcrumbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id UUID REFERENCES telemetry_errors(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT NOT NULL, -- 'navigation', 'click', 'api', 'console', 'custom'
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  level TEXT DEFAULT 'info', -- 'debug', 'info', 'warning', 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'error_threshold', 'performance_threshold', 'user_impact'
  condition JSONB NOT NULL, -- {metric: 'error_count', operator: '>', value: 10, window_minutes: 5}
  channels JSONB DEFAULT '["email"]', -- ['email', 'browser']
  enabled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- Create alert notifications table
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deployed_by UUID,
  environment TEXT DEFAULT 'production',
  error_count INTEGER DEFAULT 0,
  affected_users INTEGER DEFAULT 0,
  crash_free_rate NUMERIC DEFAULT 100.0,
  metadata JSONB DEFAULT '{}'
);

-- Create issue groups table
CREATE TABLE IF NOT EXISTS issue_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  error_type TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  occurrence_count INTEGER DEFAULT 1,
  affected_users INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'ignored'
  severity TEXT DEFAULT 'medium',
  environment TEXT DEFAULT 'production',
  release_version TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Enable RLS on new tables
ALTER TABLE error_breadcrumbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for breadcrumbs
CREATE POLICY "System can create breadcrumbs"
  ON error_breadcrumbs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view breadcrumbs for errors they can see"
  ON error_breadcrumbs FOR SELECT
  USING (true);

-- RLS Policies for alert rules
CREATE POLICY "Users can manage their alert rules"
  ON alert_rules FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Users can view all alert rules"
  ON alert_rules FOR SELECT
  USING (true);

-- RLS Policies for alert notifications
CREATE POLICY "System can create alert notifications"
  ON alert_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view all alert notifications"
  ON alert_notifications FOR SELECT
  USING (true);

CREATE POLICY "Users can acknowledge alerts"
  ON alert_notifications FOR UPDATE
  USING (true);

-- RLS Policies for releases
CREATE POLICY "System can manage releases"
  ON releases FOR ALL
  USING (true);

-- RLS Policies for issue groups
CREATE POLICY "System can manage issue groups"
  ON issue_groups FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_errors_fingerprint ON telemetry_errors(issue_fingerprint);
CREATE INDEX IF NOT EXISTS idx_telemetry_errors_group ON telemetry_errors(issue_group_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_errors_environment ON telemetry_errors(environment);
CREATE INDEX IF NOT EXISTS idx_telemetry_errors_release ON telemetry_errors(release_version);
CREATE INDEX IF NOT EXISTS idx_telemetry_errors_resolved ON telemetry_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_breadcrumbs_error ON error_breadcrumbs(error_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_rule ON alert_notifications(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_issue_groups_fingerprint ON issue_groups(fingerprint);
CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version);