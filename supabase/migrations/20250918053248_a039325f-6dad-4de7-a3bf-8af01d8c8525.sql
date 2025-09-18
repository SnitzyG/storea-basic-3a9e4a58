-- First, add the new status values to the existing enum
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'received';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'answered';
ALTER TYPE rfi_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add a comment to document the status lifecycle
COMMENT ON TYPE rfi_status IS 'Enhanced RFI lifecycle statuses: draft, sent, received, outstanding, overdue, in_review, answered, rejected, closed';