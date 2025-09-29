-- Update existing records to use the new role names
UPDATE profiles SET role = 'client' WHERE role = 'homeowner';
UPDATE profiles SET role = 'lead_consultant' WHERE role = 'architect';
UPDATE profiles SET role = 'lead_contractor' WHERE role = 'builder';

UPDATE project_users SET role = 'client' WHERE role = 'homeowner';
UPDATE project_users SET role = 'lead_consultant' WHERE role = 'architect';
UPDATE project_users SET role = 'lead_contractor' WHERE role = 'builder';

-- Update any invitations that might have the old role names
UPDATE invitations SET role = 'client' WHERE role = 'homeowner';
UPDATE invitations SET role = 'lead_consultant' WHERE role = 'architect';
UPDATE invitations SET role = 'lead_contractor' WHERE role = 'builder';

-- Update any project_join_requests that might have the old role names
UPDATE project_join_requests SET role = 'client' WHERE role = 'homeowner';
UPDATE project_join_requests SET role = 'lead_consultant' WHERE role = 'architect';
UPDATE project_join_requests SET role = 'lead_contractor' WHERE role = 'builder';