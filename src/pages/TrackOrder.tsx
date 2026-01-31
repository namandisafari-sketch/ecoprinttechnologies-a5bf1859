import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
        .eq("order_number", orderNumber.trim().toUpperCase())
        .single();

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
      <Header cartCount={0} onCartClick={() => {}} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order number to check the status of your order
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., SWXXX123)"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Track</span>
            </Button>
          </form>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10 mb-8">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {orderData && statusConfig && (
            <div className="space-y-6">
              {/* Order Status Card */}
              <Card>
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${statusConfig.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <statusConfig.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{statusConfig.label}</CardTitle>
                  <p className="text-muted-foreground">Order #{orderData.order_number}</p>
                </CardHeader>
                <CardContent>
                  {/* Progress Steps */}
                  {statusConfig.step > 0 && (
                    <div className="flex justify-between mb-8 relative">
                      <div className="absolute top-4 left-0 right-0 h-1 bg-muted -z-10" />
                      <div 
                        className="absolute top-4 left-0 h-1 bg-primary -z-10 transition-all"
                        style={{ width: `${((statusConfig.step - 1) / 4) * 100}%` }}
                      />
                      {steps.map((step, index) => (
                        <div key={step.step} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              step.step <= statusConfig.step
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step.step <= statusConfig.step ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              step.step
                            )}
                          </div>
                          <span className={`text-xs mt-2 ${
                            step.step <= statusConfig.step ? "font-medium" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-medium">{orderData.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span className="font-medium">
                          {new Date(orderData.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-primary">{formatPrice(orderData.total)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">City:</span>
                        <span className="font-medium">{orderData.city}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Payment:</span>
                        <Badge variant={orderData.payment_status === "paid" ? "default" : "secondary"}>
                          {orderData.payment_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Need help with your order?</p>
                  <p className="font-medium">Contact us on WhatsApp: +256 772 123 456</p>
                </CardContent>
              </Card>
            </div>
          )}

          {!hasSearched && !orderData && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter your order number above to see the current status
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
