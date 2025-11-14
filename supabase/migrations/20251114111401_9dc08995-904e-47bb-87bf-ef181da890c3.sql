-- Add company_phone column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_phone text;

-- Add a comment explaining the column
COMMENT ON COLUMN profiles.company_phone IS 'Company phone number for business users (architects, builders, contractors)';