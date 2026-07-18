-- Expense categories: lets administrators manage the category list instead of
-- a hardcoded array baked into the frontend bundle.
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read expense categories" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert expense categories" ON expense_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update expense categories" ON expense_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete expense categories" ON expense_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Seed with the categories that used to be hardcoded in the Expenses page so
-- existing expense rows keep resolving to a familiar category out of the box.
INSERT INTO expense_categories (name) VALUES
  ('Air Tickets'), ('Customs'), ('Freight'), ('Packaging'), ('Fuel'), ('Maintenance'),
  ('Office Supplies'), ('Utilities'), ('Rent'), ('Insurance'), ('Marketing'), ('Salaries'),
  ('Taxes'), ('Legal'), ('Software'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- Expenses: move from a single attachment_url to up to 3 photos, matching the
-- shipments table's existing photos TEXT[] pattern.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: carry forward any existing single attachment into the new array
-- so nothing already saved is lost.
UPDATE expenses
SET photos = ARRAY[attachment_url]
WHERE attachment_url IS NOT NULL AND attachment_url <> '' AND array_length(photos, 1) IS NULL;
