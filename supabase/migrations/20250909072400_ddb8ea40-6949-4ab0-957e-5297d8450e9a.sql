-- Create calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  is_meeting BOOLEAN DEFAULT false,
  attendees JSONB DEFAULT '[]'::jsonb,
  external_attendees TEXT[],
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar events
CREATE POLICY "Users can view calendar events for their projects"
  ON public.calendar_events
  FOR SELECT
  USING (
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = calendar_events.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create calendar events"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    (project_id IS NULL OR 
     EXISTS (
       SELECT 1 FROM project_users 
       WHERE project_users.project_id = calendar_events.project_id 
       AND project_users.user_id = auth.uid()
     ))
  );

CREATE POLICY "Users can update their own calendar events"
  ON public.calendar_events
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own calendar events"
  ON public.calendar_events
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();