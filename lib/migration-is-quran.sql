-- Migration: add is_quran flag to books
-- Run this in the Supabase SQL editor after lib/schema.sql

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS is_quran BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: only "Quran Sharif" (exact, case-sensitive) is treated as a Quran item.
-- All other Quran-named books (Qurani Khawatin, Taiserul Quran, etc.) remain regular
-- books and continue to qualify for the 10% / 15% payment discount.
UPDATE books
SET is_quran = TRUE
WHERE name_en = 'Quran Sharif' OR name_ur = 'Quran Sharif';

-- Helpful index for filtering Quran items in ledger / cart calculations
CREATE INDEX IF NOT EXISTS books_is_quran_idx ON books (is_quran) WHERE is_quran = TRUE;