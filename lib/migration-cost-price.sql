-- Run once in Supabase SQL editor, then: npm run update-cost-prices
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN books.cost_price IS 'Purchase / buying price (1st MRP in inventory)';
