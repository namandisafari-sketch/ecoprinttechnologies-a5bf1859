import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import MaintenancePage from "@/components/MaintenancePage";
import Index from "./pages/Index";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import NotificationsPage from "./pages/Notifications";
import Delivery from "./pages/Delivery";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPOS from "./pages/admin/POS";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCategories from "./pages/admin/Categories";
import AdminCustomers from "./pages/admin/Customers";
import AdminInventory from "./pages/admin/Inventory";
import AdminChat from "./pages/admin/Chat";
import AdminSettings from "./pages/admin/Settings";
import AdminMore from "./pages/admin/More";
import AdminNewsletter from "./pages/admin/Newsletter";
import AdminHeroSlides from "./pages/admin/HeroSlides";
import AdminNotifications from "./pages/admin/Notifications";
import AdminStoreLocation from "./pages/admin/StoreLocation";
import AdminDeliveryZones from "./pages/admin/DeliveryZones";
import AdminDeliveryAccounts from "./pages/admin/DeliveryAccounts";
import AdminStickers from "./pages/admin/Stickers";
import AdminQuotations from "./pages/admin/Quotations";
import AdminExpenses from "./pages/admin/Expenses";
import AdminReports from "./pages/admin/Reports";
import AdminSaleHistory from "./pages/admin/SaleHistory";

const queryClient = new QueryClient();

// Wrapper that checks maintenance mode for public routes
const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();
  const { isAdmin } = useAuth();
  const location = useLocation();

  // Allow admin routes, login, delivery portal even in maintenance
  const bypassPaths = ["/admin", "/login", "/signup", "/delivery"];
  const isBypassed = bypassPaths.some(p => location.pathname.startsWith(p));

  if (isLoading) return null;
  if (isMaintenanceMode && !isAdmin && !isBypassed) {
    return <MaintenancePage />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DeviceProvider>
        <BrowserRouter>
          <MaintenanceGuard>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/delivery" element={<Delivery />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="pos" element={<AdminPOS />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="more" element={<AdminMore />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="hero-slides" element={<AdminHeroSlides />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="store-location" element={<AdminStoreLocation />} />
              <Route path="delivery-zones" element={<AdminDeliveryZones />} />
              <Route path="delivery-accounts" element={<AdminDeliveryAccounts />} />
              <Route path="stickers" element={<AdminStickers />} />
              <Route path="quotations" element={<AdminQuotations />} />
              <Route path="expenses" element={<AdminExpenses />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="sale-history" element={<AdminSaleHistory />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MaintenanceGuard>
        </BrowserRouter>
        </DeviceProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
