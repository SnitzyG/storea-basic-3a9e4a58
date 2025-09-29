-- Recreate all RLS policies with the original 4-role system (architect, homeowner, builder, contractor)

-- activity_log policies
CREATE POLICY "System can create activity logs" ON public.activity_log
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view activities for their projects" ON public.activity_log
FOR SELECT TO authenticated USING (
  (project_id IS NULL) OR EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = activity_log.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update activity metadata for dismissal" ON public.activity_log
FOR UPDATE TO authenticated USING (
  (project_id IS NULL) OR EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = activity_log.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- budget_categories policies
CREATE POLICY "Project creators and architects/builders can manage budget categories" ON public.budget_categories
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = budget_categories.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = budget_categories.project_id
      AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = budget_categories.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = budget_categories.project_id
      AND projects.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view budget categories for their projects" ON public.budget_categories
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = budget_categories.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- calendar_events policies
CREATE POLICY "Users can create calendar events" ON public.calendar_events
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND (
    project_id IS NULL OR EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = calendar_events.project_id
        AND project_users.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view calendar events for their projects" ON public.calendar_events
FOR SELECT TO authenticated USING (
  project_id IS NULL OR EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = calendar_events.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own calendar events" ON public.calendar_events
FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events
FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- cashflow_items policies
CREATE POLICY "Project creators and architects/builders can manage cashflow items" ON public.cashflow_items
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = cashflow_items.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = cashflow_items.project_id
      AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = cashflow_items.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = cashflow_items.project_id
      AND projects.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view cashflow items for their projects" ON public.cashflow_items
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = cashflow_items.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- change_orders policies
CREATE POLICY "Project creators and architects/builders can manage change orders" ON public.change_orders
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = change_orders.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = change_orders.project_id
      AND projects.created_by = auth.uid()
  )
);

CREATE POLICY "Project members can create change orders" ON public.change_orders
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = requested_by AND EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = change_orders.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view change orders for their projects" ON public.change_orders
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = change_orders.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- client_contributions policies
CREATE POLICY "Project creators and architects/builders can manage client contributions" ON public.client_contributions
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = client_contributions.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = client_contributions.project_id
      AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = client_contributions.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role = ANY (ARRAY['architect'::public.user_role, 'builder'::public.user_role])
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = client_contributions.project_id
      AND projects.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view client contributions for their projects" ON public.client_contributions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = client_contributions.project_id
      AND project_users.user_id = auth.uid()
  )
);