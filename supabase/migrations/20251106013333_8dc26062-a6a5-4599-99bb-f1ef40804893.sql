-- Make richard@storea.com.au an admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'richard@storea.com.au'
ON CONFLICT (user_id, role) DO NOTHING;