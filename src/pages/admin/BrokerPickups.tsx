import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Calendar, CheckCircle2, PackageCheck, RotateCcw, XCircle, Clock, AlertTriangle, Printer, MessageCircle, Bell } from "lucide-react";
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
  brokers?: { full_name: string; phone: string };
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

  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brokers").select("id, full_name, phone").eq("is_active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-pickup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, sku, price, stock_quantity").eq("is_active", true).order("name").limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: pickups = [] } = useQuery({
    queryKey: ["broker-pickups", tab, search],
    queryFn: async () => {
      let q = supabase.from("broker_pickups").select("*, brokers(full_name, phone)").order("created_at", { ascending: false });
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
      }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success("Approved — storekeeper can now release");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (p: Pickup) => {
      const { error } = await supabase.from("broker_pickups").update({ status: "rejected" }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success("Rejected");
    },
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
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["broker-pickups"] });
      toast.success(v.status === "returned" ? "Marked returned — stock restored" : "Marked sold");
      setReturnOpen(null);
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
      }));
    }
  };

  const counts = {
    pending: pickups.filter((p) => p.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Broker Pickups</h1>
          <p className="text-sm text-muted-foreground">Approve, release, and track items taken by brokers</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Pickup
        </Button>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        {pickups.map((p) => {
          const meta = STATUS_META[p.status] || STATUS_META.pending;
          const Icon = meta.icon;
          const purposeLabel = PURPOSES.find((x) => x.value === p.purpose)?.label || p.purpose;
          const payLabel = PAYMENT_METHODS.find((x) => x.value === p.payment_method)?.label || p.payment_method;
          const isOverdue = p.status === "released" && p.expected_return_date && new Date(p.expected_return_date) < new Date();
          return (
            <Card key={p.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{p.pickup_number}</p>
                    <h3 className="font-semibold">{p.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {p.brokers?.full_name} • {p.brokers?.phone}
                    </p>
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
                  {p.expected_return_date && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Return by</p>
                      <p className="font-medium">{format(new Date(p.expected_return_date), "PP")}</p>
                    </div>
                  )}
                </div>

                {p.notes && <p className="text-sm bg-muted/50 rounded p-2 italic">"{p.notes}"</p>}

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
                      <Button size="sm" variant="outline" onClick={() => reject.mutate(p)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <Button size="sm" onClick={() => setReleaseOpen(p)}>
                      <PackageCheck className="h-3.5 w-3.5" /> Release to Broker
                    </Button>
                  )}
                  {p.status === "released" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => closeAs.mutate({ p, status: "returned" })}>
                        <RotateCcw className="h-3.5 w-3.5" /> Mark Returned
                      </Button>
                      <Button size="sm" onClick={() => closeAs.mutate({ p, status: "sold" })}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Sold
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
                <Select value={form.product_id} onValueChange={onPickProduct}>
                  <SelectTrigger><SelectValue placeholder="Pick or type below" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""} — stock: {p.stock_quantity ?? 0}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Release dialog */}
      <Dialog open={!!releaseOpen} onOpenChange={(o) => !o && setReleaseOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Item to Broker</DialogTitle>
          </DialogHeader>
          {releaseOpen && (
            <div className="space-y-3">
              <p className="text-sm">
                Releasing <strong>{releaseOpen.quantity} × {releaseOpen.product_name}</strong> to <strong>{releaseOpen.brokers?.full_name}</strong>.
              </p>
              <div>
                <Label>Released by (storekeeper name)</Label>
                <Input value={releasedBy} onChange={(e) => setReleasedBy(e.target.value)} placeholder="Your name" />
              </div>
              <p className="text-xs text-muted-foreground">Stock will be deducted from inventory automatically.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseOpen(null)}>Cancel</Button>
            <Button onClick={() => release.mutate()} disabled={release.isPending}>
              Confirm Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerPickups;
