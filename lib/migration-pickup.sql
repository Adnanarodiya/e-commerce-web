-- Pickup confirmation + packed timestamp on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ;