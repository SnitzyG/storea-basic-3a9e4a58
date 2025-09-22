-- Update RFI number generation to use the RFI creator's company instead of project creator's company
CREATE OR REPLACE FUNCTION public.generate_rfi_number(project_id_param uuid, rfi_type_param rfi_type, raised_by_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    company_code TEXT;
    type_code TEXT;
    rfi_count INTEGER;
    rfi_number TEXT;
BEGIN
    -- Get company code from RFI creator's company
    SELECT UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3)) 
    INTO company_code
    FROM profiles pr
    JOIN companies c ON c.id = pr.company_id
    WHERE pr.user_id = raised_by_param;
    
    -- If no company code found, try project creator's company
    IF company_code IS NULL OR LENGTH(company_code) = 0 THEN
        SELECT UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3)) 
        INTO company_code
        FROM projects p
        JOIN profiles pr ON pr.user_id = p.created_by
        JOIN companies c ON c.id = pr.company_id
        WHERE p.id = project_id_param;
    END IF;
    
    -- If still no company code found, use project name first 3 chars
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
$function$;

-- Update the auto-generation trigger to pass the raised_by parameter
CREATE OR REPLACE FUNCTION public.auto_generate_rfi_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only generate if rfi_number is not provided
    IF NEW.rfi_number IS NULL THEN
        NEW.rfi_number := generate_rfi_number(NEW.project_id, NEW.rfi_type, NEW.raised_by);
    END IF;
    
    RETURN NEW;
END;
$function$;