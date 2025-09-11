-- Update RFI status enum to match new requirements
ALTER TYPE rfi_status RENAME TO rfi_status_old;

CREATE TYPE rfi_status AS ENUM ('outstanding', 'overdue', 'responded', 'closed');

-- Update the rfis table to use new enum
ALTER TABLE rfis 
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE rfi_status USING 
  CASE status::text
    WHEN 'submitted' THEN 'outstanding'::rfi_status
    WHEN 'in_review' THEN 'outstanding'::rfi_status
    WHEN 'responded' THEN 'responded'::rfi_status
    WHEN 'closed' THEN 'closed'::rfi_status
    ELSE 'outstanding'::rfi_status
  END,
ALTER COLUMN status SET DEFAULT 'outstanding'::rfi_status;

-- Drop old enum
DROP TYPE rfi_status_old;