-- Drop all remaining policies that reference role enum values
DROP POLICY "Users can delete their own documents" ON documents;
DROP POLICY "Project admins can manage tender packages" ON tender_packages;

-- Now update the enum and columns
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('client', 'lead_consultant', 'lead_contractor');

-- Update all columns that use user_role to use the new enum
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
ALTER TABLE project_users ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Drop the old enum
DROP TYPE user_role_old;

-- Recreate the essential policies with updated role references
CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
USING ((auth.uid() = uploaded_by) OR (EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = documents.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))));

CREATE POLICY "Project members can update RFIs with restrictions"
ON rfis FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = rfis.project_id 
    AND project_users.user_id = auth.uid()
  ) 
  AND (
    rfis.raised_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = rfis.project_id 
      AND project_users.user_id = auth.uid() 
      AND project_users.role = 'lead_consultant'::user_role
    )
  )
);

CREATE POLICY "Lead consultants can manage tender packages"
ON tender_packages FOR ALL
USING (EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = tender_packages.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = 'lead_consultant'::user_role))));

CREATE POLICY "Lead consultants can create tenders" 
ON tenders FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = tenders.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = 'lead_consultant'::user_role))));

CREATE POLICY "Lead consultants can update tenders"
ON tenders FOR UPDATE
USING (EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = tenders.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = 'lead_consultant'::user_role))));

CREATE POLICY "Lead consultants can create tender invitations"
ON tender_invitations FOR INSERT
WITH CHECK (EXISTS ( SELECT 1
   FROM (tenders t
     JOIN project_users pu ON ((t.project_id = pu.project_id)))
  WHERE ((t.id = tender_invitations.tender_id) AND (pu.user_id = auth.uid()) AND (pu.role = 'lead_consultant'::user_role))));

CREATE POLICY "Project creators and lead consultants can manage budgets" 
ON project_budgets FOR ALL 
USING ((EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = project_budgets.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_budgets.project_id) AND (projects.created_by = auth.uid())))));

CREATE POLICY "Project creators and lead consultants can manage budget categories"
ON budget_categories FOR ALL
USING ((EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = budget_categories.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = budget_categories.project_id) AND (projects.created_by = auth.uid())))));

CREATE POLICY "Project creators and lead consultants can manage invoices"
ON project_invoices FOR UPDATE
USING ((EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = project_invoices.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_invoices.project_id) AND (projects.created_by = auth.uid())))));

CREATE POLICY "Project creators and lead consultants can manage change orders"
ON change_orders FOR UPDATE
USING ((EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = change_orders.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = change_orders.project_id) AND (projects.created_by = auth.uid())))));

CREATE POLICY "Project creators and lead consultants can manage client contributions"
ON client_contributions FOR ALL
USING ((EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = client_contributions.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = client_contributions.project_id) AND (projects.created_by = auth.uid())))));

CREATE POLICY "Project creators and lead consultants can manage cashflow items"
ON cashflow_items FOR ALL
USING ((EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = cashflow_items.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = ANY (ARRAY['lead_consultant'::user_role, 'lead_contractor'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = cashflow_items.project_id) AND (projects.created_by = auth.uid())))));

CREATE POLICY "Lead consultants can manage document types"
ON document_types FOR ALL
USING (EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = document_types.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = 'lead_consultant'::user_role))));

CREATE POLICY "Lead consultants can manage status options"
ON document_status_options FOR ALL
USING (EXISTS ( SELECT 1
   FROM project_users
  WHERE ((project_users.project_id = document_status_options.project_id) AND (project_users.user_id = auth.uid()) AND (project_users.role = 'lead_consultant'::user_role))));