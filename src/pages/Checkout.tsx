import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronLeft, Upload, Copy, Check, Loader2, Smartphone } from "lucide-react";
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

const MANUAL_PAYMENT_DETAILS = {
  mtn: { name: "MTN Mobile Money", number: "0772123456" },
  airtel: { name: "Airtel Money", number: "0702123456" },
};


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
    paymentMethod: "pesapal",
  });
  const [ugandaLocation, setUgandaLocation] = useState<LocationData>({
    district: "",
    subcounty: "",
    parish: "",
    village: "",
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
    toast({ title: "Copied!", description: "Payment number copied to clipboard" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
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

      // Create order in DB first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          city: ugandaLocation.district,
          shipping_address: [ugandaLocation.subcounty, ugandaLocation.parish, ugandaLocation.village, formData.address].filter(Boolean).join(', '),
          notes: formData.notes,
          payment_method: formData.paymentMethod,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
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

      if (formData.paymentMethod === 'pesapal') {
        // Initiate Pesapal payment
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
          throw new Error(pesapalData?.error || 'Failed to initiate Pesapal payment');
        }

        // Redirect to Pesapal payment page
        window.location.href = pesapalData.redirect_url;
        return;
      }

      // Manual payment (MTN / Airtel) — upload proof if provided
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${orderNumber}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
          await supabase.from('orders').update({
            notes: (formData.notes || '') + `\n\nPayment proof: ${urlData.publicUrl}`,
          }).eq('id', order.id);
        }
      }

      toast({
        title: "Order placed!",
        description: `Order #${orderNumber} submitted. We'll verify your payment shortly.`,
      });

      navigate(`/track-order?order=${orderNumber}`);
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

  const isManualPayment = formData.paymentMethod === 'mtn' || formData.paymentMethod === 'airtel';
  const selectedManualPayment = isManualPayment
    ? MANUAL_PAYMENT_DETAILS[formData.paymentMethod as keyof typeof MANUAL_PAYMENT_DETAILS]
    : null;

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
          {/* Order Summary - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </p>
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
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0772..."
                    required
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-10"
                />
              </div>
              <UgandaLocationSelector value={ugandaLocation} onChange={setUgandaLocation} />
              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Building..."
                  required
                  className="min-h-[70px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
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
                {/* Pesapal — preferred */}
                <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-colors ${formData.paymentMethod === 'pesapal' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="pesapal" id="pesapal" />
                  <Label htmlFor="pesapal" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Mobile Money (Pesapal)</p>
                        <p className="text-xs text-muted-foreground">MTN & Airtel — pay securely via Pesapal</p>
                      </div>
                    </div>
                  </Label>
                </div>
                {/* Manual MTN */}
                <div className={`flex items-center space-x-2 p-3 border rounded-lg ${formData.paymentMethod === 'mtn' ? 'border-primary' : 'border-border'}`}>
                  <RadioGroupItem value="mtn" id="mtn" />
                  <Label htmlFor="mtn" className="flex-1 cursor-pointer text-sm">MTN Mobile Money (Manual)</Label>
                </div>
                {/* Manual Airtel */}
                <div className={`flex items-center space-x-2 p-3 border rounded-lg ${formData.paymentMethod === 'airtel' ? 'border-primary' : 'border-border'}`}>
                  <RadioGroupItem value="airtel" id="airtel" />
                  <Label htmlFor="airtel" className="flex-1 cursor-pointer text-sm">Airtel Money (Manual)</Label>
                </div>
              </RadioGroup>

              {/* Pesapal info */}
              {formData.paymentMethod === 'pesapal' && (
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm text-muted-foreground">
                  You'll be redirected to the Pesapal secure payment page to complete your payment with MTN or Airtel Mobile Money.
                </div>
              )}

              {/* Manual payment details */}
              {isManualPayment && selectedManualPayment && (
                <>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <p className="text-xs font-medium">Send {formatPrice(total)} to:</p>
                    <div className="flex items-center justify-between bg-background p-2 rounded border">
                      <div>
                        <p className="text-xs text-muted-foreground">{selectedManualPayment.name}</p>
                        <p className="font-mono font-semibold">{selectedManualPayment.number}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopyNumber(selectedManualPayment.number)}
                      >
                        {copiedNumber ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="proof" className="text-xs">Payment Proof (Optional)</Label>
                    <div className="mt-1.5 border-2 border-dashed rounded-lg p-3 text-center">
                      <input type="file" id="proof" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <label htmlFor="proof" className="cursor-pointer">
                        {paymentProof ? (
                          <div className="flex items-center justify-center gap-2 text-primary text-sm">
                            <Check className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{paymentProof.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">Upload screenshot</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting}
          >
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
