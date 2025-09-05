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

-- Create RLS policy for document_events (check if not exists first)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_events' 
        AND policyname = 'Users can view events for documents in their projects'
    ) THEN
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
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_events' 
        AND policyname = 'System can create document events'
    ) THEN
        CREATE POLICY "System can create document events"
        ON document_events FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

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

-- Create RLS policy for document_transmittals (check if not exists first)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_transmittals' 
        AND policyname = 'Users can view transmittals for documents in their projects'
    ) THEN
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
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_transmittals' 
        AND policyname = 'Users can create transmittals for documents in their projects'
    ) THEN
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
    END IF;
END $$;

-- Update the existing documents to have titles (copy from name field)
UPDATE documents SET title = name WHERE title IS NULL;