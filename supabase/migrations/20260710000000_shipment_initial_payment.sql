-- Initial payment (deposit) collected at shipment creation time.
-- Deducted from final_amount to determine the outstanding balance.
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS initial_payment INTEGER NOT NULL DEFAULT 0 CHECK (initial_payment >= 0);
