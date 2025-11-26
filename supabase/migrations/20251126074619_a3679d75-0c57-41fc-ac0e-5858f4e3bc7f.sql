-- Phase 1a: Test single table RLS policies to isolate the issue

-- Test with simple todos table first (has simple structure)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own todos" ON todos
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);