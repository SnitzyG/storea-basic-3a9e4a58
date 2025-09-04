-- Create foreign key constraint between project_users and profiles
-- This fixes the database relationship issue

ALTER TABLE project_users 
ADD CONSTRAINT fk_project_users_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on the user_id lookup
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON project_users(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable real-time updates for project_users table
ALTER TABLE project_users REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;