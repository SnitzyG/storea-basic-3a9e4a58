-- Enhanced Tenders System Database Schema

-- First check current tenders table structure and enhance it
DO $$ 
BEGIN
  -- Add columns for tender packages and advanced features
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'tender_package_id') THEN
    ALTER TABLE tenders ADD COLUMN tender_package_id UUID REFERENCES tender_packages(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'tender_type') THEN
    ALTER TABLE tenders ADD COLUMN tender_type TEXT DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'compliance_requirements') THEN
    ALTER TABLE tenders ADD COLUMN compliance_requirements JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'evaluation_criteria') THEN
    ALTER TABLE tenders ADD COLUMN evaluation_criteria JSONB DEFAULT '{"price_weight": 40, "experience_weight": 20, "timeline_weight": 20, "technical_weight": 15, "communication_weight": 5}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'workflow_stage') THEN
    ALTER TABLE tenders ADD COLUMN workflow_stage TEXT DEFAULT 'draft';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'auto_close_enabled') THEN
    ALTER TABLE tenders ADD COLUMN auto_close_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create tender packages table for grouping related work items
CREATE TABLE IF NOT EXISTS tender_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_budget NUMERIC,
  package_type TEXT DEFAULT 'general', -- general, design, construction, consulting
  status TEXT DEFAULT 'active' -- active, inactive, completed
);

-- Create tender discussions table for Q&A functionality
CREATE TABLE IF NOT EXISTS tender_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'question', -- question, clarification, announcement
  parent_id UUID REFERENCES tender_discussions(id), -- for threaded discussions
  is_official BOOLEAN DEFAULT false, -- official responses from tender issuer
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tender amendments table for tracking changes
CREATE TABLE IF NOT EXISTS tender_amendments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  amendment_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  changes_made JSONB NOT NULL DEFAULT '{}',
  issued_by UUID NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT false
);

-- Create contractor prequalification table
CREATE TABLE IF NOT EXISTS contractor_prequalifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  experience_years INTEGER,
  certifications JSONB DEFAULT '[]',
  previous_projects JSONB DEFAULT '[]',
  financial_capacity NUMERIC,
  insurance_details JSONB DEFAULT '{}',
  references JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  review_notes TEXT,
  UNIQUE(project_id, contractor_id)
);

-- Enhanced tender_bids table for better evaluation
DO $$ 
BEGIN
  -- Add evaluation columns to tender_bids if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'price_score') THEN
    ALTER TABLE tender_bids ADD COLUMN price_score NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'experience_score') THEN
    ALTER TABLE tender_bids ADD COLUMN experience_score NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'timeline_score') THEN
    ALTER TABLE tender_bids ADD COLUMN timeline_score NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'technical_score') THEN
    ALTER TABLE tender_bids ADD COLUMN technical_score NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'communication_score') THEN
    ALTER TABLE tender_bids ADD COLUMN communication_score NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'overall_score') THEN
    ALTER TABLE tender_bids ADD COLUMN overall_score NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'evaluator_notes') THEN
    ALTER TABLE tender_bids ADD COLUMN evaluator_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'evaluated_at') THEN
    ALTER TABLE tender_bids ADD COLUMN evaluated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'evaluator_id') THEN
    ALTER TABLE tender_bids ADD COLUMN evaluator_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'compliance_checked') THEN
    ALTER TABLE tender_bids ADD COLUMN compliance_checked BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'compliance_issues') THEN
    ALTER TABLE tender_bids ADD COLUMN compliance_issues JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tender_bids' AND column_name = 'estimated_duration_days') THEN
    ALTER TABLE tender_bids ADD COLUMN estimated_duration_days INTEGER;
  END IF;
END $$;

-- Create tender notifications table for automated reminders
CREATE TABLE IF NOT EXISTS tender_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- reminder, deadline_warning, status_change, amendment
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_ids UUID[] NOT NULL,
  message_template TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' -- pending, sent, failed
);

-- Create tender documents table for version control
CREATE TABLE IF NOT EXISTS tender_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- specification, drawing, legal, amendment
  file_path TEXT NOT NULL,
  file_size BIGINT,
  version_number INTEGER DEFAULT 1,
  uploaded_by UUID NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_current_version BOOLEAN DEFAULT true,
  replaced_document_id UUID REFERENCES tender_documents(id),
  access_level TEXT DEFAULT 'public' -- public, restricted, confidential
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