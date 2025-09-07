-- Add status column to message_threads table
ALTER TABLE message_threads ADD COLUMN status TEXT DEFAULT 'active';

-- Add inquiry_status column to messages table for formal inquiries
ALTER TABLE messages ADD COLUMN inquiry_status TEXT DEFAULT NULL;

-- Update existing RLS policies to ensure proper access control
-- These policies should already exist but let's make sure they're comprehensive

-- Ensure only project members can see and interact with threads and messages
CREATE POLICY "Only project members can see thread updates" 
ON message_threads 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM project_users 
  WHERE project_users.project_id = message_threads.project_id 
  AND project_users.user_id = auth.uid()
));

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_message_threads_status ON message_threads(status);
CREATE INDEX IF NOT EXISTS idx_messages_inquiry_status ON messages(inquiry_status);