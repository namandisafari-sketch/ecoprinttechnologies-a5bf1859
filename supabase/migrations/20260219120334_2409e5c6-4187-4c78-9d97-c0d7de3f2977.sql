
CREATE POLICY "Anyone can view orders by order_number"
ON public.orders
FOR SELECT
USING (true);
