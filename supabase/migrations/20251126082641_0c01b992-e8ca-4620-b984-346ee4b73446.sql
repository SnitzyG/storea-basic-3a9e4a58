-- Phase 6 Final Fix: Address 3 Critical Security Issues

-- 1. Fix Profiles Table - Remove overly permissive public access policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- 2. Fix User Sessions - Remove dangerous policies and create proper ones
DROP POLICY IF EXISTS "System can update sessions" ON user_sessions;
DROP POLICY IF EXISTS "us_system_all" ON user_sessions;

-- Create proper INSERT policy for session creation
CREATE POLICY "Users can create their own sessions"
ON user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create proper UPDATE policy
CREATE POLICY "Users can update their own sessions"
ON user_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow system/service role to manage sessions via functions
CREATE POLICY "Service can manage sessions"
ON user_sessions
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Fix Admin Activity Log - Require admin role for INSERT
DROP POLICY IF EXISTS "admin_activity_auth_insert" ON admin_activity_log;

-- Create proper admin-only INSERT policy
CREATE POLICY "Only admins can create admin activity logs"
ON admin_activity_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);