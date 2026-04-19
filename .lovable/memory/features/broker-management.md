---
name: Broker management
description: Registered broker resellers pick up stock from shop with admin approval, storekeeper release, and return tracking
type: feature
---
The system manages walking shop brokers who take laptops to resell to their customers.

**Registry:** Brokers must be pre-registered (full_name, phone, email, id_number, location, commission_rate, is_active) at /admin/brokers. Walk-ins are not allowed.

**Pickup flow** at /admin/broker-pickups:
1. Staff creates a pickup request — selects broker + product (or types custom item), quantity, unit price, purpose (`buying` / `showing` / `borrowing`), payment method (`cash` / `momo` / `unpaid` / `on_return`), amount paid, expected_return_date, notes. Status starts as `pending`.
2. **Admin** approves or rejects (only admins can approve — sets `approved_by`, `approved_at`, status → `approved`).
3. Storekeeper releases the item with their name (status → `released`, `released_by`, `released_at`). On release, product stock_quantity is automatically decremented.
4. Closure: Mark `returned` (restores stock) or `sold`. Sets `closed_at` and `actual_return_date`.

**Tables:** `brokers`, `broker_pickups` (with auto-generated `pickup_number` like `BP-YYMMDD-XXXXX` via trigger). RLS: admin-only ALL access on both tables.

**UI:** Tabs filter by status (Pending, Approved, Released, All Open, Returned, Sold, All). Pending count shows as a destructive badge. Released items past `expected_return_date` show as "Overdue" in the UI without changing the DB status.
