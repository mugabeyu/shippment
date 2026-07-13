-- customers.total_kg_sent is a stored counter that application code increments/
-- decrements on each shipment create/update/delete. Any deletion path that
-- bypasses those API routes (bulk delete via the SQL editor/table UI, etc.)
-- leaves it stale -- which is exactly what the Offers page reads to compute
-- each customer's loyalty progress. Make the database the source of truth
-- instead: recompute it from shipments.weight_kg on every change.

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
-- actually exist right now (also fixes today's stale post-bulk-delete data).
UPDATE customers c
SET total_kg_sent = COALESCE((SELECT SUM(s.weight_kg) FROM shipments s WHERE s.customer_id = c.id), 0)
WHERE total_kg_sent IS DISTINCT FROM COALESCE((SELECT SUM(s.weight_kg) FROM shipments s WHERE s.customer_id = c.id), 0);
