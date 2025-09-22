-- Remove RFI status change validation that restricts closing to creator only
DROP FUNCTION IF EXISTS public.validate_rfi_status_change() CASCADE;