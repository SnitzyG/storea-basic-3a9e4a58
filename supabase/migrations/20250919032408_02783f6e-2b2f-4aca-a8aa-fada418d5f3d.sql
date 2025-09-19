-- Enhanced Tenders System Database Schema - Fixed

-- First check current tenders table structure and enhance it
DO $$ 
BEGIN
  -- Add columns for tender packages and advanced features
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

-- Add foreign key reference to tender packages after table is created
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'tender_package_id') THEN
    ALTER TABLE tenders ADD COLUMN tender_package_id UUID;
    ALTER TABLE tenders ADD CONSTRAINT fk_tenders_package FOREIGN KEY (tender_package_id) REFERENCES tender_packages(id);
  END IF;
END $$;

-- Create tender discussions table for Q&A functionality
CREATE TABLE IF NOT EXISTS tender_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'question', -- question, clarification, announcement
  parent_id UUID, -- for threaded discussions
  is_official BOOLEAN DEFAULT false, -- official responses from tender issuer
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES tender_discussions(id)
);

-- Create tender amendments table for tracking changes
CREATE TABLE IF NOT EXISTS tender_amendments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  amendment_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  changes_made JSONB NOT NULL DEFAULT '{}',
  issued_by UUID NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT false,
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
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
  contractor_references JSONB DEFAULT '[]',
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
  tender_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- reminder, deadline_warning, status_change, amendment
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_ids UUID[] NOT NULL,
  message_template TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- Create tender documents table for version control
CREATE TABLE IF NOT EXISTS tender_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- specification, drawing, legal, amendment
  file_path TEXT NOT NULL,
  file_size BIGINT,
  version_number INTEGER DEFAULT 1,
  uploaded_by UUID NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_current_version BOOLEAN DEFAULT true,
  replaced_document_id UUID,
  access_level TEXT DEFAULT 'public', -- public, restricted, confidential
  FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
  FOREIGN KEY (replaced_document_id) REFERENCES tender_documents(id)
);