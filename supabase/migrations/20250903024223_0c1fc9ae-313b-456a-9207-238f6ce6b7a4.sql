-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- Allow system to create notifications for any user

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create activity log table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid,
  entity_type text NOT NULL, -- 'project', 'rfi', 'tender', 'document', 'message'
  entity_id uuid,
  action text NOT NULL, -- 'created', 'updated', 'deleted', 'assigned', etc.
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on activity log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create policy for activity log
CREATE POLICY "Users can view activities for their projects"
  ON public.activity_log FOR SELECT
  USING (
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = activity_log.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create activity logs"
  ON public.activity_log FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.activity_log REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;