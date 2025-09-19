-- Add RLS policies for new tables

-- Enable RLS on all new tables
ALTER TABLE tender_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_prequalifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tender_packages
CREATE POLICY "Users can view tender packages for their projects" ON tender_packages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = tender_packages.project_id 
    AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Project admins can manage tender packages" ON tender_packages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = tender_packages.project_id 
    AND project_users.user_id = auth.uid() 
    AND project_users.role IN ('architect', 'contractor')
  )
);

-- RLS Policies for tender_discussions
CREATE POLICY "Users can view discussions for tenders in their projects" ON tender_discussions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_discussions.tender_id 
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create discussions for tenders in their projects" ON tender_discussions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_discussions.tender_id 
    AND pu.user_id = auth.uid()
  )
);

-- RLS Policies for tender_amendments
CREATE POLICY "Users can view amendments for tenders in their projects" ON tender_amendments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_amendments.tender_id 
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Project admins can create amendments" ON tender_amendments
FOR INSERT WITH CHECK (
  auth.uid() = issued_by AND
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_amendments.tender_id 
    AND pu.user_id = auth.uid() 
    AND pu.role = 'architect'
  )
);

-- RLS Policies for contractor_prequalifications
CREATE POLICY "Contractors can view their own prequalifications" ON contractor_prequalifications
FOR SELECT USING (auth.uid() = contractor_id);

CREATE POLICY "Project admins can view all prequalifications" ON contractor_prequalifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = contractor_prequalifications.project_id 
    AND project_users.user_id = auth.uid() 
    AND project_users.role = 'architect'
  )
);

CREATE POLICY "Contractors can create their prequalifications" ON contractor_prequalifications
FOR INSERT WITH CHECK (
  auth.uid() = contractor_id AND
  EXISTS (
    SELECT 1 FROM project_users 
    WHERE project_users.project_id = contractor_prequalifications.project_id 
    AND project_users.user_id = auth.uid()
  )
);

-- RLS Policies for tender_notifications
CREATE POLICY "System can manage tender notifications" ON tender_notifications
FOR ALL USING (true);

-- RLS Policies for tender_documents
CREATE POLICY "Users can view tender documents for their projects" ON tender_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_documents.tender_id 
    AND pu.user_id = auth.uid()
  )
);

CREATE POLICY "Project admins can manage tender documents" ON tender_documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_documents.tender_id 
    AND pu.user_id = auth.uid() 
    AND pu.role = 'architect'
  )
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_tender_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_tender_discussions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tender_packages_updated_at_trigger ON tender_packages;
CREATE TRIGGER update_tender_packages_updated_at_trigger
  BEFORE UPDATE ON tender_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_tender_packages_updated_at();

DROP TRIGGER IF EXISTS update_tender_discussions_updated_at_trigger ON tender_discussions;
CREATE TRIGGER update_tender_discussions_updated_at_trigger
  BEFORE UPDATE ON tender_discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_tender_discussions_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tender_packages_project_id ON tender_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_tender_discussions_tender_id ON tender_discussions(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_amendments_tender_id ON tender_amendments(tender_id);
CREATE INDEX IF NOT EXISTS idx_contractor_prequalifications_project_id ON contractor_prequalifications(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_prequalifications_contractor_id ON contractor_prequalifications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_tender_notifications_tender_id ON tender_notifications(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON tender_documents(tender_id);

-- Create function to auto-generate amendment numbers
CREATE OR REPLACE FUNCTION generate_amendment_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(amendment_number), 0) + 1 
  INTO NEW.amendment_number
  FROM tender_amendments 
  WHERE tender_id = NEW.tender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_amendment_number ON tender_amendments;
CREATE TRIGGER auto_generate_amendment_number
  BEFORE INSERT ON tender_amendments
  FOR EACH ROW
  EXECUTE FUNCTION generate_amendment_number();