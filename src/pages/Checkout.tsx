import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronLeft, Loader2, Smartphone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { CartItem } from "@/components/cart/CartDrawer";
import UgandaLocationSelector, { LocationData } from "@/components/checkout/UgandaLocationSelector";

const Checkout = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { toast } = useToast();
  
  const cartItems: CartItem[] = locationState.state?.cartItems || [];
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 100000 ? 0 : 10000;
  const total = subtotal + deliveryFee;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    paymentMethod: "mobile_money",
  });
  const [ugandaLocation, setUgandaLocation] = useState<LocationData>({
    district: "",
    subcounty: "",
    parish: "",
    village: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const generateOrderNumber = () => {
    const prefix = "SW";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast({ title: "Cart is empty", description: "Please add items to your cart", variant: "destructive" });
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !ugandaLocation.district || !ugandaLocation.subcounty || !formData.address) {
      toast({ title: "Missing information", description: "Please fill in all required fields including district and sub-county", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      const orderId = crypto.randomUUID();

      // Create order in DB (no .select() to avoid RLS SELECT issues for guests)
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          order_number: orderNumber,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          city: ugandaLocation.district,
          shipping_address: [ugandaLocation.subcounty, ugandaLocation.parish, ugandaLocation.village, formData.address].filter(Boolean).join(', '),
          notes: formData.notes,
          payment_method: formData.paymentMethod === 'mobile_money' ? 'pesapal_momo' : 'pesapal_card',
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          status: 'pending',
          payment_status: 'pending',
        });

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: typeof item.id === 'string' ? item.id : null,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Initiate Pesapal payment (both Mobile Money and Card go through Pesapal)
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: pesapalData, error: pesapalFnError } = await supabase.functions.invoke('pesapal-payment', {
        body: {
          action: 'initiate',
          orderNumber,
          amount: total,
          currency: 'UGX',
          description: `Order ${orderNumber} - Co Print Technologies`,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          callbackUrl: `${window.location.origin}/track-order?order=${orderNumber}`,
          notificationUrl: `https://${projectId}.supabase.co/functions/v1/pesapal-payment`,
        },
      });

      if (pesapalFnError || !pesapalData?.redirect_url) {
        throw new Error(pesapalData?.error || 'Failed to initiate payment');
      }

      // Redirect to Pesapal payment page
      window.location.href = pesapalData.redirect_url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Order failed",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur h-14 flex items-center px-4 border-b border-border">
          <Link to="/" className="p-1"><ChevronLeft className="h-5 w-5" /></Link>
          <span className="ml-3 font-medium">Checkout</span>
        </header>
        <main className="flex-1 flex items-center justify-center p-4 pb-20">
          <Card className="w-full max-w-sm text-center">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-2">Cart is empty</h2>
              <p className="text-sm text-muted-foreground mb-4">Add products first</p>
              <Button size="sm" onClick={() => navigate("/")}>Continue Shopping</Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation cartCount={0} onCartClick={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg">Checkout</h1>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{deliveryFee === 0 ? <span className="text-primary">Free</span> : formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs">Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone *</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0772..." required className="h-10" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-10" />
              </div>
              <UgandaLocationSelector value={ugandaLocation} onChange={setUgandaLocation} />
              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs">Address *</Label>
                <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street, Building..." required className="min-h-[70px]" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method — 2 options, both via Pesapal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                className="gap-2"
              >
                {/* Mobile Money */}
                <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-colors ${formData.paymentMethod === 'mobile_money' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Mobile Money</p>
                        <p className="text-xs text-muted-foreground">MTN & Airtel Mobile Money</p>
                      </div>
                    </div>
                  </Label>
                </div>
                {/* Card */}
                <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-colors ${formData.paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Card Payment</p>
                        <p className="text-xs text-muted-foreground">Visa, Mastercard & more</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm text-muted-foreground">
                You'll be redirected to a secure payment page to complete your {formData.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'card'} payment.
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </form>
      </main>

      <BottomNavigation cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} onCartClick={() => {}} />
    </div>
  );
};

export default Checkout;
