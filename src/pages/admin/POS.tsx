import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, Trash2, Printer, Receipt, Loader2, ScanBarcode } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import ReceiptModal from "@/components/pos/ReceiptModal";
import BarcodeScanner from "@/components/pos/BarcodeScanner";

type Product = Tables<"products">;

interface CartItem {
  product: Product;
  quantity: number;
  customPrice: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const AdminPOS = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "", email: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discount, setDiscount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["pos-products", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("name");

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data as Product[];
    },
  });

  const handleBarcodeScan = async (code: string) => {
    try {
      // Search for product by SKU (barcode typically maps to SKU)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .or(`sku.eq.${code},name.ilike.%${code}%`)
        .limit(1)
        .single();

      if (error || !data) {
        toast({
          title: "Product not found",
          description: `No product found with code: ${code}`,
          variant: "destructive",
        });
        return;
      }

      addToCart(data);
      toast({
        title: "Product added",
        description: `${data.name} added to cart`,
      });
    } catch (err) {
      toast({
        title: "Scan error",
        description: "Failed to process scanned code",
        variant: "destructive",
      });
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.stock_quantity || 0)) {
          toast({ title: "Not enough stock", variant: "destructive" });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, customPrice: Number(product.price) }];
    });
  };

  const updatePrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, customPrice: Math.max(0, price) } : item
      )
    );
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > (item.product.stock_quantity || 0)) {
              toast({ title: "Not enough stock", variant: "destructive" });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: "", phone: "", email: "", address: "" });
    setDiscount(0);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.customPrice * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(
    () => (subtotal * discount) / 100,
    [subtotal, discount]
  );

  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const orderNumber = `SW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
      
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: customerInfo.name || "Walk-in Customer",
          customer_phone: customerInfo.phone || "N/A",
          customer_email: customerInfo.email || "pos@ecoprint.ug",
          shipping_address: customerInfo.address || "In-Store Purchase",
          city: "In-Store",
          subtotal: subtotal,
          delivery_fee: 0,
          total: total,
          status: "delivered",
          payment_status: "paid",
          payment_method: paymentMethod,
          notes: discount > 0 ? `Discount: ${discount}%` : "POS Sale",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.customPrice,
        quantity: item.quantity,
        subtotal: item.customPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock quantities
      for (const item of cart) {
        const newStock = (item.product.stock_quantity || 0) - item.quantity;
        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product.id);
      }

      // Set completed order for receipt
      setCompletedOrder({
        ...order,
        items: cart,
        discount,
        discountAmount,
      });

      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

      toast({ title: "Sale completed successfully!" });
      setShowReceipt(true);
    } catch (error: any) {
      toast({ title: "Error processing sale", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setCompletedOrder(null);
    clearCart();
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-muted-foreground">In-shop sales with receipt generation</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowScanner(true)}
            title="Scan barcode"
          >
            <ScanBarcode className="h-5 w-5" />
          </Button>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-primary font-bold text-sm mt-1">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.stock_quantity}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No products found" : "Start typing to search products"}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <Card className="w-full lg:w-96 flex flex-col max-h-[50vh] lg:max-h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Current Sale</span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Input
              placeholder="Customer name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, name: e.target.value }))}
              className="text-sm"
            />
            <Input
              placeholder="Phone"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))}
              className="text-sm"
            />
            <Input
              placeholder="Email (optional)"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, email: e.target.value }))}
              className="text-sm"
            />
            <Input
              placeholder="Address (optional)"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo((p) => ({ ...p, address: e.target.value }))}
              className="text-sm"
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Click products to add to cart
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.product.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Details */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex gap-2">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mtn_mobile_money">MTN Mobile Money</SelectItem>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Discount %"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-24"
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount ({discount}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-1 border-t">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={processSale}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Complete Sale ({formatPrice(total)})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceipt && completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={handleReceiptClose}
        />
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default AdminPOS;
