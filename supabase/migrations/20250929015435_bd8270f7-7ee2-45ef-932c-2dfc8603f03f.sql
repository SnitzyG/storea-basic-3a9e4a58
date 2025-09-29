-- Drop the remaining RFI policy that references roles
DROP POLICY "Project members can update RFIs with restrictions" ON rfis;