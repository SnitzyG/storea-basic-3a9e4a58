-- Add project_id field for joining projects via ID and join request system
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_id VARCHAR(15) UNIQUE;

-- Create a trigger function to generate unique 15-character alphanumeric project_id
CREATE OR REPLACE FUNCTION generate_unique_project_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_id := '';
        FOR i IN 1..15 LOOP
            new_id := new_id || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM projects WHERE project_id = new_id) INTO exists_check;
        
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- Create trigger to auto-generate project_id for new projects
CREATE OR REPLACE FUNCTION auto_generate_project_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.project_id IS NULL THEN
        NEW.project_id := generate_unique_project_id();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_project_id ON projects;
CREATE TRIGGER trigger_auto_generate_project_id
    BEFORE INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_project_id();

-- Update existing projects to have project_id
UPDATE projects 
SET project_id = generate_unique_project_id() 
WHERE project_id IS NULL;

-- Create project join requests table
CREATE TABLE IF NOT EXISTS project_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL,
    project_code VARCHAR(15) NOT NULL,
    requester_name TEXT,
    requester_email TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID,
    UNIQUE(project_id, requester_id)
);

-- Enable RLS on project_join_requests
ALTER TABLE project_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_join_requests
CREATE POLICY "Users can create join requests" ON project_join_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their own join requests" ON project_join_requests
    FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Project creators can view join requests for their projects" ON project_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_join_requests.project_id 
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Project creators can update join requests for their projects" ON project_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_join_requests.project_id 
            AND projects.created_by = auth.uid()
        )
    );

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_project_join_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_project_join_requests_updated_at ON project_join_requests;
CREATE TRIGGER trigger_update_project_join_requests_updated_at
    BEFORE UPDATE ON project_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_project_join_requests_updated_at();