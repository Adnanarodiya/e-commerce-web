-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_books_name_en ON books (name_en);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Enable RLS (permissive policies for anon-key app without customer auth)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_select_all" ON books;
DROP POLICY IF EXISTS "books_insert_all" ON books;
DROP POLICY IF EXISTS "books_update_all" ON books;
DROP POLICY IF EXISTS "books_delete_all" ON books;
CREATE POLICY "books_select_all" ON books FOR SELECT USING (true);
CREATE POLICY "books_insert_all" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "books_update_all" ON books FOR UPDATE USING (true);
CREATE POLICY "books_delete_all" ON books FOR DELETE USING (true);

DROP POLICY IF EXISTS "orders_select_all" ON orders;
DROP POLICY IF EXISTS "orders_insert_all" ON orders;
DROP POLICY IF EXISTS "orders_update_all" ON orders;
CREATE POLICY "orders_select_all" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_all" ON orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "order_items_select_all" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_all" ON order_items;
CREATE POLICY "order_items_select_all" ON order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert_all" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "settings_select_all" ON settings;
DROP POLICY IF EXISTS "settings_upsert_all" ON settings;
CREATE POLICY "settings_select_all" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_upsert_all" ON settings FOR ALL USING (true);

-- Storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('qr-codes', 'qr-codes', true) ON CONFLICT DO NOTHING;