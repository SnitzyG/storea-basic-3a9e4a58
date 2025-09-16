-- Add invitation_token to projects table for multi-use project invitation links
ALTER TABLE projects ADD COLUMN invitation_token TEXT;

-- Create unique index on invitation_token
CREATE UNIQUE INDEX idx_projects_invitation_token ON projects(invitation_token) WHERE invitation_token IS NOT NULL;

-- Function to generate project invitation token
CREATE OR REPLACE FUNCTION generate_project_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'proj_' || encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;