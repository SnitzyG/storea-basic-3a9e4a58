-- Only create RFI activity log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rfi_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on rfi_activities if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rfi_activities' AND policyname = 'Users can view RFI activities for their projects'
  ) THEN
    ALTER TABLE public.rfi_activities ENABLE ROW LEVEL SECURITY;
    
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
  END IF;
END $$;

-- Enable realtime on rfi_activities
ALTER TABLE public.rfi_activities REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$ 
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'rfi_activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rfi_activities;
  END IF;
END $$;