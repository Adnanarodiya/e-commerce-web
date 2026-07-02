# Noorani Makatib — Book Store & Fulfillment System

**Master Plan**
Version 1.0 · Bilingual (English + Urdu) · Next.js + Supabase

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles](#3-user-roles)
4. [Business Rules](#4-business-rules)
5. [Customer Journey](#5-customer-journey)
6. [Admin Workflow](#6-admin-workflow)
7. [Packer Workflow](#7-packer-workflow)
8. [Database Schema](#8-database-schema)
9. [Bilingual & RTL](#9-bilingual--rtl)
10. [Authentication & Security](#10-authentication--security)
11. [Realtime Notifications](#11-realtime-notifications)
12. [Image Storage](#12-image-storage)
13. [Seed Catalog](#13-seed-catalog)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Deployment](#15-deployment)
16. [Open Decisions](#16-open-decisions)

---

## 1. Overview

Noorani Makatib is an online store that sells Islamic and Urdu educational books. The system has three faces:

- A **storefront** where customers browse books, build a cart, choose delivery and payment, and place orders.
- An **admin console** where the owner sees incoming orders, confirms them by phone, watches earnings and stock, manages the book catalog, and configures the UPI QR code.
- A **packer console** where the packing team receives confirmed orders, packs the box, and prints a shipping slip for the delivery person.

The store is fully **bilingual**: English (primary, left-to-right) and Urdu (right-to-left).

---

## 2. Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, Shadcn/Radix UI, lucide-react icons |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| i18n | Custom Language context (English + Urdu) |
| Hosting | Vercel |

---

## 3. User Roles

| Role | Access | Purpose |
| :--- | :--- | :--- |
| Customer | `/`, `/cart`, `/checkout` | Browse, cart, place orders (guest checkout). |
| Admin | `/admin` | Orders queue, analytics, ledger, stock, book CRUD, QR settings. |
| Packer | `/admin` (packer view) | `ready_to_pack` queue, box pack, print slip. |

Only staff with the `admin` or `packer` role can enter `/admin`. Customers are redirected away.

---

## 4. Business Rules

### 4.1 Cart
- A customer may add any number of book titles, each with its own quantity.
- `subtotal = sum(price × quantity)` across all cart lines.

### 4.2 Delivery method (chosen in cart)
Customer selects one of:
- **Courier**
- **Post**
- **In Person** (self-pickup)

### 4.3 Packaging charge

| Delivery | Charge |
| :--- | :--- |
| In Person | ₹0 |
| Courier / Post | `max(₹10, 1% of subtotal)` |

Worked examples (Courier):
- Subtotal ₹800 → `max(₹10, ₹8)` = **₹10**
- Subtotal ₹30,000 → 1% = **₹300**
- Subtotal ₹50,000 → 1% = **₹500**

### 4.4 Payment discount (tiered)
Discount applies **only when `subtotal ≥ ₹5,000`**:

| Payment method | Discount |
| :--- | :--- |
| Bank / UPI | 10% of subtotal |
| Cash (COD) | 15% of subtotal |
| Subtotal under ₹5,000 | 0% |

### 4.5 Total
```
total = max(0, subtotal − discount + packagingCharge)
```

### 4.6 Discount banner (bilingual, shown in cart)
- **English:** "Special Offer: Buy for ₹5,000 or more to get a 10% discount on Bank payments and a 15% discount on Cash payments!"
- **Urdu:** "خصوصی پیشکش: ₹5,000 یا اس سے زیادہ کی خریداری پر بینک ادائیگی پر %10 اور کیش پر %15 کی رعایت حاصل کریں!"

### 4.7 Book weight
- Every book has a `weight` in grams, **default 80g**.
- When an admin adds/edits a book, a **weight field** is available in the form.
- Weight is stored in the `books` table and can later be used to compute courier shipping cost.

---

## 5. Customer Journey

1. Browse the homepage, add books to the cart.
2. On the cart page, choose **delivery method** and **payment method**.
3. See live totals: subtotal, discount, packaging, total.
4. Proceed to checkout and fill in name, phone, address.
5. If paying by **Bank**, scan the UPI QR code and tick "I have paid". If **Cash**, pay on delivery.
6. Place the order. A unique Order ID (`NM-XXXXXX`) is generated.
7. Stock is decremented for each ordered book.
8. A thank-you screen confirms the order and Order ID.

---

## 6. Admin Workflow

The admin dashboard has four tabs.

### 6.1 Orders tab
- Lists all new, pending orders with: customer name, phone, address, items, quantities, delivery type, payment type, total.
- **Ready to Pack** button opens a confirmation dialog: "Calling {name} at {phone}... Are you sure?".
- On confirm, the order status becomes `ready_to_pack` and it is routed to the packer.
- A fulfillment history shows orders that are with the packer or packed.

### 6.2 Dashboard tab (analytics)
- Cards: **Stock Valuation**, **Bank Revenue**, **Cash Revenue**, **Total Revenue**.
- Time filter: **Day / Month / Year**.
- **Low Stock** list (quantity ≤ 3) with a reorder input per book.
- **Out of Stock** list (quantity = 0) with a restock input per book.
- **Ledger**: separate Bank and Cash statement line items for the filtered period.

### 6.3 Inventory tab (book CRUD)
- Create, read, update, delete books.
- Each book has: English name, Urdu name, price, stock, cover image, English description, Urdu description.

### 6.4 Settings tab
- Edit **UPI ID**, **Payee Name**, and **QR code image**.
- The QR code shown at checkout updates instantly when saved here.

---

## 7. Packer Workflow

1. The packer opens `/admin` (signed in as packer) and sees only orders with status `ready_to_pack`.
2. Each order card shows: customer name, phone, address, delivery type, and the full book list with per-book quantities.
3. The packer assembles the box, then clicks **Box Pack**.
4. The order is marked `packed` and `payment_confirmed`.
5. A **shipping slip** renders and the print dialog opens. The slip contains:
   - Order ID
   - Customer name, phone, address
   - Delivery type
   - Date
   - Pack contents (book name × quantity)
6. The printed slip is attached to the box for the delivery person.

---

## 8. Database Schema

### 8.1 `books`
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | BIGSERIAL | Primary key |
| name_en | TEXT | English title |
| name_ur | TEXT | Urdu title |
| price | NUMERIC(10,2) | Unit price ₹ |
| description_en | TEXT | English description |
| description_ur | TEXT | Urdu description |
| image | TEXT | Storage URL |
| stock | INTEGER | Current inventory |
| weight | INTEGER | Weight in grams, default 80 |
| created_at | TIMESTAMPTZ | Default now() |

### 8.2 `orders`
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | TEXT | Primary key, format `NM-XXXXXX`, unique |
| customer_name | TEXT | |
| customer_email | TEXT | |
| customer_phone | TEXT | |
| customer_address | TEXT | |
| delivery_type | TEXT | `courier` / `post` / `in_person` |
| payment_type | TEXT | `cash` / `bank` |
| subtotal | NUMERIC(10,2) | |
| discount | NUMERIC(10,2) | Default 0 |
| packaging_charge | NUMERIC(10,2) | Default 0 |
| total | NUMERIC(10,2) | |
| status | TEXT | `pending` / `ready_to_pack` / `packed` |
| payment_confirmed | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Default now() |

### 8.3 `order_items`
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | BIGSERIAL | Primary key |
| order_id | TEXT | FK → orders(id) ON DELETE CASCADE |
| book_id | BIGINT | FK → books(id) ON DELETE SET NULL |
| book_name | TEXT | Snapshot at purchase |
| quantity | INTEGER | |
| price | NUMERIC(10,2) | Snapshot at purchase |

### 8.4 `settings` (key/value)
Holds `upi_id`, `payee_name`, `qr_code_url`. Extensible for any global config.

### 8.5 `profiles` (for auth roles)
| Column | Type | Notes |
| :--- | :--- | :--- |
| id | UUID | FK → auth.users(id) ON DELETE CASCADE |
| email | TEXT | |
| role | TEXT | `customer` / `admin` / `packer` |

A trigger auto-creates a `profiles` row on signup with `role = 'customer'`. An admin manually promotes staff to `admin` or `packer`.

### 8.6 Indexes
- `orders(status)`, `orders(payment_type)`, `orders(created_at DESC)`, `order_items(order_id)`.

### 8.7 Row-Level Security
- `books`: public `SELECT`; only `admin` can insert/update/delete.
- `orders`, `order_items`: customers insert their own; `admin` and `packer` can select; `admin` can update status.
- `settings`: public `SELECT`; only `admin` can update.

---

## 9. Bilingual & RTL

- A language toggle in the header switches between **English** and **اردو**.
- When Urdu is active, the document direction becomes `rtl` and layouts mirror.
- All user-facing strings live in a single translation dictionary with `en` and `ur` keys. No hard-coded text in components.
- Urdu headings use a Nastaliq font for readability.
- The choice is persisted in `localStorage`.

---

## 10. Authentication & Security

**Decision: No authentication for the store.** Customers check out as guests — there is no login or signup flow.

- Customers never create accounts and never log in. Guest checkout only.
- Supabase Auth (email/password) is **not** used for customers.
- `/admin` is still protected, but with a **lightweight shared passcode** instead of user accounts. Anyone with the passcode can enter and switch between the admin and packer views.
- The passcode is stored as a setting/env value, not hard-coded in the client bundle.
- Row-Level Security on the database provides a second line of defense: public read for books/settings, admin-only writes via the service role key.

> See Open Decision D3 for the passcode method.

---

## 11. Realtime Notifications

- The admin dashboard subscribes to `orders` inserts via Supabase Realtime.
- A new order appears instantly with a "New order" toast, without a manual reload.
- The packer queue auto-refreshes when an order moves to `ready_to_pack`.
- A manual Reload button remains as a fallback.

---

## 12. Image Storage

- Two Supabase Storage buckets: `book-covers` and `qr-codes`.
- Admin can **upload** a new QR image file (not just paste a URL) in the Settings tab.
- Admin can **upload** book cover images when adding or editing a book in the Inventory tab.
- Uploaded files are stored in Supabase Storage; the public URL is saved in the relevant table.

---

## 13. Seed Catalog

The store launches with the Noorani Makatib book list. Prices in ₹. Stock is a suggested default.

| # | English title | Urdu title | Price | Stock |
| -: | :--- | :--- | ---: | ---: |
| 1 | Taysirul Quran | تیسیرالقرآن - آسان اردو ترجمہ مع تشریحی فوائد | 750 | 50 |
| 2 | Dekhi Hui Duniya - Part 1 | دیکھی ہوئی دنیا - ۱ (زیروس کاپی) | 90 | 45 |
| 3 | Dekhi Hui Duniya - Part 2 | دیکھی ہوئی دنیا - ۲ (زیروس کاپی) | 90 | 60 |
| 4 | Al-Arbaeen Al-Malkiyyah | الاربعون الملکیہ | 90 | 30 |
| 5 | Al-Arbaeen Al-Madaniyyah | الاربعون المدنیہ | 90 | 40 |
| 6 | Dekhi Hui Duniya - Part 3 | دیکھی ہوئی دنیا - ۳ | 90 | 50 |
| 7 | Dekhi Hui Duniya - Part 4 | دیکھی ہوئی دنیا - ۴ | 70 | 25 |
| 8 | Dekhi Hui Duniya - Part 5 | دیکھی ہوئی دنیا - ۵ | 70 | 35 |
| 9 | Dekhi Hui Duniya - Part 6 | دیکھی ہوئی دنیا - ۶ | 90 | 20 |
| 10 | Dekhi Hui Duniya - Part 7 | دیکھی ہوئی دنیا - ۷ | 60 | 15 |
| 11 | Syllabus Of Maktab | نصاب مکتب | 100 | 100 |
| 12 | Quran Majeed (Gujarati Hashiya) | قرآن مجید (مع گجراتی حاشیہ و ہدایات) | 325 | 10 |
| 13 | Quran Majeed (Urdu Hashiya) | قرآن مجید (مع اردو حاشیہ و ہدایات) | 325 | 10 |
| 14 | Quran Majeed (Pocket Size) | قرآن مجید (یبیج سائز پانچ-پانچ پارے والا) | 200 | 30 |
| 15 | Haroof-e-Tahajji Takhti | حروف تہجی تختی (جدید) | 10 | 200 |
| 16 | Rauzatul Atfal | روضۃ الاطفال | 90 | 80 |
| 17 | Bachon Ka Tohfa - Part 1 | بچوں کا تحفہ - ۱ | 80 | 150 |
| 18 | Bachon Ka Tohfa - Part 2 | بچوں کا تحفہ - ۲ | 125 | 150 |
| 19 | Seh Parah (3 Parah) English Edition | Seh Parah (3 Parah) English Edition | 70 | 40 |
| 20 | Para E Amm English Edition | Para E Amm English Edition | 120 | 80 |
| 21 | Rauzatul Atfal English Edition | Rauzatul Atfal English Edition | 200 | 60 |
| 22 | Bachcho Ka Tohfa-1 English Edition | Bachcho Ka Tohfa-1 English Edition | 100 | 90 |
| 23 | Bachon Ko Parhane Ka Tariqa | بچوں کو پڑھانے کا طریقہ | 120 | 50 |
| 24 | Bachon Ko Hifz Kaise Karayein? | بچوں کو حفظ کیسے کروائیں؟ | 130 | 5 |
| 25 | Rahbar-e-Muavin | رہبر معاون و ممتحن مع مکاتب کے اہم امور | 30 | 100 |
| 26 | Noorani Makatib Taaruf (B&W) | نورانی مکاتب تعارف تفصیلی (بلیک وائٹ کاپی) | 70 | 120 |
| 27 | Noorani Makatib Taaruf (Color) | نورانی مکاتب تعارف اجمالی (کلر کاپی) | 150 | 100 |
| 28 | Complete Quran Sharif Audio USB | مکمل قرآن شریف آڈیو تفسیر پین ڈرائیو | 425 | 20 |

> Verify this list against the source PDF before seeding.

---

## 14. Implementation Roadmap

### Phase 1 — Real catalog and pricing (no backend needed)
- [ ] Seed the 28 real books (replace the placeholder books).
- [ ] Add bilingual descriptions and cover images for each.
- [ ] Confirm the storefront and inventory tab show the full catalog.
- [ ] Fix the packaging formula to `max(₹10, 1% of subtotal)`.

### Phase 2 — Supabase go-live
- [ ] Create the Supabase project and run the schema (with `profiles`, indexes, RLS).
- [ ] Seed the 28 books via SQL.
- [ ] Set environment variables; verify reads and writes hit Supabase.
- [ ] Add stock validation at checkout (reject quantity above available stock).
- [ ] Make Order ID generation collision-safe.

### Phase 3 — Authentication and admin protection
- [ ] Enable Supabase Auth (email + password).
- [ ] Create `profiles` table and signup trigger.
- [ ] Add `/login` page and protect `/admin` server-side.
- [ ] Drive the role from the database; remove the client toggle in production.
- [ ] Apply and verify RLS policies.

### Phase 4 — Realtime and image uploads
- [ ] Subscribe the admin dashboard to realtime order inserts.
- [ ] Add a "New order" toast and auto-refresh.
- [ ] Create `book-covers` and `qr-codes` storage buckets.
- [ ] Add QR image upload in Settings.
- [ ] Add cover image upload in Inventory CRUD.

### Phase 5 — Polish and launch
- [ ] Print CSS to isolate the shipping slip.
- [ ] Wire storefront search to the product grid.
- [ ] Optional customer order history page.
- [ ] Urdu Nastaliq font and RTL spacing audit.
- [ ] Mobile QA in both languages.
- [ ] Deploy to Vercel and run the schema on the production database.

---

## 15. Deployment

```bash
# Environment variables (.env.local for dev, Vercel settings for prod)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>   # server only

# 1. Run the schema in the Supabase SQL editor.
# 2. Seed the 28 books.
# 3. Create storage buckets: book-covers, qr-codes.
# 4. Enable email/password auth; create admin and packer users; set roles.
# 5. Install and run.
npm install
npm run dev     # development
npm run build   # production build
```

---

## 16. Open Decisions

1. **Packaging formula** — confirm `max(₹10, 1% of subtotal)` for Courier/Post, ₹0 for In Person.
2. **Book catalog** — confirm the 28-book list (names, prices, stock, weights) against the source PDF.
3. **Admin/packer gate method** — since there is no auth, gate `/admin` with a shared passcode (recommended) vs. no gate at all. Confirm the passcode approach.
4. **Bank payment verification** — should bank orders require manual admin verification before "Ready to Pack"?
5. **Monorepo** — keep the single Next.js app (recommended), or split into a Turborepo monorepo?

> Resolved: No customer authentication — guest checkout only. Book `weight` field (default 80g) added to the schema.
