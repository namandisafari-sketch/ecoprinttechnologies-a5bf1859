import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Search, Phone, MapPin, Package, User, LogOut, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const Delivery = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [deliveryPerson, setDeliveryPerson] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from("delivery_accounts")
      .select("*")
      .eq("phone", phone)
      .eq("pin_code", pin)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Login failed", description: "Invalid phone or PIN", variant: "destructive" });
      return;
    }
    setDeliveryPerson(data);
    toast({ title: `Welcome, ${data.full_name}!` });
  };

  const handleSearchOrder = async () => {
    if (!orderNumber.trim()) return;
    setSearching(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();

    setSearching(false);
    if (error || !data) {
      toast({ title: "Order not found", variant: "destructive" });
      setOrder(null);
      return;
    }
    setOrder(data);
  };

  // Geocode address and show on map
  useEffect(() => {
    if (!order || !mapRef.current) return;

    const address = `${order.shipping_address}, ${order.city}, Uganda`;

    const initMap = async () => {
      // Geocode using Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const results = await res.json();

        let lat = order.delivery_latitude || 0.3476;
        let lng = order.delivery_longitude || 32.5825;

        if (results.length > 0) {
          lat = parseFloat(results[0].lat);
          lng = parseFloat(results[0].lon);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapRef.current!).setView([lat, lng], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>${order.customer_name}</b><br/>${order.shipping_address}`)
          .openPopup();

        mapInstanceRef.current = map;
      } catch {
        toast({ title: "Could not load map location", variant: "destructive" });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order]);

  const handleLogout = () => {
    setDeliveryPerson(null);
    setOrder(null);
    setOrderNumber("");
  };

  // Login screen
  if (!deliveryPerson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Eco Print Delivery</h1>
              <p className="text-sm text-muted-foreground">Sign in with your delivery credentials</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter your phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">PIN Code</label>
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button className="w-full" onClick={handleLogin}>
                <LogIn className="h-4 w-4 mr-2" /> Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          <span className="font-bold text-sm">Eco Print Delivery</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs">{deliveryPerson.full_name}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Order Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter Order ID (e.g. ORD-123456)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchOrder()}
          />
          <Button onClick={handleSearchOrder} disabled={searching}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {order.order_number}
                  </h2>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.status === "delivered" ? "bg-primary/10 text-primary" :
                    order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${order.customer_phone}`} className="text-primary underline">
                      {order.customer_phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{order.shipping_address}, {order.city}</span>
                  </div>
                  {order.delivery_code && (
                    <div className="bg-muted p-2 rounded text-center">
                      <span className="text-xs text-muted-foreground">Delivery Code:</span>
                      <span className="ml-2 font-bold text-primary text-lg">{order.delivery_code}</span>
                    </div>
                  )}
                </div>

                {/* Call Customer Button */}
                <Button className="w-full" asChild>
                  <a href={`tel:${order.customer_phone}`}>
                    <Phone className="h-4 w-4 mr-2" /> Call Customer
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardContent className="p-0">
                <div ref={mapRef} className="h-[400px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        )}

        {!order && (
          <div className="text-center py-16 text-muted-foreground">
            <Navigation className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter an order ID to view delivery details and customer location</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Delivery;
