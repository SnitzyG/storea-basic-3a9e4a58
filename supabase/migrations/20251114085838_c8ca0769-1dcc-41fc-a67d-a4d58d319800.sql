-- Drop existing get_system_health function and recreate with correct signature
DROP FUNCTION IF EXISTS public.get_system_health();

CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS TABLE (
  active_users INTEGER,
  total_users INTEGER,
  total_projects INTEGER,
  active_projects INTEGER,
  pending_approvals INTEGER,
  critical_alerts INTEGER,
  total_rfis INTEGER,
  open_rfis INTEGER,
  total_tenders INTEGER,
  open_tenders INTEGER,
  total_documents INTEGER,
  messages_24h INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE last_seen > NOW() - INTERVAL '5 minutes' AND online_status = true) as active_users,
    (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
    (SELECT COUNT(*)::INTEGER FROM projects) as total_projects,
    (SELECT COUNT(*)::INTEGER FROM projects WHERE status = 'active') as active_projects,
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE approved = false) as pending_approvals,
    (SELECT COUNT(*)::INTEGER FROM admin_alerts WHERE resolved_at IS NULL AND severity IN ('critical', 'error')) as critical_alerts,
    (SELECT COUNT(*)::INTEGER FROM rfis) as total_rfis,
    (SELECT COUNT(*)::INTEGER FROM rfis WHERE status NOT IN ('closed', 'resolved')) as open_rfis,
    (SELECT COUNT(*)::INTEGER FROM tenders) as total_tenders,
    (SELECT COUNT(*)::INTEGER FROM tenders WHERE status IN ('open', 'active')) as open_tenders,
    (SELECT COUNT(*)::INTEGER FROM document_groups) as total_documents,
    (SELECT COUNT(*)::INTEGER FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as messages_24h;
END;
$$;