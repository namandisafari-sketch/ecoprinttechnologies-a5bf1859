import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SellerProtectedRoute from "./components/auth/SellerProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import SellerLayout from "@/components/seller/SellerLayout";
import Index from "./pages/Index";
import Search from "./pages/Search";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SellerSignup from "./pages/SellerSignup";
import Technicians from "./pages/Technicians";

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

// Seller pages
import SellerOverview from "./pages/seller/Overview";
import SellerServices from "./pages/seller/Services";
import SellerRequests from "./pages/seller/Requests";
import SellerProfile from "./pages/seller/Profile";
import SellerSettings from "./pages/seller/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/seller-signup" element={<SellerSignup />} />
            <Route path="/technicians" element={<Technicians />} />
            
            {/* Seller routes */}
            <Route
              path="/seller"
              element={
                <SellerProtectedRoute>
                  <SellerLayout />
                </SellerProtectedRoute>
              }
            >
              <Route index element={<SellerOverview />} />
              <Route path="services" element={<SellerServices />} />
              <Route path="requests" element={<SellerRequests />} />
              <Route path="profile" element={<SellerProfile />} />
              <Route path="settings" element={<SellerSettings />} />
            </Route>

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
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
