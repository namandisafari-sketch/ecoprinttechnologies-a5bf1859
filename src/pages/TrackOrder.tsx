import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/layout/BottomNavigation";

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  city: string;
  shipping_address: string;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending", color: "bg-yellow-500", step: 1 },
  confirmed: { icon: CheckCircle, label: "Confirmed", color: "bg-blue-500", step: 2 },
  processing: { icon: Package, label: "Processing", color: "bg-purple-500", step: 3 },
  shipped: { icon: Truck, label: "Shipped", color: "bg-indigo-500", step: 4 },
  delivered: { icon: CheckCircle, label: "Delivered", color: "bg-green-500", step: 5 },
  cancelled: { icon: AlertCircle, label: "Cancelled", color: "bg-red-500", step: 0 },
  refunded: { icon: AlertCircle, label: "Refunded", color: "bg-gray-500", step: 0 },
};

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, payment_status, total, created_at, city, shipping_address")
        .eq("order_number", orderNumber.trim())
        .maybeSingle();

      if (fetchError || !data) {
        setOrderData(null);
        setError("Order not found. Please check your order number and try again.");
      } else {
        setOrderData(data);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search if order number is in URL
  useState(() => {
    if (initialOrder) {
      handleSearch();
    }
  });

  const statusConfig = orderData?.status 
    ? STATUS_CONFIG[orderData.status as keyof typeof STATUS_CONFIG] 
    : null;

  const steps = [
    { label: "Pending", step: 1 },
    { label: "Confirmed", step: 2 },
    { label: "Processing", step: 3 },
    { label: "Shipped", step: 4 },
    { label: "Delivered", step: 5 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Page Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/" className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-lg">Track Order</h1>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-6 pb-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your order number to check status
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g., SWXXX123"
              className="flex-1 h-12"
            />
            <Button type="submit" disabled={isLoading} className="h-12 px-6">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10 mb-6">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {orderData && statusConfig && (
            <div className="space-y-4">
              {/* Order Status Card */}
              <Card>
                <CardHeader className="text-center pb-4">
                  <div className={`w-14 h-14 ${statusConfig.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <statusConfig.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{statusConfig.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">#{orderData.order_number}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Progress Steps */}
                  {statusConfig.step > 0 && (
                    <div className="flex justify-between mb-6 relative px-2">
                      <div className="absolute top-3 left-4 right-4 h-0.5 bg-muted -z-10" />
                      <div 
                        className="absolute top-3 left-4 h-0.5 bg-primary -z-10 transition-all"
                        style={{ width: `${((statusConfig.step - 1) / 4) * 100}%` }}
                      />
                      {steps.map((step) => (
                        <div key={step.step} className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              step.step <= statusConfig.step
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step.step <= statusConfig.step ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              step.step
                            )}
                          </div>
                          <span className={`text-[10px] mt-1 ${
                            step.step <= statusConfig.step ? "font-medium" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-medium">{orderData.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {new Date(orderData.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City</span>
                      <span className="font-medium">{orderData.city}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payment</span>
                      <Badge variant={orderData.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                        {orderData.payment_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-primary">{formatPrice(orderData.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-muted/50">
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Need help?</p>
                  <p className="text-sm font-medium">WhatsApp: +256 772 123 456</p>
                </CardContent>
              </Card>
            </div>
          )}

          {!hasSearched && !orderData && (
            <Card className="bg-muted/50">
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Enter your order number above
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNavigation cartCount={0} onCartClick={() => {}} />
    </div>
  );
};

export default TrackOrder;
