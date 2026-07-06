-- The settings table is meant to be a singleton row. If duplicates were
-- created (e.g. seed ran more than once), keep only the earliest row so
-- GET/PUT operate on a single consistent record.
DELETE FROM settings
WHERE id NOT IN (
  SELECT id FROM settings ORDER BY created_at ASC, id ASC LIMIT 1
);
