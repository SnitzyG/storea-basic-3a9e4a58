-- Enhanced RFI permissions for Phase 4
-- Ensure any project member can create and assign RFIs, but only creators can close them

-- Update the existing policies to be more permissive for project members
DO $$
BEGIN
    -- Update INSERT policy to allow any project member to create RFIs
    DROP POLICY IF EXISTS "Users can create RFIs in their projects" ON public.rfis;
    
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

    -- Create a function to validate RFI status changes
    CREATE OR REPLACE FUNCTION public.validate_rfi_status_change()
    RETURNS TRIGGER AS $$
    BEGIN
        -- If status is being changed to 'closed', only allow if user is the creator
        IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
            IF auth.uid() != NEW.raised_by THEN
                RAISE EXCEPTION 'Only the RFI creator can close this RFI';
            END IF;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger to enforce closing restrictions
    DROP TRIGGER IF EXISTS validate_rfi_status_change_trigger ON public.rfis;
    
    CREATE TRIGGER validate_rfi_status_change_trigger
        BEFORE UPDATE ON public.rfis
        FOR EACH ROW
        EXECUTE FUNCTION public.validate_rfi_status_change();

END $$;