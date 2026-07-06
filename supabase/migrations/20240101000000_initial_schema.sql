-- La Grande Marque Shipping Admin - Initial Supabase Schema
-- Run this in Supabase SQL Editor or via migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff / Admins table
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

-- Customers table
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

-- Shipments table
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  handling_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  target_kg INTEGER NOT NULL CHECK (target_kg > 0),
  reward_kg INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (singleton-ish row)
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

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(date);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_date ON shipments(pickup_date);
CREATE INDEX IF NOT EXISTS idx_shipments_expected_arrival ON shipments(expected_arrival);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_auth_uid ON staff(auth_uid);

-- Seed default admin (password should be handled via Supabase Auth in production)
INSERT INTO staff (name, email, role, phone, active, auth_uid)
SELECT 'Admin User', 'admin@lagrandemarque.com', 'Admin', '+261 34 00 000 00', TRUE, uuid_generate_v4()
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'admin@lagrandemarque.com');

-- Seed default settings
INSERT INTO settings (company_name, contact_email, phone, address, currency, default_rate_per_kg, payment_methods, loyalty_enabled, tax_enabled, tax_rate)
SELECT 'La Grande Marque', 'contact@lagrandemarque.com', '+261 34 00 000 00', 'Antananarivo, Madagascar', 'MGA', 15000, ARRAY['Cash', 'Bank Transfer', 'Mobile Money (Mvola)'], TRUE, FALSE, 0
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Seed default offer
INSERT INTO offers (name, target_kg, reward_kg, active)
SELECT 'Send 25kg, Get 2kg Free', 25, 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM offers);

-- Seed categories
INSERT INTO categories (name, description, handling_notes)
VALUES
  ('Spices & Vanilla', 'Agricultural products', 'Keep dry, moderate temperature'),
  ('Textiles', 'Clothing and fabrics', 'Standard handling'),
  ('Electronics', 'Devices and components', 'Fragile, keep dry')
ON CONFLICT (name) DO NOTHING;

-- Seed routes
INSERT INTO routes (from_city, to_city, active)
VALUES
  ('Madagascar', 'Mauritius', TRUE),
  ('Mauritius', 'Madagascar', TRUE)
ON CONFLICT DO NOTHING;

-- Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
CREATE POLICY "Allow public read staff" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert staff" ON staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update staff" ON staff FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete staff" ON staff FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for customers
CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert customers" ON customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update customers" ON customers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete customers" ON customers FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for shipments
CREATE POLICY "Allow public read shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert shipments" ON shipments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update shipments" ON shipments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete shipments" ON shipments FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for categories
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for offers
CREATE POLICY "Allow public read offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert offers" ON offers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update offers" ON offers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete offers" ON offers FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for routes
CREATE POLICY "Allow public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert routes" ON routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update routes" ON routes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete routes" ON routes FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for settings
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert settings" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete settings" ON settings FOR DELETE USING (auth.role() = 'authenticated');

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
CREATE POLICY "Public read access to photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update photos" ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
