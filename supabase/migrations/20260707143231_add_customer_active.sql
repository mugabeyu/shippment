-- Add active column to customers table for block/unblock functionality
ALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
UPDATE customers SET active = TRUE WHERE active IS NULL;
