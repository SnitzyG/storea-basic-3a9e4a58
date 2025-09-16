-- Fix search path security warnings for cleanup functions
CREATE OR REPLACE FUNCTION cleanup_orphaned_activity_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all activity logs for the deleted project
  DELETE FROM activity_log WHERE project_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search path security warnings for cleanup functions
CREATE OR REPLACE FUNCTION cleanup_orphaned_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete notifications related to the deleted project
  DELETE FROM notifications 
  WHERE data->>'project_id' = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;