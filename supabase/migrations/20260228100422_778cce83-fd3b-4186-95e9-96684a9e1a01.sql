
-- Allow admins to update delivery accounts
CREATE POLICY "Admins can update delivery accounts" ON public.delivery_accounts
  FOR UPDATE USING (is_admin(auth.uid()));

-- Allow admins to delete delivery accounts
CREATE POLICY "Admins can delete delivery accounts" ON public.delivery_accounts
  FOR DELETE USING (is_admin(auth.uid()));
