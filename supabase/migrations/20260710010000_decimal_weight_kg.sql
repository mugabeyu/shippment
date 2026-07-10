-- Line-item weight is now entered with decimals (e.g. 4.2kg), so the columns that
-- store or accumulate it need to hold fractional values, not just whole kilograms.
ALTER TABLE shipments ALTER COLUMN weight_kg TYPE NUMERIC(10,2) USING weight_kg::numeric;
ALTER TABLE shipment_line_items ALTER COLUMN weight_kg TYPE NUMERIC(10,2) USING weight_kg::numeric;
ALTER TABLE customers ALTER COLUMN total_kg_sent TYPE NUMERIC(10,2) USING total_kg_sent::numeric;
