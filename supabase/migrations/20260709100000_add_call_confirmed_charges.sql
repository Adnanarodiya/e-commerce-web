-- Call-confirmed packaging & courier charges (not collected at checkout)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

COMMENT ON COLUMN orders.packaging_charge IS 'Admin-entered packaging charge after phone confirmation';
COMMENT ON COLUMN orders.courier_charge IS 'Admin-entered courier charge after phone confirmation';
