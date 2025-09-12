-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.auto_lock_new_document()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Auto-lock new documents when uploaded
    NEW.is_locked := TRUE;
    NEW.locked_by := NEW.uploaded_by;
    NEW.locked_at := NOW();
    
    RETURN NEW;
END;
$$;