-- Fix search path security warnings for new functions
CREATE OR REPLACE FUNCTION generate_unique_project_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION auto_generate_project_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.project_id IS NULL THEN
        NEW.project_id := generate_unique_project_id();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_project_join_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;