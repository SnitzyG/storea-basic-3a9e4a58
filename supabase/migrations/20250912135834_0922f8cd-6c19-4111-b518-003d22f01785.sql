-- Add document locking and revision tracking columns if they don't exist
DO $$ BEGIN
    -- Add is_locked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_locked') THEN
        ALTER TABLE documents ADD COLUMN is_locked BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add locked_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='locked_by') THEN
        ALTER TABLE documents ADD COLUMN locked_by UUID;
    END IF;
    
    -- Add locked_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='locked_at') THEN
        ALTER TABLE documents ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add superseded_by column for tracking replacements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='superseded_by') THEN
        ALTER TABLE documents ADD COLUMN superseded_by UUID;
    END IF;
    
    -- Add is_superseded boolean flag for easier filtering
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_superseded') THEN
        ALTER TABLE documents ADD COLUMN is_superseded BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Set default lock state for newly uploaded documents
CREATE OR REPLACE FUNCTION public.auto_lock_new_document()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-lock new documents when uploaded
    NEW.is_locked := TRUE;
    NEW.locked_by := NEW.uploaded_by;
    NEW.locked_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-locking new documents
DROP TRIGGER IF EXISTS trigger_auto_lock_document ON public.documents;
CREATE TRIGGER trigger_auto_lock_document
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_lock_new_document();