-- Create a special RFI type for message inquiries and update the trigger
-- First, let's add a new enum value for message_inquiry if it doesn't exist
-- Note: We can't easily add enum values in migrations, so we'll modify the trigger logic instead

-- Update the trigger function to detect message inquiries and use MES code
CREATE OR REPLACE FUNCTION set_rfi_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    company_name TEXT;
    type_code TEXT;
    next_number INTEGER;
    rfi_number TEXT;
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

        -- Extract company code (first 3 characters, uppercase)
        company_name := UPPER(LEFT(company_name, 3));
        
        -- Determine type code - use MES for message inquiries
        IF NEW.category = 'Message Inquiry' THEN
            type_code := 'MES';
        ELSE
            type_code := CASE NEW.rfi_type
                WHEN 'general_correspondence' THEN 'GC'
                WHEN 'request_for_information' THEN 'RFI'
                WHEN 'general_advice' THEN 'GA'
                ELSE 'RFI'
            END;
        END IF;
        
        -- Get the next number for this type and project
        SELECT COALESCE(MAX(CAST(SPLIT_PART(rfi_number, '-', 3) AS INTEGER)), 0) + 1
        INTO next_number
        FROM rfis 
        WHERE project_id = NEW.project_id 
        AND rfi_number IS NOT NULL 
        AND rfi_number ~ ('^[A-Z]{3}-' || type_code || '-[0-9]+$');
        
        -- Default to 1 if no existing RFIs
        IF next_number IS NULL THEN
            next_number := 1;
        END IF;
        
        -- Generate the RFI number
        NEW.rfi_number := company_name || '-' || type_code || '-' || LPAD(next_number::TEXT, 4, '0');
    END IF;
    
    RETURN NEW;
END;
$$;