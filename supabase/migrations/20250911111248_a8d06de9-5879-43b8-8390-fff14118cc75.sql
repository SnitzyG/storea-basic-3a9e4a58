-- Create pending team invitations table
CREATE TABLE IF NOT EXISTS project_pending_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, email)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_invitations_project_id ON project_pending_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_token ON project_pending_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_email ON project_pending_invitations(email);

-- Enable RLS
ALTER TABLE project_pending_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending invitations
CREATE POLICY "View project pending invitations" ON project_pending_invitations
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            UNION 
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project creators can manage pending invitations" ON project_pending_invitations
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    );

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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