-- Fix the search path security issue for the function
CREATE OR REPLACE FUNCTION generate_project_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'proj_' || encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;