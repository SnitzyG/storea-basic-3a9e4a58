-- Create RFI email delivery tracking table
CREATE TABLE public.rfi_email_delivery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RFI collaborators table
CREATE TABLE public.rfi_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('reviewer', 'approver', 'observer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'declined')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RFI collaboration comments table
CREATE TABLE public.rfi_collaboration_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'concern', 'approval')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RFI templates table
CREATE TABLE public.rfi_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RFI workflow transitions table  
CREATE TABLE public.rfi_workflow_transitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id UUID NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfi_email_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_collaboration_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_workflow_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rfi_email_delivery
CREATE POLICY "Users can view email delivery for their project RFIs" ON public.rfi_email_delivery
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM rfis r JOIN project_users pu ON r.project_id = pu.project_id
    WHERE r.id = rfi_email_delivery.rfi_id AND pu.user_id = auth.uid()
  ));

CREATE POLICY "System can manage email delivery" ON public.rfi_email_delivery
  FOR ALL USING (true);

-- RLS Policies for rfi_collaborators
CREATE POLICY "Users can view collaborators for their project RFIs" ON public.rfi_collaborators
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM rfis r JOIN project_users pu ON r.project_id = pu.project_id
    WHERE r.id = rfi_collaborators.rfi_id AND pu.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own collaboration status" ON public.rfi_collaborators
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rfi_collaboration_comments
CREATE POLICY "Users can view comments for their project RFIs" ON public.rfi_collaboration_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM rfis r JOIN project_users pu ON r.project_id = pu.project_id
    WHERE r.id = rfi_collaboration_comments.rfi_id AND pu.user_id = auth.uid()
  ));

CREATE POLICY "Users can create comments for their project RFIs" ON public.rfi_collaboration_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM rfis r JOIN project_users pu ON r.project_id = pu.project_id
    WHERE r.id = rfi_collaboration_comments.rfi_id AND pu.user_id = auth.uid()
  ));

-- RLS Policies for rfi_templates
CREATE POLICY "Users can view shared templates or their own" ON public.rfi_templates
  FOR SELECT USING (is_shared = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their own templates" ON public.rfi_templates
  FOR ALL USING (created_by = auth.uid());

-- RLS Policies for rfi_workflow_transitions
CREATE POLICY "Users can view workflow transitions for their project RFIs" ON public.rfi_workflow_transitions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM rfis r JOIN project_users pu ON r.project_id = pu.project_id
    WHERE r.id = rfi_workflow_transitions.rfi_id AND pu.user_id = auth.uid()
  ));

CREATE POLICY "Users can create workflow transitions" ON public.rfi_workflow_transitions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add update trigger for rfi_collaborators
CREATE TRIGGER update_rfi_collaborators_updated_at
  BEFORE UPDATE ON public.rfi_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for rfi_templates
CREATE TRIGGER update_rfi_templates_updated_at
  BEFORE UPDATE ON public.rfi_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();