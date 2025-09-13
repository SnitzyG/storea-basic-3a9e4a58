-- Create function to handle email verification redirect for invitations
CREATE OR REPLACE FUNCTION public.handle_invitation_auth_redirect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_token TEXT;
BEGIN
    -- Extract invitation token from user metadata
    invitation_token := NEW.raw_user_meta_data->>'invitation_token';
    
    -- If this user signed up via invitation, automatically accept it
    IF invitation_token IS NOT NULL THEN
        PERFORM public.accept_team_invitation(invitation_token, NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically handle invitation acceptance after email verification
DROP TRIGGER IF EXISTS on_auth_user_confirmed_invitation ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_invitation
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.handle_invitation_auth_redirect();

-- Create a more robust invitation acceptance function
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token_param text, user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    invitation_record project_pending_invitations%ROWTYPE;
    result JSONB;
    project_name TEXT;
    inviter_name TEXT;
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
    
    -- Get project and inviter information for notifications
    SELECT p.name, prof.name
    INTO project_name, inviter_name
    FROM projects p
    LEFT JOIN profiles prof ON prof.user_id = invitation_record.invited_by
    WHERE p.id = invitation_record.project_id;
    
    -- Add user to project team
    INSERT INTO project_users (project_id, user_id, role, invited_by, joined_at)
    VALUES (
        invitation_record.project_id,
        user_id_param,
        invitation_record.role::user_role,
        invitation_record.invited_by,
        NOW()
    );
    
    -- Create activity log entry
    INSERT INTO activity_log (user_id, project_id, action, entity_type, entity_id, description, metadata)
    VALUES (
        user_id_param,
        invitation_record.project_id,
        'joined_team',
        'project',
        invitation_record.project_id,
        'Accepted team invitation and joined project',
        json_build_object(
            'role', invitation_record.role,
            'invited_by', invitation_record.invited_by,
            'invitation_token', invitation_token_param
        )
    );
    
    -- Create notification for project creator
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
        invitation_record.invited_by,
        'team_member_joined',
        'New Team Member Joined',
        COALESCE((SELECT name FROM profiles WHERE user_id = user_id_param), invitation_record.email) || ' has joined the project team.',
        json_build_object(
            'project_id', invitation_record.project_id,
            'project_name', project_name,
            'new_member_id', user_id_param,
            'role', invitation_record.role
        )
    );
    
    -- Remove the invitation
    DELETE FROM project_pending_invitations WHERE id = invitation_record.id;
    
    -- Return success with project info
    SELECT json_build_object(
        'success', true,
        'project_id', invitation_record.project_id,
        'project_name', project_name,
        'role', invitation_record.role,
        'inviter_name', inviter_name
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Add index for better performance on invitation token lookups
CREATE INDEX IF NOT EXISTS idx_project_pending_invitations_token 
ON project_pending_invitations(invitation_token);

-- Add index for better performance on expiration cleanup
CREATE INDEX IF NOT EXISTS idx_project_pending_invitations_expires 
ON project_pending_invitations(expires_at);

-- Enable realtime for project_users table for live team updates
ALTER TABLE project_users REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE project_users;

-- Enable realtime for project_pending_invitations for live invitation status
ALTER TABLE project_pending_invitations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE project_pending_invitations;