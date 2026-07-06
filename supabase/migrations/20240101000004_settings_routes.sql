-- Store routes as a JSONB column on the settings singleton row.
-- Routes are managed from the Settings page and read via settings.routes,
-- so they no longer rely on a (nonexistent) relationship to the routes table.
ALTER TABLE settings ADD COLUMN IF NOT EXISTS routes JSONB DEFAULT '[]'::jsonb;
