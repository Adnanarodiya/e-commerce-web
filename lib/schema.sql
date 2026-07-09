-- Database Schema for BloomShop

-- 1. Create books table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ur TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL DEFAULT 0, -- Purchase / buying price
  description_en TEXT,
  description_ur TEXT,
  image TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 80, -- Weight in grams (default 80g per book)
  is_quran BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE only for Quran Sharif (flat ₹25/copy discount, no % discount)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- We'll use order IDs like "NM-123456"
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'courier' | 'post' | 'in_person'
  payment_type TEXT NOT NULL,  -- 'cash' | 'bank'
  subtotal NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  packaging_charge NUMERIC NOT NULL DEFAULT 0,
  courier_charge NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'ready_to_pack' | 'packed' | 'cancelled'
  payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  packed_at TIMESTAMP WITH TIME ZONE,
  pickup_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  pickup_confirmed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
  book_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

-- 4. Create settings table (for QR Code, UPI ID etc.)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('upi_id', '9426880068@kotak')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value) VALUES
('payee_name', 'ADNAN IBADULLAH ARODIYA')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value) VALUES
('qr_code_url', '/images/qr-code.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed the 68-book catalog from PRICE LIST.xlsx:
-- Run lib/seed-catalog.sql in the Supabase SQL editor after this schema.
-- Then run lib/schema-hardening.sql for indexes and RLS policies.
