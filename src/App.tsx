import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionGate from "./components/auth/PermissionGate";
import SellerProtectedRoute from "./components/auth/SellerProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SellerSignup from "./pages/SellerSignup";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import TrackOrder from "./pages/TrackOrder";
import Delivery from "./pages/Delivery";
import Technicians from "./pages/Technicians";
import Notifications from "./pages/Notifications";
import WorkerVerify from "./pages/WorkerVerify";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPOS from "./pages/admin/POS";
import AdminProducts from "./pages/admin/Products";
import AdminInventory from "./pages/admin/Inventory";
import AdminBarcodeTracking from "./pages/admin/BarcodeTracking";
import AdminStockReceiving from "./pages/admin/StockReceiving";
import AdminOrders from "./pages/admin/Orders";
import AdminReturnsExchanges from "./pages/admin/ReturnsExchanges";
import AdminPurchaseOrders from "./pages/admin/PurchaseOrders";
import AdminExpenses from "./pages/admin/Expenses";
import AdminSuppliersPayments from "./pages/admin/SuppliersPayments";
import AdminCategories from "./pages/admin/Categories";
import AdminCustomers from "./pages/admin/Customers";
import AdminNotifications from "./pages/admin/Notifications";
import AdminNewsletter from "./pages/admin/Newsletter";
import AdminChat from "./pages/admin/Chat";
import AdminDeliveryZones from "./pages/admin/DeliveryZones";
import AdminDeliveryAccounts from "./pages/admin/DeliveryAccounts";
import AdminStickers from "./pages/admin/Stickers";
import AdminBrokers from "./pages/admin/Brokers";
import AdminBrokerPickups from "./pages/admin/BrokerPickups";
import AdminBrokerStatement from "./pages/admin/BrokerStatement";
import AdminStaff from "./pages/admin/Staff";
import AdminAttendance from "./pages/admin/Attendance";
import AdminQuotations from "./pages/admin/Quotations";
import AdminSaleHistory from "./pages/admin/SaleHistory";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminHeroSlides from "./pages/admin/HeroSlides";
import AdminStoreLocation from "./pages/admin/StoreLocation";
import AdminMore from "./pages/admin/More";
import AdminAuditLog from "./pages/admin/AuditLog";
import AdminWorkers from "./pages/admin/Workers";

// Seller
import SellerLayout from "./components/seller/SellerLayout";
import SellerOverview from "./pages/seller/Overview";
import SellerProfile from "./pages/seller/Profile";
import SellerServices from "./pages/seller/Services";
import SellerRequests from "./pages/seller/Requests";
import SellerSettings from "./pages/seller/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SplashScreen />
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/seller-signup" element={<SellerSignup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/technicians" element={<Technicians />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/worker/:id" element={<WorkerVerify />} />

            {/* Admin (any signed-in staff member can enter; per-page guards below filter access) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PermissionGate page="dashboard"><AdminDashboard /></PermissionGate>} />
              <Route path="pos" element={<PermissionGate page="pos"><AdminPOS /></PermissionGate>} />
              <Route path="products" element={<PermissionGate page="products"><AdminProducts /></PermissionGate>} />
              <Route path="inventory" element={<PermissionGate page="inventory"><AdminInventory /></PermissionGate>} />
              <Route path="barcode-tracking" element={<PermissionGate page="inventory"><AdminBarcodeTracking /></PermissionGate>} />
              <Route path="stock-receiving" element={<PermissionGate page="inventory"><AdminStockReceiving /></PermissionGate>} />
              <Route path="orders" element={<PermissionGate page="orders"><AdminOrders /></PermissionGate>} />
              <Route path="returns-exchanges" element={<PermissionGate page="orders"><AdminReturnsExchanges /></PermissionGate>} />
              <Route path="purchase-orders" element={<PermissionGate page="inventory"><AdminPurchaseOrders /></PermissionGate>} />
              <Route path="expenses" element={<PermissionGate page="expenses"><AdminExpenses /></PermissionGate>} />
              <Route path="suppliers-payments" element={<PermissionGate page="expenses"><AdminSuppliersPayments /></PermissionGate>} />
              <Route path="categories" element={<PermissionGate page="categories"><AdminCategories /></PermissionGate>} />
              <Route path="customers" element={<PermissionGate page="customers"><AdminCustomers /></PermissionGate>} />
              <Route path="notifications" element={<PermissionGate page="notifications"><AdminNotifications /></PermissionGate>} />
              <Route path="newsletter" element={<PermissionGate page="newsletter"><AdminNewsletter /></PermissionGate>} />
              <Route path="chat" element={<PermissionGate page="chat"><AdminChat /></PermissionGate>} />
              <Route path="delivery-zones" element={<PermissionGate page="delivery_zones"><AdminDeliveryZones /></PermissionGate>} />
              <Route path="delivery-accounts" element={<PermissionGate page="delivery_accounts"><AdminDeliveryAccounts /></PermissionGate>} />
              <Route path="stickers" element={<PermissionGate page="stickers"><AdminStickers /></PermissionGate>} />
              <Route path="brokers" element={<PermissionGate page="brokers"><AdminBrokers /></PermissionGate>} />
              <Route path="broker-pickups" element={<PermissionGate page="broker_pickups"><AdminBrokerPickups /></PermissionGate>} />
              <Route path="broker-statement" element={<PermissionGate page="brokers"><AdminBrokerStatement /></PermissionGate>} />
              <Route path="staff" element={<PermissionGate adminOnly><AdminStaff /></PermissionGate>} />
              <Route path="attendance" element={<PermissionGate page="attendance"><AdminAttendance /></PermissionGate>} />
              <Route path="quotations" element={<PermissionGate page="quotations"><AdminQuotations /></PermissionGate>} />
              <Route path="sale-history" element={<PermissionGate page="sale_history"><AdminSaleHistory /></PermissionGate>} />
              <Route path="reports" element={<PermissionGate page="reports"><AdminReports /></PermissionGate>} />
              <Route path="settings" element={<PermissionGate page="settings"><AdminSettings /></PermissionGate>} />
              <Route path="hero-slides" element={<PermissionGate page="hero_slides"><AdminHeroSlides /></PermissionGate>} />
              <Route path="store-location" element={<PermissionGate page="settings"><AdminStoreLocation /></PermissionGate>} />
              <Route path="workers" element={<PermissionGate adminOnly><AdminWorkers /></PermissionGate>} />
              <Route path="audit-log" element={<PermissionGate adminOnly><AdminAuditLog /></PermissionGate>} />
              <Route path="more" element={<AdminMore />} />
            </Route>

            {/* Seller */}
            <Route
              path="/seller"
              element={
                <SellerProtectedRoute>
                  <SellerLayout />
                </SellerProtectedRoute>
              }
            >
              <Route index element={<SellerOverview />} />
              <Route path="profile" element={<SellerProfile />} />
              <Route path="services" element={<SellerServices />} />
              <Route path="requests" element={<SellerRequests />} />
              <Route path="settings" element={<SellerSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
