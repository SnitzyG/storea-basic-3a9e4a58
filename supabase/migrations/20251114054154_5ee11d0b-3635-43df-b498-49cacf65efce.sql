-- Create telemetry tables for comprehensive monitoring

-- Table 1: User Activity Tracking
CREATE TABLE IF NOT EXISTS telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'button_click', 'form_submit', 'download', 'upload', 'search', 'navigation', 'interaction')),
  event_category TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_events_user_id ON telemetry_events(user_id);
CREATE INDEX idx_telemetry_events_created_at ON telemetry_events(created_at);
CREATE INDEX idx_telemetry_events_event_type ON telemetry_events(event_type);
CREATE INDEX idx_telemetry_events_session_id ON telemetry_events(session_id);
CREATE INDEX idx_telemetry_events_event_category ON telemetry_events(event_category);

-- Table 2: Performance Metrics
CREATE TABLE IF NOT EXISTS telemetry_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('page_load', 'api_call', 'database_query', 'edge_function', 'render_time', 'network_latency')),
  metric_name TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_performance_metric_type ON telemetry_performance(metric_type);
CREATE INDEX idx_telemetry_performance_created_at ON telemetry_performance(created_at);
CREATE INDEX idx_telemetry_performance_status ON telemetry_performance(status);
CREATE INDEX idx_telemetry_performance_user_id ON telemetry_performance(user_id);

-- Table 3: Error Tracking
CREATE TABLE IF NOT EXISTS telemetry_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL CHECK (error_type IN ('client_error', 'api_error', 'database_error', 'auth_error', 'network_error', 'validation_error')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_errors_severity ON telemetry_errors(severity);
CREATE INDEX idx_telemetry_errors_resolved ON telemetry_errors(resolved);
CREATE INDEX idx_telemetry_errors_created_at ON telemetry_errors(created_at);
CREATE INDEX idx_telemetry_errors_error_type ON telemetry_errors(error_type);
CREATE INDEX idx_telemetry_errors_user_id ON telemetry_errors(user_id);

-- Table 4: Session Tracking
CREATE TABLE IF NOT EXISTS telemetry_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views_count INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,
  os TEXT,
  ip_address INET,
  location_country TEXT,
  location_city TEXT
);

CREATE INDEX idx_telemetry_sessions_user_id ON telemetry_sessions(user_id);
CREATE INDEX idx_telemetry_sessions_started_at ON telemetry_sessions(started_at);
CREATE INDEX idx_telemetry_sessions_session_id ON telemetry_sessions(session_id);

-- Table 5: Business Metrics
CREATE TABLE IF NOT EXISTS telemetry_business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_category TEXT NOT NULL CHECK (metric_category IN ('projects', 'tenders', 'rfis', 'financials', 'collaboration', 'documents', 'messages', 'calendar', 'tasks')),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  time_period TEXT CHECK (time_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_business_metrics_category ON telemetry_business_metrics(metric_category);
CREATE INDEX idx_telemetry_business_metrics_period ON telemetry_business_metrics(period_start, period_end);
CREATE INDEX idx_telemetry_business_metrics_created_at ON telemetry_business_metrics(created_at);

-- Enable Row Level Security
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_business_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telemetry_events
CREATE POLICY "Anyone can create telemetry events"
  ON telemetry_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own telemetry events"
  ON telemetry_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Architects can view all telemetry events"
  ON telemetry_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'architect'
    )
  );

-- RLS Policies for telemetry_performance
CREATE POLICY "Anyone can create performance metrics"
  ON telemetry_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own performance metrics"
  ON telemetry_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Architects can view all performance metrics"
  ON telemetry_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'architect'
    )
  );

-- RLS Policies for telemetry_errors
CREATE POLICY "Anyone can create error logs"
  ON telemetry_errors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own errors"
  ON telemetry_errors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Architects can view all errors"
  ON telemetry_errors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'architect'
    )
  );

CREATE POLICY "Architects can update errors (mark as resolved)"
  ON telemetry_errors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'architect'
    )
  );

-- RLS Policies for telemetry_sessions
CREATE POLICY "Anyone can create sessions"
  ON telemetry_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON telemetry_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Users can view their own sessions"
  ON telemetry_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Architects can view all sessions"
  ON telemetry_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'architect'
    )
  );

-- RLS Policies for telemetry_business_metrics
CREATE POLICY "System can create business metrics"
  ON telemetry_business_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can view business metrics"
  ON telemetry_business_metrics FOR SELECT
  USING (true);

-- Function to automatically update session end time and duration
CREATE OR REPLACE FUNCTION update_session_end_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON telemetry_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_end_time();

-- Function to increment session event counts
CREATE OR REPLACE FUNCTION increment_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'page_view' THEN
    UPDATE telemetry_sessions
    SET page_views_count = page_views_count + 1,
        events_count = events_count + 1
    WHERE session_id = NEW.session_id;
  ELSE
    UPDATE telemetry_sessions
    SET events_count = events_count + 1
    WHERE session_id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_session_counts
  AFTER INSERT ON telemetry_events
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_counts();