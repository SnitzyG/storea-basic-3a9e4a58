-- Add user-specific project reference numbers to project_users table
ALTER TABLE project_users 
ADD COLUMN user_project_reference text;

-- Add comment for clarity
COMMENT ON COLUMN project_users.user_project_reference IS 'User-specific project reference number that each user can set for their own use';