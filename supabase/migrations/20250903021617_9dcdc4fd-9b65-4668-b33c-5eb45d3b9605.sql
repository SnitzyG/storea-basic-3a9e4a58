-- Create message_participants table for read status
CREATE TABLE public.message_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_participants
CREATE POLICY "Users can view message participants for their projects" 
ON public.message_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM messages m 
  JOIN project_users pu ON m.project_id = pu.project_id 
  WHERE m.id = message_participants.message_id 
  AND pu.user_id = auth.uid()
));

CREATE POLICY "Users can mark messages as read" 
ON public.message_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their read status" 
ON public.message_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime on tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_threads REPLICA IDENTITY FULL;
ALTER TABLE public.message_participants REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_participants;