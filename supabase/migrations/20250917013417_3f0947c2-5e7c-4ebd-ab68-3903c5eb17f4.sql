-- Ensure RFI visibility is properly scoped to projects
-- Verify and update RLS policies for rfis table

-- Check current RLS policies
DO $$
BEGIN
    -- Ensure RLS is enabled on rfis table
    ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;
    
    -- Drop and recreate the main SELECT policy to ensure it's correct
    DROP POLICY IF EXISTS "Users can view RFIs for their projects" ON public.rfis;
    
    CREATE POLICY "Users can view RFIs for their projects"
    ON public.rfis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_users
            WHERE project_users.project_id = rfis.project_id
            AND project_users.user_id = auth.uid()
        )
    );
    
    -- Ensure INSERT policy is also project-scoped
    DROP POLICY IF EXISTS "Users can create RFIs in their projects" ON public.rfis;
    
    CREATE POLICY "Users can create RFIs in their projects"
    ON public.rfis FOR INSERT
    WITH CHECK (
        auth.uid() = raised_by
        AND EXISTS (
            SELECT 1 FROM public.project_users
            WHERE project_users.project_id = rfis.project_id
            AND project_users.user_id = auth.uid()
        )
    );
    
    -- Ensure UPDATE policy is also project-scoped
    DROP POLICY IF EXISTS "Users can update RFIs they created or are assigned to" ON public.rfis;
    
    CREATE POLICY "Users can update RFIs they created or are assigned to"
    ON public.rfis FOR UPDATE
    USING (
        (auth.uid() = raised_by OR auth.uid() = assigned_to)
        AND EXISTS (
            SELECT 1 FROM public.project_users
            WHERE project_users.project_id = rfis.project_id
            AND project_users.user_id = auth.uid()
        )
    );

END $$;