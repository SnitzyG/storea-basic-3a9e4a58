-- Add attachments column to rfis table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rfis' 
        AND column_name = 'attachments' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.rfis ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;