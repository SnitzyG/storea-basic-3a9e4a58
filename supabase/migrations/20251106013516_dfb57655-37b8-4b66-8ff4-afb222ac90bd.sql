-- Approve richard@storea.com.au
UPDATE profiles 
SET approved = true, approved_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'richard@storea.com.au'
);