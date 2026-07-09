-- ============================================
-- Shipping Items — per-item pricing with Aller/Retour rates
-- Aller = Mauritius → Madagascar
-- Retour = Madagascar → Mauritius
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

-- Need to drop shipment FK before recreating it
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_shipping_item_id_fkey;

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

-- Restore shipment FK
ALTER TABLE shipments
  ADD CONSTRAINT shipments_shipping_item_id_fkey
  FOREIGN KEY (shipping_item_id) REFERENCES shipping_items(id) ON DELETE SET NULL;

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
