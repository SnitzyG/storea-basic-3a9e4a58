-- Fix the project invitation token generation function
-- PostgreSQL doesn't support 'base64url' encoding, only 'base64', 'hex', and 'escape'
CREATE OR REPLACE FUNCTION generate_project_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'proj_' || encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;