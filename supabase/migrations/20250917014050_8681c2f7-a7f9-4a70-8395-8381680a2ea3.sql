-- Fix security warning for function search path
CREATE OR REPLACE FUNCTION public.validate_rfi_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is being changed to 'closed', only allow if user is the creator
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        IF auth.uid() != NEW.raised_by THEN
            RAISE EXCEPTION 'Only the RFI creator can close this RFI';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;