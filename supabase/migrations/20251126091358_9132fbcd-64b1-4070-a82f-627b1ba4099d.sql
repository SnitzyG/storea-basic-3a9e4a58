-- Fix telemetry_sessions dangerous UPDATE policy
DROP POLICY IF EXISTS "Anyone can update sessions" ON telemetry_sessions;
CREATE POLICY "Users can update their own sessions" 
  ON telemetry_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Remove architect access to all telemetry data (admins keep access via existing policies)
DROP POLICY IF EXISTS "Architects can view all sessions" ON telemetry_sessions;
DROP POLICY IF EXISTS "Architects can view all telemetry events" ON telemetry_events;
DROP POLICY IF EXISTS "Architects can view all errors" ON telemetry_errors;
DROP POLICY IF EXISTS "Architects can view all performance metrics" ON telemetry_performance;

-- Remove architect UPDATE access on errors
DROP POLICY IF EXISTS "Architects can update errors (mark as resolved)" ON telemetry_errors;