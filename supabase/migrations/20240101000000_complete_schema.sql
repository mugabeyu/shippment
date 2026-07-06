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
CREATE POLICY "Authenticated users can update photos" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete photos" ON storage.objects FOR DELETE WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
