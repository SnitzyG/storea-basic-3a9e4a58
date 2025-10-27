-- Create progress_claims table
CREATE TABLE public.progress_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  claim_number TEXT NOT NULL,
  claim_date DATE NOT NULL,
  month_period TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  total_works_completed_to_date NUMERIC NOT NULL DEFAULT 0,
  total_variations_included NUMERIC NOT NULL DEFAULT 0,
  total_amount_excl_gst NUMERIC NOT NULL DEFAULT 0,
  gst_applicable NUMERIC NOT NULL DEFAULT 0,
  total_amount_incl_gst NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progress_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress_claims
CREATE POLICY "Users can view claims for their projects"
ON public.progress_claims FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = progress_claims.project_id
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects/builders can manage claims"
ON public.progress_claims FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = progress_claims.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = progress_claims.project_id
    AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = progress_claims.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = progress_claims.project_id
    AND projects.created_by = auth.uid()
  )
);

-- Create line_item_budgets table
CREATE TABLE public.line_item_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  contract_budget NUMERIC NOT NULL DEFAULT 0,
  revised_budget NUMERIC,
  percentage_complete NUMERIC NOT NULL DEFAULT 0 CHECK (percentage_complete >= 0 AND percentage_complete <= 100),
  total_claimed_to_date NUMERIC NOT NULL DEFAULT 0,
  balance_to_claim NUMERIC NOT NULL DEFAULT 0,
  forecast_to_complete NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, item_number)
);

-- Enable RLS
ALTER TABLE public.line_item_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for line_item_budgets
CREATE POLICY "Users can view line items for their projects"
ON public.line_item_budgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = line_item_budgets.project_id
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects/builders can manage line items"
ON public.line_item_budgets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = line_item_budgets.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = line_item_budgets.project_id
    AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = line_item_budgets.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = line_item_budgets.project_id
    AND projects.created_by = auth.uid()
  )
);

-- Create payment_stages table
CREATE TABLE public.payment_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  percentage_of_contract NUMERIC NOT NULL,
  completion_criteria TEXT,
  milestone_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'released')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage_number)
);

-- Enable RLS
ALTER TABLE public.payment_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_stages
CREATE POLICY "Users can view payment stages for their projects"
ON public.payment_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = payment_stages.project_id
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects/builders can manage payment stages"
ON public.payment_stages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = payment_stages.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = payment_stages.project_id
    AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = payment_stages.project_id
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'builder')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = payment_stages.project_id
    AND projects.created_by = auth.uid()
  )
);

-- Update change_orders table with new fields
ALTER TABLE public.change_orders
ADD COLUMN variation_reference TEXT,
ADD COLUMN percentage_complete NUMERIC DEFAULT 0 CHECK (percentage_complete >= 0 AND percentage_complete <= 100),
ADD COLUMN amount_claimed NUMERIC DEFAULT 0,
ADD COLUMN balance_remaining NUMERIC DEFAULT 0,
ADD COLUMN claimed_in_claim_id UUID REFERENCES public.progress_claims(id) ON DELETE SET NULL;

-- Update project_budgets table with new fields
ALTER TABLE public.project_budgets
ADD COLUMN project_management_margin_percent NUMERIC DEFAULT 10,
ADD COLUMN provisional_sums_total NUMERIC DEFAULT 0,
ADD COLUMN prime_cost_sums_total NUMERIC DEFAULT 0;

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_progress_claims_updated_at
BEFORE UPDATE ON public.progress_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_line_item_budgets_updated_at
BEFORE UPDATE ON public.line_item_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_stages_updated_at
BEFORE UPDATE ON public.payment_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();