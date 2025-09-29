-- First, migrate existing contractor users to lead_contractor
UPDATE profiles SET role = 'lead_contractor' WHERE role = 'contractor';
UPDATE project_users SET role = 'lead_contractor' WHERE role = 'contractor';
UPDATE invitations SET role = 'lead_contractor' WHERE role = 'contractor';
UPDATE project_join_requests SET role = 'lead_contractor' WHERE role = 'contractor';

-- Drop ALL policies that reference role enum values
DROP POLICY "Architects can create tenders" ON tenders;
DROP POLICY "Architects can update tenders" ON tenders;
DROP POLICY "Architects can create tender invitations" ON tender_invitations;
DROP POLICY "Project creators and architects can manage budgets" ON project_budgets;
DROP POLICY "Project creators and architects can manage budget categories" ON budget_categories;
DROP POLICY "Project creators and architects can manage invoices" ON project_invoices;
DROP POLICY "Project creators and architects can manage change orders" ON change_orders;
DROP POLICY "Project creators and architects can manage client contributions" ON client_contributions;
DROP POLICY "Project creators and architects can manage cashflow items" ON cashflow_items;