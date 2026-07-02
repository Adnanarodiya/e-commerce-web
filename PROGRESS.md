# Noorani Makatib — Progress Tracker

> Living document. Update the status of every task as work happens.
> Last updated: Phase 1 complete (catalog + pricing)

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
| ✅ Done | 45 |
| 🔄 In progress | 0 |
| ⬜ Pending | 13 |
| 🔴 Blocked | 1 |
| ❌ Cancelled | 1 |
| **Active total** | **58** |

**Overall completion: ~78%** (45 / 58 active tasks)

> Blocked item: seeding the real 28-book catalog, pending confirmation of the book list against the source PDF. A 10-book dummy catalog (with weight) is in place for development.

---

## Decisions Locked In

- **D1 — Packaging (weight-based):** ₹10 per kg, rounded up to the next whole kg, for Courier/Post; ₹0 In Person. Total weight = Σ(book.weight × quantity). ✅ Implemented in `context/CartContext.tsx`. *(1 kg = ₹10, 10 kg = ₹100. Confirm if you want exact kg instead of rounding up.)*
- **No authentication for the store:** customers check out as guests. No login/signup flow. ❌ Supabase Auth for customers is cancelled.
- **Admin/Packer access (passcode gate):** ✅ Implemented. `middleware.ts` protects `/admin`; staff enter a shared passcode at `/admin/login` → httpOnly cookie (12h). Passcode = `ADMIN_PASSCODE` env var (server-side; default `noorani2026` — **change it!**). Role switch (admin/packer) in header, staff-only.
- **Book weight:** every book has a `weight` field in grams, **default 80g**, editable in the admin book form. ✅ Implemented in schema, `lib/supabase.ts`, admin form, product card, product page, and cart.
- **Supabase:** ✅ LIVE. Project URL + anon key in `.env.local`; schema run remotely (4 tables + `weight` column + 10 dummy books + settings). App reads/writes the real DB. ⚠️ `SUPABASE_SERVICE_ROLE_KEY` still a placeholder; indexes/RLS not yet applied (RLS limited by the no-auth decision).

---

## Phase 0 — Planning & Setup

- [x] Audit current codebase and document status
- [x] Write master plan (`MASTER_PLAN.md`)
- [x] Create this progress tracker (`PROGRESS.md`)
- [ ] 🟡 Confirm 28-book catalog against PDF *(blocked — I cannot read the PDF; need the list as text/CSV)* 🔴
- [ ] 🟡 Final sign-off on packaging formula (D1)
- [x] ✅ Confirm admin/packer gate method → passcode (implemented)
- [x] ✅ Receive Supabase project URL + anon key
- [x] ✅ Create `.env.local` with Supabase credentials (⚠️ service_role key still needs the real value)

---

## Phase 1 — Catalog & Pricing (no backend needed)

### Catalog & Data
- [x] ✅ Bilingual book data model (`name_en/ur`, `description_en/ur`)
- [x] ✅ Admin book CRUD (add / edit / delete)
- [x] ✅ Add **weight** field to `books` (default 80g) — schema + `lib/supabase.ts` + admin form + product card
- [x] ✅ Seed 10 **dummy** books (with weight) for development — replaces 6 placeholders
- [ ] ⬜ Seed the 28 **real** books once the PDF list is confirmed *(blocked on Phase 0 catalog confirmation)* 🔴
- [ ] ⬜ Add bilingual descriptions + cover image URLs for all 28 real books

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
- [x] ✅ Run schema on Supabase (tables + `weight` + 10 dummy books + settings) — verified live
- [ ] ⬜ Add DB indexes + RLS hardening *(RLS limited by no-auth; admin writes use anon key)*
- [ ] ⬜ Seed 28 real books in Supabase *(blocked on PDF catalog confirmation)* 🔴
- [x] ✅ Set env vars; verify app reads/writes hit Supabase

---

## Phase 3 — Admin & Packer Access (no auth)

- [x] ✅ Guest checkout only (no customer accounts)
- [x] ❌ Supabase Auth for customers — cancelled (not wanted)
- [x] ✅ Lightweight admin/packer gate (shared passcode) — no user accounts
- [x] ✅ Protect `/admin` route with the passcode (`middleware.ts` + httpOnly cookie)
- [x] ✅ Role switch (admin / packer) within the gated area (header dropdown, staff-only)

---

## Phase 4 — Realtime & Image Uploads

### Admin Console (remaining)
- [x] ✅ Dashboard analytics (stock valuation, bank/cash/total revenue)
- [x] ✅ Day / month / year filter
- [x] ✅ Low stock + out-of-stock lists with reorder
- [x] ✅ Ledger (bank + cash statements)
- [x] ✅ Pending orders list with full details
- [x] ✅ "Ready to Pack" + call-confirmation modal
- [x] ✅ Fulfillment history
- [x] ✅ Books CRUD modal
- [x] ✅ QR / UPI settings editor
- [ ] ⬜ QR image **upload** (file → storage, not just URL)
- [ ] ⬜ Book cover image **upload** in CRUD

### Packer Console (remaining)
- [x] ✅ `ready_to_pack` queue
- [x] ✅ Order card (name, phone, address, items, qty, delivery type)
- [x] ✅ "Box Pack" action (status → packed, `payment_confirmed`)
- [x] ✅ Printable shipping slip
- [ ] ⬜ Print CSS to isolate the slip (`@media print`)

### Realtime
- [ ] ⬜ Subscribe admin dashboard to realtime `orders` inserts
- [ ] ⬜ "New order" toast notification
- [ ] ⬜ Packer queue auto-refresh on status change

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
| 2026-07-02 | Supabase LIVE: logged in via PAT, linked project `jbajhdoewljxwmzgmxqf`, ran `lib/schema.sql` remotely (4 tables + `weight` column + 10 dummy books + settings). Verified tables, books (with weight), and settings. App now reads/writes real Supabase DB. Fixed `.env.local` CLI-parse issue. 45/58 (~78%). ⚠️ PAT should be revoked. |
| 2026-07-02 | Phase 2 (checkout) + Phase 3 (admin gate) done: stock validation at checkout, collision-safe Order ID (`db.orderExists`), no-auth passcode gate (`middleware.ts` + `/admin/login` + `/api/admin/verify` + httpOnly cookie), staff-only role switch, logout button. `ADMIN_PASSCODE=noorani2026` added to `.env.local` (change it). Build passes. 42/57 (~74%). |
| 2026-07-02 | Phase 1 complete: added `weight` field (default 80g) to schema + DB + admin CRUD + product card + product page; seeded 10 dummy books; migrated product page to DB; switched packaging to weight-based ₹10/kg; configured `.env.local` (anon key OK, service key placeholder). Build passes. 38/57 (~67%). |
| 2026-07-02 | Tracker created from codebase audit. 31 tasks done, 24 pending, 1 blocked, 1 cancelled (customer auth). Added weight-field task and no-auth decision. |
