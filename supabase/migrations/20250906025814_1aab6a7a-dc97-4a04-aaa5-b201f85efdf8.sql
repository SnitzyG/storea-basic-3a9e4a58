-- Add new columns to rfis table for the structured RFI form
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS project_name text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS project_number text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS rfi_number text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS recipient_name text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS recipient_email text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS sender_email text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS drawing_no text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS specification_section text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS contract_clause text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS other_reference text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS proposed_solution text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS required_response_by timestamp with time zone;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS responder_name text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS responder_position text;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS response_date timestamp with time zone;

-- Create function to auto-generate RFI numbers
CREATE OR REPLACE FUNCTION generate_rfi_number(project_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    project_code TEXT;
    rfi_count INTEGER;
    rfi_number TEXT;
BEGIN
    -- Get project name first 3 chars as code
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) 
    INTO project_code
    FROM projects 
    WHERE id = project_id_param;
    
    -- If no project code found, use 'RFI'
    IF project_code IS NULL OR LENGTH(project_code) = 0 THEN
        project_code := 'RFI';
    END IF;
    
    -- Count existing RFIs for this project
    SELECT COUNT(*) + 1 
    INTO rfi_count
    FROM rfis 
    WHERE project_id = project_id_param;
    
    -- Generate RFI number: PROJECT_CODE-RFI-NNNN
    rfi_number := project_code || '-RFI-' || LPAD(rfi_count::TEXT, 4, '0');
    
    RETURN rfi_number;
END;
$$;

-- Create trigger to auto-generate RFI numbers
CREATE OR REPLACE FUNCTION auto_generate_rfi_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Only generate if rfi_number is not provided
    IF NEW.rfi_number IS NULL THEN
        NEW.rfi_number := generate_rfi_number(NEW.project_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for RFI number generation
DROP TRIGGER IF EXISTS trigger_auto_generate_rfi_number ON rfis;
CREATE TRIGGER trigger_auto_generate_rfi_number
    BEFORE INSERT ON rfis
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_rfi_number();