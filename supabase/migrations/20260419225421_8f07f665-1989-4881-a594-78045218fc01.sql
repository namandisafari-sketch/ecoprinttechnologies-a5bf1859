
-- Products: optional descriptive columns referenced in admin code
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS model text;

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  name text GENERATED ALWAYS AS (full_name) STORED,
  phone text, email text, address text, city text, notes text,
  total_spent numeric DEFAULT 0,
  total_orders integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage customers" ON public.customers;
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ CUSTOMER WALLETS ============
CREATE TABLE IF NOT EXISTS public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage wallets" ON public.customer_wallets;
CREATE POLICY "Admins manage wallets" ON public.customer_wallets FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES public.customer_wallets(id) ON DELETE CASCADE,
  customer_id uuid,
  amount numeric NOT NULL,
  type text NOT NULL,
  reference text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage wallet txns" ON public.wallet_transactions;
CREATE POLICY "Admins manage wallet txns" ON public.wallet_transactions FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ SALES (POS) ============
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL DEFAULT ('POS-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0')),
  customer_id uuid, customer_name text, customer_phone text,
  cashier_id uuid, cashier_name text,
  subtotal numeric NOT NULL DEFAULT 0, discount numeric DEFAULT 0, tax numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0, amount_paid numeric DEFAULT 0, change_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'cash', payment_status text DEFAULT 'paid',
  status text DEFAULT 'completed', notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage sales" ON public.sales;
CREATE POLICY "Admins manage sales" ON public.sales FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid, product_name text NOT NULL, product_sku text,
  quantity integer NOT NULL DEFAULT 1, unit_price numeric NOT NULL,
  discount numeric DEFAULT 0, subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage sale items" ON public.sale_items;
CREATE POLICY "Admins manage sale items" ON public.sale_items FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ REFUNDS / EXCHANGES ============
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  order_id uuid, amount numeric NOT NULL, reason text,
  refund_method text DEFAULT 'cash', status text DEFAULT 'completed',
  processed_by uuid, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage refunds" ON public.refunds;
CREATE POLICY "Admins manage refunds" ON public.refunds FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  original_product_id uuid, new_product_id uuid, reason text,
  difference_amount numeric DEFAULT 0, status text DEFAULT 'completed', notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage exchanges" ON public.exchanges;
CREATE POLICY "Admins manage exchanges" ON public.exchanges FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ CREDIT SALES / PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.credit_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_id uuid, customer_name text, customer_phone text,
  total_amount numeric NOT NULL, amount_paid numeric DEFAULT 0,
  balance numeric NOT NULL, due_date date, status text DEFAULT 'pending', notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage credit sales" ON public.credit_sales;
CREATE POLICY "Admins manage credit sales" ON public.credit_sales FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_sale_id uuid REFERENCES public.credit_sales(id) ON DELETE CASCADE,
  amount numeric NOT NULL, payment_method text DEFAULT 'cash', notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage credit payments" ON public.credit_payments;
CREATE POLICY "Admins manage credit payments" ON public.credit_payments FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ INVENTORY ============
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL, quantity integer NOT NULL,
  unit_cost numeric DEFAULT 0, total_cost numeric DEFAULT 0,
  reference text, reference_id uuid, notes text, performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage inventory txns" ON public.inventory_transactions;
CREATE POLICY "Admins manage inventory txns" ON public.inventory_transactions FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ SUPPLIERS ============
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, contact_person text, phone text, email text, address text, notes text,
  total_owed numeric DEFAULT 0, is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage suppliers" ON public.suppliers;
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  amount numeric NOT NULL, payment_method text DEFAULT 'cash',
  reference text, notes text, paid_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage supplier payments" ON public.supplier_payments;
CREATE POLICY "Admins manage supplier payments" ON public.supplier_payments FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL DEFAULT ('PO-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0')),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text, total_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending', expected_date date, notes text, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage POs" ON public.purchase_orders;
CREATE POLICY "Admins manage POs" ON public.purchase_orders FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid, product_name text NOT NULL,
  quantity integer NOT NULL, unit_cost numeric NOT NULL, subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage PO items" ON public.purchase_order_items;
CREATE POLICY "Admins manage PO items" ON public.purchase_order_items FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ STOCK RECEIVING ============
CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text UNIQUE NOT NULL DEFAULT ('SR-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0')),
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  supplier_id uuid, supplier_name text, total_amount numeric DEFAULT 0,
  notes text, received_by uuid, received_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage stock receipts" ON public.stock_receipts;
CREATE POLICY "Admins manage stock receipts" ON public.stock_receipts FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.stock_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_receipt_id uuid NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  product_id uuid, product_name text NOT NULL,
  quantity integer NOT NULL, unit_cost numeric NOT NULL, subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_receipt_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage stock receipt items" ON public.stock_receipt_items;
CREATE POLICY "Admins manage stock receipt items" ON public.stock_receipt_items FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ BARCODE TRACKING ============
CREATE TABLE IF NOT EXISTS public.barcode_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number text, status text DEFAULT 'in_stock', notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.barcode_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage barcodes" ON public.barcode_items;
CREATE POLICY "Admins manage barcodes" ON public.barcode_items FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ CASH REGISTER ============
CREATE TABLE IF NOT EXISTS public.cash_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_balance numeric NOT NULL DEFAULT 0, closing_balance numeric,
  expected_balance numeric, difference numeric,
  opened_by uuid, closed_by uuid,
  opened_at timestamptz DEFAULT now(), closed_at timestamptz,
  status text DEFAULT 'open', notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage cash register" ON public.cash_register;
CREATE POLICY "Admins manage cash register" ON public.cash_register FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ BANK DEPOSITS ============
CREATE TABLE IF NOT EXISTS public.bank_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL, bank_name text, account_number text, reference text,
  deposited_by uuid, deposit_date date DEFAULT current_date, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_deposits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage bank deposits" ON public.bank_deposits;
CREATE POLICY "Admins manage bank deposits" ON public.bank_deposits FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ QUOTATIONS ============
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL DEFAULT ('QT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0')),
  customer_name text NOT NULL, customer_phone text, customer_email text, customer_address text,
  subtotal numeric NOT NULL DEFAULT 0, tax numeric DEFAULT 0,
  discount numeric DEFAULT 0, total numeric NOT NULL DEFAULT 0,
  valid_until date, status text DEFAULT 'draft', notes text, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage quotations" ON public.quotations;
CREATE POLICY "Admins manage quotations" ON public.quotations FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid, product_name text NOT NULL, description text,
  quantity integer NOT NULL DEFAULT 1, unit_price numeric NOT NULL, subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage quotation items" ON public.quotation_items;
CREATE POLICY "Admins manage quotation items" ON public.quotation_items FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ STICKERS ============
CREATE TABLE IF NOT EXISTS public.stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  sticker_data jsonb, layout jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage stickers" ON public.stickers;
CREATE POLICY "Admins manage stickers" ON public.stickers FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ SITE SETTINGS (alias) ============
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Site settings publicly readable" ON public.site_settings;
CREATE POLICY "Site settings publicly readable" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL USING (is_admin_or_manager(auth.uid()));
