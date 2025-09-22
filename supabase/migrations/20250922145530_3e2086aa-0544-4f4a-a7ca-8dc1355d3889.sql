-- Update the RFI number generation to always use MES for message-based inquiries
-- First check what's in the database
SELECT rfi_number, rfi_type, category FROM rfis ORDER BY created_at DESC LIMIT 5;