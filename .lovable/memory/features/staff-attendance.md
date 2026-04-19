---
name: Staff & Roles + Attendance
description: Granular per-page/per-action permissions for staff users and GPS-geofenced clock-in/out
type: feature
---
The system includes a Staff & Roles page (`/admin/staff`) where admins create user accounts and assign granular per-page, per-action permissions (view/create/edit/delete) stored in `staff_permissions.permissions` JSONB. Role templates (admin, manager, cashier, storekeeper, accountant, staff) pre-fill sensible defaults that can be overridden per checkbox.

Attendance (`/admin/attendance`) requires staff to physically be at the shop: it pulls live GPS, computes Haversine distance from the saved store coordinates, and only allows check-in/out when within the admin-configured radius (stored in `store_settings` key `attendance_geofence`, default 150m). Each record stores user_id, lat/lng for both check-in and check-out, and the measured distance. Admins see a full attendance log table.
