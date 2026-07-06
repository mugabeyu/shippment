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
