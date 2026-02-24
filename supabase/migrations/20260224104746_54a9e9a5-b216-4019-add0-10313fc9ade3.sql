
-- Wishlist table
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(device_id, product_id),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view own wishlist" ON public.wishlist
  FOR SELECT USING (true);

CREATE POLICY "Anyone can add to wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can remove from wishlist" ON public.wishlist
  FOR DELETE USING (true);

-- Notifications table (admin broadcasts)
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  link text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active notifications" ON public.notifications
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (is_admin_or_manager(auth.uid()));

-- User notification reads (track which notifications each device/user has seen)
CREATE TABLE public.notification_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(notification_id, device_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view own reads" ON public.notification_reads
  FOR SELECT USING (true);

CREATE POLICY "Anyone can mark as read" ON public.notification_reads
  FOR INSERT WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
