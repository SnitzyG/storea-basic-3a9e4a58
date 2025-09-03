-- Create tender bids table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tender_bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id uuid NOT NULL,
  bidder_id uuid NOT NULL,
  bid_amount numeric(12,2) NOT NULL,
  proposal_text text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  submitted_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on tender_bids if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tender_bids' AND policyname = 'Users can view bids for their project tenders'
  ) THEN
    ALTER TABLE public.tender_bids ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view bids for their project tenders"
      ON public.tender_bids FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM tenders t
        JOIN project_users pu ON t.project_id = pu.project_id
        WHERE t.id = tender_bids.tender_id 
        AND pu.user_id = auth.uid()
      ));

    CREATE POLICY "Users can submit bids to project tenders"
      ON public.tender_bids FOR INSERT
      WITH CHECK (
        auth.uid() = bidder_id AND
        EXISTS (
          SELECT 1 FROM tenders t
          JOIN project_users pu ON t.project_id = pu.project_id
          WHERE t.id = tender_bids.tender_id 
          AND pu.user_id = auth.uid()
          AND t.status = 'open'
        )
      );

    CREATE POLICY "Users can update their own bids"
      ON public.tender_bids FOR UPDATE
      USING (auth.uid() = bidder_id);
  END IF;
END $$;

-- Create trigger for tender_bids updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tender_bids_updated_at'
  ) THEN
    CREATE TRIGGER update_tender_bids_updated_at
      BEFORE UPDATE ON public.tender_bids
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Enable realtime
ALTER TABLE public.tender_bids REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'tender_bids'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_bids;
  END IF;
END $$;