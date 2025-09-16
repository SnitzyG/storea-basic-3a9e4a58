-- Add invitation_token column if not already present
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;

-- Create function to generate URL-safe project invitation tokens
CREATE OR REPLACE FUNCTION generate_project_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'proj_' || replace(
    replace(encode(gen_random_bytes(32), 'base64'), '+', '-'),
    '/', '_'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;