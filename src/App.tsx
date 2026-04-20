import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
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

            {/* Admin */}
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
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="barcode-tracking" element={<AdminBarcodeTracking />} />
              <Route path="stock-receiving" element={<AdminStockReceiving />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="returns-exchanges" element={<AdminReturnsExchanges />} />
              <Route path="purchase-orders" element={<AdminPurchaseOrders />} />
              <Route path="expenses" element={<AdminExpenses />} />
              <Route path="suppliers-payments" element={<AdminSuppliersPayments />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="delivery-zones" element={<AdminDeliveryZones />} />
              <Route path="delivery-accounts" element={<AdminDeliveryAccounts />} />
              <Route path="stickers" element={<AdminStickers />} />
              <Route path="brokers" element={<AdminBrokers />} />
              <Route path="broker-pickups" element={<AdminBrokerPickups />} />
              <Route path="broker-statement" element={<AdminBrokerStatement />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="quotations" element={<AdminQuotations />} />
              <Route path="sale-history" element={<AdminSaleHistory />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="hero-slides" element={<AdminHeroSlides />} />
              <Route path="store-location" element={<AdminStoreLocation />} />
              <Route path="workers" element={<AdminWorkers />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
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
