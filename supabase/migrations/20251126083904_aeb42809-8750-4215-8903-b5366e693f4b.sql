-- Comprehensive Security Fix: Address All ERROR-Level Issues
-- This migration fixes 6 critical security vulnerabilities

-- ============================================================================
-- FIX 1: CRITICAL - Projects Table RLS Policy
-- Issue: "project_id IS NOT NULL" allows any authenticated user to view ALL projects
-- ============================================================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view their projects" ON projects;

-- Create secure policy that actually checks project membership
CREATE POLICY "Users can view their projects"
ON projects
FOR SELECT
TO authenticated
USING (
  -- User is a member of the project
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = projects.id
    AND project_users.user_id = auth.uid()
  )
  OR
  -- User created the project
  created_by = auth.uid()
);

-- ============================================================================
-- FIX 2: Tenders Table RLS Policies
-- Issue: Tender data exposed without proper authentication checks
-- ============================================================================

-- Drop any insecure policies that allow unauthenticated access
DROP POLICY IF EXISTS "Anyone can view open tenders" ON tenders;
DROP POLICY IF EXISTS "view_own_or_open_tenders" ON tenders;

-- Recreate secure tender viewing policy
CREATE POLICY "Users can view tenders they have access to"
ON tenders
FOR SELECT
TO authenticated
USING (
  -- User is project member
  EXISTS (
    SELECT 1 FROM project_users pu
    WHERE pu.project_id = tenders.project_id
    AND pu.user_id = auth.uid()
  )
  OR
  -- User has approved tender access
  EXISTS (
    SELECT 1 FROM tender_access ta
    WHERE ta.tender_id = tenders.id
    AND ta.user_id = auth.uid()
    AND ta.status = 'approved'
  )
  OR
  -- User is the issuer
  issued_by = auth.uid()
);

-- ============================================================================
-- FIX 3: Tender Package Documents RLS
-- Issue: Tender documents accessible without proper authorization
-- ============================================================================

DROP POLICY IF EXISTS "Users with tender access can view tender packages" ON tender_package_documents;

CREATE POLICY "Users with tender access can view tender packages"
ON tender_package_documents
FOR SELECT
TO authenticated
USING (
  user_has_tender_access(auth.uid(), tender_id)
  OR
  EXISTS (
    SELECT 1 FROM tenders t
    WHERE t.id = tender_package_documents.tender_id
    AND t.issued_by = auth.uid()
  )
);

-- ============================================================================
-- FIX 4: Tender Line Items RLS
-- Issue: Pricing data exposed without authorization
-- ============================================================================

DROP POLICY IF EXISTS "Users with tender access can view line items" ON tender_line_items;

CREATE POLICY "Users with tender access can view line items"
ON tender_line_items
FOR SELECT
TO authenticated
USING (
  user_has_tender_access(auth.uid(), tender_id)
  OR
  EXISTS (
    SELECT 1 FROM tenders t
    WHERE t.id = tender_line_items.tender_id
    AND t.issued_by = auth.uid()
  )
);

-- ============================================================================
-- FIX 5: Notifications Table - Remove Insecure INSERT Policy
-- Issue: System can create notifications with condition 'true'
-- ============================================================================

-- The existing create_notification function already exists and is secure
-- Just ensure no insecure policies exist
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_auth_insert" ON notifications;

-- No need to add new INSERT policy - the create_notification() function
-- already exists and properly validates authentication
-- Users must use: supabase.rpc('create_notification', {...})

-- ============================================================================
-- FIX 6: Document Events Table - Remove Insecure INSERT Policy  
-- Issue: System can create document events with condition 'true'
-- ============================================================================

-- The log_document_event function already exists and is secure
-- Just ensure no insecure policies exist
DROP POLICY IF EXISTS "System can create document events" ON document_events;
DROP POLICY IF EXISTS "document_events_auth_insert" ON document_events;

-- No INSERT policy needed - users must use log_document_event() function
-- which properly validates authentication and authorization

-- ============================================================================
-- VERIFICATION: Ensure Activity Log Policy is Secure
-- The activity_log table should only allow users to log their own activities
-- ============================================================================

-- Verify the secure INSERT policy exists (it should from Phase 6)
-- This is just a safety check - the policy should already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'activity_log' 
    AND policyname = 'Users can create activity logs'
  ) THEN
    CREATE POLICY "Users can create activity logs"
    ON activity_log
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- SUMMARY OF FIXES
-- ============================================================================
-- ✅ Fixed projects table - now requires actual project membership
-- ✅ Fixed tenders table - requires tender access approval
-- ✅ Fixed tender_package_documents - requires tender access
-- ✅ Fixed tender_line_items - requires tender access  
-- ✅ Removed insecure notifications INSERT policy - use create_notification()
-- ✅ Removed insecure document_events INSERT policy - use log_document_event()
-- ✅ Verified activity_log has secure INSERT policy