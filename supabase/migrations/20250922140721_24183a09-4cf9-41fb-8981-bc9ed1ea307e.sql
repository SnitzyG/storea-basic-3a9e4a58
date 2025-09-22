-- Add pinned and archived status to message_threads
ALTER TABLE message_threads 
ADD COLUMN is_pinned boolean DEFAULT false,
ADD COLUMN is_archived boolean DEFAULT false;