-- ============================================
-- ONE-TIME BOOTSTRAP BUNDLE — not a tracked migration itself.
-- This is every migration under supabase/migrations/ concatenated in order
-- (the redundant 20240101000000_initial_schema.sql is intentionally excluded —
-- it duplicates 20240101000000_complete_schema.sql's tables/policies without
-- IF NOT EXISTS guards on the policies, so running both back to back errors
-- with "policy already exists").
--
-- Run this ONCE, in full, in the Supabase SQL Editor against a brand-new/empty
-- project — it creates every table, column, index, policy, and seed row this
-- app expects from a blank "public" schema. Every individual migration file
-- under supabase/migrations/ is idempotent (IF NOT EXISTS / ON CONFLICT
-- guards), so re-running this whole bundle again later is also safe.
-- ============================================

-- ============================================
-- La Grande Marque Shipping Admin
-- Complete Supabase Setup (Single Migration)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Staff / Admins
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Staff')),
  phone TEXT NOT NULL DEFAULT '',
  photo TEXT,
  active BOOLEAN DEFAULT FALSE,
  auth_uid UUID UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  total_kg_sent INTEGER DEFAULT 0,
  notes TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  category TEXT NOT NULL,
  weight_kg INTEGER NOT NULL CHECK (weight_kg > 0),
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Packed', 'Ready', 'Loaded', 'In Transit', 'Arrived', 'Ready for Pickup', 'Delivered', 'Cancelled')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid')),
  payment_method TEXT NOT NULL,
  receipt_sent BOOLEAN DEFAULT FALSE,
  pickup_date DATE,
  expected_arrival DATE,
  insurance BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  internal_notes TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  base_price INTEGER DEFAULT 0 CHECK (base_price >= 0),
  discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount INTEGER DEFAULT 0 CHECK (final_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  handling_notes TEXT,
  price_per_kg NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  target_kg INTEGER NOT NULL CHECK (target_kg > 0),
  reward_kg INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'La Grande Marque',
  contact_email TEXT NOT NULL DEFAULT 'contact@lagrandemarque.com',
  phone TEXT NOT NULL DEFAULT '+261 34 00 000 00',
  address TEXT NOT NULL DEFAULT 'Antananarivo, Madagascar',
  currency TEXT NOT NULL DEFAULT 'MGA',
  default_rate_per_kg INTEGER NOT NULL DEFAULT 15000,
  payment_methods TEXT[] DEFAULT ARRAY['Cash', 'Bank Transfer', 'Mobile Money (Mvola)'],
  loyalty_enabled BOOLEAN DEFAULT TRUE,
  tax_enabled BOOLEAN DEFAULT FALSE,
  tax_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Configuration
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  type TEXT NOT NULL DEFAULT 'json',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(date);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_date ON shipments(pickup_date);
CREATE INDEX IF NOT EXISTS idx_shipments_expected_arrival ON shipments(expected_arrival);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_auth_uid ON staff(auth_uid);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY "Allow public read staff" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert staff" ON staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update staff" ON staff FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete staff" ON staff FOR DELETE USING (auth.role() = 'authenticated');

-- Customers policies
CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert customers" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update customers" ON customers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete customers" ON customers FOR DELETE USING (auth.role() = 'authenticated');

-- Shipments policies
CREATE POLICY "Allow public read shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert shipments" ON shipments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update shipments" ON shipments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete shipments" ON shipments FOR DELETE USING (auth.role() = 'authenticated');

-- Categories policies
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Offers policies
CREATE POLICY "Allow public read offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert offers" ON offers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update offers" ON offers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete offers" ON offers FOR DELETE USING (auth.role() = 'authenticated');

-- Routes policies
CREATE POLICY "Allow public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert routes" ON routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update routes" ON routes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete routes" ON routes FOR DELETE USING (auth.role() = 'authenticated');

-- Settings policies
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert settings" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete settings" ON settings FOR DELETE USING (auth.role() = 'authenticated');

-- App config policies
CREATE POLICY "Allow public read app_config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert app_config" ON app_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update app_config" ON app_config FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete app_config" ON app_config FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access to photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update photos" ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
-- ============================================
-- La Grande Marque Shipping Admin
-- Additive migration: missing tables referenced by the app
-- (audit_logs, notifications, receipts) + RLS
-- ============================================

-- Audit logs (admin action trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL DEFAULT '',
  details JSONB DEFAULT '{}'::jsonb,
  staff_id UUID REFERENCES staff (id) ON DELETE SET NULL,
  staff_name TEXT,
  staff_email TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (in-app staff alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  staff_id UUID REFERENCES staff (id) ON DELETE CASCADE,
  reference_id TEXT,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts (shipment payment receipts)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT UNIQUE NOT NULL,
  shipment_id UUID REFERENCES shipments (id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers (id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff (id) ON DELETE SET NULL,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  tax NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'MGA',
  pdf_url TEXT,
  sent_via_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit_logs (staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON notifications (staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_receipts_shipment_id ON receipts (shipment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts (customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts (receipt_number);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE POLICY "Allow public read audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update audit_logs" ON audit_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete audit_logs" ON audit_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Notifications
CREATE POLICY "Allow public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update notifications" ON notifications FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete notifications" ON notifications FOR DELETE USING (auth.role() = 'authenticated');

-- Receipts
CREATE POLICY "Allow public read receipts" ON receipts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert receipts" ON receipts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update receipts" ON receipts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete receipts" ON receipts FOR DELETE USING (auth.role() = 'authenticated');
-- ============================================
-- La Grande Marque Shipping Admin
-- Seed app_config (key/value JSON). Idempotent.
-- Drives the sidebar nav, branding, breadcrumbs, shipment statuses, etc.
-- ============================================

INSERT INTO app_config (key, value, type, description) VALUES
  (
    'navigation',
    '[
      {"path":"/dashboard","label":"Dashboard","icon":"LayoutDashboard"},
      {"path":"/shipments","label":"Shipments","icon":"Truck"},
      {"path":"/customers","label":"Customers","icon":"Users"},
      {"path":"/categories","label":"Categories","icon":"Tags"},
      {"path":"/offers","label":"Offers","icon":"Gift"},
      {"path":"/reports","label":"Reports","icon":"BarChart3"},
      {"path":"/notifications","label":"Activity","icon":"Bell"},
      {"path":"/audit","label":"Audit Logs","icon":"FileSearch"},
      {"path":"/settings","label":"Settings","icon":"Settings"},
      {"path":"/staff","label":"Staff","icon":"UserPlus"}
    ]'::jsonb,
    'json',
    'Sidebar navigation items'
  ),
  (
    'branding',
    '{"companyName":"LA GRANDE MARQUE","tagline":"SHIPPING ADMIN"}'::jsonb,
    'json',
    'Company branding'
  ),
  (
    'breadcrumbs',
    '{"shipments":"Shipments","customers":"Customers","staff":"Staff","categories":"Categories","offers":"Offers","reports":"Reports","notifications":"Notifications","audit":"Audit Logs","settings":"Settings","profile":"Profile"}'::jsonb,
    'json',
    'Breadcrumb labels by route segment'
  ),
  (
    'shipment_statuses',
    '["Pending","Packed","Ready","Loaded","In Transit","Arrived","Ready for Pickup","Delivered","Cancelled"]'::jsonb,
    'json',
    'Allowed shipment statuses'
  ),
  (
    'defaults',
    '{"origin":"","destination":"","currency":"MGA","paymentMethods":["Cash","Bank Transfer","Mobile Money"],"loyaltyTargetKg":25}'::jsonb,
    'json',
    'Default form values'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
-- Add department column to staff table for profile editing
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
-- Store routes as a JSONB column on the settings singleton row.
-- Routes are managed from the Settings page and read via settings.routes,
-- so they no longer rely on a (nonexistent) relationship to the routes table.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS routes JSONB DEFAULT '[]'::jsonb;
-- The settings table is meant to be a singleton row. If duplicates were
-- created (e.g. seed ran more than once), keep only the earliest row so
-- GET/PUT operate on a single consistent record.
DELETE FROM settings
WHERE id NOT IN (
  SELECT id FROM settings ORDER BY created_at ASC, id ASC LIMIT 1
);
-- Expenses table for tracking business costs
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  note TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert expenses" ON expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update expenses" ON expenses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete expenses" ON expenses FOR DELETE USING (auth.role() = 'authenticated');
-- Add active column to customers table for block/unblock functionality
ALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
UPDATE customers SET active = TRUE WHERE active IS NULL;
-- ============================================
-- Shipping Items — per-item pricing with Aller/Retour rates
-- Aller = Madagascar → Mauritius
-- Retour = Mauritius → Madagascar
-- Each item belongs to a category (created via the Categories page).
-- ============================================

-- Drop old version if it used the legacy `category TEXT` column
DROP TABLE IF EXISTS shipping_items CASCADE;

CREATE TABLE shipping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  aller_price INTEGER NOT NULL CHECK (aller_price >= 0),
  retour_price INTEGER, -- NULL = unavailable for Retour route
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- (On a fresh bootstrap, shipments.shipping_item_id doesn't exist yet at this
-- point — it's added further down with its own inline FK to this table — so
-- the drop/recreate dance the original migration did here is skipped.)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_items_category_id ON shipping_items (category_id);
CREATE INDEX IF NOT EXISTS idx_shipping_items_active ON shipping_items (active);

-- Enable RLS
ALTER TABLE shipping_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all for authenticated users'
    AND tablename = 'shipping_items'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON shipping_items
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END$$;

-- ============================================
-- Seed: upsert the shipping categories into the categories table first,
-- then insert matching items.
-- ============================================

DO $$
DECLARE
  cat_electronics UUID;
  cat_fashion UUID;
  cat_misc UUID;
BEGIN
  -- Insert/update categories for shipping item groups
  INSERT INTO categories (name, description, handling_notes, price_per_kg)
  VALUES ('Electronics', 'Electronic devices and accessories', '', 0)
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO cat_electronics;

  INSERT INTO categories (name, description, handling_notes, price_per_kg)
  VALUES ('Personal & Fashion', 'Personal items, fashion and accessories', '', 0)
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO cat_fashion;

  INSERT INTO categories (name, description, handling_notes, price_per_kg)
  VALUES ('Misc & Medical', 'Miscellaneous items and medical supplies', '', 0)
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO cat_misc;

  -- Seed shipping items
  INSERT INTO shipping_items (category_id, item, aller_price, retour_price) VALUES
    (cat_electronics, 'Téléphone (sans accessoires)', 500, 500),
    (cat_electronics, 'Téléphone (avec accessoires + boîte)', 600, 650),
    (cat_electronics, 'Tablette - P.M', 800, 800),
    (cat_electronics, 'Tablette - G.M', 1000, 1000),
    (cat_electronics, 'Ordinateur', 1500, 1500),
    (cat_electronics, 'Solomaso', 300, 300),
    (cat_electronics, 'Montre / Pièces', 250, 200),
    (cat_fashion, 'Guitare', 1600, NULL),
    (cat_fashion, 'Kiraro vaovao (paires)', 400, 300),
    (cat_fashion, 'Firavaka - Volafotsy', 500, 400),
    (cat_fashion, 'Firavaka - Volamena', 700, 500),
    (cat_fashion, 'Peruque', 300, NULL),
    (cat_misc, 'Dossier par enveloppe / personne', 400, 350),
    (cat_misc, 'Fanafody / boîte - P.M', 200, 200),
    (cat_misc, 'Fanafody / boîte - M.M / G.M', 300, 300),
    (cat_misc, 'Entana misy boritra rehetra (+200 Rs)', 200, 200);

END$$;
-- ============================================
-- Add shipping_item_id and route_direction to shipments
-- for item-based pricing lookup.
-- ============================================

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS shipping_item_id UUID REFERENCES shipping_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_direction TEXT CHECK (route_direction IN ('aller', 'retour'));
-- ============================================
-- Shipment Line Items — support multiple items per shipment
-- route_direction replaces origin/destination
-- ============================================

-- Line items table
CREATE TABLE IF NOT EXISTS shipment_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  shipping_item_id UUID REFERENCES shipping_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  category_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  weight_kg INTEGER NOT NULL DEFAULT 1 CHECK (weight_kg > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sli_shipment_id ON shipment_line_items (shipment_id);

-- Enable RLS
ALTER TABLE shipment_line_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all for authenticated users'
    AND tablename = 'shipment_line_items'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON shipment_line_items
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END$$;

-- Add route_direction column to shipments (replaces origin/destination)
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS route_direction TEXT CHECK (route_direction IN ('aller', 'retour'));
-- Sequential, staff-facing shipment number (separate from the internal UUID pk).
-- Backfilled in creation order so existing shipments get 1, 2, 3, ... too.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS id_no INTEGER;
CREATE SEQUENCE IF NOT EXISTS shipments_id_no_seq;

DO $$
DECLARE
  r RECORD;
  n INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM shipments WHERE id_no IS NULL ORDER BY created_at ASC, id ASC LOOP
    UPDATE shipments SET id_no = n WHERE id = r.id;
    n := n + 1;
  END LOOP;
  PERFORM setval('shipments_id_no_seq', GREATEST(n - 1, 1), true);
END $$;

ALTER TABLE shipments ALTER COLUMN id_no SET NOT NULL;
ALTER TABLE shipments ALTER COLUMN id_no SET DEFAULT nextval('shipments_id_no_seq');
ALTER SEQUENCE shipments_id_no_seq OWNED BY shipments.id_no;

CREATE UNIQUE INDEX IF NOT EXISTS shipments_id_no_key ON shipments(id_no);

-- Per-direction counters for the human tracking number: A-01, A-02... / R-01, R-02...
-- Both start at 1 and only apply to shipments created from now on; existing
-- TRK-xxxx tracking numbers are left untouched since they may already be on
-- receipts shared with customers.
CREATE SEQUENCE IF NOT EXISTS shipments_aller_tracking_seq START 1;
CREATE SEQUENCE IF NOT EXISTS shipments_retour_tracking_seq START 1;

CREATE OR REPLACE FUNCTION next_tracking_number(p_direction TEXT)
RETURNS TEXT AS $$
DECLARE
  n INTEGER;
BEGIN
  IF p_direction = 'retour' THEN
    n := nextval('shipments_retour_tracking_seq');
    RETURN 'R-' || LPAD(n::TEXT, 2, '0');
  ELSE
    n := nextval('shipments_aller_tracking_seq');
    RETURN 'A-' || LPAD(n::TEXT, 2, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;
-- Initial payment (deposit) collected at shipment creation time.
-- Deducted from final_amount to determine the outstanding balance.
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS initial_payment INTEGER NOT NULL DEFAULT 0 CHECK (initial_payment >= 0);
-- Line-item weight is now entered with decimals (e.g. 4.2kg), so the columns that
-- store or accumulate it need to hold fractional values, not just whole kilograms.
ALTER TABLE shipments ALTER COLUMN weight_kg TYPE NUMERIC(10,2) USING weight_kg::numeric;
ALTER TABLE shipment_line_items ALTER COLUMN weight_kg TYPE NUMERIC(10,2) USING weight_kg::numeric;
ALTER TABLE customers ALTER COLUMN total_kg_sent TYPE NUMERIC(10,2) USING total_kg_sent::numeric;
-- ============================================
-- Per-item pricing + Kilograms category + Work Sessions
-- ============================================
-- Items are now billed flat per item (unitPrice x quantity) by default.
-- Weight-based billing (unitPrice x weightKg x quantity) is preserved only for
-- items whose category has pricing_mode = 'per_kg' — the "Kilograms" category
-- below is the one seeded for that purpose, and is the only thing that feeds
-- the Offers/loyalty kg-milestone math (via customers.total_kg_sent).

ALTER TABLE categories ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'per_item' CHECK (pricing_mode IN ('per_item', 'per_kg'));

-- A shipment made up entirely of per-item (non-Kilograms) lines now legitimately
-- has zero billable weight — the original "> 0" constraint would reject it.
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_weight_kg_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_weight_kg_check CHECK (weight_kg >= 0);

INSERT INTO categories (name, description, pricing_mode)
VALUES ('Kilograms', 'Items billed by weight (per kg) instead of per item.', 'per_kg')
ON CONFLICT (name) DO UPDATE SET pricing_mode = 'per_kg';

-- Quantity can now be fractional (e.g. 2.5), and weight is only meaningful for
-- per_kg lines, so it's no longer required.
ALTER TABLE shipment_line_items ALTER COLUMN quantity TYPE NUMERIC(10,2);
ALTER TABLE shipment_line_items ALTER COLUMN quantity DROP DEFAULT;
ALTER TABLE shipment_line_items ALTER COLUMN quantity SET DEFAULT 1;
ALTER TABLE shipment_line_items DROP CONSTRAINT IF EXISTS shipment_line_items_weight_kg_check;
ALTER TABLE shipment_line_items ALTER COLUMN weight_kg DROP NOT NULL;
ALTER TABLE shipment_line_items ALTER COLUMN weight_kg DROP DEFAULT;
ALTER TABLE shipment_line_items ADD CONSTRAINT shipment_line_items_weight_kg_check CHECK (weight_kg IS NULL OR weight_kg > 0);

-- ============================================
-- Work sessions — a staff member must have one open before mutating anything.
-- ============================================
CREATE TABLE IF NOT EXISTS staff_work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_sessions_staff ON staff_work_sessions(staff_id);
-- A staff member can only have one open (ended_at IS NULL) session at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_sessions_one_open_per_staff ON staff_work_sessions(staff_id) WHERE ended_at IS NULL;

ALTER TABLE staff_work_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_work_sessions' AND policyname = 'Allow public read work sessions') THEN
    CREATE POLICY "Allow public read work sessions" ON staff_work_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_work_sessions' AND policyname = 'Allow authenticated insert work sessions') THEN
    CREATE POLICY "Allow authenticated insert work sessions" ON staff_work_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_work_sessions' AND policyname = 'Allow authenticated update work sessions') THEN
    CREATE POLICY "Allow authenticated update work sessions" ON staff_work_sessions FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Attribute shipments/expenses to the staff member + work session that created them,
-- so the Staff Work page can compute per-session financial totals.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS work_session_id UUID REFERENCES staff_work_sessions(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS work_session_id UUID REFERENCES staff_work_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_work_session ON shipments(work_session_id);
CREATE INDEX IF NOT EXISTS idx_expenses_work_session ON expenses(work_session_id);

-- ============================================
-- Rename "Audit Logs" -> "Staff Work" in the seeded sidebar nav/breadcrumb config
-- (the page now shows per-session financial summaries, not just a raw log).
-- ============================================
UPDATE app_config
SET value = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'path' = '/audit' THEN jsonb_set(elem, '{label}', '"Staff Work"')
         ELSE elem END
  )
  FROM jsonb_array_elements(value) elem
),
updated_at = NOW()
WHERE key = 'navigation';

UPDATE app_config
SET value = jsonb_set(value, '{audit}', '"Staff Work"'),
updated_at = NOW()
WHERE key = 'breadcrumbs' AND value ? 'audit';

-- ============================================
-- customers.total_kg_sent was a stored counter that application code
-- incremented/decremented on each shipment create/update/delete. Any deletion
-- path that bypassed those API routes (bulk delete via SQL editor/table UI,
-- etc.) left it stale -- which is exactly what the Offers page reads to
-- compute each customer's loyalty progress. Make the database the source of
-- truth instead: recompute it from shipments.weight_kg on every change.
-- ============================================

CREATE OR REPLACE FUNCTION sync_customer_total_kg()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.customer_id IS DISTINCT FROM NEW.customer_id AND OLD.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_kg_sent = COALESCE((SELECT SUM(weight_kg) FROM shipments WHERE customer_id = OLD.customer_id), 0)
    WHERE id = OLD.customer_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_kg_sent = COALESCE((SELECT SUM(weight_kg) FROM shipments WHERE customer_id = OLD.customer_id), 0)
      WHERE id = OLD.customer_id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_kg_sent = COALESCE((SELECT SUM(weight_kg) FROM shipments WHERE customer_id = NEW.customer_id), 0)
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_customer_total_kg ON shipments;
CREATE TRIGGER trg_sync_customer_total_kg
AFTER INSERT OR UPDATE OR DELETE ON shipments
FOR EACH ROW EXECUTE FUNCTION sync_customer_total_kg();

-- Row-level triggers don't fire on TRUNCATE, so cover that path too.
CREATE OR REPLACE FUNCTION reset_customer_totals_on_truncate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers SET total_kg_sent = 0;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reset_customer_totals_truncate ON shipments;
CREATE TRIGGER trg_reset_customer_totals_truncate
AFTER TRUNCATE ON shipments
FOR EACH STATEMENT EXECUTE FUNCTION reset_customer_totals_on_truncate();

-- One-time backfill: recompute every customer's total from the shipments that
-- actually exist right now (also fixes stale data left by a prior bulk delete).
UPDATE customers c
SET total_kg_sent = COALESCE((SELECT SUM(s.weight_kg) FROM shipments s WHERE s.customer_id = c.id), 0)
WHERE total_kg_sent IS DISTINCT FROM COALESCE((SELECT SUM(s.weight_kg) FROM shipments s WHERE s.customer_id = c.id), 0);
-- Expense categories: lets administrators manage the category list instead of
-- a hardcoded array baked into the frontend bundle.
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read expense categories" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert expense categories" ON expense_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update expense categories" ON expense_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete expense categories" ON expense_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Seed with the categories that used to be hardcoded in the Expenses page so
-- existing expense rows keep resolving to a familiar category out of the box.
INSERT INTO expense_categories (name) VALUES
  ('Air Tickets'), ('Customs'), ('Freight'), ('Packaging'), ('Fuel'), ('Maintenance'),
  ('Office Supplies'), ('Utilities'), ('Rent'), ('Insurance'), ('Marketing'), ('Salaries'),
  ('Taxes'), ('Legal'), ('Software'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- Expenses: move from a single attachment_url to up to 3 photos, matching the
-- shipments table's existing photos TEXT[] pattern.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: carry forward any existing single attachment into the new array
-- so nothing already saved is lost.
UPDATE expenses
SET photos = ARRAY[attachment_url]
WHERE attachment_url IS NOT NULL AND attachment_url <> '' AND array_length(photos, 1) IS NULL;
