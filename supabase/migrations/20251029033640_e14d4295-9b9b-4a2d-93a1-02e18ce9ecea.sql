-- Add tender_id column to tenders table
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tender_id TEXT UNIQUE;

-- Function to generate unique tender ID (15 character alphanumeric)
CREATE OR REPLACE FUNCTION generate_unique_tender_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        
        SELECT EXISTS(SELECT 1 FROM tenders WHERE tender_id = new_id) INTO exists_check;
        
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- Trigger to auto-generate tender_id on insert
CREATE OR REPLACE FUNCTION auto_generate_tender_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.tender_id IS NULL THEN
        NEW.tender_id := generate_unique_tender_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS set_tender_id ON tenders;
CREATE TRIGGER set_tender_id
    BEFORE INSERT ON tenders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_tender_id();

-- Backfill existing tenders with tender_id
UPDATE tenders SET tender_id = generate_unique_tender_id() WHERE tender_id IS NULL;