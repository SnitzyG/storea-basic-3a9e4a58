-- Add new columns to documents table for comprehensive document management
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;

-- Create index for document numbers
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents(document_number);

-- Create function to generate document numbers based on project
CREATE OR REPLACE FUNCTION generate_document_number(project_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_code TEXT;
    doc_count INTEGER;
    doc_number TEXT;
BEGIN
    -- Get project name first 3 chars as code
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) 
    INTO project_code
    FROM projects 
    WHERE id = project_id_param;
    
    -- If no project code found, use 'DOC'
    IF project_code IS NULL OR LENGTH(project_code) = 0 THEN
        project_code := 'DOC';
    END IF;
    
    -- Count existing documents for this project
    SELECT COUNT(*) + 1 
    INTO doc_count
    FROM documents 
    WHERE project_id = project_id_param;
    
    -- Generate document number: PROJECT_CODE-YYYYMMDD-NNNN
    doc_number := project_code || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(doc_count::TEXT, 4, '0');
    
    RETURN doc_number;
END;
$$;

-- Create trigger to auto-generate document numbers
CREATE OR REPLACE FUNCTION auto_generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate if document_number is not provided
    IF NEW.document_number IS NULL THEN
        NEW.document_number := generate_document_number(NEW.project_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_generate_document_number ON documents;
CREATE TRIGGER trigger_auto_generate_document_number
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_document_number();

-- Create document types table for dropdowns
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on document_types
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_types
CREATE POLICY "Users can view document types for their projects"
ON document_types FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_users.project_id = document_types.project_id 
        AND project_users.user_id = auth.uid()
    )
);

CREATE POLICY "Project admins can manage document types"
ON document_types FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_users.project_id = document_types.project_id 
        AND project_users.user_id = auth.uid() 
        AND project_users.role = 'architect'
    )
);

-- Insert default document types for existing projects
INSERT INTO document_types (name, project_id, created_by)
SELECT 
    type_name,
    p.id as project_id,
    p.created_by
FROM projects p
CROSS JOIN (
    VALUES 
    ('Architectural Drawings'),
    ('Structural Plans'),
    ('Electrical Plans'),
    ('Plumbing Plans'),
    ('Specifications'),
    ('Contracts'),
    ('Permits'),
    ('Reports'),
    ('Correspondence'),
    ('Photographs')
) AS types(type_name)
WHERE NOT EXISTS (
    SELECT 1 FROM document_types dt 
    WHERE dt.project_id = p.id 
    AND dt.name = type_name
);

-- Create document status options table
CREATE TABLE IF NOT EXISTS document_status_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on document_status_options
ALTER TABLE document_status_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_status_options
CREATE POLICY "Users can view status options for their projects"
ON document_status_options FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_users.project_id = document_status_options.project_id 
        AND project_users.user_id = auth.uid()
    )
);

CREATE POLICY "Project admins can manage status options"
ON document_status_options FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_users.project_id = document_status_options.project_id 
        AND project_users.user_id = auth.uid() 
        AND project_users.role = 'architect'
    )
);

-- Insert default status options for existing projects
INSERT INTO document_status_options (name, project_id, created_by)
SELECT 
    status_name,
    p.id as project_id,
    p.created_by
FROM projects p
CROSS JOIN (
    VALUES 
    ('Draft'),
    ('For Review'),
    ('Under Review'),
    ('Approved'),
    ('Superseded'),
    ('Void'),
    ('Final')
) AS statuses(status_name)
WHERE NOT EXISTS (
    SELECT 1 FROM document_status_options dso 
    WHERE dso.project_id = p.id 
    AND dso.name = status_name
);

-- Create document events table for event history
CREATE TABLE IF NOT EXISTS document_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_description TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on document_events
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for document_events
CREATE POLICY "Users can view events for documents in their projects"
ON document_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM documents d
        JOIN project_users pu ON d.project_id = pu.project_id
        WHERE d.id = document_events.document_id 
        AND pu.user_id = auth.uid()
    )
);

CREATE POLICY "System can create document events"
ON document_events FOR INSERT
WITH CHECK (true);

-- Create transmittals table for transmittal history
CREATE TABLE IF NOT EXISTS document_transmittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    transmittal_number TEXT NOT NULL,
    sent_to TEXT NOT NULL,
    sent_by UUID REFERENCES auth.users(id),
    purpose TEXT,
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on document_transmittals
ALTER TABLE document_transmittals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for document_transmittals
CREATE POLICY "Users can view transmittals for documents in their projects"
ON document_transmittals FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM documents d
        JOIN project_users pu ON d.project_id = pu.project_id
        WHERE d.id = document_transmittals.document_id 
        AND pu.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create transmittals for documents in their projects"
ON document_transmittals FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM documents d
        JOIN project_users pu ON d.project_id = pu.project_id
        WHERE d.id = document_transmittals.document_id 
        AND pu.user_id = auth.uid()
    )
);

-- Update the existing documents to have titles (copy from name field)
UPDATE documents SET title = name WHERE title IS NULL;