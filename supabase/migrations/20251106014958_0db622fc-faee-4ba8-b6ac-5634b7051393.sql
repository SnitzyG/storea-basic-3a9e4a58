-- Update richard@storea.com.au profile role from architect to admin equivalent
-- Since user_role enum likely doesn't have 'admin', we'll use 'builder' or create a generic role
-- First, let's just ensure they're not architect and have proper admin access

UPDATE profiles 
SET role = 'builder' -- Using builder as a privileged role since admin isn't in user_role enum
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'richard@storea.com.au'
);

-- Ensure admin role is set in user_roles table
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'richard@storea.com.au'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove any other conflicting roles if needed
DELETE FROM user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'richard@storea.com.au'
)
AND role != 'admin';