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
