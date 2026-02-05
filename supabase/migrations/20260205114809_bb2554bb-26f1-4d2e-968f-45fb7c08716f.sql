-- Add shop_number column to seller_profiles
ALTER TABLE public.seller_profiles 
ADD COLUMN shop_number text;