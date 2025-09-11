-- Create project team members table
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',  -- Options: architect, builder, contractor, client, consultant, project_manager
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id, user_id)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON project_team_members(user_id);

-- RLS: Enable and policies
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own projects' teams" ON project_team_members
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE created_by = auth.uid()
        UNION SELECT project_id FROM project_team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Owners insert members" ON project_team_members
    FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Owners delete members" ON project_team_members
    FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Users profile table (enhance if needed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Enable realtime for team updates
ALTER TABLE project_team_members REPLICA IDENTITY FULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);