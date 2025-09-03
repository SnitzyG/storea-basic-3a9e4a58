-- Add unique constraint to prevent duplicate project_users entries
ALTER TABLE project_users ADD CONSTRAINT project_users_unique_user_project 
UNIQUE (project_id, user_id);