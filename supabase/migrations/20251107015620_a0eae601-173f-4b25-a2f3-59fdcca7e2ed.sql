-- Create tender_access table for managing builder access to tenders
CREATE TABLE IF NOT EXISTS public.tender_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  UNIQUE(tender_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tender_access ENABLE ROW LEVEL SECURITY;

-- Users can create tender access requests for themselves
CREATE POLICY "Users can create tender access requests"
  ON public.tender_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
  ON public.tender_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Tender issuers can view all requests for their tenders
CREATE POLICY "Tender issuers can view requests for their tenders"
  ON public.tender_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenders
      WHERE tenders.id = tender_access.tender_id
      AND tenders.issued_by = auth.uid()
    )
  );

-- Tender issuers can update requests for their tenders (approve/reject)
CREATE POLICY "Tender issuers can update requests"
  ON public.tender_access
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenders
      WHERE tenders.id = tender_access.tender_id
      AND tenders.issued_by = auth.uid()
    )
  );

-- Add storage policy for tender-packages bucket to allow approved users to download
CREATE POLICY "Users with approved access can download tender packages"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tender-packages'
    AND (
      -- Tender issuer can always access
      EXISTS (
        SELECT 1 FROM public.tenders
        WHERE tenders.id::text = (storage.foldername(name))[1]
        AND tenders.issued_by = auth.uid()
      )
      OR
      -- Users with approved access can download
      EXISTS (
        SELECT 1 FROM public.tender_access
        JOIN public.tenders ON tenders.id = tender_access.tender_id
        WHERE tenders.id::text = (storage.foldername(name))[1]
        AND tender_access.user_id = auth.uid()
        AND tender_access.status = 'approved'
      )
    )
  );