import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Calendar, CheckCircle2, PackageCheck, RotateCcw, XCircle, Clock, AlertTriangle, Printer, MessageCircle, Bell, DollarSign, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { printPickupSlip } from "@/lib/printPickupSlip";

interface Pickup {
  id: string;
  pickup_number: string;
  broker_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_value: number;
  purpose: string;
  payment_method: string | null;
  amount_paid: number | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: string;
  notes: string | null;
  released_by: string | null;
  released_at: string | null;
  approved_at: string | null;
  closed_at: string | null;
  created_at: string;
  approval_notes?: string | null;
  rejection_reason?: string | null;
  return_condition?: string | null;
  return_reason?: string | null;
  brokers?: { full_name: string; phone: string; commission_rate: number };
}

interface Broker {
  id: string;
  full_name: string;
  phone: string;
  commission_rate: number;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: "Pending Approval", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30", icon: Clock },
  approved: { label: "Approved", cls: "bg-blue-500/10 text-blue-700 border-blue-500/30", icon: CheckCircle2 },
  released: { label: "Released", cls: "bg-purple-500/10 text-purple-700 border-purple-500/30", icon: PackageCheck },
  returned: { label: "Returned", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30", icon: RotateCcw },
  sold: { label: "Sold", cls: "bg-green-500/10 text-green-700 border-green-500/30", icon: CheckCircle2 },
  overdue: { label: "Overdue", cls: "bg-red-500/10 text-red-700 border-red-500/30", icon: AlertTriangle },
  rejected: { label: "Rejected", cls: "bg-muted text-muted-foreground", icon: XCircle },
};

const PURPOSES = [
  { value: "buying", label: "Buying outright" },
  { value: "showing", label: "Showing to client" },
  { value: "borrowing", label: "Borrowing / consignment" },
];

const PAYMENT_METHODS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "cash", label: "Cash on spot" },
  { value: "momo", label: "Mobile Money" },
  { value: "on_return", label: "Pay on return" },
];

const CONDITION_CODES = [
  { value: "new", label: "New / Unopened" },
  { value: "like_new", label: "Like New" },
  { value: "used", label: "Used / Normal Wear" },
  { value: "damaged", label: "Damaged" },
  { value: "incomplete", label: "Incomplete / Missing Parts" },
];

const RETURN_REASONS = [
  { value: "returned_unsold", label: "Returned - Did not sell" },
  { value: "customer_returned", label: "Customer returned item" },
  { value: "damaged_in_transit", label: "Damaged in transit" },
  { value: "defective", label: "Defective / Faulty" },
  { value: "broker_request", label: "Broker requested return" },
];

const fmt = (n: number) => `UGX ${Number(n || 0).toLocaleString()}`;

const emptyForm = {
  broker_id: "",
  product_id: "",
  product_name: "",
  product_sku: "",
  quantity: "1",
  unit_price: "0",
  purpose: "showing",
  payment_method: "unpaid",
  amount_paid: "0",
  expected_return_date: "",
  notes: "",
};

const BrokerPickups = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [releaseOpen, setReleaseOpen] = useState<Pickup | null>(null);
  const [releasedBy, setReleasedBy] = useState("");
  const [returnOpen, setReturnOpen] = useState<Pickup | null>(null);
  const [returnCondition, setReturnCondition] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [selectedPickups, setSelectedPickups] = useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = useState<Pickup | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);

  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brokers").select("id, full_name, phone, commission_rate").eq("is_active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-pickup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price, stock_quantity, unit_cost")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: pickups = [] } = useQuery({
    queryKey: ["broker-pickups", tab, search],
    queryFn: async () => {
      let q = supabase.from("broker_pickups").select("*, brokers(full_name, phone, commission_rate)").order("created_at", { ascending: false });
      if (tab !== "all") {
        if (tab === "open") q = q.in("status", ["pending", "approved", "released", "overdue"]);
        else q = q.eq("status", tab);
      }
      if (search) q = q.or(`pickup_number.ilike.%${search}%,product_name.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Pickup[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const qty = Number(form.quantity) || 1;
      const unit = Number(form.unit_price) || 0;
      const payload: any = {
        broker_id: form.broker_id,
        product_id: form.product_id || null,
        product_name: form.product_name.trim(),
        product_sku: form.product_sku.trim() || null,
        quantity: qty,
        unit_price: unit,
        total_value: qty * unit,
        purpose: form.purpose,
        payment_method: form.payment_method,
        amount_paid: Number(form.amount_paid) || 0,
        expected_return_date: form.expected_return_date || null,
        notes: form.notes.trim() || null,
        status: "pending",
      };
      const { error } = await supabase.from("broker_pickups").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success("Pickup request submitted for approval");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async (p: Pickup) => {
      const { error } = await supabase.from("broker_pickups").update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        approval_notes: approvalNotes.trim() || null,
      }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success("Approved — storekeeper can now release");
      setApprovalNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkApprove = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedPickups);
      for (const id of ids) {
        await supabase.from("broker_pickups").update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        }).eq("id", id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success(`Approved ${selectedPickups.size} pickup(s)`);
      setSelectedPickups(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkRelease = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedPickups);
      for (const id of ids) {
        const p = pickups.find((x) => x.id === id);
        if (p?.status === "approved") {
          await supabase.from("broker_pickups").update({
            status: "released",
            released_at: new Date().toISOString(),
            released_by: "Bulk Release",
          }).eq("id", id);
          // decrement stock
          if (p.product_id) {
            const { data: prod } = await supabase.from("products").select("stock_quantity").eq("id", p.product_id).single();
            if (prod) {
              await supabase.from("products").update({
                stock_quantity: Math.max(0, (prod.stock_quantity || 0) - p.quantity),
              }).eq("id", p.product_id);
            }
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success(`Released ${selectedPickups.size} pickup(s)`);
      setSelectedPickups(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (p: Pickup) => {
      const { error } = await supabase.from("broker_pickups").update({
        status: "rejected",
        rejection_reason: rejectReason.trim() || null,
      }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success("Pickup rejected");
      setRejectOpen(null);
      setRejectReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const release = useMutation({
    mutationFn: async () => {
      if (!releaseOpen) return;
      const { error } = await supabase.from("broker_pickups").update({
        status: "released",
        released_at: new Date().toISOString(),
        released_by: releasedBy.trim() || "Storekeeper",
      }).eq("id", releaseOpen.id);
      if (error) throw error;
      // decrement stock if product linked
      if (releaseOpen.product_id) {
        const { data: prod } = await supabase.from("products").select("stock_quantity").eq("id", releaseOpen.product_id).single();
        if (prod) {
          await supabase.from("products").update({
            stock_quantity: Math.max(0, (prod.stock_quantity || 0) - releaseOpen.quantity),
          }).eq("id", releaseOpen.product_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success("Released to broker");
      setReleaseOpen(null);
      setReleasedBy("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeAs = useMutation({
    mutationFn: async ({ p, status }: { p: Pickup; status: "returned" | "sold" }) => {
      const updates: any = {
        status,
        closed_at: new Date().toISOString(),
        actual_return_date: new Date().toISOString().slice(0, 10),
      };
      if (status === "returned") {
        updates.return_condition = returnCondition || "used";
        updates.return_reason = returnReason || null;
      }
      const { error } = await supabase.from("broker_pickups").update(updates).eq("id", p.id);
      if (error) throw error;
      
      // restock on return
      if (status === "returned" && p.product_id) {
        const { data: prod } = await supabase.from("products").select("stock_quantity").eq("id", p.product_id).single();
        if (prod) {
          await supabase.from("products").update({
            stock_quantity: (prod.stock_quantity || 0) + p.quantity,
          }).eq("id", p.product_id);
        }
      }
      
      // auto-create sale when marked sold
      if (status === "sold") {
        const product = products.find((x) => x.id === p.product_id);
        const orderNumber = `BP-${p.pickup_number || p.id?.slice(0, 8).toUpperCase()}-${Date.now()}`;
        const paymentMethod = PAYMENT_METHODS.map((m) => m.value).includes(p.payment_method || "") ? p.payment_method : "cash";
        const paymentStatus = p.amount_paid && p.amount_paid >= p.total_value ? "paid" : "pending";

        const { data: createdOrder, error: orderErr } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            customer_name: p.brokers?.full_name || "Broker Sale",
            customer_phone: p.brokers?.phone || "",
            customer_email: "",
            shipping_address: "Broker consignment sale",
            city: "",
            source: "broker",
            status: "completed",
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            subtotal: p.total_value,
            total: p.total_value,
            broker_id: p.broker_id,
            user_id: user?.id || null,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (orderErr) {
          console.warn("Could not auto-create sale order:", orderErr);
        } else if (createdOrder?.id) {
          const orderItems = [
            {
              order_id: createdOrder.id,
              product_id: p.product_id,
              product_name: p.product_name,
              product_price: p.unit_price,
              quantity: p.quantity,
              subtotal: p.total_value,
              cost_price: product?.unit_cost ?? null,
              created_at: new Date().toISOString(),
            },
          ];
          const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
          if (itemsErr) console.warn("Could not create order item:", itemsErr);
        }
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success(v.status === "returned" ? "Marked returned — stock restored" : "Marked sold — sale created");
      setReturnOpen(null);
      setReturnCondition("");
      setReturnReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onPickProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (p) {
      setForm((f) => ({
        ...f,
        product_id: id,
        product_name: p.name,
        product_sku: p.sku || "",
        unit_price: String(p.price || 0),
        quantity: f.quantity || "1",
      }));
      setShowProductPicker(false);
      setProductSearch("");
    }
  };

  // Enhanced product filtering with search
  const selectedProduct = useMemo(
    () => products.find((x) => x.id === form.product_id),
    [form.product_id, products]
  );

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase();
    return products
      .filter((p: any) => {
        return (
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          query === ""
        );
      })
      .sort((a: any, b: any) => {
        const aStock = (a.stock_quantity || 0) > 0 ? 0 : 1;
        const bStock = (b.stock_quantity || 0) > 0 ? 0 : 1;
        if (aStock !== bStock) return aStock - bStock;
        return a.name.localeCompare(b.name);
      });
  }, [productSearch, products]);

  const getStockColor = (qty: number) => {
    if (qty === 0) return "bg-destructive/10 text-destructive";
    if (qty < 5) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const getStockLabel = (qty: number) => {
    if (qty === 0) return "Out of Stock";
    if (qty < 5) return `Low Stock (${qty})`;
    return `In Stock (${qty})`;
  };

  // Enhanced calculations with payment reconciliation
  const counts = {
    pending: pickups.filter((p) => p.status === "pending").length,
    overdue: pickups.filter((p) => {
      if (p.status !== "released") return false;
      return p.expected_return_date && new Date(p.expected_return_date) < new Date();
    }).length,
  };

  const totalReleased = pickups
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + p.total_value, 0);

  const totalSoldValue = pickups
    .filter((p) => p.status === "sold")
    .reduce((sum, p) => sum + p.total_value, 0);

  const totalCommission = pickups
    .filter((p) => p.status === "sold")
    .reduce((sum, p) => sum + ((p.brokers?.commission_rate || 0) * p.unit_price * p.quantity) / 100, 0);

  const totalOutstanding = pickups
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + Math.max(0, p.total_value - (p.amount_paid || 0)), 0);

  const unpaidCount = pickups.filter((p) => p.status === "released" && p.payment_method === "on_return" && !p.amount_paid).length;

  const brokerStats = brokers.map((broker: Broker) => {
    const brokerPickups = pickups.filter((p) => p.broker_id === broker.id);
    const released = brokerPickups.filter((p) => p.status === "released");
    const sold = brokerPickups.filter((p) => p.status === "sold");
    const returned = brokerPickups.filter((p) => p.status === "returned");
    const overdue = released.filter((p) => p.expected_return_date && new Date(p.expected_return_date) < new Date());
    
    const totalValue = released.reduce((sum, p) => sum + p.total_value, 0);
    const totalPaid = released.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const balanceDue = totalValue - totalPaid;
    
    const sellThrough = brokerPickups.length > 0 ? (sold.length / brokerPickups.length) * 100 : 0;
    const commission = sold.reduce((sum, p) => sum + (p.unit_price * p.quantity * broker.commission_rate / 100), 0);

    return {
      broker,
      onConsignment: released.length,
      totalValue,
      balanceDue,
      sold: sold.length,
      returned: returned.length,
      overdue: overdue.length,
      sellThrough: sellThrough.toFixed(1),
      commission,
    };
  });

  const dueTomorrow = pickups.filter((p) => {
    if (p.status !== "released" || !p.expected_return_date) return false;
    const d = new Date(p.expected_return_date);
    const tomorrow = addDays(new Date(), 1);
    return d.toDateString() === tomorrow.toDateString();
  });

  const toggleSelectPickup = (id: string) => {
    const newSelected = new Set(selectedPickups);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedPickups(newSelected);
  };

  const toggleSelectAll = (list: Pickup[]) => {
    if (selectedPickups.size === list.length) {
      setSelectedPickups(new Set());
    } else {
      setSelectedPickups(new Set(list.map((p) => p.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Broker Pickups</h1>
          <p className="text-sm text-muted-foreground">Approve, release, track items & reconcile payments</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Pickup
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{counts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Released (In Field)</p>
                <p className="text-2xl font-bold">{pickups.filter((p) => p.status === "released").length}</p>
                <p className="text-xs text-emerald-600 font-medium">{fmt(totalReleased)}</p>
              </div>
              <PackageCheck className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Balance Due</p>
                <p className={`text-2xl font-bold ${totalOutstanding > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {fmt(totalOutstanding)}
                </p>
                <p className="text-xs text-muted-foreground">{unpaidCount} unpaid</p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sold Value</p>
                <p className="text-2xl font-bold text-foreground">{fmt(totalSoldValue)}</p>
                <p className="text-xs text-muted-foreground">Closed sales</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Broker Commission</p>
                <p className="text-2xl font-bold text-purple-600">{fmt(totalCommission)}</p>
                <p className="text-xs text-muted-foreground">Payable on sold items</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue Pickups</p>
                <p className={`text-2xl font-bold ${counts.overdue > 0 ? "text-destructive" : ""}`}>{counts.overdue}</p>
                <p className="text-xs text-muted-foreground">Need follow-up</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broker Performance Stats */}
      {brokerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Broker Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {brokerStats.filter((s) => s.onConsignment > 0 || s.sold.length > 0).map((stat) => (
                <div key={stat.broker.id} className="flex items-center justify-between text-sm p-2 border rounded hover:bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{stat.broker.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.onConsignment} in field • {stat.sold} sold ({stat.sellThrough}%) • Commission: {fmt(stat.commission)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${stat.balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {fmt(stat.balanceDue)}
                    </p>
                    {stat.overdue > 0 && <Badge variant="destructive" className="text-xs">{stat.overdue} overdue</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Tomorrow Alert */}
      {dueTomorrow.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <p className="font-semibold flex items-center gap-2 text-amber-700">
              <Bell className="h-4 w-4" /> {dueTomorrow.length} pickup(s) due tomorrow
            </p>
            <div className="mt-2 space-y-1.5">
              {dueTomorrow.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm gap-2 flex-wrap">
                  <span><strong>{p.brokers?.full_name}</strong> — {p.product_name} ({p.pickup_number})</span>
                  {p.brokers?.phone && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const phone = p.brokers!.phone.replace(/[^0-9]/g, "");
                      const msg = `Hi ${p.brokers!.full_name}, friendly reminder — ${p.product_name} (Pickup ${p.pickup_number}) is due back tomorrow. Please confirm. Thank you.`;
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}>
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Search */}
      <div className="space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending {counts.pending > 0 && <Badge className="ml-2" variant="destructive">{counts.pending}</Badge>}</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="released">Released</TabsTrigger>
            <TabsTrigger value="open">All Open</TabsTrigger>
            <TabsTrigger value="returned">Returned</TabsTrigger>
            <TabsTrigger value="sold">Sold</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search pickup # or product…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPickups.size > 0 && (
        <div className="flex gap-2 items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900">
          <span className="text-sm font-medium flex-1">{selectedPickups.size} selected</span>
          {tab === "pending" && (
            <Button size="sm" onClick={() => bulkApprove.mutate()} disabled={bulkApprove.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve All
            </Button>
          )}
          {tab === "approved" && (
            <Button size="sm" onClick={() => bulkRelease.mutate()} disabled={bulkRelease.isPending}>
              <PackageCheck className="h-3.5 w-3.5 mr-1" /> Release All
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setSelectedPickups(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Pickups Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {pickups.length > 0 && (
          <div className="lg:col-span-2 flex items-center gap-2 p-2">
            <input
              type="checkbox"
              checked={selectedPickups.size === pickups.length && pickups.length > 0}
              onChange={() => toggleSelectAll(pickups)}
              className="w-4 h-4"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>
        )}
        {pickups.map((p) => {
          const meta = STATUS_META[p.status] || STATUS_META.pending;
          const Icon = meta.icon;
          const purposeLabel = PURPOSES.find((x) => x.value === p.purpose)?.label || p.purpose;
          const payLabel = PAYMENT_METHODS.find((x) => x.value === p.payment_method)?.label || p.payment_method;
          const isOverdue = p.status === "released" && p.expected_return_date && new Date(p.expected_return_date) < new Date();
          const balanceDue = p.total_value - (p.amount_paid || 0);
          const commission = p.brokers ? (p.unit_price * p.quantity * p.brokers.commission_rate / 100) : 0;
          
          return (
            <Card key={p.id} className={`${isOverdue ? "border-destructive/50 bg-destructive/5" : ""}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPickups.has(p.id)}
                      onChange={() => toggleSelectPickup(p.id)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{p.pickup_number}</p>
                      <h3 className="font-semibold">{p.product_name}</h3>
                      <p className="text-sm text-muted-foreground">{p.brokers?.full_name} • {p.brokers?.phone}</p>
                    </div>
                  </div>
                  <Badge className={meta.cls} variant="outline">
                    <Icon className="h-3 w-3 mr-1" />
                    {isOverdue ? "Overdue" : meta.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Purpose</p>
                    <p className="font-medium">{purposeLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="font-medium">{payLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Qty × Price</p>
                    <p className="font-medium">{p.quantity} × {fmt(p.unit_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{fmt(p.total_value)}</p>
                  </div>
                  {p.amount_paid ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="font-medium text-emerald-600">{fmt(p.amount_paid)}</p>
                    </div>
                  ) : null}
                  {p.status === "released" && balanceDue > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Balance Due</p>
                      <p className={`font-semibold ${balanceDue > 0 ? "text-destructive" : "text-emerald-600"}`}>{fmt(balanceDue)}</p>
                    </div>
                  )}
                  {p.expected_return_date && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Return by
                      </p>
                      <p className={`font-medium ${isOverdue ? "text-destructive font-bold" : ""}`}>
                        {format(new Date(p.expected_return_date), "PP")}
                      </p>
                    </div>
                  )}
                  {commission > 0 && p.status === "sold" && (
                    <div>
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <p className="font-medium text-purple-600">{fmt(commission)}</p>
                    </div>
                  )}
                </div>

                {p.notes && <p className="text-sm bg-muted/50 rounded p-2 italic">"{p.notes}"</p>}

                {p.approval_notes && (
                  <p className="text-xs bg-blue-50 dark:bg-blue-950/30 rounded p-2 border border-blue-200 dark:border-blue-900">
                    <strong>Approval note:</strong> {p.approval_notes}
                  </p>
                )}

                {p.return_reason && (
                  <div className="text-xs bg-emerald-50 dark:bg-emerald-950/30 rounded p-2 border border-emerald-200 dark:border-emerald-900">
                    <p><strong>Return:</strong> {RETURN_REASONS.find((r) => r.value === p.return_reason)?.label || p.return_reason}</p>
                    {p.return_condition && (
                      <p><strong>Condition:</strong> {CONDITION_CODES.find((c) => c.value === p.return_condition)?.label || p.return_condition}</p>
                    )}
                  </div>
                )}

                {p.released_by && (
                  <p className="text-xs text-muted-foreground">
                    Released by <strong>{p.released_by}</strong> on {p.released_at && format(new Date(p.released_at), "PP p")}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {p.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => approve.mutate(p)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectOpen(p)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <>
                      <Button size="sm" onClick={() => setReleaseOpen(p)}>
                        <PackageCheck className="h-3.5 w-3.5" /> Release
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => printPickupSlip(p)}>
                        <Printer className="h-3.5 w-3.5" /> Print Slip
                      </Button>
                    </>
                  )}
                  {p.status === "released" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setReturnOpen(p)}>
                        <RotateCcw className="h-3.5 w-3.5" /> Returned
                      </Button>
                      <Button size="sm" onClick={() => closeAs.mutate({ p, status: "sold" })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sold
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {pickups.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">No pickups in this view.</p>
        )}
      </div>

      {/* New pickup dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Broker Pickup Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Broker *</Label>
                <Select value={form.broker_id} onValueChange={(v) => setForm({ ...form, broker_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select broker" /></SelectTrigger>
                  <SelectContent>
                    {brokers.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.full_name} — {b.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product (from inventory)</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductPicker(true)}
                  className="w-full justify-start text-left font-normal"
                >
                  {form.product_id ? (
                    <div className="text-left">
                      <div className="font-medium">{form.product_name}</div>
                      <div className="text-xs text-muted-foreground">{form.product_sku || "No SKU"}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select a product…</span>
                  )}
                </Button>
              </div>
              <div className="sm:col-span-2">
                <Label>Item Name *</Label>
                <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. HP EliteBook 840 G7" />
              </div>
              <div>
                <Label>SKU / Serial</Label>
                <Input value={form.product_sku} onChange={(e) => setForm({ ...form, product_sku: e.target.value })} />
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Unit Price (UGX)</Label>
                <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
              </div>
              <div>
                <Label>Purpose *</Label>
                <Select value={form.purpose} onValueChange={(v) => setForm({ ...form, purpose: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount Paid (UGX)</Label>
                <Input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
              </div>
              <div>
                <Label>Expected Return Date</Label>
                <Input type="date" value={form.expected_return_date} onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any conditions, customer name, etc." />
            </div>
            <div className="text-right text-sm">
              <span className="text-muted-foreground">Total value: </span>
              <span className="font-semibold">{fmt((Number(form.quantity) || 0) * (Number(form.unit_price) || 0))}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.broker_id || !form.product_name || create.isPending}>
              {create.isPending ? "Submitting…" : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Notes Dialog */}
      <Dialog open={tab === "pending"} onOpenChange={() => setApprovalNotes("")}>
        {/* Integrated into action buttons */}
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={(o) => !o && setRejectOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Pickup Request</DialogTitle>
          </DialogHeader>
          {rejectOpen && (
            <div className="space-y-3">
              <p className="text-sm">
                Rejecting <strong>{rejectOpen.product_name}</strong> pickup from <strong>{rejectOpen.brokers?.full_name}</strong>.
              </p>
              <div>
                <Label>Reason for Rejection *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Stock unavailable, customer objection, policy conflict..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => reject.mutate(rejectOpen!)}
              disabled={!rejectReason.trim() || reject.isPending}
            >
              {reject.isPending ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Approval Dialog */}
      <Dialog open={!!releaseOpen} onOpenChange={(o) => !o && setReleaseOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Item to Broker</DialogTitle>
          </DialogHeader>
          {releaseOpen && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-900">
                <p className="text-sm">
                  <strong>{releaseOpen.quantity}</strong> × <strong>{releaseOpen.product_name}</strong><br />
                  Broker: <strong>{releaseOpen.brokers?.full_name}</strong><br />
                  Total Value: <strong>{fmt(releaseOpen.total_value)}</strong>
                </p>
              </div>
              <div>
                <Label>Released by (storekeeper name) *</Label>
                <Input value={releasedBy} onChange={(e) => setReleasedBy(e.target.value)} placeholder="Your name" />
              </div>
              <p className="text-xs text-muted-foreground">✓ Stock will be deducted from inventory automatically</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseOpen(null)}>Cancel</Button>
            <Button
              onClick={() => release.mutate()}
              disabled={!releasedBy.trim() || release.isPending}
            >
              {release.isPending ? "Releasing…" : "Confirm Release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Verification Dialog */}
      <Dialog open={!!returnOpen} onOpenChange={(o) => !o && setReturnOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Item as Returned</DialogTitle>
          </DialogHeader>
          {returnOpen && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded border border-emerald-200 dark:border-emerald-900">
                <p className="text-sm">
                  <strong>{returnOpen.quantity}</strong> × <strong>{returnOpen.product_name}</strong><br />
                  Broker: <strong>{returnOpen.brokers?.full_name}</strong>
                </p>
              </div>
              <div>
                <Label>Item Condition on Return *</Label>
                <Select value={returnCondition} onValueChange={setReturnCondition}>
                  <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_CODES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason for Return *</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">✓ Stock will be restored to inventory automatically</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(null)}>Cancel</Button>
            <Button
              onClick={() => closeAs.mutate({ p: returnOpen!, status: "returned" })}
              disabled={!returnCondition || !returnReason || closeAs.isPending}
            >
              {closeAs.isPending ? "Processing…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Product to Give Broker</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-4">
            {/* Search Bar */}
            <div className="sticky top-0 bg-background z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by product name or SKU…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid gap-2">
                {filteredProducts.map((p: any) => {
                  const isSelected = form.product_id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onPickProduct(p.id)}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.sku ? (
                              <>SKU: {p.sku} • </>
                            ) : null}
                            Price: {fmt(p.price || 0)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStockColor(p.stock_quantity || 0)}>
                            {getStockLabel(p.stock_quantity || 0)}
                          </Badge>
                          {isSelected && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No products found matching "{productSearch}"</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>

          {/* Footer with selection summary */}
          {form.product_id && (
            <div className="border-t pt-3 bg-blue-50/50 dark:bg-blue-950/20 rounded p-3 mt-3">
              <p className="text-sm">
                <strong>Selected:</strong> {form.product_name}
                {form.product_sku && <span className="text-muted-foreground ml-2">({form.product_sku})</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Unit Price: {fmt(Number(form.unit_price))}</p>
              {selectedProduct?.unit_cost != null && (
                <p className="text-xs text-muted-foreground mt-1">Cost: {fmt(selectedProduct.unit_cost)}</p>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-3">
            <Button
              variant="outline"
              onClick={() => setShowProductPicker(false)}
            >
              {form.product_id ? "Done" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerPickups;
