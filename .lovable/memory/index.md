# Project Memory

## Core
- **Backend & Deploy:** Supabase with RLS, public 'product-images' bucket. Planning transition to self-hosted Ubuntu/Docker/Nginx.
- **Brand & Admin:** 'Eco Print Technologies', admin@ecotechnologies.app. Mandatory 'Kabejja Systems' footer attribution.
- **Build:** Require `--legacy-peer-deps`. React-leaflet pinned to 4.2.1 for React 18 compatibility.
- **Media:** AVIF support required. Missing images fallback to gallery first, then standard placeholder.
- **Printing Constraints:** ALL generated docs (Invoices, Quotations, Manuals, Pickup Slips) strictly constrained to 1 A4 page (max 297mm height).
- **UI/Layout:** 7xl max-width, responsive grid (2 cols mobile -> 5 desktop), custom serif, clamp() typography.
- **Staff access:** Granular permissions stored in `staff_permissions.permissions` JSONB; attendance gated by GPS geofence around store coords.

## Memories
- [Typography Patterns](mem://style/typography-patterns) — Custom serif fonts and clamp() for responsive sizes
- [Minimalist Aesthetic](mem://style/minimalist-aesthetic) — Clean centered design, large typography, framer-motion animations
- [Data Portability](mem://features/data-portability) — Export/import ZIPs, strict table upsert dependency order
- [Database Schema](mem://architecture/database-modules) — Multi-module schema: core, commerce, chat, seller features
- [Device Persistence](mem://auth/device-persistence) — Guest tracking via hardware fingerprints, deferred identification
- [RLS Patterns](mem://security/rls-patterns) — SECURITY DEFINER is_admin, fingerprint-based guest access
- [PWA Config](mem://infrastructure/pwa-configuration) — Workbox max file size increased to 3MB
- [Image Watermarking](mem://features/image-watermarking) — Auto-apply 35% scale centered logo overlay to uploads
- [Product Reviews](mem://features/product-reviews) — Verified buyers matched via device ID to delivered orders
- [Delivery System](mem://features/delivery-system) — PIN auth portal, OpenStreetMap, dynamic bottom nav toggle
- [Brand Identity](mem://project/brand-identity) — Brand assets, logos, and signatures for official docs
- [Spec Parsing](mem://features/spec-parsing) — Admin auto-extraction of key-value specs from raw technical text
- [Maintenance Mode](mem://features/maintenance-mode) — Public guard with admin and delivery portal bypasses
- [Branding Kabejja](mem://style/branding-kabejja) — Mandatory Kabejja Systems attribution and promo cards
- [Product Display Logic](mem://ui/product-display-logic) — Image fallbacks, gallery defaults, onError handling
- [Self Hosting Plan](mem://infrastructure/self-hosting-plan) — Architecture for self-hosted Ubuntu/Docker Supabase + Nginx
- [Bulk Image Upload](mem://features/bulk-image-upload) — Filename parsing for product matching, index assignment, filters
- [Layout System](mem://style/layout-system) — 7xl container, responsive 2-5 col grids, line-clamping
- [Product Manual](mem://features/product-manual) — A4 branded printable guide with specs and maintenance info
- [Product Stickers](mem://features/product-stickers) — 3-per-A4 laptop labels, dashed cutouts, store_settings templates
- [POS Billing](mem://features/pos-billing) — A4 proforma invoice books, 12-row table, UGX amount in words
- [Quotations System](mem://features/quotations-system) — A4 block pattern letterhead, 18% VAT, amount in words
- [Printing Constraints](mem://constraints/printing) — Strict 1-page A4 limit (297mm) overflow prevention rules
- [Accounting Management](mem://features/accounting-management) — Custom expense categories, income/balance reports
- [Sale History](mem://features/sale-history) — Store vs Online payment classification, grid layout, A4 receipts, profit/margin display
- [Scroll Behavior](mem://navigation/scroll-behavior) — Global ScrollToTop routing component implementation
- [Broker Management](mem://features/broker-management) — Pickup slip print, WhatsApp reminders, statements, sold→sale, profit/COGS
- [Staff & Attendance](mem://features/staff-attendance) — Granular per-page permissions + GPS geofenced check-in
