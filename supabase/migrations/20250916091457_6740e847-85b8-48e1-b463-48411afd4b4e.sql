-- Add an additional permissive INSERT policy allowing creators to insert
CREATE POLICY "projects_insert_creator" ON projects
FOR INSERT
WITH CHECK (auth.uid() = created_by);