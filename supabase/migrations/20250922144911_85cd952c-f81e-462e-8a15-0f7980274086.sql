-- Create a function to generate RFI numbers automatically
CREATE OR REPLACE FUNCTION generate_rfi_number(project_id_param UUID, company_name_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    company_code TEXT;
    next_number INTEGER;
    rfi_number TEXT;
BEGIN
    -- Extract company code (first 3 characters, uppercase)
    company_code := UPPER(LEFT(company_name_param, 3));
    
    -- Get the next number for this project
    SELECT COALESCE(MAX(CAST(SPLIT_PART(rfi_number, '-', 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM rfis 
    WHERE project_id = project_id_param 
    AND rfi_number IS NOT NULL 
    AND rfi_number ~ '^[A-Z]{3}-MES-[0-9]+$';
    
    -- Default to 1 if no existing RFIs
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    -- Format the RFI number
    rfi_number := company_code || '-MES-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN rfi_number;
END;
$$;

-- Create a trigger to automatically set RFI number on insert
CREATE OR REPLACE FUNCTION set_rfi_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    company_name TEXT;
BEGIN
    -- Only set if rfi_number is not already provided
    IF NEW.rfi_number IS NULL THEN
        -- Get company name from the project creator's profile
        SELECT c.name INTO company_name
        FROM projects p
        JOIN profiles prof ON prof.user_id = p.created_by
        JOIN companies c ON c.id = prof.company_id
        WHERE p.id = NEW.project_id;
        
        -- Default to 'COMPANY' if no company found
        IF company_name IS NULL THEN
            company_name := 'COMPANY';
        END IF;
        
        -- Generate the RFI number
        NEW.rfi_number := generate_rfi_number(NEW.project_id, company_name);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_rfi_number ON rfis;
CREATE TRIGGER trigger_set_rfi_number
    BEFORE INSERT ON rfis
    FOR EACH ROW
    EXECUTE FUNCTION set_rfi_number();