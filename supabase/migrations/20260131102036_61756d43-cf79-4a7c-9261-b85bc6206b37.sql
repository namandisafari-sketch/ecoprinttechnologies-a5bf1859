-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Create more restrictive policies for orders
-- Allow authenticated users to create orders (setting their own user_id)
-- Allow guest checkout (user_id can be null) with rate limiting considerations
CREATE POLICY "Authenticated users can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        -- Either the user is authenticated and user_id matches their id
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        -- Or it's a guest checkout (user_id is null) - still allowed but tracked
        OR (user_id IS NULL)
    );

-- Order items can only be created for orders the user owns or guest orders
CREATE POLICY "Users can create order items for their orders"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );