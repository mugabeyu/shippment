-- ============================================
-- Add shipping_item_id and route_direction to shipments
-- for item-based pricing lookup.
-- ============================================

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS shipping_item_id UUID REFERENCES shipping_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_direction TEXT CHECK (route_direction IN ('aller', 'retour'));
