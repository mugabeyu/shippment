-- next_tracking_number() was pulling from a sequence that isn't tied to what's
-- actually in the shipments table. If any row ever got its tracking_number
-- outside of nextval() (seed data, a manual insert/restore, etc.), the
-- sequence has no way to know and will eventually re-issue a number that's
-- already taken, blowing up the shipments_tracking_number_key unique
-- constraint on create.

-- One-time resync: fast-forward each sequence past the highest number
-- already used for its prefix, so normal operation doesn't need to loop.
DO $$
DECLARE
  max_aller INTEGER;
  max_retour INTEGER;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(tracking_number FROM 3)::INTEGER), 0) INTO max_aller
    FROM shipments WHERE tracking_number ~ '^A-[0-9]+$';
  SELECT COALESCE(MAX(SUBSTRING(tracking_number FROM 3)::INTEGER), 0) INTO max_retour
    FROM shipments WHERE tracking_number ~ '^R-[0-9]+$';

  PERFORM setval('shipments_aller_tracking_seq', GREATEST(max_aller, 1), max_aller > 0);
  PERFORM setval('shipments_retour_tracking_seq', GREATEST(max_retour, 1), max_retour > 0);
END $$;

-- Going forward, self-heal against any future drift instead of trusting the
-- sequence blindly: keep drawing from it (still atomic/collision-free between
-- concurrent callers) but skip past any candidate that's somehow already on a
-- row, so a stale sequence can never produce a duplicate-key error again.
CREATE OR REPLACE FUNCTION next_tracking_number(p_direction TEXT)
RETURNS TEXT AS $$
DECLARE
  n INTEGER;
  prefix TEXT;
  candidate TEXT;
BEGIN
  prefix := CASE WHEN p_direction = 'retour' THEN 'R-' ELSE 'A-' END;
  LOOP
    IF p_direction = 'retour' THEN
      n := nextval('shipments_retour_tracking_seq');
    ELSE
      n := nextval('shipments_aller_tracking_seq');
    END IF;
    candidate := prefix || LPAD(n::TEXT, 2, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM shipments WHERE tracking_number = candidate);
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql;
