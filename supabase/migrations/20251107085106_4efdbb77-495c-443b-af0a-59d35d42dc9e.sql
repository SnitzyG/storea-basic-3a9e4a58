-- Drop the old function
DROP FUNCTION IF EXISTS delete_tender_cascade(uuid);

-- Create updated function without tender_access_requests table
CREATE OR REPLACE FUNCTION delete_tender_cascade(tender_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  tender_record record;
  result jsonb;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get tender to verify ownership/permission
  SELECT * INTO tender_record
  FROM tenders
  WHERE id = tender_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tender not found';
  END IF;

  -- Check if user is the issuer or project architect
  IF tender_record.issued_by != current_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM project_users 
      WHERE project_id = tender_record.project_id 
      AND user_id = current_user_id 
      AND role = 'architect'
    ) THEN
      RAISE EXCEPTION 'Insufficient permissions to delete this tender';
    END IF;
  END IF;

  -- Delete related data in correct order (child to parent)
  
  -- 1. Delete bid line items
  DELETE FROM tender_bid_line_items
  WHERE bid_id IN (
    SELECT id FROM tender_bids WHERE tender_id = tender_id_param
  );

  -- 2. Delete bids
  DELETE FROM tender_bids WHERE tender_id = tender_id_param;

  -- 3. Delete line items
  DELETE FROM tender_line_items WHERE tender_id = tender_id_param;

  -- 4. Delete package documents
  DELETE FROM tender_package_documents WHERE tender_id = tender_id_param;

  -- 5. Delete activity logs
  DELETE FROM activity_log WHERE entity_id = tender_id_param AND entity_type = 'tender';

  -- 6. Finally delete the tender itself
  DELETE FROM tenders WHERE id = tender_id_param;

  result := jsonb_build_object(
    'success', true,
    'message', 'Tender and all related data deleted successfully'
  );

  RETURN result;
END;
$$;