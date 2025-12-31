# Reports + Discounts PRD (Option A)

## 0) Context
This app is a barber shop billing + customer khata MVP.

**Core entities today (already in DB):**
- Invoice (`invoices`): `subtotal_paise`, `discount_paise`, `total_paise`, `issued_at`, `customer_id`, `shop_id`
- Invoice items (`invoice_items`): per-service line items with `qty` and `total_paise`
- Payments (`payments`): currently one payment created per invoice with `method` + `amount_paise` + optional `upi_ref`
- Customers (`customers`): optional phone, notes
- Services (`services`): name, price, active

## 1) Confirmed scope decisions
- **Per-day grouping:** local calendar day (device local time).
- **Partial/split payments:** not supported for now (assume exactly one payment per invoice).
- **Refunds/voids:** not supported for now.
- **Discounts:** supported as a final absolute amount on the whole bill.

## 2) Definitions & calculations
All amounts are stored and computed in **paise** (`*_paise`), displayed as ₹.

### 2.1 Invoice amount definitions
Per invoice:
- **Gross/Subtotal (₹)** = `invoice.subtotal_paise`
- **Discount (₹)** = `invoice.discount_paise`
- **Net/Total payable (₹)** = `invoice.total_paise`

Backend rule (already implemented):
- `total_paise = max(0, subtotal_paise - discount_paise)`
- `discount_paise` is clamped to `[0, subtotal_paise]`

### 2.2 Sales definitions for reporting
For any date filter (day/range):
- **Gross Sales** = sum of `subtotal_paise`
- **Discounts Given** = sum of `discount_paise`
- **Net Sales** = sum of `total_paise`
- **Bills Count** = number of invoices
- **Average Bill Value** = `Net Sales / Bills Count` (guard for 0)

### 2.3 Payment method rules
- Use invoice’s **primary payment method** for splits.
- Since partial payments are out-of-scope, the method is derived from the single payment record.

### 2.4 Day boundary
- A bill belongs to a day by `issued_at` interpreted in the **device local timezone**.
- For consistency across devices later, consider adding a shop timezone config and server-side range aggregation.

## 3) Functional requirements

### 3.1 Discount UI (New Bill)
**Goal:** let user apply a final absolute discount amount while creating a bill.

**Inputs/controls:**
- Add a field: **Discount (₹)**
  - Accept numeric input in rupees; optional decimals.
  - Convert to paise integer.
  - Clamp to `[0, subtotal]`.

**Bill summary UI should show:**
- Subtotal (gross)
- Discount
- Total (net payable)

**Save behavior:**
- POST `/api/invoices/` with `discount_paise`.
- Payment amount created should equal invoice net total.
- Save button label uses **net total**.

**Edge cases:**
- Empty discount => 0
- Discount > subtotal => clamp to subtotal (optionally show helper text)

### 3.2 Receipt breakdown (Bill Receipt)
**Goal:** show Subtotal/Discount/Total on receipt (and in WhatsApp share text).

Receipt UI should display:
- Items list (existing)
- Subtotal
- Discount
- Total
- Paid via (existing)

WhatsApp text should include:
- Subtotal, Discount, Total lines

### 3.3 Reports (Screens and behavior)
All reports support:
- Authentication required
- Empty states (no data)
- Error state (API failure)

#### A) Daily Close (MVP)
**Purpose:** end-of-day reconciliation.

**Default filter:** Today.

**Summary cards:**
- Gross Sales (Today)
- Discounts (Today)
- Net Sales (Today)
- Bills (Today)
- Avg Bill (Today)

**Breakdown cards:**
- Cash Net (Today)
- UPI Net (Today)

**Invoice register list:**
- Time
- Customer name (or Walk-in)
- Gross / Discount / Net
- Payment method
- Receipt link

#### B) Sales Over Time
**Purpose:** see trends.

**Filters:**
- Presets: 7 days, 30 days, 90 days
- Custom range (start/end)

**Chart:** daily series for:
- Gross sales
- Discounts
- Net sales
- Bills count (optional overlay)

**Table:** per day row with Gross/Discount/Net/Bills/Avg.

#### C) Weekday + Peak Hours
**Purpose:** staffing and operations.

**Weekday report:**
- Aggregate net sales + bills by weekday.

**Peak hours:**
- Aggregate net sales + bills by hour (0–23).

#### D) Service performance
**Purpose:** optimize service list/pricing.

**Top services (by revenue):**
- Sum of item `total_paise` per service in date filter.

**Top services (by quantity):**
- Sum of item `qty` per service.

**Service mix (%):**
- Share of gross item totals.

Note: discounts are invoice-level, not allocated to items in v1.

#### E) Customer insights
**Purpose:** retention and outreach.

- Repeat customers: customers with ≥2 invoices in range
- Top customers: by net spend (and show gross/discount/net columns)
- Dormant customers: last invoice older than N days

#### F) Payments reconciliation
**Purpose:** match payment methods and UPI refs.

- Breakdown by method for net sales
- List UPI transactions with `upi_ref` and invoice link

#### G) Exports & Audit
**Purpose:** backups and accountant-friendly exports.

Provide CSV downloads for:
- Invoice register
- Invoice items register
- Payments register

### 3.4 Non-functional requirements
- Performance: avoid per-invoice detail calls for report pages.
- Correctness: totals must match the same definitions used during invoice creation.

## 4) API requirements

### 4.1 Existing endpoints (today)
- `GET /api/invoices` returns invoice summaries (currently missing gross/discount)
- `GET /api/invoices/{id}` returns invoice detail (includes `subtotal_paise`, `discount_paise`, `total_paise`)
- `POST /api/invoices/` accepts `discount_paise` (frontend currently sends 0)

### 4.2 Required changes for gross+discount+net reporting
**Extend invoice summary response** (`GET /api/invoices`) to include:
- `subtotal_paise`
- `discount_paise`

So the frontend can compute:
- gross = sum(subtotal)
- discount = sum(discount)
- net = sum(total)

### 4.3 Recommended (next) for scalable reports
Add server-side filtering/aggregation:
- `GET /api/invoices?start=...&end=...` (date range)
  - or a dedicated `GET /api/reports/summary?start=...&end=...`

This avoids client-side day grouping and avoids the implicit list limit.

## 5) Implementation plan (phased)

### Phase 1 (Shipable MVP)
1. Invoice summary API: add `subtotal_paise` + `discount_paise` to list response.
2. Discount UI on New Bill: input + summary breakdown + send `discount_paise`.
3. Receipt: show Subtotal/Discount/Total and include in WhatsApp text.
4. Reports: upgrade Today cards to show Gross/Discount/Net and keep Cash/UPI Net.

### Phase 2 (Next)
- Date range filters + charts for Sales Over Time.
- Service performance tables.
- Customer insights tables.
- CSV exports.

## 6) Acceptance criteria
- Creating a bill with discount reduces net total and payment amount accordingly.
- Receipt shows Subtotal/Discount/Total and matches invoice detail from API.
- Reports page shows Gross/Discount/Net for today and matches sum of invoices.
- No per-invoice detail fetches needed for reports.
