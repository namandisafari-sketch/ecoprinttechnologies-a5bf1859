import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { useDeviceContext } from "@/contexts/DeviceContext";

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
  payment_method: string | null;
}

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pending", color: "bg-yellow-500" },
  confirmed: { icon: CheckCircle, label: "Confirmed", color: "bg-blue-500" },
  processing: { icon: Package, label: "Processing", color: "bg-purple-500" },
  shipped: { icon: Truck, label: "Shipped", color: "bg-indigo-500" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "bg-green-500" },
  cancelled: { icon: AlertCircle, label: "Cancelled", color: "bg-red-500" },
  refunded: { icon: AlertCircle, label: "Refunded", color: "bg-gray-500" },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(price);

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const highlightOrder = searchParams.get("order") || "";
  const { deviceId, deviceName, recoveryCode, isLoading: deviceLoading } = useDeviceContext();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);

  useEffect(() => {
    if (deviceId && !deviceLoading) {
      fetchOrders();
    } else if (!deviceLoading) {
      setIsLoading(false);
    }
  }, [deviceId, deviceLoading]);

  // Auto-select highlighted order
  useEffect(() => {
    if (highlightOrder && orders.length > 0) {
      const found = orders.find(o => o.order_number === highlightOrder);
      if (found) setSelectedOrder(found);
    }
  }, [highlightOrder, orders]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, payment_status, total, created_at, city, shipping_address, payment_method")
        .eq("device_id", deviceId!)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as OrderData[]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Also allow searching any order by number
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, payment_status, total, created_at, city, shipping_address, payment_method")
        .eq("order_number", searchQuery.trim())
        .maybeSingle();
      if (data) {
        setSelectedOrder(data as OrderData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Order detail view
  if (selectedOrder) {
    const config = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    const steps = [
      { label: "Pending", step: 1 },
      { label: "Confirmed", step: 2 },
      { label: "Processing", step: 3 },
      { label: "Shipped", step: 4 },
      { label: "Delivered", step: 5 },
    ];
    const currentStep = { pending: 1, confirmed: 2, processing: 3, shipped: 4, delivered: 5 }[selectedOrder.status] || 0;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center h-14 px-4 gap-3">
            <button onClick={() => setSelectedOrder(null)} className="p-1">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-lg">Order Details</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 max-w-md mx-auto w-full space-y-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={`w-14 h-14 ${config.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <StatusIcon className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold">{config.label}</h2>
              <p className="text-sm text-muted-foreground">#{selectedOrder.order_number}</p>

              {currentStep > 0 && (
                <div className="flex justify-between mt-6 relative px-2">
                  <div className="absolute top-3 left-4 right-4 h-0.5 bg-muted -z-10" />
                  <div className="absolute top-3 left-4 h-0.5 bg-primary -z-10 transition-all" style={{ width: `${((currentStep - 1) / 4) * 100}%` }} />
                  {steps.map((step) => (
                    <div key={step.step} className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step.step <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {step.step <= currentStep ? <CheckCircle className="h-4 w-4" /> : step.step}
                      </div>
                      <span className={`text-[10px] mt-1 ${step.step <= currentStep ? "font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 text-sm mt-6 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City</span>
                  <span className="font-medium">{selectedOrder.city}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment</span>
                  <Badge variant={selectedOrder.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Need help?</p>
              <p className="text-sm font-medium">WhatsApp: +256 772 123 456</p>
            </CardContent>
          </Card>
        </main>

        <BottomNavigation cartCount={0} onCartClick={() => {}} />
      </div>
    );
  }

  // Orders list view
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/" className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-lg flex-1">My Orders</h1>
          <button onClick={() => setShowRecoveryCode(!showRecoveryCode)} className="p-2 text-muted-foreground">
            <Key className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 max-w-md mx-auto w-full">
        {/* Recovery code banner */}
        {showRecoveryCode && recoveryCode && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your Recovery Code (save this!)</p>
              <p className="text-lg font-mono font-bold tracking-widest">{recoveryCode}</p>
              <p className="text-xs text-muted-foreground mt-1">Use this code to access your orders on a new phone</p>
            </CardContent>
          </Card>
        )}

        {/* Search bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2 mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number"
            className="flex-1 h-10"
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Greeting */}
        {deviceName && (
          <p className="text-sm text-muted-foreground mb-3">Hi <span className="font-medium text-foreground">{deviceName}</span></p>
        )}

        {isLoading || deviceLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="py-10 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No orders yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Your orders will appear here after you place one.</p>
              <Button asChild size="sm">
                <Link to="/">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cfg.color} rounded-full flex items-center justify-center shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">#{order.order_number}</p>
                          <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <Badge variant="secondary" className="text-[10px] h-5">{cfg.label}</Badge>
                          <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation cartCount={0} onCartClick={() => {}} />
    </div>
  );
};

export default TrackOrder;
