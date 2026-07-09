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
