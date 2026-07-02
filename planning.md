# Noorani Makatib — Bilingual Book Store & Fulfillment System

> **Master Plan & Implementation Roadmap**
> A single-page store (English + Urdu) for selling books, with a Supabase backend, an Admin console, and a Packer console with printable shipping slips.

This document is the **single source of truth**. It records (a) what is already built, (b) what remains, (c) the exact business rules, (d) the database design, (e) the step-by-step roadmap, and (f) open decisions that need your confirmation.

---

## 0. How To Read This Document

- ✅ = already implemented in the current codebase (with file reference).
- ⚠️ = partially implemented / needs hardening.
- ❌ = not yet implemented (a roadmap task).
- 🟡 = open decision — needs your confirmation before we build.

Jump to: [Section 5 (Business Rules)](#5-business-rules--pricing), [Section 10 (Roadmap)](#10-phased-roadmap), [Section 12 (Open Decisions)](#12-open-decisions--questions).

---

## 1. Tech Stack

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| Frontend | **Next.js 16** (App Router) + **React 19** | Already in use (`package.json`). |
| Styling | **Tailwind CSS 4** + Shadcn/Radix UI | OKLCH design tokens in `app/globals.css`. |
| Language | **TypeScript 5** | Strict types for all entities. |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Realtime) | Wrapper already exists (`lib/supabase.ts`). |
| Icons | lucide-react | Already used. |
| i18n | Custom context (`context/LanguageContext.tsx`) | English (LTR, primary) + Urdu (RTL). |
| Images | `next/image` + Supabase Storage | For book covers and the UPI QR code. |
| Deployment | Vercel (recommended) | Env vars in Section 11. |

**Note on "Turborepo":** You mentioned *"turbo rapport"*. The project is currently a single Next.js app, which is simpler and fine for this scope. Splitting storefront + admin into a Turborepo monorepo is **optional** and only worth it if you plan multiple separate apps. See [Open Decision D6](#d6--turborepo). **Recommended: stay single-app for now.**

---

## 2. System Architecture

```
┌──────────────┐   add to cart    ┌──────────────────┐   insertOrder    ┌────────────────────────┐
│  Customer    │ ───────────────▶ │ Cart & Checkout  │ ───────────────▶ │  Supabase Postgres     │
│  (storefront)│                  │  pricing engine  │                  │  books / orders /      │
│              │                  │ delivery+payment │                  │  order_items / settings│
└──────────────┘                  └──────────────────┘                  └───────────┬────────────┘
                                                                                    │ Realtime
                                                                       ┌────────────┴────────────┐
                                                                       ▼                         ▼
                                                              ┌─────────────────┐      ┌─────────────────┐
                                                              │  Admin Console  │      │ Packer Console  │
                                                              │ (/admin)        │      │ (/admin, role)  │
                                                              │ - orders queue  │      │ - ready_to_pack │
                                                              │ - analytics     │      │ - box pack      │
                                                              │ - ledger        │      │ - print slip    │
                                                              │ - books CRUD    │      └─────────────────┘
                                                              │ - QR settings   │
                                                              └─────────────────┘
```

**Key idea:** One shared Next.js app. The `/admin` route renders different UI based on the signed-in user's role (`admin` or `packer`). Customers never see `/admin`.

---

## 3. Roles & Access Model

| Role | Sees | Can do |
| :--- | :--- | :--- |
| **Customer** | Storefront (`/`, `/product/[id]`, `/cart`, `/checkout`) | Browse, add to cart, place orders. |
| **Admin** | `/admin` (Admin view) | See incoming orders, call-confirm → "Ready to Pack", view analytics & ledger, reorder stock, CRUD books, edit QR/UPI. |
| **Packer** | `/admin` (Packer view) | See `ready_to_pack` orders only, click "Box Pack", print shipping slip. |

Currently roles are a **localStorage toggle** in the header (testing only). ❌ This must be replaced with **Supabase Auth** + a `profiles` table with `role` column, and route protection on `/admin`. See [Section 8](#8-authentication--security-model-not-yet-implemented).

---

## 4. Current Implementation Status

The project is **~80% feature-complete** as a working prototype with a localStorage mock DB. Below is the honest audit.

### ✅ Already working
- **Bilingual + RTL** — `context/LanguageContext.tsx`: `en`/`ur` dictionary, `dir` switching, persisted in `localStorage`. Language switcher in `components/layout/Header.tsx:121`.
- **Cart engine** — `context/CartContext.tsx`: add/remove/update qty, persist to `localStorage`, plus `deliveryType`, `paymentType`, and live `subtotal`/`discount`/`packagingCharge`/`total`.
- **Pricing rules** — `context/CartContext.tsx:86-107`: 10% bank / 15% cash above ₹5,000; packaging ₹10 / ₹500-at-₹50K. *(Formula needs confirmation — see D1.)*
- **Checkout** — `app/checkout/page.tsx`: shipping form with validation, payment choice, dynamic UPI/QR loaded from DB settings, "I have paid" confirmation, order insertion with stock deduction, success screen with Order ID.
- **Storefront** — `components/home/ProductList.tsx` loads books via `db.getBooks()`; `app/page.tsx`; `components/home/ProductCard.tsx`.
- **Admin dashboard** — `app/admin/page.tsx`: tabbed UI (Dashboard / Orders / Inventory / Settings), revenue cards (stock valuation, bank, cash, total) with day/month/year filter, low-stock + out-of-stock reorder panel, bank/cash ledger, pending orders with "Ready to Pack" + **call-confirmation modal**, fulfillment history, books CRUD modal, QR/UPI settings editor.
- **Packer view** — `app/admin/page.tsx:305`: `ready_to_pack` queue, "Box Pack" action (sets `packed` + `payment_confirmed`), printable shipping slip overlay with `window.print()`.
- **DB abstraction** — `lib/supabase.ts`: a unified `db` object that uses Supabase when env vars are present, otherwise falls back to a `localStorage` mock. CRUD for books, orders, order_items, settings.
- **Schema SQL** — `lib/schema.sql`: `books`, `orders`, `order_items`, `settings` tables + seed.

### ⚠️ Needs hardening
- **Packaging formula** (`context/CartContext.tsx:88-94`): flat ₹10 / ₹500-at-50K. Likely should be `max(₹10, 1% of subtotal)`. See [D1](#d1--packaging-charge-formula).
- **Print slip** (`app/admin/page.tsx:289`): `window.print()` prints the whole page. Needs `@media print` CSS to isolate only the slip.
- **Order ID** (`app/checkout/page.tsx:122`): random `NM-XXXXXX` can collide. Should check uniqueness or use a DB sequence.
- **`products.json`** (`data/products.json`): vestigial — `ProductList` no longer uses it. Remove or keep only as an offline fallback seed.

### ❌ Not yet implemented (roadmap)
1. **Real book catalog** — the 28 books from your PDF are **not seeded**. Code only has 6 placeholder books. *(This is the #1 gap.)*
2. **Supabase Auth** + role-protected `/admin`.
3. **Realtime notifications** — admin must currently click "Reload Data". Should use Supabase Realtime subscriptions so new orders appear live.
4. **Image uploads** — QR code & book covers are URL text fields only. Need Supabase Storage upload.
5. **Stock validation at checkout** — cart quantity is not checked against available stock; overselling is possible.
6. **Customer order history** — a logged-in customer cannot see past orders.
7. **Storefront search** — the header search box (`Header.tsx:106`) is not wired to filter products.
8. **Production deployment** — env vars, Supabase project, RLS policies not documented.

---

## 5. Business Rules & Pricing

These are the exact rules the cart/checkout must enforce. **All implemented except the packaging formula (needs confirmation).**

### 5.1 Cart
- A customer may add **many book types** (e.g. 10 types), each with its own **quantity** (e.g. 50 each). ✅
- `subtotal = Σ (book.price × quantity)` for all cart lines. ✅

### 5.2 Delivery method (chosen in cart)
Customer picks one of three: **Courier**, **Post**, or **In Person**. ✅ (`components/cart/OrderSummary.tsx:42`)

### 5.3 Packaging charge
| Delivery | Rule |
| :--- | :--- |
| In Person | ₹0 (free) |
| Courier / Post | **max(₹10, 1% of subtotal)** *(recommended — see D1)* |

> Example (recommended formula): subtotal ₹50,000 → 1% = ₹500 ✅. subtotal ₹800 → max(₹10, ₹8) = ₹10 ✅. subtotal ₹30,000 → ₹300.
>
> **Current code** does flat ₹10 then jumps to ₹500 at ₹50K — which under-charges mid-range orders. Needs your sign-off. 🟡 **D1**

### 5.4 Payment-based discount (tiered)
Applies **only when `subtotal ≥ ₹5,000`**:
| Payment | Discount |
| :--- | :--- |
| Bank / UPI | **10%** of subtotal |
| Cash (COD) | **15%** of subtotal |
| subtotal < ₹5,000 | 0% |

✅ Implemented in `context/CartContext.tsx:96-104`.

### 5.5 Total
`total = max(0, subtotal − discount + packagingCharge)` ✅

### 5.6 Bilingual discount banner (in cart)
Shown in both languages so customers know the offer. ✅ Keys `discountBanner` in `LanguageContext.tsx:52` & `:139`. Also a dynamic "add ₹X more to unlock" hint in `OrderSummary.tsx:155`.

> **English:** *"🎉 Special Offer: Buy for ₹5,000 or more to get a 10% discount on Bank payments and a 15% discount on Cash payments!"*
>
> **Urdu:** *"🎉 خصوصی پیشکش: ₹5,000 یا اس سے زیادہ کی خریداری پر بینک ادائیگی پر %10 اور کیش پر %15 کی رعایت حاصل کریں!"*

---

## 6. Database Schema (Supabase / Postgres)

Existing in `lib/schema.sql`. Below is the **target** schema including Auth, indexes, and Row-Level Security. Tables already present are marked; new ones are ❌.

### 6.1 `books` ✅ (exists)
```sql
CREATE TABLE books (
  id            BIGSERIAL PRIMARY KEY,
  name_en       TEXT NOT NULL,
  name_ur       TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  description_en TEXT,
  description_ur TEXT,
  image         TEXT NOT NULL,        -- Supabase Storage URL
  stock         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.2 `orders` ✅ (exists)
```sql
CREATE TABLE orders (
  id                TEXT PRIMARY KEY,            -- "NM-XXXXXX", must be unique
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_address  TEXT NOT NULL,
  delivery_type     TEXT NOT NULL,   -- 'courier' | 'post' | 'in_person'
  payment_type      TEXT NOT NULL,   -- 'cash' | 'bank'
  subtotal          NUMERIC(10,2) NOT NULL,
  discount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  packaging_charge  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'ready_to_pack' | 'packed'
  payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.3 `order_items` ✅ (exists)
```sql
CREATE TABLE order_items (
  id        BIGSERIAL PRIMARY KEY,
  order_id  TEXT REFERENCES orders(id) ON DELETE CASCADE,
  book_id   BIGINT REFERENCES books(id) ON DELETE SET NULL,
  book_name TEXT NOT NULL,     -- snapshot at purchase time
  quantity  INTEGER NOT NULL,
  price     NUMERIC(10,2) NOT NULL  -- snapshot at purchase time
);
```

### 6.4 `settings` (key/value) ✅ (exists)
Holds `upi_id`, `payee_name`, `qr_code_url`. Extendable for any global config.

### 6.5 `profiles` ❌ (NEW — for Auth roles)
```sql
CREATE TABLE profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT,
  role      TEXT NOT NULL DEFAULT 'customer'  -- 'customer' | 'admin' | 'packer'
);
```
A trigger copies new auth users into `profiles`; the admin manually sets `role='admin'`/`'packer'` for staff emails.

### 6.6 Recommended indexes ❌
```sql
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_payment     ON orders(payment_type);
CREATE INDEX idx_orders_created     ON orders(created_at DESC);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
```

### 6.7 Row-Level Security ❌ (critical before going live)
- `books`: public `SELECT`; only `admin` can `INSERT/UPDATE/DELETE`.
- `orders` / `order_items`: customers can `INSERT` their own; `admin`+`packer` can `SELECT`; `admin` can `UPDATE status`.
- `settings`: public `SELECT` (needed to render QR at checkout); only `admin` can `UPDATE`.

---

## 7. Workflow (the end-to-end game)

### 7.1 Customer places an order
1. Browses `/`, adds books (any type, any qty) → cart. ✅
2. In `/cart` chooses **Courier / Post / In Person** and **Cash / Bank**. ✅
3. Sees live subtotal, discount, packaging, total. ✅
4. Goes to `/checkout`, fills name/phone/address. ✅
5. If **Bank**: scans QR (loaded from `settings`), ticks "I have paid". If **Cash**: nothing to pay now. ✅
6. Clicks **Place Order** → `db.insertOrder` writes `orders` + `order_items` and **decrements book stock**. ✅
7. Sees thank-you screen with Order ID (`NM-XXXXXX`). ✅

### 7.2 Admin fulfils the order
1. New order appears in `/admin` → **Orders** tab (status `pending`). ⚠️ *Currently requires "Reload Data"; realtime will make it instant.*
2. Admin reviews name, phone, address, items, qty, delivery type, payment type, total. ✅
3. Admin clicks **Ready to Pack** → a **call-confirmation modal** opens: *"Calling {name} at {phone}… Are you sure?"* ✅ (`app/admin/page.tsx:914`)
4. Admin phones the customer to confirm details, then clicks **Confirm** → status becomes `ready_to_pack` and the order drops into the **Packer's** queue. ✅
5. Order also appears in **Fulfillment History** as "With Packer". ✅

### 7.3 Packer packs the box
1. Packer opens `/admin` (role = packer) → sees only `ready_to_pack` orders. ✅
2. Each card shows: customer name, phone, address, delivery type, and the full book list with per-book quantities. ✅
3. Packer clicks **Box Pack** → status becomes `packed`, `payment_confirmed` set true. ✅
4. A **printable shipping slip** renders (Order ID, name, phone, address, delivery type, pack contents) and the browser print dialog opens. ✅ *(Slip isolation needs print CSS.)*
5. Packer attaches the printed slip to the box for the delivery person.

### 7.4 Admin analytics & stock management
- **Dashboard tab**: Stock Valuation, Bank Revenue, Cash Revenue, Total Revenue — filterable by **Day / Month / Year**. ✅
- **Low Stock** (qty ≤ 3) and **Out of Stock** (qty = 0) lists with per-book **Reorder/Update** inputs. ✅
- **Ledger**: Bank Statement and Cash Statement line items for the filtered period. ✅
- **Inventory tab**: full **CRUD** for books (add/edit/delete, bilingual fields, price, stock, image). ✅
- **Settings tab**: edit UPI ID, Payee Name, QR code. ✅ *(Upload, not just URL, is a roadmap task.)*

---

## 8. Authentication & Security Model (NOT yet implemented)

Today, anyone can toggle `customer`/`admin`/`packer` from the header dropdown (`Header.tsx:131`). That is a **dev convenience only** and must be replaced before launch.

**Plan:**
1. Enable **Supabase Auth** (email + password). ❌
2. Create `profiles` table (6.5) and a trigger to auto-insert on signup. ❌
3. `/admin` route checks the session server-side; redirects non-staff to `/login`. ❌
4. Header role dropdown is removed for production; the role comes from the DB. ❌
5. Apply **RLS policies** (6.7) so the DB itself enforces who can read/write. ❌
6. Keep a hidden `/dev-role` toggle available **only in `NODE_ENV=development`** for testing. ❌

---

## 9. Realtime & Notifications (NOT yet implemented)

The user requirement: *"admin panel will notify… he can see that I have got this order."*

**Plan:** subscribe to the `orders` table with Supabase Realtime in `/admin`:
```ts
supabase.channel("orders")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
      () => refreshOrders())
  .subscribe();
```
- A toast/badge "New order!" appears instantly. ❌
- Packer's queue auto-refreshes when an order flips to `ready_to_pack`. ❌
- Falls back gracefully to the existing manual **Reload** button if realtime is unavailable. ✅ (already present)

---

## 10. Phased Roadmap

Each phase is independently shippable. Tackle in order.

### Phase 0 — Decisions & Data (do first)
- [ ] 🟡 Confirm **D1 packaging formula**.
- [ ] 🟡 Confirm **D2 book catalog** (28 books) against the PDF — I could not read the PDF directly; the table in Section 13 came from the prior planning draft and must be verified.
- [ ] 🟡 Decide **D3 auth model** (Supabase Auth email/password vs. magic link).
- [ ] Provide Supabase project URL + anon/service keys (`.env.local`).

### Phase 1 — Real Catalog Seed (highest-value, no backend needed)
- [ ] Replace the 6 placeholder books in `DEFAULT_BOOKS` (`lib/supabase.ts:58`) and in `lib/schema.sql:64` with the **28 real books** from Section 13.
- [ ] Add bilingual `description_en`/`description_ur` and real cover image URLs for each.
- [ ] Verify storefront (`/`) and admin Inventory tab show the full catalog.
- [ ] Fix **packaging formula** in `context/CartContext.tsx:88-94` per D1.

### Phase 2 — Supabase Go-Live (real DB)
- [ ] Create the Supabase project; run the **enhanced** schema (Section 6) incl. `profiles`, indexes, RLS.
- [ ] Seed the 28 books via SQL.
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; confirm `db.*` reads/writes hit Supabase (the wrapper auto-detects env vars).
- [ ] Add **stock validation** at checkout: reject/limit qty > `book.stock`.
- [ ] Make **Order ID** collision-safe (DB unique constraint + retry, or a sequence).

### Phase 3 — Auth & Admin Protection
- [ ] Enable Supabase Auth; create `profiles` + trigger.
- [ ] Add `/login` page; protect `/admin` server-side.
- [ ] Replace the header role-toggle with DB-driven role (dev toggle only in dev).
- [ ] Apply RLS policies; verify customer vs admin vs packer access.

### Phase 4 — Realtime & Image Uploads
- [ ] Add Supabase Realtime subscriptions in `/admin` (orders insert + status changes) with a "New order" toast.
- [ ] Add **Supabase Storage** buckets: `qr-codes` and `book-covers`.
- [ ] Admin Settings: upload QR image (file input → storage → save URL). Replace URL text field.
- [ ] Admin Inventory: upload cover image when adding/editing a book.

### Phase 5 — Polish & Launch
- [ ] Print CSS: `@media print` hides everything except the shipping slip.
- [ ] Wire storefront **search** to filter the product grid.
- [ ] Optional: customer order history page (`/orders`).
- [ ] Urdu Nastaliq font for headings; audit RTL spacing.
- [ ] Lighthouse/perf pass; mobile QA in both languages.
- [ ] Deploy to Vercel; set env vars; run schema on prod DB.

---

## 11. Deployment Checklist

```bash
# 1. Env vars (.env.local for dev, Vercel project settings for prod)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>   # server-only, never expose to client

# 2. DB
#    Run lib/schema.sql (enhanced version) in Supabase SQL editor.
#    Seed the 28 books.

# 3. Storage (Supabase dashboard)
#    Create public buckets: "qr-codes", "book-covers".

# 4. Auth
#    Enable Email/Password provider.
#    Create admin + packer users; set profiles.role.

# 5. Local dev
npm install
npm run dev

# 6. Lint/build
npm run lint
npm run build
```

---

## 12. Open Decisions & Questions

### 🟡 D1 — Packaging charge formula
Current code: flat ₹10, jumps to ₹500 at ₹50K. Your words ("1%… ₹10… 50K → ₹500") suggest **`max(₹10, 1% of subtotal)`** for Courier/Post, ₹0 for In Person. **Recommendation: adopt the 1%-with-₹10-min formula.** Confirm?

### 🟡 D2 — Book catalog accuracy
I could **not** read `Noorani Makatib Books List 15-6-26.pdf` (my model doesn't accept PDF input). The 28-book table in Section 13 came from the earlier planning draft. Please confirm the names/prices/stock, or paste the list as text/CSV so I can seed exact data.

### 🟡 D3 — Auth model
Supabase Auth with **email + password** (simplest for staff) vs. **magic link** (passwordless). Recommendation: email+password for admin/packer. Confirm?

### 🟡 D4 — Customer accounts
Should customers **create accounts** (to see order history), or stay **guest checkout** only (current behavior)? Recommendation: keep guest checkout now, add optional accounts in Phase 5.

### 🟡 D5 — Payment verification for Bank
Currently the customer self-confirms "I have paid". Should admin also see the payment as **unverified until manually confirmed**? (The `payment_confirmed` flag already supports this.) Recommendation: show a "Verify payment" step for bank orders before "Ready to Pack".

### 🟡 D6 — Turborepo
You said *"turbo rapport"*. Do you want a **Turborepo monorepo** (separate storefront & admin apps), or keep the **single Next.js app**? Recommendation: **single app** — simpler and sufficient.

---

## 13. Seed Catalog (28 books — verify against PDF 🟡 D2)

> Replace the 6 placeholder books with these. Prices in ₹. Stock is a suggested default — adjust to your real inventory.

| # | Book Name (English) | Book Name (Urdu) | Price | Stock |
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

---

## 14. Design Principles (to keep it "easy to use")

1. **One screen, one job.** Admin tabs (Dashboard / Orders / Inventory / Settings) isolate concerns.
2. **No jargon.** Labels are plain ("Ready to Pack", "Box Pack", "Reorder").
3. **Bilingual everywhere.** Every customer-facing and staff-facing string has `en` + `ur` keys in `LanguageContext.tsx`. Never hard-code user-facing text in components.
4. **Fail gracefully.** The `db` wrapper falls back to localStorage when Supabase isn't configured — so the demo always works.
5. **Confirm destructive/important actions.** The call-confirmation modal before "Ready to Pack" is the model for all irreversible steps.
6. **Mobile-first.** Packer may use a phone/tablet on the shop floor — keep packer cards touch-friendly.

---

## 15. Next Action

**The single highest-value next step is Phase 1: seed the real 28-book catalog and fix the packaging formula.** It requires no backend and immediately makes the store real.

To proceed, please answer the 🟡 decisions in [Section 12](#12-open-decisions--questions) — especially **D1** (packaging) and **D2** (confirm/paste the book list) — and I'll start implementing.
