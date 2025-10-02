-- Add document_categories table for custom categories
CREATE TABLE IF NOT EXISTS public.document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_categories
CREATE POLICY "Users can view categories for their projects"
  ON public.document_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = document_categories.project_id
      AND project_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Architects can manage categories"
  ON public.document_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = document_categories.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role IN ('architect', 'builder')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users
      WHERE project_users.project_id = document_categories.project_id
      AND project_users.user_id = auth.uid()
      AND project_users.role IN ('architect', 'builder')
    )
  );

-- Add project_stage column to document_groups
ALTER TABLE public.document_groups
ADD COLUMN IF NOT EXISTS project_stage TEXT DEFAULT 'General';

-- Update existing documents: change 'Permit' to 'Other'
UPDATE public.document_groups
SET category = 'Other'
WHERE category = 'Permit';

-- Drop and recreate the document number generation function with new format
DROP FUNCTION IF EXISTS public.generate_document_group_number(uuid);

CREATE OR REPLACE FUNCTION public.generate_document_group_number(
  project_id_param UUID,
  category_param TEXT,
  project_stage_param TEXT DEFAULT 'General'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  company_code TEXT;
  stage_code TEXT;
  category_count INTEGER;
  doc_number TEXT;
BEGIN
  -- Get company code from project creator's company (3 chars)
  SELECT UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3)) 
  INTO company_code
  FROM projects p
  JOIN profiles pr ON pr.user_id = p.created_by
  JOIN companies c ON c.id = pr.company_id
  WHERE p.id = project_id_param;
  
  -- If no company code found, use project name first 3 chars
  IF company_code IS NULL OR LENGTH(company_code) = 0 THEN
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3)) 
    INTO company_code
    FROM projects 
    WHERE id = project_id_param;
    
    -- If still no code, use 'DOC'
    IF company_code IS NULL OR LENGTH(company_code) = 0 THEN
      company_code := 'DOC';
    END IF;
  END IF;
  
  -- Create stage code from project_stage (take first 3 chars or abbreviate)
  stage_code := UPPER(LEFT(REGEXP_REPLACE(project_stage_param, '[^A-Za-z0-9]', '', 'g'), 3));
  IF stage_code IS NULL OR LENGTH(stage_code) = 0 THEN
    stage_code := 'GEN';
  END IF;
  
  -- Count existing document groups for this project, category, and stage
  SELECT COUNT(*) + 1 
  INTO category_count
  FROM document_groups 
  WHERE project_id = project_id_param 
  AND category = category_param
  AND COALESCE(project_stage, 'General') = project_stage_param;
  
  -- Generate document number: COMPANY-STAGE-NNNN
  doc_number := company_code || '-' || stage_code || '-' || LPAD(category_count::TEXT, 4, '0');
  
  RETURN doc_number;
END;
$$;

-- Update the trigger function to use the new signature
DROP TRIGGER IF EXISTS set_document_group_number ON public.document_groups;

CREATE OR REPLACE FUNCTION public.auto_generate_document_group_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Only generate if document_number is not provided
  IF NEW.document_number IS NULL THEN
    NEW.document_number := generate_document_group_number(
      NEW.project_id, 
      NEW.category,
      COALESCE(NEW.project_stage, 'General')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_document_group_number
  BEFORE INSERT ON public.document_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_document_group_number();