---
name: Broker Sales Integration
description: Print Slip, WhatsApp reminders, statements, sold→sale auto-link, and profit/COGS tracking
type: feature
---
Broker module enhancements:
- **Print Pickup Slip** (`src/lib/printPickupSlip.ts`): A4 branded slip with terms and 3 signature lines (broker, storekeeper, admin), printable from any released/sold/returned pickup card.
- **WhatsApp reminders**: per-pickup wa.me button on released items + auto "due tomorrow" panel on the BrokerPickups page that pre-fills WhatsApp messages (manual click — no API).
- **Auto Sale on Sold**: Marking a pickup `sold` inserts an order tagged `source='broker'` with `broker_id`, including order_items with `cost_price` snapshotted from products. Also writes back `sale_order_id` on the pickup.
- **Broker Statement page** (`/admin/broker-statement`): aggregates per-broker open balance, items currently out, total sold, commission earned (using `brokers.commission_rate`), with print + WhatsApp.
- **Profit tracking**: `order_items.cost_price` is now used in Sale History (per-card profit + margin %, totals card) and Reports (COGS line, Gross Profit row, Net Income now = gross profit − expenses).
