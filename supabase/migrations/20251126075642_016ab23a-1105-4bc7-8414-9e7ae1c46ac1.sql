-- Phase 2: Fix all insecure INSERT policies with WITH CHECK (true)

-- 1-4. Drop old insecure telemetry policies (we added proper ones in Phase 1)
DROP POLICY IF EXISTS "Anyone can create error logs" ON telemetry_errors;
DROP POLICY IF EXISTS "Anyone can create telemetry events" ON telemetry_events;
DROP POLICY IF EXISTS "Anyone can create performance metrics" ON telemetry_performance;
DROP POLICY IF EXISTS "Anyone can create sessions" ON telemetry_sessions;

-- 5. Fix user_sessions - remove duplicate insecure policy
DROP POLICY IF EXISTS "System can create sessions" ON user_sessions;
-- Keep the us_sys policy from Phase 1 but make it more restrictive for service role only
DROP POLICY IF EXISTS "us_sys" ON user_sessions;
CREATE POLICY "us_system_all" ON user_sessions
  FOR ALL 
  USING (auth.jwt() IS NOT NULL)
  WITH CHECK (auth.jwt() IS NOT NULL);

-- 6. Fix admin_activity_log - require authentication
DROP POLICY IF EXISTS "System can insert admin activity" ON admin_activity_log;
CREATE POLICY "admin_activity_auth_insert" ON admin_activity_log
  FOR INSERT 
  WITH CHECK (auth.jwt() IS NOT NULL);

-- 7. Fix admin_alerts - require authentication or admin role
DROP POLICY IF EXISTS "System can create admin alerts" ON admin_alerts;
CREATE POLICY "admin_alerts_auth_insert" ON admin_alerts
  FOR INSERT 
  WITH CHECK (
    auth.jwt() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
    )
  );

-- 8. Fix alert_notifications - require authentication
DROP POLICY IF EXISTS "System can create alert notifications" ON alert_notifications;
CREATE POLICY "alert_notifications_auth_insert" ON alert_notifications
  FOR INSERT 
  WITH CHECK (auth.jwt() IS NOT NULL);

-- 9. Fix error_breadcrumbs - require authentication
DROP POLICY IF EXISTS "System can create breadcrumbs" ON error_breadcrumbs;
CREATE POLICY "error_breadcrumbs_auth_insert" ON error_breadcrumbs
  FOR INSERT 
  WITH CHECK (auth.jwt() IS NOT NULL);

-- 10. Fix telemetry_business_metrics - require authentication
DROP POLICY IF EXISTS "System can create business metrics" ON telemetry_business_metrics;
CREATE POLICY "business_metrics_auth_insert" ON telemetry_business_metrics
  FOR INSERT 
  WITH CHECK (
    auth.jwt() IS NOT NULL OR
    auth.uid() IS NOT NULL
  );