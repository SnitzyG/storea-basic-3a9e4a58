-- Create tender status and bid status enums
CREATE TYPE tender_status AS ENUM ('draft', 'open', 'closed', 'awarded', 'cancelled');
CREATE TYPE bid_status AS ENUM ('submitted', 'under_review', 'accepted', 'rejected');

-- Create tenders table (extends existing)
-- Note: The table already exists, so we'll add any missing columns
DO $$ 
BEGIN
  -- Add status column if it doesn't exist with the enum type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'requirements') THEN
    ALTER TABLE public.tenders ADD COLUMN requirements jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create tender bids table
CREATE TABLE IF NOT EXISTS public.tender_bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id uuid NOT NULL,
  bidder_id uuid NOT NULL,
  bid_amount numeric(12,2) NOT NULL,
  proposal_text text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status bid_status DEFAULT 'submitted'::bid_status NOT NULL,
  submitted_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on tender_bids
ALTER TABLE public.tender_bids ENABLE ROW LEVEL SECURITY;

-- RLS policies for tender_bids
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
      AND t.status = 'open'::tender_status
    )
  );

CREATE POLICY "Users can update their own bids"
  ON public.tender_bids FOR UPDATE
  USING (auth.uid() = bidder_id);

-- Create trigger for tender_bids updated_at
CREATE TRIGGER update_tender_bids_updated_at
  BEFORE UPDATE ON public.tender_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.tender_bids REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_bids;