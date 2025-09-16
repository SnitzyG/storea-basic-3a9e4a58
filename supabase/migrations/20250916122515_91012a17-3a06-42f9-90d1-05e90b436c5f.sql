-- Create function to clean up orphaned activity logs when projects are deleted
CREATE OR REPLACE FUNCTION cleanup_orphaned_activity_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all activity logs for the deleted project
  DELETE FROM activity_log WHERE project_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up activity logs when projects are deleted
CREATE TRIGGER cleanup_activity_on_project_delete
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_activity_logs();

-- Create function to clean up orphaned notifications when projects are deleted
CREATE OR REPLACE FUNCTION cleanup_orphaned_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete notifications related to the deleted project
  DELETE FROM notifications 
  WHERE data->>'project_id' = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically clean up notifications when projects are deleted
CREATE TRIGGER cleanup_notifications_on_project_delete
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_notifications();

-- Clean up existing orphaned activity logs (activities for non-existent projects)
DELETE FROM activity_log 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM projects);

-- Clean up existing orphaned notifications (notifications for non-existent projects)
DELETE FROM notifications 
WHERE data->>'project_id' IS NOT NULL 
AND data->>'project_id' NOT IN (SELECT id::text FROM projects);