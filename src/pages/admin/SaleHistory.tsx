import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

const AdminSaleHistory = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ["sale-history", search, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, product_price, subtotal)")
        .order("created_at", { ascending: false });

      if (search) q = q.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);

      const { data } = await q.limit(200);
      return data || [];
    },
  });

  const completedOrders = orders.filter((o: any) => o.status !== "cancelled");
  const totalSales = completedOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
  const totalItems = completedOrders.reduce((s: number, o: any) => s + (o.order_items?.reduce((is: number, i: any) => is + i.quantity, 0) || 0), 0);
  const fmt = (n: number) => new Intl.NumberFormat("en-UG").format(Math.round(n));

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": case "delivered": return "default";
      case "pending": return "secondary";
      case "processing": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sale History</h1>
        <p className="text-sm text-muted-foreground">Complete record of all sales transactions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-xl font-bold text-foreground">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg"><DollarSign className="h-5 w-5 text-secondary-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Items Sold</p>
                <p className="text-xl font-bold text-foreground">{totalItems}</p>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" placeholder="From" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" placeholder="To" />
      </div>

      {/* Sales table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="text-sm">{format(new Date(o.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      {o.order_items?.slice(0, 2).map((i: any, idx: number) => (
                        <p key={idx} className="text-xs truncate">{i.quantity}× {i.product_name}</p>
                      ))}
                      {(o.order_items?.length || 0) > 2 && <p className="text-xs text-muted-foreground">+{o.order_items.length - 2} more</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusColor(o.status) as any} className="capitalize">{o.status}</Badge></TableCell>
                  <TableCell><Badge variant={o.payment_status === "paid" ? "default" : "secondary"} className="capitalize">{o.payment_status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">UGX {fmt(o.total)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No sales found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSaleHistory;
