-- Drop all policies that might reference role enum values
DROP POLICY "Project admins can manage document types" ON document_types;
DROP POLICY "Project admins can manage status options" ON document_status_options;