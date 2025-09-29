-- Add new enum values in separate statements and commit them first
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead_consultant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead_contractor';