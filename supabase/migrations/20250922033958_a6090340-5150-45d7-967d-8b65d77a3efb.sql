-- Create trigger to auto-generate RFI numbers when new RFIs are created
CREATE TRIGGER auto_generate_rfi_number_trigger
  BEFORE INSERT ON public.rfis
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_rfi_number();