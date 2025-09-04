-- Create tender_invitations table
CREATE TABLE public.tender_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'sent',
  personal_message TEXT,
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE public.tender_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations for their project tenders"
ON public.tender_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenders t
    JOIN public.project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_invitations.tender_id 
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Architects can create tender invitations"
ON public.tender_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenders t
    JOIN public.project_users pu ON t.project_id = pu.project_id
    JOIN public.profiles p ON pu.user_id = p.user_id
    WHERE t.id = tender_invitations.tender_id 
    AND pu.user_id = auth.uid()
    AND p.role = 'architect'
  )
);

-- Create index for performance
CREATE INDEX idx_tender_invitations_token ON public.tender_invitations(token);
CREATE INDEX idx_tender_invitations_tender_id ON public.tender_invitations(tender_id);
CREATE INDEX idx_tender_invitations_email ON public.tender_invitations(invited_email);

-- Add trigger for updated_at
CREATE TRIGGER update_tender_invitations_updated_at
  BEFORE UPDATE ON public.tender_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();