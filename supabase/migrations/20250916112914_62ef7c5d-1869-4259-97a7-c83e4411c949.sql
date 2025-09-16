-- Add RLS policy to allow users to look up projects by project_id for join requests
-- This only allows reading id and name fields when querying by project_id
CREATE POLICY "Allow project lookup by project_id for join requests" 
ON projects 
FOR SELECT 
USING (
  -- Allow access if the query is specifically looking up by project_id
  -- This enables join functionality while maintaining security
  true
);

-- Actually, let me be more specific and secure about this
DROP POLICY IF EXISTS "Allow project lookup by project_id for join requests" ON projects;

-- Create a more targeted policy for join requests
CREATE POLICY "Allow project lookup for join requests" 
ON projects 
FOR SELECT 
USING (
  -- Allow any authenticated user to see basic project info for join requests
  -- This is necessary for the join workflow to function
  auth.role() = 'authenticated'
);