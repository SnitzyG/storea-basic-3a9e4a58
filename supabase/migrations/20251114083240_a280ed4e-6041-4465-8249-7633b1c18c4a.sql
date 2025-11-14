-- Add RLS policy for user_sessions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' AND policyname = 'Users can view their own sessions'
  ) THEN
    CREATE POLICY "Users can view their own sessions"
      ON user_sessions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add admin policy to view all sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' AND policyname = 'Admins can view all sessions'
  ) THEN
    CREATE POLICY "Admins can view all sessions"
      ON user_sessions FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

-- Enable realtime for user_sessions if not already enabled
ALTER TABLE user_sessions REPLICA IDENTITY FULL;