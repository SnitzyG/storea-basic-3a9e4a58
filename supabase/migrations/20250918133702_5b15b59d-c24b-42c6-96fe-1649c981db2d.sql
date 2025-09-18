-- Add DELETE policy for RFIs - only the creator can delete their own RFIs
CREATE POLICY "Users can delete their own RFIs" 
ON public.rfis 
FOR DELETE 
USING (auth.uid() = raised_by);