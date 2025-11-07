-- Create tender_bid_line_items table
CREATE TABLE IF NOT EXISTS public.tender_bid_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.tender_bids(id) ON DELETE CASCADE,
  tender_line_item_id UUID REFERENCES public.tender_line_items(id) ON DELETE SET NULL,
  line_number INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  specification TEXT,
  unit_of_measure TEXT,
  quantity NUMERIC,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add excel file columns to tender_bids
ALTER TABLE public.tender_bids 
ADD COLUMN IF NOT EXISTS excel_file_path TEXT,
ADD COLUMN IF NOT EXISTS excel_file_name TEXT,
ADD COLUMN IF NOT EXISTS data_entry_method TEXT DEFAULT 'web_form';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tender_bid_line_items_bid_id ON public.tender_bid_line_items(bid_id);
CREATE INDEX IF NOT EXISTS idx_tender_bid_line_items_tender_line_item_id ON public.tender_bid_line_items(tender_line_item_id);

-- Enable RLS
ALTER TABLE public.tender_bid_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tender_bid_line_items

-- Bidders can view their own bid line items
CREATE POLICY "Bidders can view their own bid line items"
  ON public.tender_bid_line_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      WHERE tb.id = tender_bid_line_items.bid_id
      AND tb.bidder_id = auth.uid()
    )
  );

-- Project team can view bid line items for their tenders
CREATE POLICY "Project team can view bid line items for their tenders"
  ON public.tender_bid_line_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      JOIN public.tenders t ON t.id = tb.tender_id
      JOIN public.project_users pu ON pu.project_id = t.project_id
      WHERE tb.id = tender_bid_line_items.bid_id
      AND pu.user_id = auth.uid()
    )
  );

-- Bidders can insert their own bid line items
CREATE POLICY "Bidders can insert their own bid line items"
  ON public.tender_bid_line_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      WHERE tb.id = tender_bid_line_items.bid_id
      AND tb.bidder_id = auth.uid()
    )
  );

-- Bidders can update their own bid line items before tender deadline
CREATE POLICY "Bidders can update their own bid line items"
  ON public.tender_bid_line_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      JOIN public.tenders t ON t.id = tb.tender_id
      WHERE tb.id = tender_bid_line_items.bid_id
      AND tb.bidder_id = auth.uid()
      AND (t.deadline IS NULL OR t.deadline > NOW())
    )
  );

-- Bidders can delete their own bid line items before tender deadline
CREATE POLICY "Bidders can delete their own bid line items"
  ON public.tender_bid_line_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tender_bids tb
      JOIN public.tenders t ON t.id = tb.tender_id
      WHERE tb.id = tender_bid_line_items.bid_id
      AND tb.bidder_id = auth.uid()
      AND (t.deadline IS NULL OR t.deadline > NOW())
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tender_bid_line_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tender_bid_line_items_updated_at
  BEFORE UPDATE ON public.tender_bid_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_tender_bid_line_items_updated_at();