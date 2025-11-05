-- Add category, location, meeting_link, and reminder fields to calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER;

-- Create index for better performance on category filtering
CREATE INDEX IF NOT EXISTS idx_calendar_events_category ON calendar_events(category);

-- Create event_templates table for saved templates
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  title_template TEXT,
  description_template TEXT,
  priority TEXT DEFAULT 'medium',
  is_meeting BOOLEAN DEFAULT FALSE,
  reminder_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on event_templates
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_templates
CREATE POLICY "Users can view their own templates"
  ON event_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON event_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON event_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON event_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON event_templates(user_id);