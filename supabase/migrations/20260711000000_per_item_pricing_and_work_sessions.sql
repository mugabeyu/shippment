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
