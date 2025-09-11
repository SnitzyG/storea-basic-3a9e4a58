-- Fix search path security issues for functions
DROP FUNCTION IF EXISTS cleanup_expired_invitations();
DROP FUNCTION IF EXISTS accept_team_invitation(TEXT, UUID);

-- Recreate functions with proper search path
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM project_pending_invitations 
    WHERE expires_at < NOW();
END;
$$;

-- Function to accept invitation and add to team
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token_param TEXT, user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record project_pending_invitations%ROWTYPE;
    result JSONB;
BEGIN
    -- Find and validate invitation
    SELECT * INTO invitation_record
    FROM project_pending_invitations
    WHERE invitation_token = invitation_token_param
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Check if user is already a team member
    IF EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_id = invitation_record.project_id 
        AND user_id = user_id_param
    ) THEN
        -- Remove the invitation since user is already a member
        DELETE FROM project_pending_invitations WHERE id = invitation_record.id;
        RETURN json_build_object('success', false, 'error', 'You are already a member of this project');
    END IF;
    
    -- Add user to project team
    INSERT INTO project_users (project_id, user_id, role, invited_by, joined_at)
    VALUES (
        invitation_record.project_id,
        user_id_param,
        invitation_record.role::user_role,
        invitation_record.invited_by,
        NOW()
    );
    
    -- Remove the invitation
    DELETE FROM project_pending_invitations WHERE id = invitation_record.id;
    
    -- Get project info for response
    SELECT json_build_object(
        'success', true,
        'project_id', invitation_record.project_id,
        'role', invitation_record.role
    ) INTO result;
    
    RETURN result;
END;
$$;