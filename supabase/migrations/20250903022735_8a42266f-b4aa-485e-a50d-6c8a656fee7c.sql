-- Create RFI status and priority enums
CREATE TYPE rfi_status AS ENUM ('submitted', 'in_review', 'responded', 'closed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Create RFIs table
CREATE TABLE public.rfis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  raised_by uuid NOT NULL,
  assigned_to uuid,
  question text NOT NULL,
  response text,
  status rfi_status DEFAULT 'submitted'::rfi_status NOT NULL,
  priority priority_level DEFAULT 'medium'::priority_level NOT NULL,
  due_date timestamp with time zone,
  category text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create RFI activity log table
CREATE TABLE public.rfi_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for RFIs
CREATE POLICY "Users can view RFIs for their projects"
  ON public.rfis FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = rfis.project_id 
    AND project_users.user_id = auth.uid()
  ));

CREATE POLICY "Users can create RFIs in their projects"
  ON public.rfis FOR INSERT
  WITH CHECK (
    auth.uid() = raised_by AND
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = rfis.project_id 
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update RFIs they created or are assigned to"
  ON public.rfis FOR UPDATE
  USING (auth.uid() = raised_by OR auth.uid() = assigned_to);

-- RLS policies for RFI activities
CREATE POLICY "Users can view RFI activities for their projects"
  ON public.rfi_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rfis r
    JOIN project_users pu ON r.project_id = pu.project_id
    WHERE r.id = rfi_activities.rfi_id 
    AND pu.user_id = auth.uid()
  ));

CREATE POLICY "Users can create RFI activities"
  ON public.rfi_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_rfis_updated_at
  BEFORE UPDATE ON public.rfis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.rfis REPLICA IDENTITY FULL;
ALTER TABLE public.rfi_activities REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfi_activities;