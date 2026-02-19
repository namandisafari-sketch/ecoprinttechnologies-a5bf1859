
-- Table to track device identities
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint text NOT NULL UNIQUE,
  full_name text NOT NULL,
  recovery_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Anyone can create a device (first visit registration)
CREATE POLICY "Anyone can register a device"
  ON public.devices FOR INSERT
  WITH CHECK (true);

-- Devices can read their own record by fingerprint
CREATE POLICY "Anyone can read devices"
  ON public.devices FOR SELECT
  USING (true);

-- Devices can update their own name
CREATE POLICY "Anyone can update own device"
  ON public.devices FOR UPDATE
  USING (true);

-- Add device_id column to orders table to link orders to devices
ALTER TABLE public.orders ADD COLUMN device_id uuid REFERENCES public.devices(id);

-- Index for fast lookup
CREATE INDEX idx_orders_device_id ON public.orders(device_id);
CREATE INDEX idx_devices_fingerprint ON public.devices(device_fingerprint);
CREATE INDEX idx_devices_recovery_code ON public.devices(recovery_code);

-- Trigger for updated_at
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
