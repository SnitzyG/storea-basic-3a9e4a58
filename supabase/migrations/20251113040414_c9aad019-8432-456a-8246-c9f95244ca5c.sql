-- Enable reading company names for all authenticated users
CREATE POLICY "Allow authenticated users to read companies"
ON companies
FOR SELECT
TO authenticated
USING (true);