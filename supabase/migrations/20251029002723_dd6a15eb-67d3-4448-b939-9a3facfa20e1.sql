-- Create tender_line_items table to store line items extracted from drawings
CREATE TABLE IF NOT EXISTS tender_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  specification TEXT,
  unit_of_measure TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  total NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE tender_line_items ENABLE ROW LEVEL SECURITY;

-- Users can view line items for tenders in their projects
CREATE POLICY "Users can view tender line items for their projects"
ON tender_line_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_line_items.tender_id
    AND pu.user_id = auth.uid()
  )
);

-- Project creators and architects/builders can manage line items
CREATE POLICY "Project creators and architects/builders can manage tender line items"
ON tender_line_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_line_items.tender_id
    AND pu.user_id = auth.uid()
    AND pu.role IN ('architect', 'builder')
  )
  OR EXISTS (
    SELECT 1 FROM tenders t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = tender_line_items.tender_id
    AND p.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenders t
    JOIN project_users pu ON t.project_id = pu.project_id
    WHERE t.id = tender_line_items.tender_id
    AND pu.user_id = auth.uid()
    AND pu.role IN ('architect', 'builder')
  )
  OR EXISTS (
    SELECT 1 FROM tenders t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = tender_line_items.tender_id
    AND p.created_by = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_tender_line_items_tender_id ON tender_line_items(tender_id);

-- Add trigger for updated_at
CREATE TRIGGER update_tender_line_items_updated_at
  BEFORE UPDATE ON tender_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();