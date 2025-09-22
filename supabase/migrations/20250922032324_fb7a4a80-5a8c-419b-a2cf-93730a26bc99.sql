-- Add RFI type field and update number generation

-- Create RFI type enum
CREATE TYPE rfi_type AS ENUM ('general_correspondence', 'request_for_information', 'general_advice');

-- Add rfi_type column to rfis table
ALTER TABLE rfis ADD COLUMN rfi_type rfi_type NOT NULL DEFAULT 'request_for_information';

-- Update the generate_rfi_number function to include company and type
CREATE OR REPLACE FUNCTION generate_rfi_number(project_id_param uuid, rfi_type_param rfi_type)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    company_code TEXT;
    type_code TEXT;
    rfi_count INTEGER;
    rfi_number TEXT;
BEGIN
    -- Get company code from project creator's company
    SELECT UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3)) 
    INTO company_code
    FROM projects p
    JOIN profiles pr ON pr.user_id = p.created_by
    JOIN companies c ON c.id = pr.company_id
    WHERE p.id = project_id_param;
    
    -- If no company code found, use project name first 3 chars
    IF company_code IS NULL OR LENGTH(company_code) = 0 THEN
        SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) 
        INTO company_code
        FROM projects 
        WHERE id = project_id_param;
        
        -- If still no code, use 'RFI'
        IF company_code IS NULL OR LENGTH(company_code) = 0 THEN
            company_code := 'RFI';
        END IF;
    END IF;
    
    -- Map RFI type to code
    type_code := CASE rfi_type_param
        WHEN 'general_correspondence' THEN 'GC'
        WHEN 'request_for_information' THEN 'RFI'
        WHEN 'general_advice' THEN 'GA'
        ELSE 'RFI'
    END;
    
    -- Count existing RFIs of this type for this project
    SELECT COUNT(*) + 1 
    INTO rfi_count
    FROM rfis 
    WHERE project_id = project_id_param 
    AND rfi_type = rfi_type_param;
    
    -- Generate RFI number: COMPANY-TYPE-NNNN
    rfi_number := company_code || '-' || type_code || '-' || LPAD(rfi_count::TEXT, 4, '0');
    
    RETURN rfi_number;
END;
$$;

-- Update the auto_generate_rfi_number function to pass the type
CREATE OR REPLACE FUNCTION auto_generate_rfi_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Only generate if rfi_number is not provided
    IF NEW.rfi_number IS NULL THEN
        NEW.rfi_number := generate_rfi_number(NEW.project_id, NEW.rfi_type);
    END IF;
    
    RETURN NEW;
END;
$$;