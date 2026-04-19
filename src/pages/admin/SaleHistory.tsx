import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShoppingBag, TrendingUp, DollarSign, Printer, Store, Globe, Eye } from "lucide-react";
import { format } from "date-fns";
import A4Receipt from "@/components/pos/A4Receipt";

const AdminSaleHistory = () => {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["sale-history", search, sourceFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, product_price, subtotal, cost_price)")
        .order("created_at", { ascending: false });

      if (search) q = q.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);

      // Source filter: store sales come from POS (payment_method = 'cash'/'pos'), online orders come from checkout
      if (sourceFilter === "store") q = q.in("payment_method", ["cash", "pos", "card"]);
      if (sourceFilter === "online") q = q.in("payment_method", ["mobile_money", "mtn_momo", "pesapal"]).not("payment_method", "is", null);

      const { data } = await q.limit(200);
      return data || [];
    },
  });

  const isStoreSale = (order: any) => {
    return ["cash", "pos", "card"].includes(order.payment_method);
  };

  const completedOrders = orders.filter((o: any) => o.status !== "cancelled");
  const totalSales = completedOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const totalTransactions = completedOrders.length;
  const storeCount = completedOrders.filter((o: any) => isStoreSale(o)).length;
  const onlineCount = completedOrders.filter((o: any) => !isStoreSale(o)).length;
  const totalCost = completedOrders.reduce((sum: number, o: any) => {
    return sum + (o.order_items?.reduce((s: number, i: any) => s + Number(i.cost_price || 0) * Number(i.quantity), 0) || 0);
  }, 0);
  const totalProfit = totalSales - totalCost;
  const totalProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const orderProfit = (order: any) => {
    const cost = order.order_items?.reduce((s: number, i: any) => s + Number(i.cost_price || 0) * Number(i.quantity), 0) || 0;
    return Number(order.total) - cost;
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": case "delivered": return "default";
      case "pending": return "secondary";
      case "processing": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const handleReprint = (order: any) => {
    const receiptOrder = {
      ...order,
      items: order.order_items?.map((i: any) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        product_price: i.product_price,
        subtotal: i.subtotal,
      })) || [],
    };
    setSelectedOrder(receiptOrder);
    setReceiptOpen(true);
  };

  const printReceipt = () => {
    const el = receiptRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;width:210mm;margin:0 auto;}img{display:inline-block;}@page{size:A4;margin:0;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sale History</h1>
        <p className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Store className="h-3 w-3" /> Store</span> = POS sales at the shop &nbsp;|&nbsp;
          <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> Online</span> = Customer orders via the website
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold text-foreground">UGX {fmt(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/50 rounded-lg"><ShoppingBag className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold text-foreground">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg"><TrendingUp className="h-5 w-5 text-slate-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Cost of Goods Sold</p>
                <p className="text-xl font-bold text-slate-700">UGX {fmt(totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Store className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Store Sales</p>
                <p className="text-xl font-bold text-foreground">{storeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Globe className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Online Orders</p>
                <p className="text-xl font-bold text-foreground">{onlineCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Profit</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>UGX {fmt(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100/20 rounded-lg"><TrendingUp className="h-5 w-5 text-green-700" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className={`text-xl font-bold ${totalProfitMargin >= 0 ? "text-emerald-600" : "text-destructive"}`}>{totalProfitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, order #, phone..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="store">Store Sales</SelectItem>
            <SelectItem value="online">Online Orders</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
      </div>

      {/* Grid Cards */}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No sales found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((o: any) => {
            const store = isStoreSale(o);
            return (
              <Card key={o.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {store ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 gap-1">
                          <Store className="h-3 w-3" /> Store
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 gap-1">
                          <Globe className="h-3 w-3" /> Online
                        </Badge>
                      )}
                      <Badge variant={statusColor(o.status) as any} className="capitalize">{o.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{o.order_number}</span>
                  </div>

                  {/* Customer */}
                  <div>
                    <p className="font-semibold text-sm text-foreground">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                  </div>

                  {/* Items */}
                  <div className="bg-muted/50 rounded-md p-2 space-y-1">
                    {o.order_items?.slice(0, 3).map((i: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="truncate mr-2">{i.quantity}× {i.product_name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">UGX {fmt(i.subtotal)}</span>
                      </div>
                    ))}
                    {(o.order_items?.length || 0) > 3 && (
                      <p className="text-xs text-muted-foreground">+{o.order_items.length - 3} more items</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div>
                      <p className="text-lg font-bold text-foreground">UGX {fmt(o.total)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "MMM dd, yyyy • HH:mm")}</p>
                      {(() => {
                        const p = orderProfit(o);
                        const margin = o.total > 0 ? (p / Number(o.total)) * 100 : 0;
                        return p !== Number(o.total) ? (
                          <p className={`text-xs font-medium ${p >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            Profit: UGX {fmt(p)} ({margin.toFixed(1)}%)
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleReprint(o)} title="Reprint receipt">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Receipt Reprint Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Receipt Preview</span>
              <Button onClick={printReceipt} size="sm">
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div ref={receiptRef} className="bg-white">
              <A4Receipt order={selectedOrder} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSaleHistory;
