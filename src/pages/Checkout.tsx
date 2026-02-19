import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronLeft, Loader2, Smartphone, CreditCard, ShieldCheck, MapPin, User, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
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

      // Create order in DB
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
          payment_method: formData.paymentMethod === 'pay_on_delivery' ? 'pay_on_delivery' : formData.paymentMethod === 'mobile_money' ? 'pesapal_momo' : 'pesapal_card',
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          status: 'pending',
          payment_status: formData.paymentMethod === 'pay_on_delivery' ? 'pending' : 'pending',
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

      // Pay on Delivery — skip Pesapal, go straight to confirmation
      if (formData.paymentMethod === 'pay_on_delivery') {
        toast({ title: "Order placed!", description: `Order ${orderNumber} confirmed. Pay on delivery.` });
        navigate(`/track-order?order=${orderNumber}`);
        return;
      }

      // Initiate Pesapal payment
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: pesapalData, error: pesapalFnError } = await supabase.functions.invoke('pesapal-payment', {
        body: {
          action: 'initiate',
          orderNumber,
          amount: total,
          currency: 'UGX',
          description: `Order ${orderNumber} - Sir Wanda's Screen Shop`,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          callbackUrl: `${window.location.origin}/track-order?order=${orderNumber}`,
          notificationUrl: `https://${projectId}.supabase.co/functions/v1/pesapal-payment`,
        },
      });

      if (pesapalFnError) {
        throw new Error('Payment service unavailable. Please try again.');
      }
      
      if (!pesapalData?.redirect_url) {
        const errorMsg = pesapalData?.error || 'Could not connect to payment gateway';
        if (errorMsg.includes('amount_exceeds_default_limit')) {
          throw new Error('Online payment temporarily unavailable for this amount. Please select "Pay on Delivery" instead.');
        }
        throw new Error(errorMsg);
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
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-2">Your cart is empty</h2>
              <p className="text-sm text-muted-foreground mb-4">Browse our products and add items to cart</p>
              <Button size="sm" onClick={() => navigate("/")}>Continue Shopping</Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation cartCount={0} onCartClick={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg">Checkout</h1>
          <div className="ml-auto flex items-center gap-1 text-xs opacity-80">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Order Summary — compact */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatPrice(deliveryFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs">Full Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone *</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0772..." required className="h-10" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" required className="h-10" />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <UgandaLocationSelector value={ugandaLocation} onChange={setUgandaLocation} />
              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs">Street / Building / Landmark *</Label>
                <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="e.g. Plot 12, Luwum Street, near Clock Tower" required className="min-h-[60px] resize-none" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs">Order Notes (optional)</Label>
                <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions..." className="h-10" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                className="gap-2"
              >
                <label
                  htmlFor="mobile_money"
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'mobile_money' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
                >
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="h-9 w-9 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Smartphone className="h-4.5 w-4.5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Mobile Money</p>
                      <p className="text-xs text-muted-foreground">MTN & Airtel Mobile Money</p>
                    </div>
                  </div>
                </label>

                <label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Card Payment</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard & more</p>
                    </div>
                  </div>
                </label>

                {/* Pay on Delivery */}
                <label
                  htmlFor="pay_on_delivery"
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentMethod === 'pay_on_delivery' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'}`}
                >
                  <RadioGroupItem value="pay_on_delivery" id="pay_on_delivery" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Pay on Delivery</p>
                      <p className="text-xs text-muted-foreground">Cash or Mobile Money on arrival</p>
                    </div>
                  </div>
                </label>
              </RadioGroup>

              <div className="flex items-start gap-2 bg-muted/60 p-3 rounded-lg text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>
                  {formData.paymentMethod === 'pay_on_delivery'
                    ? 'Pay when your order is delivered. Cash or Mobile Money accepted.'
                    : `You'll be securely redirected to Pesapal to complete your ${formData.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'card'} payment.`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>{formData.paymentMethod === 'pay_on_delivery' ? 'Place Order' : `Pay ${formatPrice(total)}`}</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground pb-2">
            By placing this order, you agree to our terms of service
          </p>
        </form>
      </main>

      <BottomNavigation cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} onCartClick={() => {}} />
    </div>
  );
};

export default Checkout;
