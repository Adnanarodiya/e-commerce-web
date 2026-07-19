-- Remember when the admin opened a quotation in WhatsApp.
-- This keeps the Quotation Order button hidden after page reloads.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS quotation_shared_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.quotation_shared_at IS
  'Time the admin opened the quotation WhatsApp share action';
