import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  Boxes,
  MessageCircle,
  Receipt,
  Settings,
  Bell,
  Mail,
  Truck,
  Navigation,
  Tag,
  FileText,
  Wallet,
  BarChart3,
  History,
  UserCog,
  PackageCheck,
  ClipboardList,
  Users2,
  Clock,
  ScanBarcode,
  RefreshCcw,
  DollarSign,
  Image,
  Shield,
  IdCard,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission key matching staff_permissions.permissions[key].view. Admin pages have no key (admin-only). */
  permKey?: string;
  /** When true, only admins/managers can see/access — bypasses permKey checks. */
  adminOnly?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permKey: "dashboard" },
  { label: "POS", href: "/admin/pos", icon: Receipt, permKey: "pos" },
  { label: "Products", href: "/admin/products", icon: Package, permKey: "products" },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes, permKey: "inventory" },
  { label: "Barcode Tracking", href: "/admin/barcode-tracking", icon: ScanBarcode, permKey: "inventory" },
  { label: "Stock Receiving", href: "/admin/stock-receiving", icon: PackageCheck, permKey: "inventory" },
  { label: "Sales & Refunds", href: "/admin/orders", icon: ShoppingCart, permKey: "orders" },
  { label: "Returns & Exchanges", href: "/admin/returns-exchanges", icon: RefreshCcw, permKey: "orders" },
  { label: "Purchase Orders", href: "/admin/purchase-orders", icon: ClipboardList, permKey: "inventory" },
  { label: "Expenses", href: "/admin/expenses", icon: Wallet, permKey: "expenses" },
  { label: "Suppliers & Payments", href: "/admin/suppliers-payments", icon: DollarSign, permKey: "expenses" },
  { label: "Categories", href: "/admin/categories", icon: Tags, permKey: "categories" },
  { label: "Hero Slides", href: "/admin/hero-slides", icon: Image, permKey: "hero_slides" },
  { label: "Customers", href: "/admin/customers", icon: Users, permKey: "customers" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, permKey: "notifications" },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail, permKey: "newsletter" },
  { label: "Chat", href: "/admin/chat", icon: MessageCircle, permKey: "chat" },
  { label: "Delivery Zones", href: "/admin/delivery-zones", icon: Truck, permKey: "delivery_zones" },
  { label: "Delivery Accounts", href: "/admin/delivery-accounts", icon: Navigation, permKey: "delivery_accounts" },
  { label: "Stickers", href: "/admin/stickers", icon: Tag, permKey: "stickers" },
  { label: "Brokers", href: "/admin/brokers", icon: UserCog, permKey: "brokers" },
  { label: "Broker Pickups", href: "/admin/broker-pickups", icon: PackageCheck, permKey: "broker_pickups" },
  { label: "Broker Statement", href: "/admin/broker-statement", icon: ClipboardList, permKey: "brokers" },
  { label: "Staff & Roles", href: "/admin/staff", icon: Users2, adminOnly: true },
  { label: "Workers & ID Cards", href: "/admin/workers", icon: IdCard, adminOnly: true },
  { label: "Attendance", href: "/admin/attendance", icon: Clock, permKey: "attendance" },
  { label: "Quotations", href: "/admin/quotations", icon: FileText, permKey: "quotations" },
  { label: "Sale History", href: "/admin/sale-history", icon: History, permKey: "sale_history" },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, permKey: "reports" },
  { label: "Audit Log", href: "/admin/audit-log", icon: Shield, adminOnly: true },
  { label: "Settings", href: "/admin/settings", icon: Settings, permKey: "settings" },
];
