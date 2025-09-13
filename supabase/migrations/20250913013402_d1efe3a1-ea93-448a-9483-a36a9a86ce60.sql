-- CRITICAL: Fix broken invitation system - Complete rebuild

-- Drop problematic table
DROP TABLE IF EXISTS project_pending_invitations CASCADE;

-- Create proper invitations table
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'contractor',
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Users can manage invitations for their projects" ON invitations
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    );

-- Indexes for performance
CREATE INDEX idx_invitations_project_id ON invitations(project_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Enable realtime
ALTER TABLE invitations REPLICA IDENTITY FULL;
ALTER TABLE project_users REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE project_users;