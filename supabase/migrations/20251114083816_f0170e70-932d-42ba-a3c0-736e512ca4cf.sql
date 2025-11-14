-- Phase 2: Database Performance Optimizations

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Activity log indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_desc 
  ON activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id 
  ON activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type 
  ON activity_log(entity_type);

CREATE INDEX IF NOT EXISTS idx_activity_log_project_id 
  ON activity_log(project_id) 
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_action 
  ON activity_log(action);

-- User session indexes for admin monitoring
CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
  ON user_sessions(user_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_sessions_started 
  ON user_sessions(started_at DESC);

-- Profiles indexes for user management
CREATE INDEX IF NOT EXISTS idx_profiles_approved 
  ON profiles(approved);

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen 
  ON profiles(last_seen DESC) 
  WHERE last_seen IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_company 
  ON profiles(company_id) 
  WHERE company_id IS NOT NULL;

-- Admin alerts indexes
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity 
  ON admin_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved 
  ON admin_alerts(resolved_at) 
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_alerts_created 
  ON admin_alerts(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc 
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id 
  ON audit_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON audit_logs(action);

-- ============================================
-- ADMIN HELPER RPC FUNCTIONS
-- ============================================

-- Get count of active users (online in last 5 minutes)
CREATE OR REPLACE FUNCTION get_active_users_count()
RETURNS int
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int 
  FROM profiles 
  WHERE last_seen > NOW() - INTERVAL '5 minutes'
  AND online_status = true
$$;

-- Get system health summary
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'active_users', (SELECT get_active_users_count()),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_projects', (SELECT COUNT(*) FROM projects),
    'active_projects', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
    'pending_approvals', (SELECT COUNT(*) FROM profiles WHERE approved = false),
    'critical_alerts', (
      SELECT COUNT(*) 
      FROM admin_alerts 
      WHERE severity = 'critical' 
      AND resolved_at IS NULL
    ),
    'total_rfis', (SELECT COUNT(*) FROM rfis),
    'open_rfis', (
      SELECT COUNT(*) 
      FROM rfis 
      WHERE status NOT IN ('closed')
    ),
    'total_tenders', (SELECT COUNT(*) FROM tenders),
    'open_tenders', (
      SELECT COUNT(*) 
      FROM tenders 
      WHERE status IN ('draft', 'open')
    ),
    'total_documents', (SELECT COUNT(*) FROM documents),
    'messages_24h', (
      SELECT COUNT(*) 
      FROM messages 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    )
  )
$$;

-- Get database performance metrics
CREATE OR REPLACE FUNCTION get_db_performance_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_activity_logs', (SELECT COUNT(*) FROM activity_log),
    'activity_logs_24h', (
      SELECT COUNT(*) 
      FROM activity_log 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'total_user_sessions', (SELECT COUNT(*) FROM user_sessions),
    'active_sessions', (
      SELECT COUNT(*) 
      FROM user_sessions 
      WHERE is_active = true
    ),
    'avg_session_duration_minutes', (
      SELECT COALESCE(AVG(duration_seconds) / 60, 0)::numeric(10,2)
      FROM user_sessions
      WHERE duration_seconds IS NOT NULL
      AND ended_at IS NOT NULL
    )
  )
$$;

-- Get user activity summary for admin dashboard
CREATE OR REPLACE FUNCTION get_user_activity_summary(days_back int DEFAULT 7)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'new_users', (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE created_at > NOW() - (days_back || ' days')::interval
    ),
    'active_users', (
      SELECT COUNT(DISTINCT user_id)
      FROM activity_log
      WHERE created_at > NOW() - (days_back || ' days')::interval
    ),
    'pending_approvals', (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE approved = false
    ),
    'users_by_role', (
      SELECT jsonb_object_agg(role, count)
      FROM (
        SELECT role, COUNT(*)::int as count
        FROM profiles
        GROUP BY role
      ) role_counts
    )
  )
$$;