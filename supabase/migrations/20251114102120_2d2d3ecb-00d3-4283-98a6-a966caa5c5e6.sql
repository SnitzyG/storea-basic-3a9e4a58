-- Add comprehensive profile fields for role-based setup
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
ADD COLUMN IF NOT EXISTS abn TEXT,
ADD COLUMN IF NOT EXISTS professional_license_number TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS specialization TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS timeline TEXT,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS insurance_details TEXT,
ADD COLUMN IF NOT EXISTS number_of_employees INTEGER;