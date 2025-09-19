-- Create financial management tables for the Financials tab

-- Budget table for project budgets
CREATE TABLE public.project_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  original_budget DECIMAL(15,2) NOT NULL,
  revised_budget DECIMAL(15,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget categories for cost breakdown
CREATE TABLE public.budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  category_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'trade', 'custom'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.project_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  invoice_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'overdue'
  category_id UUID,
  description TEXT,
  attachment_path TEXT,
  created_by UUID NOT NULL,
  approved_by UUID,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.project_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  invoice_id UUID,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer', -- 'bank_transfer', 'check', 'cash', 'credit_card'
  recipient_name TEXT NOT NULL,
  reference_number TEXT,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Change orders/variations table
CREATE TABLE public.change_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  financial_impact DECIMAL(15,2) NOT NULL DEFAULT 0, -- positive for additions, negative for reductions
  timeline_impact_days INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'implemented'
  requested_by UUID NOT NULL,
  approved_by UUID,
  reason TEXT,
  approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client contributions/payments table
CREATE TABLE public.client_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  contribution_type TEXT NOT NULL DEFAULT 'deposit', -- 'deposit', 'progress_payment', 'final_payment'
  amount DECIMAL(15,2) NOT NULL,
  expected_date DATE,
  received_date DATE,
  payment_method TEXT,
  reference_number TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'received', 'overdue'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cashflow forecast table
CREATE TABLE public.cashflow_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'incoming', 'outgoing'
  amount DECIMAL(15,2) NOT NULL,
  forecast_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'forecasted', -- 'forecasted', 'confirmed', 'completed'
  linked_invoice_id UUID,
  linked_payment_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_budgets
CREATE POLICY "Users can view budgets for their projects"
ON public.project_budgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_budgets.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects can manage budgets"
ON public.project_budgets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_budgets.project_id 
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'contractor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_budgets.project_id
    AND projects.created_by = auth.uid()
  )
);

-- RLS Policies for budget_categories
CREATE POLICY "Users can view budget categories for their projects"
ON public.budget_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = budget_categories.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects can manage budget categories"
ON public.budget_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = budget_categories.project_id 
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'contractor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = budget_categories.project_id
    AND projects.created_by = auth.uid()
  )
);

-- RLS Policies for project_invoices
CREATE POLICY "Users can view invoices for their projects"
ON public.project_invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_invoices.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project members can create invoices"
ON public.project_invoices FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_invoices.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects can manage invoices"
ON public.project_invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_invoices.project_id 
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'contractor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_invoices.project_id
    AND projects.created_by = auth.uid()
  )
);

-- RLS Policies for project_payments
CREATE POLICY "Users can view payments for their projects"
ON public.project_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_payments.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project members can create payments"
ON public.project_payments FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = project_payments.project_id 
    AND project_users.user_id = auth.uid()
  )
);

-- RLS Policies for change_orders
CREATE POLICY "Users can view change orders for their projects"
ON public.change_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = change_orders.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project members can create change orders"
ON public.change_orders FOR INSERT
WITH CHECK (
  auth.uid() = requested_by
  AND
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = change_orders.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects can manage change orders"
ON public.change_orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = change_orders.project_id 
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'contractor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = change_orders.project_id
    AND projects.created_by = auth.uid()
  )
);

-- RLS Policies for client_contributions
CREATE POLICY "Users can view client contributions for their projects"
ON public.client_contributions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = client_contributions.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects can manage client contributions"
ON public.client_contributions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = client_contributions.project_id 
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'contractor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = client_contributions.project_id
    AND projects.created_by = auth.uid()
  )
);

-- RLS Policies for cashflow_items
CREATE POLICY "Users can view cashflow items for their projects"
ON public.cashflow_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = cashflow_items.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and architects can manage cashflow items"
ON public.cashflow_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = cashflow_items.project_id 
    AND project_users.user_id = auth.uid()
    AND project_users.role IN ('architect', 'contractor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = cashflow_items.project_id
    AND projects.created_by = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_project_budgets_project_id ON public.project_budgets(project_id);
CREATE INDEX idx_budget_categories_project_id ON public.budget_categories(project_id);
CREATE INDEX idx_project_invoices_project_id ON public.project_invoices(project_id);
CREATE INDEX idx_project_invoices_status ON public.project_invoices(status);
CREATE INDEX idx_project_payments_project_id ON public.project_payments(project_id);
CREATE INDEX idx_change_orders_project_id ON public.change_orders(project_id);
CREATE INDEX idx_client_contributions_project_id ON public.client_contributions(project_id);
CREATE INDEX idx_cashflow_items_project_id ON public.cashflow_items(project_id);

-- Create updated_at triggers
CREATE TRIGGER update_project_budgets_updated_at
BEFORE UPDATE ON public.project_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at
BEFORE UPDATE ON public.budget_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_invoices_updated_at
BEFORE UPDATE ON public.project_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_change_orders_updated_at
BEFORE UPDATE ON public.change_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_contributions_updated_at
BEFORE UPDATE ON public.client_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cashflow_items_updated_at
BEFORE UPDATE ON public.cashflow_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();