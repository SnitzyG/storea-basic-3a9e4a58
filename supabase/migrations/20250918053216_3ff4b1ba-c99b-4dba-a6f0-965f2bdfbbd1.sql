-- Expand RFI status enum to include enhanced lifecycle statuses
-- First, add the new status values to the existing enum
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'received';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'answered';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'rejected';

-- Note: 'outstanding', 'overdue', 'responded', and 'closed' already exist
-- The new complete status lifecycle is:
-- 'draft' - RFI created but not yet sent
-- 'sent' - RFI has been sent to recipient
-- 'received' - RFI has been received/acknowledged
-- 'outstanding' - RFI is pending response (existing)
-- 'overdue' - RFI response is overdue (existing)
-- 'in_review' - RFI response is being reviewed
-- 'answered' - RFI has been answered (maps to existing 'responded')
-- 'rejected' - RFI has been rejected/declined
-- 'closed' - RFI is completed and closed (existing)

-- Update any existing 'responded' status to 'answered' for consistency
UPDATE rfis SET status = 'answered' WHERE status = 'responded';

-- Add a comment to document the status lifecycle
COMMENT ON TYPE rfi_status IS 'Enhanced RFI lifecycle statuses: draft, sent, received, outstanding, overdue, in_review, answered, rejected, closed';