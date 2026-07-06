-- Add department column to staff table for profile editing
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
