-- CRITICAL FIX: Enable RLS on system_metrics table
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Add admin-only policies for system_metrics
CREATE POLICY "Admins can view system metrics"
ON system_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "System can insert metrics"
ON system_metrics
FOR INSERT
WITH CHECK (auth.jwt() IS NOT NULL);

-- Fix mutable search_path on 4 database functions
CREATE OR REPLACE FUNCTION public.increment_session_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_session_end_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_tender_bid_line_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_tender_package_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;