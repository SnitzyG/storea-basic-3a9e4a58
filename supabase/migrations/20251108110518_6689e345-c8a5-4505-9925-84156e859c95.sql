-- Allow users to view tenders when they have an approved access request
-- Enable RLS (safe if already enabled)
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Policy: Users with approved tender access can view tender details
CREATE POLICY "Users with approved tender access can view"
ON public.tenders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tender_access ta
    WHERE ta.tender_id = tenders.id
      AND ta.user_id = auth.uid()
      AND ta.status = 'approved'
  )
);
