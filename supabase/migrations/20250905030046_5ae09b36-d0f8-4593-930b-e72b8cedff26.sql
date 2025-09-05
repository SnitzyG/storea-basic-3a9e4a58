-- Fix security issues - properly recreate function and trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_document_number ON documents;
DROP FUNCTION IF EXISTS auto_generate_document_number();
DROP FUNCTION IF EXISTS generate_document_number(UUID);

CREATE OR REPLACE FUNCTION generate_document_number(project_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION auto_generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Only generate if document_number is not provided
    IF NEW.document_number IS NULL THEN
        NEW.document_number := generate_document_number(NEW.project_id);
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_document_number
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_document_number();