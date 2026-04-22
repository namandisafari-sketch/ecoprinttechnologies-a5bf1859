
-- Create momo_transactions table
CREATE TABLE IF NOT EXISTS public.momo_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reference_id TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED')),
  raw_request_json JSONB,
  raw_response_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prevent duplicate pending/successful payments per order
CREATE UNIQUE INDEX idx_momo_one_active_per_order 
  ON public.momo_transactions(order_id) 
  WHERE status IN ('PENDING', 'SUCCESSFUL');

-- Enable RLS
ALTER TABLE public.momo_transactions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (checkout is public/device-based)
CREATE POLICY "Anyone can create momo transactions"
  ON public.momo_transactions FOR INSERT
  WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view all momo transactions"
  ON public.momo_transactions FOR SELECT
  USING (is_admin_or_manager(auth.uid()));

-- Anyone can view by order (matches orders policy)
CREATE POLICY "Anyone can view momo transactions"
  ON public.momo_transactions FOR SELECT
  USING (true);

-- Allow edge function updates (service role bypasses RLS, but add policy for safety)
CREATE POLICY "Anyone can update momo transactions"
  ON public.momo_transactions FOR UPDATE
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_momo_transactions_updated_at
  BEFORE UPDATE ON public.momo_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
