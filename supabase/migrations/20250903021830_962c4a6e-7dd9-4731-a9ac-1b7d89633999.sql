-- Enable realtime on tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_threads REPLICA IDENTITY FULL;
ALTER TABLE public.message_participants REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_participants;