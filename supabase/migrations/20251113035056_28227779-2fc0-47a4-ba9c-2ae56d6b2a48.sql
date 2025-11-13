-- Add RLS policies for profiles table so users can view all profiles
CREATE POLICY "Users can view all profiles"
ON profiles
FOR SELECT
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id);