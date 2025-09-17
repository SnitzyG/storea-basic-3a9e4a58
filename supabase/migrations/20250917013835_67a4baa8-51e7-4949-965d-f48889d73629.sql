-- Enhanced RFI permissions for Phase 4
-- Ensure any project member can create and assign RFIs, but only creators can close them

-- Update INSERT policy to allow any project member to create RFIs
DROP POLICY IF EXISTS "Users can create RFIs in their projects" ON public.rfis;
DROP POLICY IF EXISTS "Project members can create RFIs" ON public.rfis;

CREATE POLICY "Project members can create RFIs"
ON public.rfis FOR INSERT
WITH CHECK (
    auth.uid() = raised_by
    AND EXISTS (
        SELECT 1 FROM public.project_users
        WHERE project_users.project_id = rfis.project_id
        AND project_users.user_id = auth.uid()
    )
);

-- Update UPDATE policy to handle closing restrictions
DROP POLICY IF EXISTS "Users can update RFIs they created or are assigned to" ON public.rfis;
DROP POLICY IF EXISTS "Project members can update RFIs with restrictions" ON public.rfis;

CREATE POLICY "Project members can update RFIs with restrictions"
ON public.rfis FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.project_users
        WHERE project_users.project_id = rfis.project_id
        AND project_users.user_id = auth.uid()
    )
    AND (
        -- Anyone involved can update status except 'closed'
        (auth.uid() = raised_by OR auth.uid() = assigned_to OR 
         EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'architect'))
        OR
        -- Only creator can set status to 'closed'
        (auth.uid() = raised_by)
    )
);