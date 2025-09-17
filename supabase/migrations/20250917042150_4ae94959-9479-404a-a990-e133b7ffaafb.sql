-- Remove the architect-only restriction for project creation
-- Allow all authenticated users to create projects
DROP POLICY IF EXISTS "architects_can_create_projects" ON public.projects;

-- Create a new policy that allows all authenticated users to create projects
CREATE POLICY "authenticated_users_can_create_projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also ensure the project creator gets the appropriate role when added to project_users
-- Update the useProjects hook will handle adding the creator with their actual role