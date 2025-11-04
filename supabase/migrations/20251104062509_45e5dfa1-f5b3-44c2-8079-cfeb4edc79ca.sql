-- Add message editing, deletion, and reply fields
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id),
ADD COLUMN IF NOT EXISTS quoted_content TEXT,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add favorite threads support
ALTER TABLE message_threads 
ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]';

-- Create message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user mutes table
CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  muted_user_id UUID NOT NULL,
  muted_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mutes ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_templates
CREATE POLICY "Users can view their own templates"
  ON message_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON message_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON message_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON message_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for user_mutes
CREATE POLICY "Users can view their own mutes"
  ON user_mutes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mutes"
  ON user_mutes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mutes"
  ON user_mutes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mutes"
  ON user_mutes FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_user ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mutes_user ON user_mutes(user_id, muted_user_id);