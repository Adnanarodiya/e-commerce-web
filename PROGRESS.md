# Noorani Makatib — Progress Tracker

> Living document. Update the status of every task as work happens.
> Last updated: Phase 0–4 complete (catalog from PRICE LIST.xlsx + Phase 4 features)

---

## How To Use This File

- Check the box `- [x]` when a task is done; keep `- [ ]` when pending.
- Status icons: ✅ Done · 🔄 In progress · ⬜ Pending · 🔴 Blocked · ❌ Cancelled
- Update the **Progress Summary** counts whenever you tick a box.
- Log every meaningful change in the **Changelog** at the bottom.

---

## Progress Summary

| Status | Count |
| :--- | ---: |
| ✅ Done | 56 |
| 🔄 In progress | 0 |
| ⬜ Pending | 6 |
| 🔴 Blocked | 0 |
| ❌ Cancelled | 1 |
| **Active total** | **62** |

**Overall completion: ~90%** (56 / 62 active tasks)

> Catalog seeded from `PRICE LIST.xlsx` — **68 books**. Blank or zero MRP → **₹333**. No cover images yet; gray placeholder with book name shown everywhere.

---

## Decisions Locked In

- **D1 — Packaging (weight-based):** ₹10 per kg, rounded up to the next whole kg, for Courier/Post; ₹0 In Person. ✅ Implemented in `context/CartContext.tsx`.
- **D2 — Book catalog:** ✅ Confirmed from `PRICE LIST.xlsx` (68 books). Regenerate via `npm run generate-catalog`.
- **No authentication for the store:** customers check out as guests. ❌ Supabase Auth for customers is cancelled.
- **Admin/Packer access (passcode gate):** ✅ Implemented. `middleware.ts` protects `/admin`.
- **Book images:** ✅ Fallback placeholder (gray bg + book name). Real uploads optional via admin.
- **Supabase:** ✅ LIVE. Run `lib/seed-catalog.sql` + `lib/schema-hardening.sql` on remote DB to sync 68 books, indexes, RLS.

---

## Phase 0 — Planning & Setup

- [x] Audit current codebase and document status
- [x] Write master plan (`MASTER_PLAN.md`)
- [x] Create this progress tracker (`PROGRESS.md`)
- [x] ✅ Confirm catalog from `PRICE LIST.xlsx` (68 books)
- [x] ✅ Final sign-off on packaging formula (D1 — weight-based)
- [x] ✅ Confirm admin/packer gate method → passcode (implemented)
- [x] ✅ Receive Supabase project URL + anon key
- [x] ✅ Create `.env.local` with Supabase credentials (⚠️ set real `SUPABASE_SERVICE_ROLE_KEY` for uploads)

---

## Phase 1 — Catalog & Pricing (no backend needed)

### Catalog & Data
- [x] ✅ Bilingual book data model (`name_en/ur`, `description_en/ur`)
- [x] ✅ Admin book CRUD (add / edit / delete)
- [x] ✅ Add **weight** field to `books` (default 80g)
- [x] ✅ Seed **68 real books** from `PRICE LIST.xlsx` (`lib/catalog.ts`)
- [x] ✅ Bilingual descriptions for all books (auto-generated templates)
- [x] ✅ Gray **fallback image** (book name centered) when no cover URL

### Pricing & Cart
- [x] ✅ Cart add/remove/update qty + `localStorage` persistence
- [x] ✅ Subtotal calculation
- [x] ✅ Tiered discount (10% bank / 15% cash above ₹5,000)
- [x] ✅ Delivery method selection (Courier / Post / In Person)
- [x] ✅ Payment method selection (Cash / Bank)
- [x] ✅ Bilingual discount banner + "add ₹X more" hint
- [x] ✅ Fix packaging formula → weight-based ₹10/kg (rounded up to next kg)

---

## Phase 2 — Supabase Go-Live

### Checkout & Orders
- [x] ✅ Shipping form with validation
- [x] ✅ QR code display (bank) loaded from settings
- [x] ✅ "I have paid" confirmation (bank)
- [x] ✅ Order insertion + stock decrement
- [x] ✅ Success screen with Order ID
- [x] ✅ Stock validation at checkout (prevent overselling)
- [x] ✅ Collision-safe Order ID generation (`db.orderExists` + retry loop)

### Supabase Backend
- [x] ✅ DB abstraction wrapper (`lib/supabase.ts`) with `localStorage` fallback
- [x] ✅ Base schema (`books`, `orders`, `order_items`, `settings`)
- [x] ✅ Add `weight` column to `books` in `lib/schema.sql`
- [x] ✅ Migrate product detail page from static JSON to DB (`db.getBook`)
- [x] ✅ Create Supabase project (`jbajhdoewljxwmzgmxqf`)
- [x] ✅ Run schema on Supabase
- [x] ✅ `lib/seed-catalog.sql` — 68-book seed script (run on remote DB)
- [x] ✅ `lib/schema-hardening.sql` — indexes + RLS policies
- [x] ✅ Set env vars; verify app reads/writes hit Supabase

---

## Phase 3 — Admin & Packer Access (no auth)

- [x] ✅ Guest checkout only (no customer accounts)
- [x] ❌ Supabase Auth for customers — cancelled (not wanted)
- [x] ✅ Lightweight admin/packer gate (shared passcode)
- [x] ✅ Protect `/admin` route with the passcode (`middleware.ts` + httpOnly cookie)
- [x] ✅ Role switch (admin / packer) within the gated area

---

## Phase 4 — Realtime & Image Uploads

### Admin Console
- [x] ✅ Dashboard analytics (stock valuation, bank/cash/total revenue)
- [x] ✅ Day / month / year filter
- [x] ✅ Low stock + out-of-stock lists with reorder
- [x] ✅ Ledger (bank + cash statements)
- [x] ✅ Pending orders list with full details
- [x] ✅ "Ready to Pack" + call-confirmation modal
- [x] ✅ Fulfillment history
- [x] ✅ Books CRUD modal
- [x] ✅ QR / UPI settings editor
- [x] ✅ QR image **upload** (file → `qr-codes` bucket via `/api/admin/upload`)
- [x] ✅ Book cover image **upload** in CRUD (`book-covers` bucket)

### Packer Console
- [x] ✅ `ready_to_pack` queue
- [x] ✅ Order card (name, phone, address, items, qty, delivery type)
- [x] ✅ "Box Pack" action (status → packed, `payment_confirmed`)
- [x] ✅ Printable shipping slip
- [x] ✅ Print CSS to isolate the slip (`.shipping-slip-print` in `globals.css`)

### Realtime
- [x] ✅ Subscribe admin/packer dashboard to realtime `orders` inserts + updates
- [x] ✅ "New order" toast notification
- [x] ✅ Packer queue auto-refresh on status change

---

## Phase 5 — Bilingual Polish & Launch

### Bilingual & RTL
- [x] ✅ Language context + dictionary (en / ur)
- [x] ✅ RTL direction switching
- [x] ✅ Language toggle in header
- [ ] ⬜ Urdu Nastaliq font for headings
- [ ] ⬜ RTL spacing audit across all pages

### Polish
- [ ] ⬜ Wire storefront search to the product grid
- [ ] ⬜ Optional: customer order history page
- [ ] ⬜ Mobile QA in both languages
- [ ] ⬜ Deploy to Vercel + run schema on production DB

---

## Future / Optional (not counted in totals)

- [ ] Use book **weight** to compute courier shipping cost (instead of flat packaging fee)
- [ ] Turborepo monorepo split (only if multiple apps planned)
- [ ] Order status notifications to customers (SMS / WhatsApp)

---

## Changelog

| Date | Change |
| :--- | :--- |
| 2026-07-03 | Phase 0–4 complete: parsed `PRICE LIST.xlsx` → 68 books in `lib/catalog.ts` (blank/zero price → ₹333); `BookImage` fallback (gray + name); `lib/seed-catalog.sql` + `schema-hardening.sql`; QR/cover uploads via `/api/admin/upload`; realtime order subscriptions + toast; print CSS for shipping slip. Build passes. 56/62 (~90%). |
| 2026-07-02 | Supabase LIVE: logged in via PAT, linked project `jbajhdoewljxwmzgmxqf`, ran `lib/schema.sql` remotely. 45/58 (~78%). |
| 2026-07-02 | Phase 2 (checkout) + Phase 3 (admin gate) done. Build passes. 42/57 (~74%). |
| 2026-07-02 | Phase 1 complete: weight field, 10 dummy books, weight-based packaging. Build passes. 38/57 (~67%). |
| 2026-07-02 | Tracker created from codebase audit. |