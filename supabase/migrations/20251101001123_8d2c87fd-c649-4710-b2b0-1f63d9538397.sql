-- Create property_zoning table for storing planning/zoning information
CREATE TABLE property_zoning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  address TEXT NOT NULL,
  zone TEXT,
  overlays TEXT[],
  height_limit TEXT,
  building_coverage TEXT,
  planning_scheme TEXT,
  full_response JSONB,
  api_called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_property_zoning_address ON property_zoning(address);
CREATE INDEX idx_property_zoning_project_id ON property_zoning(project_id);
CREATE INDEX idx_property_zoning_user_id ON property_zoning(user_id);

-- Enable RLS
ALTER TABLE property_zoning ENABLE ROW LEVEL SECURITY;

-- Users can view their own zoning lookups
CREATE POLICY "Users can view their own zoning lookups"
  ON property_zoning
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own zoning lookups
CREATE POLICY "Users can insert their own zoning lookups"
  ON property_zoning
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view zoning lookups for their projects
CREATE POLICY "Users can view project zoning lookups"
  ON property_zoning
  FOR SELECT
  USING (
    project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_users.project_id = property_zoning.project_id::uuid 
      AND project_users.user_id = auth.uid()
    )
  );