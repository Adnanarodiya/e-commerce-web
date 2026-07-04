-- Migration: add is_quran flag to books
-- Quran Sharif gets a flat ₹25/copy discount and never qualifies for the 10%/15% payment discount.
-- All other books (including other Quran-named titles) remain regular and stay eligible for % discount.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS is_quran BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: TRUE only for "Quran Sharif" (exact match, case-sensitive)
UPDATE books
SET is_quran = TRUE
WHERE name_en = 'Quran Sharif' OR name_ur = 'Quran Sharif';

-- Index for quick filtering of Quran items in ledger/cart calculations
CREATE INDEX IF NOT EXISTS books_is_quran_idx
  ON books (is_quran)
  WHERE is_quran = TRUE;