-- Populate existing projects with invitation tokens if they don't have one
UPDATE public.projects 
SET invitation_token = public.generate_project_invitation_token()
WHERE invitation_token IS NULL;