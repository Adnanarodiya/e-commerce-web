-- Add buying / purchase price column to books
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN books.cost_price IS 'Purchase / buying price (1st MRP in inventory)';
COMMENT ON COLUMN books.price IS 'Selling price to customers (2nd MRP in inventory)';
